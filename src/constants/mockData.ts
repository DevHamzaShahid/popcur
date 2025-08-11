import { ParkingSpot } from '../types';
import { calculateDistance } from '../utils/mapUtils';

const USER_LOCATION = {
  latitude: 31.4712,
  longitude: 74.2655,
};

export const MOCK_PARKING_SPOTS: ParkingSpot[] = [
  {
    id: '1',
    latitude: 31.4712,
    longitude: 74.2655,
    price: 8,
    available: true,
    address: 'Main Blvd Johar Town',
    block: 'Block J2',
    house: 'House 12',
    estimatedTime: 30,
    distance: 0.5,
  },
  {
    id: '2',
    latitude: 31.4725,
    longitude: 74.2628,
    price: 6,
    available: true,
    address: 'Street 18',
    block: 'Block J2',
    house: 'House 14',
    estimatedTime: 25,
    distance: 0.4,
  },
  {
    id: '3',
    latitude: 31.4748,
    longitude: 74.2689,
    price: 10,
    available: true,
    address: 'Street 19',
    block: 'Block K1',
    house: 'House 16',
    estimatedTime: 35,
    distance: 0.7,
  },
  {
    id: '4',
    latitude: 31.4696,
    longitude: 74.2703,
    price: 4,
    available: true,
    address: 'Street 16',
    block: 'Block H3',
    house: 'House 8',
    estimatedTime: 20,
    distance: 0.3,
  },
  {
    id: '5',
    latitude: 31.4762,
    longitude: 74.2667,
    price: 12,
    available: true,
    address: 'Street 20',
    block: 'Block L2',
    house: 'House 18',
    estimatedTime: 40,
    distance: 0.8,
  },
  {
    id: '6',
    latitude: 31.4681,
    longitude: 74.2632,
    price: 7,
    available: true,
    address: 'Street 15',
    block: 'Block G4',
    house: 'House 6',
    estimatedTime: 28,
    distance: 0.4,
  },
];

// Calculate actual distances and mark nearest spot
export const getProcessedParkingSpots = (
  userLocation = USER_LOCATION,
): ParkingSpot[] => {
  const spotsWithDistance = MOCK_PARKING_SPOTS.map(spot => ({
    ...spot,
    distance: calculateDistance(userLocation, {
      latitude: spot.latitude,
      longitude: spot.longitude,
    }),
  }));

  // Find nearest spot
  const nearestSpot = spotsWithDistance.reduce((nearest, current) =>
    current.distance < nearest.distance ? current : nearest,
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
