import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Text,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import MapView, {
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import ActionSheet from 'react-native-actions-sheet';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import {
  RootStackParamList,
  ParkingSpot,
  UserLocation,
  PriceRange,
} from '../types';
import {
  getProcessedParkingSpots,
  DEFAULT_REGION,
} from '../constants/mockData';
import { clusterParkingSpots, calculateDistance } from '../utils/mapUtils';
import PriceRangeSlider from '../components/PriceRangeSlider';
import PopcornMarker from '../components/PopcornMarker';
import ParkingClusterMarker from '../components/ParkingClusterMarker';
import DirectionArrowMarker from '../components/DirectionArrowMarker';
import Svg, { Path } from 'react-native-svg';

type SetPriceRangeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SetPriceRange'
>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SetPriceRangeScreen: React.FC = () => {
  const navigation = useNavigation<SetPriceRangeScreenNavigationProp>();
  const mapRef = useRef<MapView>(null);
  const actionSheetRef = useRef<ActionSheet>(null);

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<ParkingSpot[]>([]);
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 15 });
  const [clusters, setClusters] = useState<any[]>([]);

  useEffect(() => {
    requestLocationPermission();
    const spots = getProcessedParkingSpots();
    setParkingSpots(spots);
    setFilteredSpots(spots);
  }, []);

  useEffect(() => {
    if (userLocation && filteredSpots.length > 0) {
      const newClusters = clusterParkingSpots(filteredSpots, userLocation);
      setClusters(newClusters);
    }
  }, [filteredSpots, userLocation]);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message:
            'This app needs access to location to show parking spots near you.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        getCurrentLocation();
      }
    } else {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });

        // Animate to user location
        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          1000,
        );
      },
      error => {
        console.log('Location error:', error);
        // Use default location for demo
        setUserLocation({
          latitude: DEFAULT_REGION.latitude,
          longitude: DEFAULT_REGION.longitude,
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange({ min, max });
    const filtered = parkingSpots.filter(
      spot => spot.price >= min && spot.price <= max,
    );
    setFilteredSpots(filtered);
  };

  const handleMarkerPress = (spot: ParkingSpot) => {
    navigation.navigate('GetDirections', { selectedSpot: spot });
  };

  const renderPinIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
        fill="white"
      />
    </Svg>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <MapView
        key={'AIzaSyDwK5Xp8GFmWZ1yTpOin7Ma2gFLXxpIqhM'}
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
          >
            <DirectionArrowMarker />
          </Marker>
        )}

        {/* Parking spot clusters */}
        {clusters.map(cluster => (
          <Marker
            key={cluster.id}
            coordinate={cluster.coordinate}
            onPress={() => {
              if (cluster.spots.length === 1) {
                handleMarkerPress(cluster.spots[0]);
              }
            }}
          >
            {cluster.spots.length === 1 ? (
              cluster.spots[0].isNearest ? (
                <PopcornMarker />
              ) : (
                <View style={styles.regularMarker}>
                  <Text style={styles.markerText}>
                    {cluster.spots[0].price}
                  </Text>
                </View>
              )
            ) : (
              <ParkingClusterMarker count={cluster.count} />
            )}
          </Marker>
        ))}
      </MapView>

      {/* Floating Pin Button */}
      <TouchableOpacity style={styles.pinButton}>
        {renderPinIcon()}
      </TouchableOpacity>

      {/* Get Directions Button */}
      <TouchableOpacity
        style={styles.getDirectionsButton}
        onPress={() => actionSheetRef.current?.show()}
      >
        <Text style={styles.getDirectionsText}>Get Directions</Text>
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <ActionSheet
        ref={actionSheetRef}
        gestureEnabled={true}
        headerAlwaysVisible={true}
        CustomHeaderComponent={
          <View style={styles.bottomSheetHeader}>
            <View style={styles.bottomSheetHandle} />
          </View>
        }
      >
        <View style={styles.bottomSheetContent}>
          <PriceRangeSlider
            min={0}
            max={15}
            initialMin={priceRange.min}
            initialMax={priceRange.max}
            onValueChange={handlePriceRangeChange}
          />

          <View style={styles.spotsInfo}>
            <View style={styles.spotsIcon}>
              <Text style={styles.spotsNumber}>{filteredSpots.length}</Text>
            </View>
            <Text style={styles.spotsText}>
              available parking spots within{' '}
              <Text style={styles.boldText}>0.5 miles</Text>
            </Text>
          </View>
        </View>
      </ActionSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: screenWidth,
    height: screenHeight,
  },
  pinButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 48,
    height: 48,
    backgroundColor: '#000000',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  getDirectionsButton: {
    position: 'absolute',
    bottom: 100,
    left: 40,
    right: 40,
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  getDirectionsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  regularMarker: {
    backgroundColor: '#FFD700',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  markerText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomSheetHeader: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  bottomSheetContent: {
    paddingBottom: 30,
  },
  spotsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  spotsIcon: {
    backgroundColor: '#FFD700',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  spotsNumber: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  spotsText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  boldText: {
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default SetPriceRangeScreen;
