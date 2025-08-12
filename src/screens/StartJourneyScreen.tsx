import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import MapView, {
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
  Polyline,
} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import {
  RootStackParamList,
  ParkingSpot,
  UserLocation,
  NavigationRoute,
} from '../types';
import { calculateBearing, calculateDistance } from '../utils/mapUtils';
import DirectionArrowMarker from '../components/DirectionArrowMarker';
import Svg, { Path } from 'react-native-svg';

type StartJourneyScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'StartJourney'
>;
type StartJourneyScreenRouteProp = RouteProp<
  RootStackParamList,
  'StartJourney'
>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const StartJourneyScreen: React.FC = () => {
  const navigation = useNavigation<StartJourneyScreenNavigationProp>();
  const route = useRoute<StartJourneyScreenRouteProp>();
  const mapRef = useRef<MapView>(null);
  const watchIdRef = useRef<number | null>(null);

  const { selectedSpot, route: navigationRoute } = route.params;

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [remainingDistance, setRemainingDistance] = useState<number>(
    navigationRoute.distance,
  );
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');
  const [isNavigating, setIsNavigating] = useState<boolean>(true);

  useEffect(() => {
    startNavigation();
    calculateArrivalTime();

    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (userLocation) {
      const distance = calculateDistance(userLocation, {
        latitude: selectedSpot.latitude,
        longitude: selectedSpot.longitude,
      });
      setRemainingDistance(distance);

      // Check if arrived (within 50 meters)
      if (distance < 0.03) {
        // approximately 50 meters
        handleArrival();
      }

      // Update map camera to follow user with heading
      updateMapCamera();
    }
  }, [userLocation, heading]);

  const startNavigation = () => {
    const watchId = Geolocation.watchPosition(
      position => {
        const { latitude, longitude, heading: deviceHeading } = position.coords;
        const newLocation: UserLocation = {
          latitude,
          longitude,
          heading: deviceHeading || 0,
        };

        setUserLocation(newLocation);

        if (deviceHeading !== null && deviceHeading !== undefined) {
          setHeading(deviceHeading);
        } else {
          // Calculate heading based on movement direction
          if (userLocation) {
            const bearing = calculateBearing(userLocation, newLocation);
            setHeading(bearing);
          }
        }
      },
      error => {
        console.log('Navigation error:', error);
        Alert.alert(
          'Navigation Error',
          'Unable to get your current location for navigation.',
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 1000,
        distanceFilter: 5, // Update every 5 meters
      },
    );

    watchIdRef.current = watchId;
  };

  const updateMapCamera = () => {
    if (userLocation && mapRef.current) {
      // Navigation mode: keep user centered and map rotated according to heading
      mapRef.current.animateCamera(
        {
          center: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
          pitch: 60, // 3D view angle
          heading: 360 - heading, // Invert heading to keep route "up"
          zoom: 18, // Close zoom for navigation
        },
        { duration: 500 },
      );
    }
  };

  const calculateArrivalTime = () => {
    const now = new Date();
    const arrivalTime = new Date(
      now.getTime() + navigationRoute.duration * 60000,
    );
    const timeString = arrivalTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    setEstimatedArrival(timeString);
  };

  const handleArrival = () => {
    setIsNavigating(false);
    Alert.alert(
      'Arrived!',
      `You have arrived at ${selectedSpot.house}, ${selectedSpot.block}`,
      [
        {
          text: 'Done',
          onPress: () => navigation.navigate('SetPriceRange'),
        },
      ],
    );
  };

  const handleEndNavigation = () => {
    Alert.alert('End Navigation', 'Are you sure you want to end navigation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: () => {
          setIsNavigating(false);
          if (watchIdRef.current !== null) {
            Geolocation.clearWatch(watchIdRef.current);
          }
          navigation.navigate('SetPriceRange');
        },
      },
    ]);
  };

  const renderCloseIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const formatDistance = (distance: number): string => {
    if (distance < 0.1) {
      return `${Math.round(distance * 5280)} ft`;
    }
    return `${distance.toFixed(1)} mi`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />

      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        mapType="standard"
        rotateEnabled={true}
        pitchEnabled={true}
        // scrollEnabled={false}
        // zoomEnabled={false}
      >
        {/* User location marker with heading */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
          >
            <DirectionArrowMarker heading={heading} size={50} />
          </Marker>
        )}

        {/* Destination marker */}
        <Marker
          coordinate={{
            latitude: selectedSpot.latitude,
            longitude: selectedSpot.longitude,
          }}
        >
          <View style={styles.destinationMarker}>
            <Svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <Path
                d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                fill="#DC2626"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <Path d="M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" fill="#FFFFFF" />
            </Svg>
          </View>
        </Marker>

        {/* Route polyline */}
        {navigationRoute.coordinates.length > 0 && (
          <Polyline
            coordinates={navigationRoute.coordinates}
            strokeColor="#1E40AF"
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      {/* Navigation overlay */}
      <View style={styles.navigationOverlay}>
        {/* Top section */}
        <View style={styles.topSection}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleEndNavigation}
          >
            {renderCloseIcon()}
          </TouchableOpacity>

          <View style={styles.routeInfo}>
            <Text style={styles.routeTitle}>Route</Text>
            <Text style={styles.routeSubtitle}>Turn Right to Parking Spot</Text>
          </View>

          <View style={styles.placeholder} />
        </View>

        {/* Bottom section */}
        {/* <View style={styles.bottomSection}>
          <View style={styles.navigationInfo}>
            <View style={styles.distanceContainer}>
              <Text style={styles.distanceText}>{formatDistance(remainingDistance)}</Text>
              <View style={styles.directionIcon}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 4l8 8-8 8V4z"
                    fill="#FFFFFF"
                  />
                </Svg>
              </View>
            </View>
            
            <View style={styles.destinationInfo}>
              <Text style={styles.destinationTitle}>
                {selectedSpot.house}, {selectedSpot.block}
              </Text>
              <Text style={styles.arrivalText}>
                Arrival at: <Text style={styles.arrivalTime}>{estimatedArrival}</Text>
              </Text>
              <Text style={styles.distanceSubtext}>
                Available parking spots within <Text style={styles.boldText}>0.5 miles</Text>
              </Text>
            </View>
          </View>
        </View> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  map: {
    width: screenWidth,
    height: screenHeight,
  },
  navigationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeInfo: {
    alignItems: 'center',
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  routeSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  placeholder: {
    width: 48,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  navigationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  distanceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 10,
  },
  directionIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#1E40AF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationInfo: {
    flex: 1,
  },
  destinationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  arrivalText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  arrivalTime: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  distanceSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  boldText: {
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  destinationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StartJourneyScreen;
