import AsyncStorage from '@react-native-async-storage/async-storage';

export const getUnitConfig = async () => {
  try {
    const config = await AsyncStorage.getItem('unitConfig');
    if (config) return JSON.parse(config);
  } catch (e) {
    console.error('Error fetching unit config:', e);
  }
  return { distance: 'meters', speed: 'speed' }; // Defaults for short runs
};

export const formatDistance = (kmValue, unit = 'meters') => {
  if (unit === 'kilometers') {
    return { value: Number(kmValue).toFixed(2), label: 'KILOMETERS', shortLabel: 'km' };
  } else {
    return { value: (Number(kmValue) * 1000).toFixed(0), label: 'METERS', shortLabel: 'm' };
  }
};

export const formatPaceOrSpeed = (distanceKm, durationSeconds, unit = 'speed') => {
  if (distanceKm <= 0 || durationSeconds <= 0) {
     return { value: '0.0', label: unit === 'pace' ? 'PACE(M/KM)' : 'SPEED (M/S)' };
  }
  if (unit === 'pace') {
     const paceNum = durationSeconds / 60 / distanceKm;
     return { value: paceNum.toFixed(1), label: 'PACE(M/KM)' };
  } else {
     const speedNum = (distanceKm * 1000) / durationSeconds;
     return { value: speedNum.toFixed(1), label: 'SPEED (M/S)' };
  }
};
