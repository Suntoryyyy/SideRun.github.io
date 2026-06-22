/**
 * FriendMapLayer (web / react-leaflet)
 *
 * Renders the interactive crew layer on top of the Leaflet map:
 *   • avatar markers (image thumbnail, emoji, or coloured initial fallback)
 *   • the runner's own marker with an accent halo (never confused with friends)
 *   • per-marker nickname label + distance-to-you, shown by zoom level
 *   • a per-marker close (×) button that hides that friend (persisted)
 *   • a mini info card on tap that flips to avoid covering the marker
 *   • auto camera fit to (you + visible friends) on first mount
 *
 * Implementation: a screen-fixed overlay <div> is appended to the Leaflet
 * container and friend coordinates are projected to pixels with
 * latLngToContainerPoint, re-projected on every map move/zoom. The overlay
 * itself is pointer-transparent so map panning keeps working; only the avatars,
 * close buttons and card capture clicks.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { getDistance } from '../../utils/locationUtils';
import { formatDuration } from '../../utils/timeUtils';
import useMapVisibilityStore from '../../store/useMapVisibilityStore';
import {
  MAP_ZOOM,
  badgeColor,
  isImageAvatar,
  isEmojiAvatar,
  avatarInitial,
  formatMapDistance,
} from '../../constants/mapConfig';

const CARD_W = 212;
const CARD_H = 108;

// Avatar bubble content: image (with graceful fallback), emoji, or initial.
function AvatarInner({ friend, size, failed, onError }) {
  const color = badgeColor(friend.id);
  if (isImageAvatar(friend.avatar) && !failed) {
    return (
      <img
        src={friend.avatar}
        alt=""
        onError={onError}
        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
      />
    );
  }
  if (isEmojiAvatar(friend.avatar)) {
    return <span style={{ fontSize: size * 0.55, lineHeight: `${size}px` }}>{friend.avatar}</span>;
  }
  return (
    <div
      style={{
        width: '100%', height: '100%', borderRadius: '50%', background: color,
        color: '#fff', fontWeight: 800, fontSize: size * 0.42,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {avatarInitial(friend.name)}
    </div>
  );
}

export default function FriendMapLayer({ friends = [], selfLocation, fitOnMount = true }) {
  const map = useMap();
  const containerRef = useRef(null);
  const didFit = useRef(false);
  const [, force] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [failedAvatars, setFailedAvatars] = useState(() => new Set());

  const visibility = useMapVisibilityStore((s) => s.visibility);
  const setVisible = useMapVisibilityStore((s) => s.setVisible);
  const hydrate = useMapVisibilityStore((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);

  const visibleFriends = useMemo(
    () => friends.filter((f) => visibility[f.id] !== false),
    [friends, visibility]
  );

  // Screen-fixed overlay container, created once.
  useEffect(() => {
    const div = L.DomUtil.create('div', 'siderun-friend-overlay');
    Object.assign(div.style, {
      position: 'absolute', top: '0', left: '0', right: '0', bottom: '0',
      zIndex: '650', pointerEvents: 'none', overflow: 'hidden',
    });
    map.getContainer().appendChild(div);
    containerRef.current = div;
    force((n) => n + 1);
    return () => {
      try { map.getContainer().removeChild(div); } catch (_) {}
      containerRef.current = null;
    };
  }, [map]);

  // Re-project markers whenever the map moves or zooms.
  useEffect(() => {
    const onMove = () => force((n) => n + 1);
    map.on('move zoom zoomend moveend resize', onMove);
    return () => map.off('move zoom zoomend moveend resize', onMove);
  }, [map]);

  // Tap empty map area → close any open card.
  useEffect(() => {
    const onClick = () => setSelectedId(null);
    map.on('click', onClick);
    return () => map.off('click', onClick);
  }, [map]);

  // Auto-fit camera once we have something to frame.
  useEffect(() => {
    if (!fitOnMount || didFit.current) return;
    const pts = [];
    if (selfLocation && selfLocation.latitude != null) {
      pts.push([selfLocation.latitude, selfLocation.longitude]);
    }
    visibleFriends.forEach((f) => pts.push([f.latitude, f.longitude]));
    if (pts.length === 0) return;
    didFit.current = true;
    if (pts.length === 1) {
      map.setView(pts[0], 15, { animate: false });
    } else {
      map.fitBounds(L.latLngBounds(pts), { padding: [64, 80], maxZoom: 17, animate: false });
    }
  }, [map, fitOnMount, visibleFriends, selfLocation]);

  if (!containerRef.current) return null;

  const zoom = map.getZoom();
  const showLabel = zoom >= MAP_ZOOM.label;
  const showDistance = zoom >= MAP_ZOOM.distance;
  const mapSize = map.getSize();

  const project = (lat, lng) => map.latLngToContainerPoint([lat, lng]);
  const distTo = (f) =>
    selfLocation && selfLocation.latitude != null
      ? getDistance(selfLocation, { latitude: f.latitude, longitude: f.longitude }) * 1000
      : null;

  const markFailed = (id) =>
    setFailedAvatars((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  const selected = visibleFriends.find((f) => f.id === selectedId) || null;

  const overlay = (
    <>
      {/* Runner's own position — accent halo, distinct from friends */}
      {selfLocation && selfLocation.latitude != null && (() => {
        const p = project(selfLocation.latitude, selfLocation.longitude);
        return (
          <div style={{ position: 'absolute', left: p.x, top: p.y, transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
            <div style={S.selfHalo}>
              <div style={S.selfDot} />
            </div>
          </div>
        );
      })()}

      {/* Friend markers */}
      {visibleFriends.map((f) => {
        const p = project(f.latitude, f.longitude);
        const color = badgeColor(f.id);
        const dist = distTo(f);
        return (
          <div
            key={f.id}
            style={{ position: 'absolute', left: p.x, top: p.y, transform: 'translate(-50%,-100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}
          >
            {/* Close (hide) button */}
            <button
              onClick={(e) => { e.stopPropagation(); setVisible(f.id, false); if (selectedId === f.id) setSelectedId(null); }}
              title={`Hide ${f.name} on map`}
              style={S.closeBtn}
            >
              ×
            </button>
            {/* Avatar bubble */}
            <div
              onClick={(e) => { e.stopPropagation(); setSelectedId((id) => (id === f.id ? null : f.id)); }}
              style={{ ...S.avatar, borderColor: color }}
            >
              <AvatarInner friend={f} size={30} failed={failedAvatars.has(f.id)} onError={() => markFailed(f.id)} />
            </div>
            <div style={{ ...S.pinStem, borderTopColor: color }} />
            {/* Nickname + distance label (per-friend label opt-out honoured) */}
            {showLabel && visibility[`${f.id}:label`] !== false && (
              <div style={S.label}>
                <span style={S.labelName}>{f.name}</span>
                {showDistance && dist != null && (
                  <span style={S.labelDist}>{formatMapDistance(dist)}</span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Mini info card */}
      {selected && (() => {
        const p = project(selected.latitude, selected.longitude);
        let left = Math.max(8, Math.min(p.x - CARD_W / 2, mapSize.x - CARD_W - 8));
        let top = p.y - CARD_H - 52; // default: above the marker
        if (top < 8) top = p.y + 26;  // flip below if it would clip the top
        const dist = distTo(selected);
        const running = selected.status === 'running';
        return (
          <div style={{ position: 'absolute', left, top, width: CARD_W, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ ...S.cardAvatar, borderColor: badgeColor(selected.id) }}>
                  <AvatarInner friend={selected} size={36} failed={failedAvatars.has(selected.id)} onError={() => markFailed(selected.id)} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.cardName}>{selected.name}</div>
                  <div style={{ ...S.cardStatus, color: running ? '#0B8A57' : '#5B6470' }}>
                    {running ? '● 跑步中' : '已结束'}
                  </div>
                </div>
                {dist != null && <div style={S.cardDist}>{formatMapDistance(dist)}</div>}
              </div>
              <div style={S.cardMetaRow}>
                <span style={S.cardMeta}>{selected.distanceKm.toFixed(2)} km</span>
                <span style={S.cardSep}>·</span>
                <span style={S.cardMeta}>{formatDuration(selected.durationSec)}</span>
              </div>
              <div style={S.cardMsg}>{selected.lastMessage}</div>
            </div>
          </div>
        );
      })()}
    </>
  );

  return ReactDOM.createPortal(overlay, containerRef.current);
}

const S = {
  selfHalo: {
    width: 38, height: 38, borderRadius: 19, background: 'rgba(36,199,137,0.22)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  selfDot: {
    width: 18, height: 18, borderRadius: 9, background: '#0B0F13',
    border: '3px solid #24C789', boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
  },
  avatar: {
    width: 30, height: 30, borderRadius: 15, background: '#fff',
    border: '2px solid #24C789', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)', cursor: 'pointer', pointerEvents: 'auto',
  },
  pinStem: {
    width: 0, height: 0, marginTop: -1,
    borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
    borderTop: '6px solid #24C789',
  },
  closeBtn: {
    position: 'absolute', top: -8, right: -8, width: 18, height: 18,
    borderRadius: 9, border: '1.5px solid #fff', background: '#0B0F13',
    color: '#fff', fontSize: 13, lineHeight: '14px', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', padding: 0, pointerEvents: 'auto', zIndex: 2,
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
  },
  label: {
    marginTop: 3, maxWidth: 140, display: 'flex', alignItems: 'center', gap: 5,
    background: 'rgba(255,255,255,0.92)', borderRadius: 8,
    padding: '2px 7px', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
  },
  labelName: {
    fontSize: 11, fontWeight: 700, color: '#0B0F13',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  labelDist: { fontSize: 10, fontWeight: 700, color: '#24C789', whiteSpace: 'nowrap' },
  card: {
    background: '#fff', borderRadius: 14, padding: 11,
    boxShadow: '0 8px 24px rgba(11,15,19,0.22)', border: '1px solid rgba(11,15,19,0.06)',
  },
  cardAvatar: {
    width: 36, height: 36, borderRadius: 18, background: '#fff',
    border: '2px solid #24C789', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardName: {
    fontSize: 14, fontWeight: 800, color: '#0B0F13',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  cardStatus: { fontSize: 11, fontWeight: 700, marginTop: 1 },
  cardDist: { fontSize: 12, fontWeight: 800, color: '#0B0F13', flexShrink: 0 },
  cardMetaRow: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 },
  cardMeta: { fontSize: 12, fontWeight: 700, color: '#0B0F13' },
  cardSep: { fontSize: 12, color: '#C2C7CE' },
  cardMsg: {
    fontSize: 11, color: '#5B6470', marginTop: 6,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
};
