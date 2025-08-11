import { ParkingSpot } from '../types';
import { calculateDistance } from '../utils/mapUtils';

// San Francisco area coordinates for demo
const USER_LOCATION = {
  latitude: 37.7749,
  longitude: -122.4194,
};

export const MOCK_PARKING_SPOTS: ParkingSpot[] = [
  {
    id: '1',
    latitude: 37.7849,
    longitude: -122.4094,
    price: 8,
    available: true,
    address: '17th St',
    block: 'Block J2',
    house: 'House 12',
    estimatedTime: 30,
    distance: 0.5,
  },
  {
    id: '2',
    latitude: 37.7849,
    longitude: -122.4124,
    price: 6,
    available: true,
    address: '18th St',
    block: 'Block J2',
    house: 'House 14',
    estimatedTime: 25,
    distance: 0.4,
  },
  {
    id: '3',
    latitude: 37.7879,
    longitude: -122.4154,
    price: 10,
    available: true,
    address: '19th St',
    block: 'Block K1',
    house: 'House 16',
    estimatedTime: 35,
    distance: 0.7,
  },
  {
    id: '4',
    latitude: 37.7819,
    longitude: -122.4164,
    price: 4,
    available: true,
    address: '16th St',
    block: 'Block H3',
    house: 'House 8',
    estimatedTime: 20,
    distance: 0.3,
  },
  {
    id: '5',
    latitude: 37.7889,
    longitude: -122.4184,
    price: 12,
    available: true,
    address: '20th St',
    block: 'Block L2',
    house: 'House 18',
    estimatedTime: 40,
    distance: 0.8,
  },
  {
    id: '6',
    latitude: 37.7809,
    longitude: -122.4134,
    price: 7,
    available: true,
    address: '15th St',
    block: 'Block G4',
    house: 'House 6',
    estimatedTime: 28,
    distance: 0.4,
  },
];

// Calculate actual distances and mark nearest spot
export const getProcessedParkingSpots = (userLocation = USER_LOCATION): ParkingSpot[] => {
  const spotsWithDistance = MOCK_PARKING_SPOTS.map(spot => ({
    ...spot,
    distance: calculateDistance(userLocation, { latitude: spot.latitude, longitude: spot.longitude }),
  }));

  // Find nearest spot
  const nearestSpot = spotsWithDistance.reduce((nearest, current) => 
    current.distance < nearest.distance ? current : nearest
  );

  return spotsWithDistance.map(spot => ({
    ...spot,
    isNearest: spot.id === nearestSpot.id,
  }));
};

export const DEFAULT_REGION = {
  latitude: USER_LOCATION.latitude,
  longitude: USER_LOCATION.longitude,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};