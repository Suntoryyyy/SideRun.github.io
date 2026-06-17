/**
 * localClient — a fully offline, Supabase-compatible client.
 *
 * The app was originally wired to a hosted Supabase/MemFire backend for auth,
 * database, and realtime. That backend is no longer available, so this module
 * re-implements the exact subset of the `@supabase/supabase-js` surface the
 * app actually uses, backed entirely by AsyncStorage on the device.
 *
 * Goals:
 *   • No network, no server, no database — runs 100% locally.
 *   • Drop-in: every screen keeps `import { supabase } from '../services/supabase'`
 *     and the same `.auth.*` / `.from(...).select()...` / `.channel(...)` calls.
 *   • Multi-device demo friendly: each device/browser keeps its own local store,
 *     and a set of seeded demo accounts exists on every fresh install so any
 *     device can sign in immediately.
 *
 * What is supported (matches current app usage):
 *   auth.signUp / signInWithPassword / getSession / signOut
 *   from(t).select(cols)[.eq/.in/.ilike/.gte/.order/.limit/.single]
 *   from(t).insert / upsert / update[.eq] / delete[.match]
 *   channel(name).on(...).subscribe()  (local no-op) + removeChannel()
 *
 * Cross-device realtime (live cheers between two physical devices) cannot work
 * without a server; the app already simulates the social/cheer experience via
 * Demo Mode (see hooks/useDemoSocial.js), so these calls degrade to no-ops.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Storage keys ────────────────────────────────────────────────────────────
const TABLE_PREFIX = 'siderun_db_';
const SESSION_KEY = 'siderun_auth_session';
const SEED_FLAG_KEY = 'siderun_db_seeded_v1';

// ── Low-level table helpers ─────────────────────────────────────────────────
async function readTable(name) {
  try {
    const raw = await AsyncStorage.getItem(TABLE_PREFIX + name);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

async function writeTable(name, rows) {
  try {
    await AsyncStorage.setItem(TABLE_PREFIX + name, JSON.stringify(rows || []));
  } catch (e) {
    console.warn(`[localClient] write table "${name}" failed`, e);
  }
}

function genId() {
  // RFC4122-ish v4; good enough for local primary keys.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function nowIso() {
  return new Date().toISOString();
}

// ── Seed data ───────────────────────────────────────────────────────────────
// Demo accounts that exist on every fresh device so any simulated device can
// sign in instantly. Password for all seeded accounts is "123456".
const SEED_PASSWORD = '123456';
const SEED_USERS = [
  { phone: '13800138000', username: 'Alex',  weeklyDistance: 18.4, totalRuns: 32 },
  { phone: '13900139000', username: 'Sam',   weeklyDistance: 12.1, totalRuns: 21 },
  // Leaderboard flavour — these read well on the Crew → Leaderboard tab.
  { phone: '13700137000', username: 'Maya',  weeklyDistance: 24.7, totalRuns: 41 },
  { phone: '13600136000', username: 'Daiki', weeklyDistance: 9.6,  totalRuns: 15 },
  { phone: '13500135000', username: 'Lin',   weeklyDistance: 15.3, totalRuns: 27 },
];

let seedPromise = null;
async function ensureSeeded() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      // Self-healing seeding. We deliberately do NOT gate on a single boolean
      // flag: if that flag ever desyncs from the actual data (an interrupted
      // first write, a half-cleared localStorage, a build that set the flag
      // before localClient existed), the demo accounts silently vanish and
      // every login fails with "Invalid login credentials". Instead we verify
      // the seed accounts are actually present on every cold start and recreate
      // any that are missing — cheap (5 rows) and always correct.
      const authUsers = await readTable('auth_users');
      const users = await readTable('users');
      let changed = false;

      for (const s of SEED_USERS) {
        const email = `${s.phone}@siderun.app`;
        let authRow = authUsers.find((a) => a.email === email);

        if (authRow) {
          // Keep the demo password valid even if an older seed wrote a
          // different one.
          if (authRow.password !== SEED_PASSWORD) {
            authRow.password = SEED_PASSWORD;
            changed = true;
          }
        } else {
          authRow = { id: genId(), email, password: SEED_PASSWORD };
          authUsers.push(authRow);
          changed = true;
        }

        // Ensure a matching profile row exists for this auth user.
        if (!users.some((u) => looseEq(u.id, authRow.id))) {
          users.push({
            id: authRow.id,
            phone: s.phone,
            username: s.username,
            avatar: null,
            weeklyDistance: s.weeklyDistance,
            totalRuns: s.totalRuns,
            unlocked_badges: ['first_steps'],
            allowFriendsViewRecord: true,
            allowStrangersAdd: true,
            created_at: nowIso(),
          });
          changed = true;
        }
      }

      if (changed) {
        await writeTable('auth_users', authUsers);
        await writeTable('users', users);
      }
      // Best-effort marker (no longer used as a gate; kept for diagnostics).
      try { await AsyncStorage.setItem(SEED_FLAG_KEY, '1'); } catch (_) {}
    } catch (e) {
      console.warn('[localClient] seeding failed', e);
      // Allow a retry on the next call instead of caching a failed run.
      seedPromise = null;
    }
  })();
  return seedPromise;
}

// ── Filtering / matching helpers ────────────────────────────────────────────
function looseEq(a, b) {
  if (a == null && b == null) return true;
  return String(a) === String(b);
}

function likeToRegExp(pattern) {
  // SQL ILIKE → case-insensitive regex. % = wildcard, _ = single char.
  const escaped = String(pattern)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/_/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}

function applyFilters(rows, filters) {
  return rows.filter((row) =>
    filters.every((f) => {
      const cell = row[f.col];
      switch (f.type) {
        case 'eq':
          return looseEq(cell, f.val);
        case 'in':
          return Array.isArray(f.val) && f.val.some((v) => looseEq(cell, v));
        case 'ilike':
          return cell != null && likeToRegExp(f.val).test(String(cell));
        case 'gte':
          return cell != null && cell >= f.val;
        case 'lte':
          return cell != null && cell <= f.val;
        case 'gt':
          return cell != null && cell > f.val;
        case 'lt':
          return cell != null && cell < f.val;
        default:
          return true;
      }
    })
  );
}

// Parse a PostgREST embedded-resource select, e.g.
//   "*, user:users!user_id(username, avatar)"
// Returns { embeds: [{ alias, table, fk }] }.
function parseEmbeds(selectStr) {
  const embeds = [];
  if (!selectStr || typeof selectStr !== 'string') return embeds;
  const re = /(\w+)\s*:\s*(\w+)\s*!\s*(\w+)\s*\(([^)]*)\)/g;
  let m;
  while ((m = re.exec(selectStr)) !== null) {
    embeds.push({ alias: m[1], table: m[2], fk: m[3] });
  }
  return embeds;
}

async function resolveEmbeds(rows, embeds) {
  if (!embeds.length) return rows;
  const cache = {};
  for (const e of embeds) {
    if (!cache[e.table]) cache[e.table] = await readTable(e.table);
  }
  return rows.map((row) => {
    const out = { ...row };
    for (const e of embeds) {
      const fkVal = row[e.fk];
      out[e.alias] = cache[e.table].find((r) => looseEq(r.id, fkVal)) || null;
    }
    return out;
  });
}

// ── Query builder ───────────────────────────────────────────────────────────
class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.op = 'select';
    this.selectStr = '*';
    this.filters = [];
    this.orders = [];
    this._limit = null;
    this._single = false;
    this.payload = null;
    this.upsertOpts = null;
  }

  select(cols = '*') {
    if (this.op === 'select') this.selectStr = cols || '*';
    return this;
  }

  insert(values) {
    this.op = 'insert';
    this.payload = values;
    return this;
  }

  upsert(values, opts) {
    this.op = 'upsert';
    this.payload = values;
    this.upsertOpts = opts || {};
    return this;
  }

  update(patch) {
    this.op = 'update';
    this.payload = patch;
    return this;
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  eq(col, val) {
    this.filters.push({ type: 'eq', col, val });
    return this;
  }

  in(col, val) {
    this.filters.push({ type: 'in', col, val });
    return this;
  }

  ilike(col, val) {
    this.filters.push({ type: 'ilike', col, val });
    return this;
  }

  gte(col, val) {
    this.filters.push({ type: 'gte', col, val });
    return this;
  }

  lte(col, val) {
    this.filters.push({ type: 'lte', col, val });
    return this;
  }

  gt(col, val) {
    this.filters.push({ type: 'gt', col, val });
    return this;
  }

  lt(col, val) {
    this.filters.push({ type: 'lt', col, val });
    return this;
  }

  match(obj) {
    Object.entries(obj || {}).forEach(([col, val]) =>
      this.filters.push({ type: 'eq', col, val })
    );
    return this;
  }

  order(col, opts = {}) {
    this.orders.push({ col, ascending: opts.ascending !== false });
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  maybeSingle() {
    this._single = true;
    this._maybe = true;
    return this;
  }

  async _execute() {
    await ensureSeeded();
    try {
      switch (this.op) {
        case 'select':
          return await this._runSelect();
        case 'insert':
          return await this._runInsert();
        case 'upsert':
          return await this._runUpsert();
        case 'update':
          return await this._runUpdate();
        case 'delete':
          return await this._runDelete();
        default:
          return { data: null, error: { message: `Unknown op ${this.op}` } };
      }
    } catch (e) {
      return { data: null, error: { message: e?.message || String(e) } };
    }
  }

  async _runSelect() {
    let rows = await readTable(this.table);
    rows = applyFilters(rows, this.filters);

    if (this.orders.length) {
      const orders = this.orders;
      rows = [...rows].sort((a, b) => {
        for (const o of orders) {
          let av = a[o.col];
          let bv = b[o.col];
          if (av == null && bv == null) continue;
          if (av == null) return o.ascending ? -1 : 1;
          if (bv == null) return o.ascending ? 1 : -1;
          if (typeof av === 'number' && typeof bv === 'number') {
            if (av !== bv) return o.ascending ? av - bv : bv - av;
          } else {
            const cmp = String(av).localeCompare(String(bv));
            if (cmp !== 0) return o.ascending ? cmp : -cmp;
          }
        }
        return 0;
      });
    }

    if (this._limit != null) rows = rows.slice(0, this._limit);

    rows = await resolveEmbeds(rows, parseEmbeds(this.selectStr));

    if (this._single) {
      if (rows.length === 0) {
        return {
          data: null,
          error: this._maybe
            ? null
            : { message: 'No rows found', code: 'PGRST116' },
        };
      }
      return { data: rows[0], error: null };
    }
    return { data: rows, error: null };
  }

  async _runInsert() {
    const rows = await readTable(this.table);
    const incoming = Array.isArray(this.payload) ? this.payload : [this.payload];
    const inserted = incoming.map((r) => ({
      id: r.id != null ? r.id : genId(),
      created_at: r.created_at || nowIso(),
      ...r,
    }));
    await writeTable(this.table, [...rows, ...inserted]);
    return { data: inserted, error: null };
  }

  async _runUpsert() {
    const rows = await readTable(this.table);
    const conflictKey = (this.upsertOpts && this.upsertOpts.onConflict) || 'id';
    const incoming = Array.isArray(this.payload) ? this.payload : [this.payload];
    const next = [...rows];
    const result = [];
    for (const r of incoming) {
      const idx = next.findIndex((x) => looseEq(x[conflictKey], r[conflictKey]));
      if (idx >= 0) {
        next[idx] = { ...next[idx], ...r };
        result.push(next[idx]);
      } else {
        const created = {
          id: r.id != null ? r.id : genId(),
          created_at: r.created_at || nowIso(),
          ...r,
        };
        next.push(created);
        result.push(created);
      }
    }
    await writeTable(this.table, next);
    return { data: result, error: null };
  }

  async _runUpdate() {
    const rows = await readTable(this.table);
    const updated = [];
    const next = rows.map((row) => {
      if (applyFilters([row], this.filters).length) {
        const merged = { ...row, ...this.payload };
        updated.push(merged);
        return merged;
      }
      return row;
    });
    await writeTable(this.table, next);
    return { data: updated, error: null };
  }

  async _runDelete() {
    const rows = await readTable(this.table);
    const remaining = rows.filter(
      (row) => applyFilters([row], this.filters).length === 0
    );
    await writeTable(this.table, remaining);
    return { data: null, error: null };
  }

  // Thenable: `await supabase.from(...)...` resolves to { data, error }.
  then(onFulfilled, onRejected) {
    return this._execute().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this._execute().catch(onRejected);
  }
}

// ── Auth ────────────────────────────────────────────────────────────────────
let cachedSession = null;

async function loadSession() {
  if (cachedSession !== null) return cachedSession;
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    cachedSession = raw ? JSON.parse(raw) : null;
  } catch (_) {
    cachedSession = null;
  }
  return cachedSession;
}

async function saveSession(session) {
  cachedSession = session;
  try {
    if (session) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else await AsyncStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.warn('[localClient] save session failed', e);
  }
}

const auth = {
  async signUp({ email, password }) {
    await ensureSeeded();
    const authUsers = await readTable('auth_users');
    if (authUsers.some((u) => u.email === email)) {
      return {
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      };
    }
    const user = { id: genId(), email };
    authUsers.push({ ...user, password });
    await writeTable('auth_users', authUsers);
    const session = { user, access_token: genId() };
    await saveSession(session);
    return { data: { user, session }, error: null };
  },

  async signInWithPassword({ email, password }) {
    await ensureSeeded();
    const authUsers = await readTable('auth_users');
    const found = authUsers.find((u) => u.email === email);
    if (!found || found.password !== password) {
      return {
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      };
    }
    const user = { id: found.id, email: found.email };
    const session = { user, access_token: genId() };
    await saveSession(session);
    return { data: { user, session }, error: null };
  },

  async getSession() {
    const session = await loadSession();
    return { data: { session }, error: null };
  },

  async getUser() {
    const session = await loadSession();
    return { data: { user: session?.user || null }, error: null };
  },

  async signOut() {
    await saveSession(null);
    return { error: null };
  },

  // Match the old App.js cleanup call shape (global.account.deleteSession).
  async deleteSession() {
    await saveSession(null);
    return { error: null };
  },

  onAuthStateChange() {
    // No realtime auth events locally; return a no-op subscription.
    return { data: { subscription: { unsubscribe() {} } } };
  },
};

// ── Realtime (local no-op) ──────────────────────────────────────────────────
function channel() {
  const fake = {
    on() {
      return fake;
    },
    subscribe() {
      return fake;
    },
    unsubscribe() {
      return Promise.resolve('ok');
    },
  };
  return fake;
}

function removeChannel() {
  return Promise.resolve('ok');
}

// ── Public client ───────────────────────────────────────────────────────────
export const supabase = {
  auth,
  from(table) {
    return new QueryBuilder(table);
  },
  channel,
  removeChannel,
};

export default supabase;
