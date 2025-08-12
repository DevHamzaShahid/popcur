import { ParkingSpot } from '../types';
import { calculateDistance } from '../utils/mapUtils';

const USER_LOCATION = {
  latitude: 31.4712,
  longitude: 74.2655,
};

export const MOCK_PARKING_SPOTS: ParkingSpot[] = [
  // Johar Town spots
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
    popcorn: require('../assets/pop1.png'),
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
    popcorn: require('../assets/pop2.png'),
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
    popcorn: require('../assets/pop3.png'),
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
    popcorn: require('../assets/pop4.png'),
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
    popcorn: require('../assets/pop5.png'),
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
    popcorn: require('../assets/pop6.png'),
  },

  // Wapda Town
  {
    id: '7',
    latitude: 31.4467,
    longitude: 74.2675,
    price: 9,
    available: true,
    address: 'Wapda Ave',
    block: 'Block D1',
    house: 'House 22',
    estimatedTime: 32,
    distance: 0.6,
    popcorn: require('../assets/pop7.png'),
  },

  // PIA Road (Dagwood)
  {
    id: '8',
    latitude: 31.4932,
    longitude: 74.3085,
    price: 11,
    available: true,
    address: 'PIA Main Blvd',
    block: 'Dagwood Area',
    house: 'House 5',
    estimatedTime: 38,
    distance: 0.9,
    popcorn: require('../assets/pop8.png'),
  },

  // Township
  {
    id: '9',
    latitude: 31.4461,
    longitude: 74.3074,
    price: 5,
    available: true,
    address: 'Township Market',
    block: 'Block 4',
    house: 'House 3',
    estimatedTime: 22,
    distance: 0.5,
    popcorn: require('../assets/pop9.png'),
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
