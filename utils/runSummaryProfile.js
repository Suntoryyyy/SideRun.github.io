/**
 * Classify a finished run for the summary screen — mood, copy, and highlight chips.
 * Keeps celebration earned and specific (PRODUCT.md), not generic every time.
 */
const MOODS = {
  sunrise: { accent: '#FF7B5A', tint: 'rgba(255,123,90,0.14)', label: 'Sunrise' },
  daylight: { accent: '#60A7E8', tint: 'rgba(96,167,232,0.14)', label: 'Daylight' },
  golden: { accent: '#FF915A', tint: 'rgba(255,145,90,0.14)', label: 'Golden hour' },
  night: { accent: '#7B8CFF', tint: 'rgba(123,140,255,0.14)', label: 'Night run' },
};

const moodForHour = (hour) => {
  if (hour >= 5 && hour < 8) return MOODS.sunrise;
  if (hour >= 8 && hour < 17) return MOODS.daylight;
  if (hour >= 17 && hour < 20) return MOODS.golden;
  return MOODS.night;
};

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

export const getRunSummaryProfile = ({
  distanceKm = 0,
  durationSec = 0,
  isPB = false,
  cheersReceived = 0,
  splitsPaces = [],
  username = 'Runner',
  hour = new Date().getHours(),
}) => {
  const mood = moodForHour(hour);
  const placeName = describeRun(hour);
  const paceMinPerKm = distanceKm > 0 ? durationSec / 60 / distanceKm : 0;

  const highlights = [];

  if (isPB) {
    highlights.push({ icon: 'star', label: 'New 5K PB', tone: 'accent' });
  }
  if (cheersReceived >= 10) {
    highlights.push({ icon: 'flash', label: `${cheersReceived} cheers`, tone: 'social' });
  } else if (cheersReceived >= 3) {
    highlights.push({ icon: 'heart', label: `${cheersReceived} cheers`, tone: 'social' });
  }
  if (distanceKm >= 8) {
    highlights.push({ icon: 'trail-sign', label: 'Long run', tone: 'neutral' });
  } else if (distanceKm > 0 && distanceKm < 2) {
    highlights.push({ icon: 'flash-outline', label: 'Quick session', tone: 'neutral' });
  }

  if (splitsPaces.length >= 2) {
    const fastest = Math.min(...splitsPaces);
    const slowest = Math.max(...splitsPaces);
    const variance = slowest - fastest;
    if (variance <= 0.25) {
      highlights.push({ icon: 'pulse', label: 'Steady pace', tone: 'neutral' });
    } else {
      highlights.push({
        icon: 'speedometer',
        label: `Fastest ${formatPace(fastest)}`,
        tone: 'neutral',
      });
    }
  }

  let title;
  let subtitle;

  if (isPB) {
    title = `New PB, ${username}`;
    subtitle = `${placeName} · personal best unlocked`;
  } else if (cheersReceived >= 10) {
    title = `Crowd loved it, ${username}`;
    subtitle = `${placeName} · ${cheersReceived} cheers from your crew`;
  } else if (distanceKm >= 8) {
    title = `Strong miles, ${username}`;
    subtitle = `${placeName} · ${distanceKm.toFixed(1)} km logged`;
  } else if (distanceKm > 0 && distanceKm < 2) {
    title = `Nice and easy, ${username}`;
    subtitle = `${placeName} · every run counts`;
  } else {
    title = `Great run, ${username}`;
    subtitle = `${placeName} · ${mood.label.toLowerCase()}`;
  }

  return {
    mood,
    placeName,
    title,
    subtitle,
    highlights,
    accent: isPB ? '#24C789' : mood.accent,
    accentTint: isPB ? 'rgba(36,199,137,0.14)' : mood.tint,
    paceMinPerKm,
  };
};

export default getRunSummaryProfile;
