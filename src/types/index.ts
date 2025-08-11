import { Coordinate } from '../utils/mapUtils';

export interface ParkingSpot {
  id: string;
  latitude: number;
  longitude: number;
  price: number;
  available: boolean;
  address: string;
  block: string;
  house: string;
  estimatedTime: number; // in minutes
  distance: number; // in miles
  isNearest?: boolean;
}

export interface ParkingCluster {
  id: string;
  spots: ParkingSpot[];
  coordinate: Coordinate;
  count: number;
}

export interface NavigationRoute {
  coordinates: Coordinate[];
  distance: number;
  duration: number;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

export type RootStackParamList = {
  SetPriceRange: undefined;
  GetDirections: { selectedSpot: ParkingSpot };
  StartJourney: { selectedSpot: ParkingSpot; route: NavigationRoute };
};

export interface PriceRange {
  min: number;
  max: number;
}