import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Geolocation from '@react-native-community/geolocation';
import ActionSheet from 'react-native-actions-sheet';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { RootStackParamList, ParkingSpot, UserLocation, NavigationRoute } from '../types';
import { getProcessedParkingSpots, DEFAULT_REGION } from '../constants/mockData';
import { calculateDistance, getRegionForCoordinates } from '../utils/mapUtils';
import { CONFIG } from '../constants/config';
import PopcornMarker from '../components/PopcornMarker';
import DirectionArrowMarker from '../components/DirectionArrowMarker';
import Svg, { Path } from 'react-native-svg';

type GetDirectionsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GetDirections'>;
type GetDirectionsScreenRouteProp = RouteProp<RootStackParamList, 'GetDirections'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const GetDirectionsScreen: React.FC = () => {
  const navigation = useNavigation<GetDirectionsScreenNavigationProp>();
  const route = useRoute<GetDirectionsScreenRouteProp>();
  const mapRef = useRef<MapView>(null);
  const actionSheetRef = useRef<ActionSheet>(null);
  
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot>(route.params.selectedSpot);
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

  useEffect(() => {
    getCurrentLocation();
    const spots = getProcessedParkingSpots();
    setParkingSpots(spots);
    
    // Show bottom sheet immediately
    setTimeout(() => {
      actionSheetRef.current?.show();
    }, 500);
  }, []);

  useEffect(() => {
    if (userLocation && selectedSpot) {
      // Fit map to show both user location and selected spot
      const coordinates = [
        userLocation,
        { latitude: selectedSpot.latitude, longitude: selectedSpot.longitude }
      ];
      const region = getRegionForCoordinates(coordinates, 0.02);
      if (region && mapRef.current) {
        mapRef.current.animateToRegion(region, 1000);
      }
    }
  }, [userLocation, selectedSpot]);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
      },
      (error) => {
        console.log('Location error:', error);
        setUserLocation({ latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleMarkerPress = (spot: ParkingSpot) => {
    setSelectedSpot(spot);
  };

  const handleStartJourney = () => {
    if (routeCoordinates.length > 0 && routeInfo) {
      const navigationRoute: NavigationRoute = {
        coordinates: routeCoordinates,
        distance: routeInfo.distance,
        duration: routeInfo.duration,
      };
      navigation.navigate('StartJourney', { 
        selectedSpot, 
        route: navigationRoute 
      });
    }
  };

  const onDirectionsReady = (result: any) => {
    setRouteCoordinates(result.coordinates);
    setRouteInfo({
      distance: result.distance,
      duration: result.duration,
    });
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

  const renderShareIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const renderCarIcon = () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 17a2 2 0 1 0 4 0m0 0V9a1 1 0 0 1 1-1h4m0 8a2 2 0 1 0 4 0m-4 0V9m0 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8"
        stroke="#6B7280"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
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

        {/* All parking spots */}
        {parkingSpots.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
            onPress={() => handleMarkerPress(spot)}
          >
            {spot.id === selectedSpot.id ? (
              <PopcornMarker size={35} />
            ) : spot.isNearest ? (
              <PopcornMarker />
            ) : (
              <View style={[
                styles.regularMarker,
                spot.id === selectedSpot.id && styles.selectedMarker
              ]}>
                <Text style={styles.markerText}>{spot.price}</Text>
              </View>
            )}
          </Marker>
        ))}

        {/* Route directions */}
        {userLocation && selectedSpot && (
          <MapViewDirections
            origin={userLocation}
            destination={{ latitude: selectedSpot.latitude, longitude: selectedSpot.longitude }}
            apikey={CONFIG.GOOGLE_MAPS_API_KEY}
            strokeWidth={4}
            strokeColor="#000000"
            onReady={onDirectionsReady}
            onError={(errorMessage) => {
              console.log('Directions error:', errorMessage);
              // For demo purposes, create a simple straight line
              const demoRoute = [
                userLocation,
                { latitude: selectedSpot.latitude, longitude: selectedSpot.longitude }
              ];
              setRouteCoordinates(demoRoute);
              setRouteInfo({
                distance: calculateDistance(userLocation, selectedSpot),
                duration: selectedSpot.estimatedTime,
              });
            }}
          />
        )}
      </MapView>

      {/* Top buttons */}
      <View style={styles.topButtons}>
        <TouchableOpacity 
          style={styles.topButton}
          onPress={() => navigation.goBack()}
        >
          {renderCloseIcon()}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.topButton}>
          {renderShareIcon()}
        </TouchableOpacity>
      </View>

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
          <View style={styles.spotHeader}>
            <Text style={styles.spotTitle}>{selectedSpot.house}, {selectedSpot.block}</Text>
            <TouchableOpacity>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 5v14m7-7H5"
                  stroke="#1F2937"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>
          
          <View style={styles.spotDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                {renderCarIcon()}
              </View>
              <Text style={styles.detailText}>
                {routeInfo ? `${routeInfo.duration} min` : `${selectedSpot.estimatedTime} min`} / {routeInfo ? `${routeInfo.distance.toFixed(1)} miles` : `${selectedSpot.distance} miles`}
              </Text>
            </View>
            
            <View style={styles.spotsInfo}>
              <View style={styles.spotsIcon}>
                <Text style={styles.spotsNumber}>{parkingSpots.filter(s => s.available).length}</Text>
              </View>
              <Text style={styles.spotsText}>
                Available parking spots within <Text style={styles.boldText}>0.5 miles</Text>
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartJourney}
          >
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
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
  topButtons: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topButton: {
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
  selectedMarker: {
    borderColor: '#000000',
    borderWidth: 3,
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
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  spotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  spotTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  spotDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailIcon: {
    marginRight: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  spotsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  startButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GetDirectionsScreen;