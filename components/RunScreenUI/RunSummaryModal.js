/**
 * RunSummaryModal — end-of-run summary + social share.
 *
 * Redesign goals (v3):
 *   1. Route is the hero, not rings — the route shape is what friends
 *      actually recognise / remember about a run.
 *   2. Two export formats: square "card" (IG feed / Twitter) and vertical
 *      "story" (IG Story 9:16) — the user picks based on where they share.
 *   3. What the user sees in-app matches the PNG they'll get out.
 */
import React, { useRef, useState } from 'react';
import BouncyButton from '../BouncyButton';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { formatDuration } from '../../utils/timeUtils';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import RouteArt from '../RouteArt';
import ShareCard, {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from '../ShareCard';
import ShareCardStory, {
  STORY_CARD_HEIGHT,
  STORY_CARD_WIDTH,
} from '../ShareCardStory';
import useUserStore from '../../store/useUserStore';
import { T, FONT } from '../../constants/typography';

const { width } = Dimensions.get('window');

const DISTANCE_TARGET_KM = 5;

/**
 * Describe the run in a short chip based on time of day.
 * Used as `placeName` fallback so every card gets a personalised subtitle
 * even when we don't reverse-geocode.
 */
const describeRun = (hour) => {
  if (hour >= 5 && hour < 10) return 'Morning run';
  if (hour >= 10 && hour < 16) return 'Afternoon run';
  if (hour >= 16 && hour < 20) return 'Evening run';
  return 'Night run';
};

const formatPace = (minPerKm) => {
  if (!isFinite(minPerKm) || minPerKm <= 0) return '—';
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

/**
 * Project a list of {latitude, longitude} coordinates into {x, y} within a
 * [w x h] viewport — identical math to RouteArt but exposed here so the web
 * canvas fallback can draw the same polyline.
 */
const projectCoords = (coords, w, h, pad = 40) => {
  if (!coords || coords.length < 2) return null;
  const lats = coords.map((c) => c.latitude);
  const lngs = coords.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const rangeH = maxLat - minLat || 1e-4;
  const rangeW = maxLng - minLng || 1e-4;
  const scale = Math.min((w - pad * 2) / rangeW, (h - pad * 2) / rangeH);
  const projectedW = rangeW * scale;
  const projectedH = rangeH * scale;
  const offsetX = pad + (w - pad * 2 - projectedW) / 2;
  const offsetY = pad + (h - pad * 2 - projectedH) / 2;
  return coords.map((c) => ({
    x: offsetX + (c.longitude - minLng) * scale,
    y: offsetY + projectedH - (c.latitude - minLat) * scale,
  }));
};

/**
 * Fallback loop drawn when the run has no recorded coordinates (matches
 * RouteArt.FALLBACK_LOOP so native + web stay visually consistent).
 */
const fallbackLoop = (w, h, pad = 40) => {
  const cx = w / 2;
  const cy = h / 2;
  const rx = (w - pad * 2) * 0.42;
  const ry = (h - pad * 2) * 0.38;
  const pts = [];
  const N = 64;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2;
    const r = 1 + 0.08 * Math.sin(t * 3) + 0.04 * Math.cos(t * 5);
    pts.push({
      x: cx + Math.cos(t) * rx * r,
      y: cy + Math.sin(t) * ry * r,
    });
  }
  return pts;
};

// ── Web canvas builders ──────────────────────────────────────────────────
/**
 * Render a polyline onto a 2D canvas with a soft glow pass.
 */
const drawRoute = (ctx, pts, color, { strokeWidth = 10, glow = 30 } = {}) => {
  if (!pts || pts.length < 2) return;
  ctx.save();
  // Glow pass
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.restore();

  // Start + end dots
  const drawDot = (p, fill) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.fill();
  };
  drawDot(pts[0], '#FFFFFF');
  drawDot(pts[pts.length - 1], color);
};

/** Build the Square Route-Hero card as a PNG Blob. */
const buildSquareBlob = ({
  distanceKm,
  duration,
  paceLabel,
  kcal,
  username,
  placeName,
  coordinates,
  isPB,
  timeLabel,
  dateLabel,
}) => {
  if (typeof document === 'undefined') return null;
  return new Promise((resolve) => {
    const W = 1080;
    const H = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0F141A');
    grad.addColorStop(1, '#080B10');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // brand-tint glow
    const gl = ctx.createRadialGradient(W * 0.12, -40, 20, W * 0.12, -40, 440);
    gl.addColorStop(0, 'rgba(36,199,137,0.26)');
    gl.addColorStop(1, 'rgba(36,199,137,0)');
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, W, H);

    // Header
    ctx.fillStyle = '#24C789';
    ctx.beginPath();
    ctx.arc(96, 96, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px -apple-system, "Inter", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('SIDERUN', 120, 96);
    ctx.fillStyle = '#9AA0A6';
    ctx.textAlign = 'right';
    ctx.font = '600 26px -apple-system, "Inter", sans-serif';
    ctx.fillText(`${dateLabel} · ${timeLabel}`, W - 72, 96);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Map area
    const mapPad = 72;
    const mapTop = 160;
    const mapH = 460;
    const mapW = W - mapPad * 2;
    const r = 48;
    ctx.fillStyle = '#121721';
    ctx.beginPath();
    ctx.moveTo(mapPad + r, mapTop);
    ctx.lineTo(mapPad + mapW - r, mapTop);
    ctx.arcTo(mapPad + mapW, mapTop, mapPad + mapW, mapTop + r, r);
    ctx.lineTo(mapPad + mapW, mapTop + mapH - r);
    ctx.arcTo(mapPad + mapW, mapTop + mapH, mapPad + mapW - r, mapTop + mapH, r);
    ctx.lineTo(mapPad + r, mapTop + mapH);
    ctx.arcTo(mapPad, mapTop + mapH, mapPad, mapTop + mapH - r, r);
    ctx.lineTo(mapPad, mapTop + r);
    ctx.arcTo(mapPad, mapTop, mapPad + r, mapTop, r);
    ctx.closePath();
    ctx.fill();

    // Clip to map
    ctx.save();
    ctx.clip();
    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 8; i++) {
      const x = mapPad + (mapW / 8) * i;
      ctx.beginPath();
      ctx.moveTo(x, mapTop);
      ctx.lineTo(x, mapTop + mapH);
      ctx.stroke();
    }
    for (let i = 1; i < 6; i++) {
      const y = mapTop + (mapH / 6) * i;
      ctx.beginPath();
      ctx.moveTo(mapPad, y);
      ctx.lineTo(mapPad + mapW, y);
      ctx.stroke();
    }
    // Route
    const pts =
      projectCoords(coordinates, mapW, mapH, 80) ||
      fallbackLoop(mapW, mapH, 80);
    const translated = pts.map((p) => ({ x: p.x + mapPad, y: p.y + mapTop }));
    drawRoute(ctx, translated, '#24C789', { strokeWidth: 10, glow: 28 });
    ctx.restore();

    // Place chip
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    const chipLabel = placeName.toUpperCase();
    ctx.font = '700 22px -apple-system, "Inter", sans-serif';
    const chipW = ctx.measureText(chipLabel).width + 52;
    const chipX = mapPad + 28;
    const chipY = mapTop + 28;
    const chipH = 44;
    const chipR = 22;
    ctx.beginPath();
    ctx.moveTo(chipX + chipR, chipY);
    ctx.lineTo(chipX + chipW - chipR, chipY);
    ctx.arcTo(chipX + chipW, chipY, chipX + chipW, chipY + chipR, chipR);
    ctx.lineTo(chipX + chipW, chipY + chipH - chipR);
    ctx.arcTo(chipX + chipW, chipY + chipH, chipX + chipW - chipR, chipY + chipH, chipR);
    ctx.lineTo(chipX + chipR, chipY + chipH);
    ctx.arcTo(chipX, chipY + chipH, chipX, chipY + chipH - chipR, chipR);
    ctx.lineTo(chipX, chipY + chipR);
    ctx.arcTo(chipX, chipY, chipX + chipR, chipY, chipR);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#24C789';
    ctx.beginPath();
    ctx.arc(chipX + 18, chipY + chipH / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.fillText(chipLabel, chipX + 32, chipY + chipH / 2);
    ctx.textBaseline = 'alphabetic';

    if (isPB) {
      const pbLabel = '★ NEW 5K PB';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 22px -apple-system, "Inter", sans-serif';
      const pbW = ctx.measureText(pbLabel).width + 40;
      const pbX = mapPad + mapW - 28 - pbW;
      const pbY = mapTop + 28;
      ctx.beginPath();
      ctx.moveTo(pbX + chipR, pbY);
      ctx.lineTo(pbX + pbW - chipR, pbY);
      ctx.arcTo(pbX + pbW, pbY, pbX + pbW, pbY + chipR, chipR);
      ctx.lineTo(pbX + pbW, pbY + chipH - chipR);
      ctx.arcTo(pbX + pbW, pbY + chipH, pbX + pbW - chipR, pbY + chipH, chipR);
      ctx.lineTo(pbX + chipR, pbY + chipH);
      ctx.arcTo(pbX, pbY + chipH, pbX, pbY + chipH - chipR, chipR);
      ctx.lineTo(pbX, pbY + chipR);
      ctx.arcTo(pbX, pbY, pbX + chipR, pbY, chipR);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0B0F13';
      ctx.textBaseline = 'middle';
      ctx.fillText(pbLabel, pbX + 20, pbY + chipH / 2);
      ctx.textBaseline = 'alphabetic';
    }

    // Distance
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 220px -apple-system, "Inter", sans-serif';
    ctx.fillText(distanceKm.toFixed(2), mapPad, mapTop + mapH + 210);
    ctx.fillStyle = '#8E939A';
    ctx.font = '700 52px -apple-system, "Inter", sans-serif';
    const distW = ctx.measureText(distanceKm.toFixed(2)).width;
    ctx.fillText('km', mapPad + distW + 20, mapTop + mapH + 210);

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mapPad, mapTop + mapH + 260);
    ctx.lineTo(W - mapPad, mapTop + mapH + 260);
    ctx.stroke();

    // Stats
    const stats = [
      { label: 'TIME', value: duration },
      { label: 'PACE', value: `${paceLabel} /km` },
      { label: 'KCAL', value: String(kcal) },
    ];
    const statCenters = [mapPad + 80, W / 2, W - mapPad - 80];
    ctx.textAlign = 'center';
    stats.forEach((s, i) => {
      ctx.fillStyle = '#7F858C';
      ctx.font = '700 22px -apple-system, "Inter", sans-serif';
      ctx.fillText(s.label, statCenters[i], mapTop + mapH + 320);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 52px -apple-system, "Inter", sans-serif';
      ctx.fillText(s.value, statCenters[i], mapTop + mapH + 380);
    });
    ctx.textAlign = 'left';

    // Footer
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 26px -apple-system, "Inter", sans-serif';
    ctx.fillText(`@${username}`, mapPad, H - 60);
    ctx.fillStyle = '#73787F';
    ctx.textAlign = 'right';
    ctx.font = '700 22px -apple-system, "Inter", sans-serif';
    ctx.fillText('siderun.app', W - mapPad, H - 60);
    ctx.textAlign = 'left';

    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
  });
};

/** Build the 9:16 Story card as a PNG Blob. */
const buildStoryBlob = ({
  distanceKm,
  duration,
  paceLabel,
  kcal,
  username,
  placeName,
  coordinates,
  isPB,
  timeLabel,
  dateLabel,
  hour,
  splits,
}) => {
  if (typeof document === 'undefined') return null;
  return new Promise((resolve) => {
    const W = 1080;
    const H = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const palette = (() => {
      if (hour >= 5 && hour < 8)
        return { a: '#FF7B5A', b: '#8C4790', c: '#0F0D21', sun: 'rgba(255,240,210,0.45)', mood: 'SUNRISE' };
      if (hour >= 8 && hour < 17)
        return { a: '#60A7E8', b: '#2B5F95', c: '#0F1F32', sun: 'rgba(255,255,255,0.18)', mood: 'DAYLIGHT' };
      if (hour >= 17 && hour < 20)
        return { a: '#FF915A', b: '#6E3B8C', c: '#0E0A1F', sun: 'rgba(255,220,180,0.35)', mood: 'GOLDEN HOUR' };
      return { a: '#1D2550', b: '#0C1230', c: '#05070F', sun: 'rgba(180,200,255,0.12)', mood: 'NIGHT' };
    })();

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, palette.a);
    grad.addColorStop(0.45, palette.b);
    grad.addColorStop(1, palette.c);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Sun glow
    const sg = ctx.createRadialGradient(W / 2, -80, 40, W / 2, -80, 520);
    sg.addColorStop(0, palette.sun);
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W, H);

    // Brand
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(72 + 8, 112, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '900 30px -apple-system, "Inter", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('SIDERUN', 102, 112);

    ctx.textAlign = 'right';
    ctx.font = '600 22px -apple-system, "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(`${dateLabel} · ${timeLabel} · ${palette.mood}`, W - 72, 112);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // PB pill
    const pillLabel = isPB ? '★ NEW 5K PERSONAL BEST' : 'RUN COMPLETED';
    ctx.font = '900 26px -apple-system, "Inter", sans-serif';
    const pillW = ctx.measureText(pillLabel).width + 64;
    const pillX = (W - pillW) / 2;
    const pillY = 204;
    const pillH = 60;
    const pillR = 30;
    ctx.fillStyle = isPB ? '#FFFFFF' : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(pillX + pillR, pillY);
    ctx.lineTo(pillX + pillW - pillR, pillY);
    ctx.arcTo(pillX + pillW, pillY, pillX + pillW, pillY + pillR, pillR);
    ctx.lineTo(pillX + pillW, pillY + pillH - pillR);
    ctx.arcTo(pillX + pillW, pillY + pillH, pillX + pillW - pillR, pillY + pillH, pillR);
    ctx.lineTo(pillX + pillR, pillY + pillH);
    ctx.arcTo(pillX, pillY + pillH, pillX, pillY + pillH - pillR, pillR);
    ctx.lineTo(pillX, pillY + pillR);
    ctx.arcTo(pillX, pillY, pillX + pillR, pillY, pillR);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = isPB ? '#0B0F13' : '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(pillLabel, W / 2, pillY + pillH / 2);
    ctx.textBaseline = 'alphabetic';

    // Hero number
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 420px -apple-system, "Inter", sans-serif';
    ctx.fillText(distanceKm.toFixed(2), W / 2, 720);
    ctx.font = '700 56px -apple-system, "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText('KILOMETRES', W / 2, 800);
    ctx.font = '600 30px -apple-system, "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(placeName.toUpperCase(), W / 2, 854);
    ctx.textAlign = 'left';

    // Route panel
    const panelX = 120;
    const panelY = 960;
    const panelW = W - 240;
    const panelH = 480;
    const panelR = 56;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(panelX + panelR, panelY);
    ctx.lineTo(panelX + panelW - panelR, panelY);
    ctx.arcTo(panelX + panelW, panelY, panelX + panelW, panelY + panelR, panelR);
    ctx.lineTo(panelX + panelW, panelY + panelH - panelR);
    ctx.arcTo(panelX + panelW, panelY + panelH, panelX + panelW - panelR, panelY + panelH, panelR);
    ctx.lineTo(panelX + panelR, panelY + panelH);
    ctx.arcTo(panelX, panelY + panelH, panelX, panelY + panelH - panelR, panelR);
    ctx.lineTo(panelX, panelY + panelR);
    ctx.arcTo(panelX, panelY, panelX + panelR, panelY, panelR);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.clip();
    const pts =
      projectCoords(coordinates, panelW, panelH, 80) ||
      fallbackLoop(panelW, panelH, 80);
    const translated = pts.map((p) => ({ x: p.x + panelX, y: p.y + panelY }));
    drawRoute(ctx, translated, '#FFFFFF', { strokeWidth: 10, glow: 36 });
    ctx.restore();

    // Splits header
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '700 22px -apple-system, "Inter", sans-serif';
    ctx.fillText('PER-KM PACE', 120, 1510);
    ctx.textAlign = 'right';
    ctx.fillText(`${paceLabel} /KM AVG`, W - 120, 1510);
    ctx.textAlign = 'left';

    // Splits bars
    const barsX0 = 120;
    const barsY0 = 1530;
    const barsW = W - 240;
    const barsHMax = 200;
    if (splits && splits.length > 0) {
      const minP = Math.min(...splits);
      const maxP = Math.max(...splits);
      const range = maxP - minP || 0.01;
      const barW = 112;
      const gap = (barsW - barW * splits.length) / Math.max(1, splits.length - 1);
      splits.forEach((p, i) => {
        const ratio = (maxP - p) / range;
        const h = 48 + ratio * (barsHMax - 48);
        const x = barsX0 + i * (barW + gap);
        const y = barsY0 + (barsHMax - h);
        const fastest = p === minP;
        ctx.fillStyle = fastest ? '#FFFFFF' : 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        const rr = 16;
        ctx.moveTo(x + rr, y);
        ctx.lineTo(x + barW - rr, y);
        ctx.arcTo(x + barW, y, x + barW, y + rr, rr);
        ctx.lineTo(x + barW, y + h - rr);
        ctx.arcTo(x + barW, y + h, x + barW - rr, y + h, rr);
        ctx.lineTo(x + rr, y + h);
        ctx.arcTo(x, y + h, x, y + h - rr, rr);
        ctx.lineTo(x, y + rr);
        ctx.arcTo(x, y, x + rr, y, rr);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = fastest ? '#FFFFFF' : 'rgba(255,255,255,0.5)';
        ctx.font = '700 18px -apple-system, "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`KM ${i + 1}`, x + barW / 2, barsY0 + barsHMax + 32);
        ctx.textAlign = 'left';
      });
    }

    // Context row
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 28px -apple-system, "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${duration}   TIME   ·   ${kcal}   KCAL`, W / 2, 1828);
    ctx.textAlign = 'left';

    // Footer
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 26px -apple-system, "Inter", sans-serif';
    ctx.fillText(`@${username}`, 120, H - 72);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'right';
    ctx.font = '700 22px -apple-system, "Inter", sans-serif';
    ctx.fillText('siderun.app', W - 120, H - 72);
    ctx.textAlign = 'left';

    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
  });
};
// ── End web canvas builders ──────────────────────────────────────────────

const RunSummaryModal = ({
  durationInSeconds,
  runData,
  currentSpeed,
  closeRun,
  navigation,
}) => {
  const shareSquareRef = useRef(null);
  const shareStoryRef = useRef(null);
  const [busy, setBusy] = useState(null); // 'card' | 'story' | null
  const username = useUserStore((s) => s.user?.username) || 'Runner';

  const distanceKm = Number(runData?.distance || 0);
  const duration = Number(durationInSeconds || 0);
  const paceMinPerKm =
    distanceKm > 0 ? duration / 60 / distanceKm : 0;
  const paceLabel = formatPace(paceMinPerKm);
  const kcal = Math.round(distanceKm * 62);
  const isPB = distanceKm >= DISTANCE_TARGET_KM;

  const now = new Date();
  const hour = now.getHours();
  const placeName = describeRun(hour);
  const dateLabel = now
    .toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();
  const timeLabel = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Per-km splits (same math as ShareCardStory) — used by the in-app bar
  // chart and also passed to the web canvas for the Story export.
  const splitsPaces = (() => {
    const real = Array.isArray(runData?.splits) ? runData.splits : [];
    const realPaces = real
      .map((s) => (typeof s === 'number' ? s : s?.paceMinPerKm))
      .filter((n) => typeof n === 'number' && isFinite(n) && n > 0);
    if (realPaces.length >= 2) return realPaces.slice(-5);
    const km = Math.max(1, Math.round(distanceKm));
    const N = Math.min(5, km);
    if (!N || !isFinite(paceMinPerKm) || paceMinPerKm <= 0) return [];
    return Array.from({ length: N }, (_, i) => {
      const jitter = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 0.18;
      return Math.max(2.5, paceMinPerKm + jitter);
    });
  })();

  const fastest = splitsPaces.length ? Math.min(...splitsPaces) : 0;
  const slowest = splitsPaces.length ? Math.max(...splitsPaces) : 0;
  const paceRange = slowest - fastest || 0.01;

  const handleShare = async (format) => {
    if (busy) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setBusy(format);

    const shared = {
      distanceKm,
      duration: formatDuration(duration),
      paceLabel,
      kcal,
      username,
      placeName,
      coordinates: runData?.coordinates,
      isPB,
      timeLabel,
      dateLabel,
      hour,
      splits: splitsPaces,
    };

    if (Platform.OS === 'web') {
      try {
        const blob =
          format === 'story'
            ? await buildStoryBlob(shared)
            : await buildSquareBlob(shared);
        if (!blob) throw new Error('Could not render card');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `siderun-${format}-${stamp}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (e) {
        console.warn('[RunSummaryModal] web download failed', e);
        Alert.alert('Save failed', 'Could not generate the run card.');
      } finally {
        setBusy(null);
      }
      return;
    }

    try {
      const { captureRef } = require('react-native-view-shot');
      const MediaLibrary = require('expo-media-library');

      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Allow photo access',
          'SideRun needs permission to save your run card to Photos.',
        );
        setBusy(null);
        return;
      }

      const target = format === 'story' ? shareStoryRef : shareSquareRef;
      const uri = await captureRef(target, {
        format: 'png',
        quality: 0.95,
        result: 'tmpfile',
      });
      await MediaLibrary.saveToLibraryAsync(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Saved to Photos',
        `Your ${format === 'story' ? 'story' : 'card'} is now in your camera roll.`,
      );
    } catch (e) {
      console.warn('[RunSummaryModal] save failed', e);
      Alert.alert('Save failed', e?.message || 'Could not capture the run card.');
    } finally {
      setBusy(null);
    }
  };

  // In-app preview dimensions — full-bleed Route Hero look.
  const previewW = Math.min(width * 0.88, 420);
  const mapH = Math.round(previewW * 0.5);

  return (
    <Modal visible={true} transparent animationType="slide">
      {/* Off-screen capture targets (native only) */}
      {Platform.OS !== 'web' ? (
        <View pointerEvents="none" style={styles.offscreen}>
          <View style={{ width: SHARE_CARD_WIDTH, height: SHARE_CARD_HEIGHT }}>
            <ShareCard
              ref={shareSquareRef}
              distanceKm={distanceKm}
              durationLabel={formatDuration(duration)}
              paceLabel={paceLabel}
              kcal={kcal}
              username={username}
              placeName={placeName}
              coordinates={runData?.coordinates}
              isPB={isPB}
              timeLabel={timeLabel}
              dateLabel={dateLabel}
            />
          </View>
          <View style={{ width: STORY_CARD_WIDTH, height: STORY_CARD_HEIGHT, marginTop: 40 }}>
            <ShareCardStory
              ref={shareStoryRef}
              distanceKm={distanceKm}
              durationLabel={formatDuration(duration)}
              paceLabel={paceLabel}
              paceMinPerKm={paceMinPerKm}
              kcal={kcal}
              username={username}
              placeName={placeName}
              coordinates={runData?.coordinates}
              isPB={isPB}
              timeLabel={timeLabel}
              dateLabel={dateLabel}
              runData={runData}
              hourOverride={hour}
            />
          </View>
        </View>
      ) : null}

      <BlurView intensity={90} tint="dark" style={styles.blurContainer}>
        <View style={styles.card}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Headline */}
            <View style={styles.headline}>
              <Text style={styles.title}>
                {isPB ? `New PB, ${username} 🎉` : `Great run, ${username}`}
              </Text>
              <Text style={styles.subtitle}>
                {placeName} · {dateLabel} · {timeLabel}
              </Text>
            </View>

            {/* Route hero */}
            <View style={[styles.mapWrap, { width: previewW, height: mapH }]}>
              <RouteArt
                coordinates={runData?.coordinates}
                width={previewW}
                height={mapH}
                variant="hero"
                strokeColor="#24C789"
                placeName={placeName}
                badge={isPB ? { icon: 'star', label: 'NEW 5K PB' } : null}
              />
            </View>

            {/* Distance */}
            <View style={styles.heroRow}>
              <Text style={styles.heroNum} allowFontScaling={false}>
                {distanceKm.toFixed(2)}
              </Text>
              <Text style={styles.heroUnit}>km</Text>
            </View>

            {/* Stats */}
            <View style={styles.stats}>
              <InlineStat label="TIME" value={formatDuration(duration)} />
              <View style={styles.statDivider} />
              <InlineStat label="PACE" value={paceLabel} unit="/km" />
              <View style={styles.statDivider} />
              <InlineStat label="KCAL" value={String(kcal)} />
            </View>

            {/* Splits */}
            {splitsPaces.length > 0 && (
              <View style={styles.splitsBlock}>
                <View style={styles.splitsHeader}>
                  <Text style={styles.splitsLabel}>PER-KM PACE</Text>
                  <Text style={styles.splitsLabel}>
                    Fastest {formatPace(fastest)}
                  </Text>
                </View>
                <View style={styles.splitsRow}>
                  {splitsPaces.map((p, i) => {
                    const ratio = (slowest - p) / paceRange;
                    const h = 20 + ratio * 56;
                    const isFastest = p === fastest;
                    return (
                      <View key={`split-${i}`} style={styles.splitCol}>
                        <View
                          style={[
                            styles.splitBar,
                            { height: h, opacity: isFastest ? 1 : 0.35 },
                          ]}
                        />
                        <Text
                          style={[
                            styles.splitText,
                            isFastest && styles.splitTextFast,
                          ]}
                        >
                          km {i + 1}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Training insight link */}
            {distanceKm > 0 && (
              <BouncyButton
                style={styles.insightLink}
                activeOpacity={0.75}
                onPress={() => {
                  if (navigation) {
                    navigation.navigate('TrainingInsight', {
                      runData,
                      durationInSeconds: duration,
                    });
                  }
                }}
              >
                <Text style={styles.insightLinkText}>See training insight</Text>
                <Ionicons name="arrow-forward" size={13} color="#24C789" />
              </BouncyButton>
            )}

            {/* Save actions */}
            <View style={styles.saveRow}>
              <BouncyButton
                style={[styles.saveBtn, busy === 'card' && styles.saveBtnBusy]}
                activeOpacity={0.85}
                onPress={() => handleShare('card')}
                disabled={!!busy}
              >
                {busy === 'card' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="square-outline" size={17} color="#FFF" />
                    <View style={styles.saveBtnText}>
                      <Text style={styles.saveBtnTitle}>Save card</Text>
                      <Text style={styles.saveBtnSub}>1:1 · feed</Text>
                    </View>
                  </>
                )}
              </BouncyButton>

              <BouncyButton
                style={[styles.saveBtn, busy === 'story' && styles.saveBtnBusy]}
                activeOpacity={0.85}
                onPress={() => handleShare('story')}
                disabled={!!busy}
              >
                {busy === 'story' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="phone-portrait-outline" size={17} color="#FFF" />
                    <View style={styles.saveBtnText}>
                      <Text style={styles.saveBtnTitle}>Save story</Text>
                      <Text style={styles.saveBtnSub}>9:16 · IG</Text>
                    </View>
                  </>
                )}
              </BouncyButton>
            </View>

            <BouncyButton
              style={styles.doneButton}
              activeOpacity={0.85}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                closeRun();
              }}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </BouncyButton>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
};

function InlineStat({ label, value, unit }) {
  return (
    <View style={styles.inlineStat}>
      <Text style={styles.inlineStatLabel}>{label}</Text>
      <View style={styles.inlineStatRow}>
        <Text style={styles.inlineStatValue} allowFontScaling={false}>
          {value}
        </Text>
        {unit ? <Text style={styles.inlineStatUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  card: {
    width: width * 0.9,
    maxHeight: '90%',
    backgroundColor: '#0B0F13',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
  },
  scroll: {
    padding: 24,
    alignItems: 'center',
    gap: 18,
  },
  offscreen: {
    position: 'absolute',
    top: 0,
    left: -10000,
    opacity: 0,
  },

  headline: {
    alignSelf: 'stretch',
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  title: {
    fontFamily: FONT.extraBold,
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1,
    marginTop: 6,
    textTransform: 'uppercase',
  },

  mapWrap: {
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 22,
  },

  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    alignSelf: 'flex-start',
  },
  heroNum: {
    fontFamily: FONT.black,
    fontSize: 56,
    color: '#FFFFFF',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    lineHeight: 58,
  },
  heroUnit: {
    fontFamily: FONT.bold,
    fontSize: 18,
    color: '#8E939A',
    marginLeft: 8,
  },

  stats: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  inlineStat: {
    flex: 1,
    alignItems: 'center',
  },
  inlineStatLabel: {
    ...T.label,
    fontSize: 10,
    marginBottom: 4,
  },
  inlineStatRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  inlineStatValue: {
    fontFamily: FONT.extraBold,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  inlineStatUnit: {
    fontFamily: FONT.semibold,
    fontSize: 11,
    color: '#8E939A',
    marginLeft: 3,
  },

  splitsBlock: {
    alignSelf: 'stretch',
    paddingTop: 12,
    gap: 10,
  },
  splitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitsLabel: {
    fontFamily: FONT.bold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
  },
  splitsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 90,
    gap: 6,
  },
  splitCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
  },
  splitBar: {
    width: '60%',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  splitText: {
    fontFamily: FONT.bold,
    fontSize: 9,
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
  },
  splitTextFast: {
    color: '#FFFFFF',
  },

  insightLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 4,
    alignSelf: 'stretch',
  },
  insightLinkText: {
    fontFamily: FONT.bold,
    fontSize: 13,
    color: '#24C789',
    letterSpacing: 0.2,
  },

  saveRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 10,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 58,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
  },
  saveBtnBusy: { opacity: 0.6 },
  saveBtnText: { alignItems: 'flex-start' },
  saveBtnTitle: {
    fontFamily: FONT.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  saveBtnSub: {
    fontFamily: FONT.semibold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  doneButton: {
    alignSelf: 'stretch',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#24C789',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#24C789',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  doneButtonText: {
    ...T.button,
    fontSize: 17,
    letterSpacing: 0.5,
  },
});

export default RunSummaryModal;
