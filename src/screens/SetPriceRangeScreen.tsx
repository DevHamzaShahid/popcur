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
  Image,
} from 'react-native';
import MapView, {
  Circle,
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import ActionSheet from 'react-native-actions-sheet';
import { useIsFocused, useNavigation } from '@react-navigation/native';
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
import { getBoundingCircle } from '../helper/helper';
import LngButton from '../buttons/longbtn';
import { svgImages } from '../assets/svg/svgs';
import CompassIcon from '../components/rotatingIcon';

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
  const [mapZoom, setMapZoom] = useState(0);

  const handleRegionChange = region => {
    const zoom = Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2);
    setMapZoom(zoom);
  };
  const isFocused = useIsFocused();

  useEffect(() => {
    actionSheetRef.current?.show();
  }, []);

  useEffect(() => {
    requestLocationPermission();
    const spots = getProcessedParkingSpots();
    setParkingSpots(spots);
    setFilteredSpots(spots);
  }, []);
  useEffect(() => {
    if (!mapRef.current) return;
    if (!userLocation) return;
    if (filteredSpots.length === 0) return;

    const allCoords = [
      userLocation,
      ...filteredSpots.map(s => ({
        latitude: s.latitude,
        longitude: s.longitude,
      })),
    ];

    mapRef.current.fitToCoordinates(allCoords, {
      edgePadding: { top: 220, right: 180, bottom: 220, left: 180 },
      animated: true,
    });
  }, [userLocation, filteredSpots, isFocused]);

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
        console.log('position>>>>', position);

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
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 },
    );
  };
  const getNearestSpot = () => {
    if (!userLocation || filteredSpots.length === 0) return null;
    let nearestSpot = filteredSpots[0];
    let minDistance = calculateDistance(userLocation, nearestSpot);

    filteredSpots.forEach(spot => {
      const dist = calculateDistance(userLocation, spot);
      if (dist < minDistance) {
        minDistance = dist;
        nearestSpot = spot;
      }
    });

    return nearestSpot;
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
  const nearestSpot = getNearestSpot();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onRegionChange={handleRegionChange}
      >
        {userLocation &&
          filteredSpots.length > 0 &&
          (() => {
            const circle = getBoundingCircle([
              userLocation,
              ...filteredSpots.map(s => ({
                latitude: s.latitude,
                longitude: s.longitude,
              })),
            ]);
            if (!circle) return null;
            return (
              <Circle
                center={circle.center}
                radius={circle.radius * 1.1} // Slight padding
                strokeWidth={2}
                strokeColor="rgba(187, 187, 186, 0.3)"
                fillColor="rgba(187, 187, 186, 0.3)"
              />
            );
          })()}
        {/* User location marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
          >
            {svgImages.UserNotNav}
            {/* <DirectionArrowMarker /> */}
          </Marker>
        )}

        {/* Parking spot clusters */}
        {clusters.map((cluster, index) => (
          <Marker
            key={cluster.id}
            coordinate={cluster.coordinate}
            onPress={() => {
              if (cluster.spots.length === 1) {
                handleMarkerPress(cluster.spots[0]);
              }
            }}
          >
            {svgImages[`Pop${index}`]}

            {/* <Image
              source={require('../assets/pop1.png')}
              style={{ height: 40, width: 40 }}
            /> */}
          </Marker>
        ))}
      </MapView>

      {/* Floating Pin Button */}
      <View
        style={{
          position: 'absolute',
          top: 30,
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity onPress={() => actionSheetRef.current?.show()}>
          <Image
            source={require('../assets/3books.png')}
            style={{ height: 70, width: 70 }}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={require('../assets/8p.png')}
            style={{ height: 50, width: 50 }}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <ActionSheet
        ref={actionSheetRef}
        gestureEnabled={true}
        headerAlwaysVisible={true}
        defaultOverlayOpacity={0}
        CustomHeaderComponent={
          <View style={styles.bottomSheetHeader}>
            <View style={styles.bottomSheetHandle} />
          </View>
        }
      >
        <View style={styles.bottomSheetContent}>
          {/* <CompassIcon icon={require('../assets/Icon.png')} size={60} /> */}
          <View
            style={{
              width: '90%',
              borderRadius: 15,
              borderColor: '#000000',
              borderWidth: 0.4,
              alignSelf: 'center',
              padding: 10,
              backgroundColor: '#fff',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../assets/locationPin.jpg')}
                style={{ height: 20, width: 20 }}
              />
              <Text style={{ fontSize: 20, color: 'black' }}>
                {nearestSpot?.block || '!block'},{' '}
                {nearestSpot?.house || '!house'}
              </Text>
              <Image
                source={require('../assets/fav.png')}
                style={{ height: 40, width: 40, marginLeft: 20 }}
              />
              <Image
                source={require('../assets/share.png')}
                style={{ height: 40, width: 40, marginLeft: 10 }}
              />
              <TouchableOpacity
                style={{
                  marginLeft: 10,
                }}
                onPress={() => actionSheetRef.current?.hide()}
              >
                <Image
                  source={require('../assets/greyCross.png')}
                  style={{ height: 40, width: 40 }}
                />
              </TouchableOpacity>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 10,
              }}
            >
              <Image
                source={require('../assets/locationPin.jpg')}
                style={{ height: 20, width: 20 }}
              />
              <Text style={{ fontSize: 16, color: 'grey' }}>
                {nearestSpot?.estimatedTime || 0} min .{' '}
                {nearestSpot?.distance.toFixed(4) || 0} miles
              </Text>
            </View>

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
                <Text style={styles.boldText}>1.2 miles</Text>
              </Text>
            </View>
          </View>
          <LngButton
            title={'Get Directions'}
            onPress={() => {
              if (nearestSpot) {
                navigation.navigate('GetDirections', {
                  selectedSpot: nearestSpot,
                  spotCount: filteredSpots.length,
                });
              }
            }}
            styles={{ alignSelf: 'center', marginVertical: 15, marginTop: 30 }}
          />
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
    backgroundColor: '#f8f8f8',
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  bottomSheetContent: {
    paddingBottom: 30,
    backgroundColor: '#f8f8f8',
    paddingTop: 20,
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
