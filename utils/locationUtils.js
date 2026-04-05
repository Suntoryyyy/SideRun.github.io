export const getDistance = (coord1, coord2) => {
  if (!coord1 || !coord2) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const calculateDistance = (coords) => {
  if (coords.length < 2) return 0;
  let totalDistance = 0;
  for (let i = 1; i < coords.length; i++) {
    totalDistance += getDistance(coords[i - 1], coords[i]);
  }
  return totalDistance;
};