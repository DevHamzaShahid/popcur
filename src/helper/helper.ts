import { calculateDistance } from '../utils/mapUtils';

export const getBoundingCircle = (
  points: { latitude: number; longitude: number }[],
) => {
  if (points.length === 0) return null;

  // Center: average latitude & longitude
  const avgLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
  const avgLng =
    points.reduce((sum, p) => sum + p.longitude, 0) / points.length;

  // Max distance from center (in meters)
  const maxDistance = points.reduce((max, p) => {
    const d =
      calculateDistance({ latitude: avgLat, longitude: avgLng }, p) * 1609.34; // miles → meters
    return Math.max(max, d);
  }, 0);

  return {
    center: { latitude: avgLat, longitude: avgLng },
    radius: maxDistance,
  };
};

export function getClusterCircleData(coords: any) {
  if (coords.length === 0) return null;

  const avgLat = coords.reduce((sum, c) => sum + c.latitude, 0) / coords.length;
  const avgLng =
    coords.reduce((sum, c) => sum + c.longitude, 0) / coords.length;
  const center = { latitude: avgLat, longitude: avgLng };

  // Radius in meters
  const R = 6371000; // Earth radius
  const toRad = deg => (deg * Math.PI) / 180;

  let maxDist = 0;
  coords.forEach(c => {
    const dLat = toRad(c.latitude - center.latitude);
    const dLng = toRad(c.longitude - center.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(center.latitude)) *
        Math.cos(toRad(c.latitude)) *
        Math.sin(dLng / 2) ** 2;
    const cVal = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * cVal;
    if (dist > maxDist) maxDist = dist;
  });

  return { center, radius: maxDist };
}
