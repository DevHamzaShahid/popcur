export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in miles
 */
export const calculateDistance = (coord1: Coordinate, coord2: Coordinate): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) * Math.cos(toRadians(coord2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate bearing between two coordinates
 * @param coord1 Start coordinate
 * @param coord2 End coordinate
 * @returns Bearing in degrees (0-360)
 */
export const calculateBearing = (coord1: Coordinate, coord2: Coordinate): number => {
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);
  
  const x = Math.sin(dLon) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  let bearing = Math.atan2(x, y);
  bearing = (bearing * 180) / Math.PI;
  bearing = (bearing + 360) % 360;
  
  return bearing;
};

/**
 * Get map region for fitting coordinates
 */
export const getRegionForCoordinates = (coordinates: Coordinate[], padding = 0.01) => {
  if (coordinates.length === 0) return null;
  
  let minLat = coordinates[0].latitude;
  let maxLat = coordinates[0].latitude;
  let minLng = coordinates[0].longitude;
  let maxLng = coordinates[0].longitude;
  
  coordinates.forEach(coord => {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLng = Math.min(minLng, coord.longitude);
    maxLng = Math.max(maxLng, coord.longitude);
  });
  
  const latDelta = (maxLat - minLat) + padding;
  const lngDelta = (maxLng - minLng) + padding;
  
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
};

/**
 * Cluster parking spots based on distance
 */
export const clusterParkingSpots = (spots: any[], currentLocation: Coordinate, maxDistance = 0.1) => {
  const clusters: any[] = [];
  const processed = new Set();
  
  spots.forEach((spot, index) => {
    if (processed.has(index)) return;
    
    const cluster = [spot];
    processed.add(index);
    
    spots.forEach((otherSpot, otherIndex) => {
      if (processed.has(otherIndex) || index === otherIndex) return;
      
      const distance = calculateDistance(
        { latitude: spot.latitude, longitude: spot.longitude },
        { latitude: otherSpot.latitude, longitude: otherSpot.longitude }
      );
      
      if (distance <= maxDistance) {
        cluster.push(otherSpot);
        processed.add(otherIndex);
      }
    });
    
    clusters.push({
      id: `cluster_${index}`,
      spots: cluster,
      coordinate: {
        latitude: cluster.reduce((sum, s) => sum + s.latitude, 0) / cluster.length,
        longitude: cluster.reduce((sum, s) => sum + s.longitude, 0) / cluster.length,
      },
      count: cluster.length,
    });
  });
  
  return clusters;
};