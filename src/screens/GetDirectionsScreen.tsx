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
  Polyline,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Geolocation from '@react-native-community/geolocation';
import ActionSheet from 'react-native-actions-sheet';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import {
  RootStackParamList,
  ParkingSpot,
  UserLocation,
  NavigationRoute,
} from '../types';
import {
  getProcessedParkingSpots,
  DEFAULT_REGION,
} from '../constants/mockData';
import {
  calculateDistance,
  calculateBearing,
  getRegionForCoordinates,
} from '../utils/mapUtils';
import { CONFIG } from '../constants/config';
import PopcornMarker from '../components/PopcornMarker';
import DirectionArrowMarker from '../components/DirectionArrowMarker';
import Svg, { Path } from 'react-native-svg';
import { getClusterCircleData } from '../helper/helper';
import CrossBtn from '../buttons/crossbtn';
import { svgImages } from '../assets/svg/svgs';

type GetDirectionsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'GetDirections'
>;
type GetDirectionsScreenRouteProp = RouteProp<
  RootStackParamList,
  'GetDirections'
>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const GetDirectionsScreen: React.FC = () => {
  const navigation = useNavigation<GetDirectionsScreenNavigationProp>();
  const route = useRoute<GetDirectionsScreenRouteProp>();
  const mapRef = useRef<MapView>(null);
  const actionSheetRef = useRef<ActionSheet>(null);

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [currentNavLocation, setCurrentNavLocation] =
    useState<UserLocation | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot>(
    route.params.selectedSpot,
  );
  const [spotCount, setSpotCount] = useState<ParkingSpot>(
    route?.params?.spotCount || 0,
  );
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: number;
  } | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [heading, setHeading] = useState<number>(0);
  const watchIdRef = useRef<number | null>(null);
  const lastHeadingRef = useRef<number>(0);
  const [remainingDistance, setRemainingDistance] = useState<number | null>(
    null,
  );
  const hasPreviewedRef = useRef<boolean>(false);

  async function requestLocationPermission() {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }
  useEffect(() => {
    (async () => {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        console.log('hasPermission>>>', hasPermission);

        getCurrentLocation();
      } else {
        console.warn('Location permission denied');
      }
      const spots = getProcessedParkingSpots();
      setParkingSpots(spots);

      // Show bottom sheet immediately
      setTimeout(() => {
        actionSheetRef.current?.show();
      }, 500);
      return () => {
        if (watchIdRef.current !== null) {
          Geolocation.clearWatch(watchIdRef.current);
        }
      };
    })();
  }, []);

  useEffect(() => {
    if (
      userLocation &&
      selectedSpot &&
      !isNavigating &&
      !hasPreviewedRef.current
    ) {
      // Fit map to preview only once before navigation starts
      const coordinates = [
        userLocation,
        { latitude: selectedSpot.latitude, longitude: selectedSpot.longitude },
      ];
      const region = getRegionForCoordinates(coordinates, 0.02);
      if (region && mapRef.current) {
        mapRef.current.animateToRegion(region, 1000);
      }
      hasPreviewedRef.current = true;
    }
  }, [userLocation, selectedSpot, isNavigating]);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        console.log('latitude>>>', latitude);

        setUserLocation({ latitude, longitude });
      },
      error => {
        console.log('Location error:', error);
        setUserLocation({
          latitude: DEFAULT_REGION.latitude,
          longitude: DEFAULT_REGION.longitude,
        });
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 },
    );
  };

  const handleMarkerPress = (spot: ParkingSpot) => {
    // If currently navigating, stop navigation first
    if (isNavigating) {
      stopNavigation();

      // Reset map to overview when stopping navigation
      if (mapRef.current && userLocation) {
        const allCoords = [
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
          ...parkingSpots.map(s => ({
            latitude: s.latitude,
            longitude: s.longitude,
          })),
        ];
        mapRef.current.fitToCoordinates(allCoords, {
          edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
          animated: true,
        });
      }
    }

    // Set new selected spot
    setSelectedSpot(spot);

    // Show bottom sheet for the new spot
    setTimeout(
      () => {
        actionSheetRef.current?.show();
      },
      isNavigating ? 600 : 300,
    ); // Longer delay if stopping navigation
  };

  const TARGET_NAV_ZOOM = 18; // Better zoom level for functionality

  const handleStartNavigation = () => {
    if (!userLocation || routeCoordinates.length === 0) return;
    // actionSheetRef.current?.hide();
    setIsNavigating(true);
    hasPreviewedRef.current = true;

    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
    }

    // IMMEDIATE NAVIGATION START: Zoom in very tight on current location and auto-rotate
    const { bearing: initialBearing, next } = computeUpcoming(
      userLocation,
      routeCoordinates,
    );
    setHeading(initialBearing);
    lastHeadingRef.current = initialBearing;

    if (mapRef.current) {
      // Center on current location with tight zoom
      mapRef.current.animateCamera(
        {
          center: userLocation, // Center directly on user location
          pitch: 65, // Good pitch for navigation view
          heading: initialBearing, // Route bearing - this makes route point north
          zoom: TARGET_NAV_ZOOM, // Tight zoom
        },
        { duration: 1000 }, // Smooth animation to see the zoom
      );
    }

    const watchId = Geolocation.watchPosition(
      position => {
        const {
          latitude,
          longitude,
          heading: deviceHeading,
        } = position.coords as any;
        const newLoc = { latitude, longitude };
        setUserLocation(newLoc);
        setCurrentNavLocation(newLoc); // Track current navigation position

        // Determine current route direction
        const { bearing: upcomingBearing, next } = computeUpcoming(
          newLoc,
          routeCoordinates,
        );

        // Use route bearing for consistent north-pointing behavior
        const resolvedHeading = upcomingBearing;
        setHeading(resolvedHeading);

        // Distance to destination
        const dist = calculateDistance(newLoc, {
          latitude: selectedSpot.latitude,
          longitude: selectedSpot.longitude,
        });
        setRemainingDistance(dist);

        // Center directly on current location for tight navigation
        animateNavigationCamera(newLoc, resolvedHeading, dist);

        if (dist < CONFIG.ARRIVAL_THRESHOLD) {
          stopNavigation();
        }
      },
      error => {
        console.log('watchPosition error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000,
        distanceFilter: CONFIG.LOCATION_UPDATE_DISTANCE,
      },
    );
    watchIdRef.current = watchId;
  };

  const fitToAllPoints = () => {
    if (mapRef.current && userLocation && parkingSpots.length > 0) {
      const allCoords = [
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        ...parkingSpots.map(s => ({
          latitude: s.latitude,
          longitude: s.longitude,
        })),
      ];

      mapRef.current.fitToCoordinates(allCoords, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }
  };

  // const handleRecenter = () => {
  //   if (!userLocation) return;

  //   if (isNavigating) {
  //     // Navigation-style recenter
  //     const { bearing } = computeUpcoming(userLocation, routeCoordinates);
  //     lastHeadingRef.current = bearing;
  //     setHeading(bearing);

  //     mapRef.current?.animateCamera(
  //       {
  //         center: userLocation,
  //         pitch: 65,
  //         heading: bearing,
  //         zoom: TARGET_NAV_ZOOM,
  //       },
  //       { duration: 1000 },
  //     );
  //   } else {
  //     // Fit all points if not navigating
  //     fitToAllPoints();
  //   }
  // };
  useEffect(() => {
    if (userLocation && parkingSpots.length > 0 && mapRef.current) {
      const allCoords = [
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        ...parkingSpots.map(s => ({
          latitude: s.latitude,
          longitude: s.longitude,
        })),
      ];

      mapRef.current.fitToCoordinates(allCoords, {
        edgePadding: { top: 220, right: 120, bottom: 220, left: 120 },
        animated: true,
      });
    }
  }, [parkingSpots]);
  const stopNavigation = () => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsNavigating(false);
    setCurrentNavLocation(null); // Clear navigation location
  };

  const computeUpcoming = (
    current: { latitude: number; longitude: number },
    coords: any[],
  ): { bearing: number; next: { latitude: number; longitude: number } } => {
    if (!coords || coords.length < 2) {
      return { bearing: lastHeadingRef.current || 0, next: current };
    }
    let nearestIdx = 0;
    let minDist = Number.MAX_VALUE;
    for (let i = 0; i < coords.length; i++) {
      const d =
        Math.abs(coords[i].latitude - current.latitude) +
        Math.abs(coords[i].longitude - current.longitude);
      if (d < minDist) {
        minDist = d;
        nearestIdx = i;
      }
    }
    const nextIdx = Math.min(nearestIdx + 1, coords.length - 1);
    const from = coords[nearestIdx];
    const to = coords[nextIdx];
    const bearing = calculateBearing(from, to);
    return { bearing, next: to };
  };

  const getLookaheadCenter = (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
    factor = 0.12,
  ) => ({
    latitude: from.latitude + (to.latitude - from.latitude) * factor,
    longitude: from.longitude + (to.longitude - from.longitude) * factor,
  });

  const animateNavigationCamera = (
    center: { latitude: number; longitude: number },
    newHeading: number,
    distanceToDest: number,
  ) => {
    if (!mapRef.current) return;

    // Smooth the heading to avoid jittery camera movement
    const previous = lastHeadingRef.current;
    const diff = ((newHeading - previous + 540) % 360) - 180; // shortest angle
    const smoothedHeading = (previous + diff * 0.5 + 360) % 360; // More responsive smoothing
    lastHeadingRef.current = smoothedHeading;

    // Dynamic zoom based on distance to destination
    let dynamicZoom = TARGET_NAV_ZOOM;
    if (distanceToDest < 0.05) {
      // Very close - zoom in more
      dynamicZoom = TARGET_NAV_ZOOM + 1.5;
    } else if (distanceToDest < 0.1) {
      // Close - zoom in slightly
      dynamicZoom = TARGET_NAV_ZOOM + 0.5;
    } else if (distanceToDest > 0.5) {
      // Far away - slight zoom out
      dynamicZoom = TARGET_NAV_ZOOM - 1;
    }

    // CONTINUOUS AUTO-ROTATION: Keep route pointing north
    mapRef.current.animateCamera(
      {
        center, // Center directly on current location
        pitch: 65, // Good pitch for navigation
        heading: smoothedHeading, // Use route bearing directly to point north
        zoom: dynamicZoom,
      },
      { duration: 400 }, // Faster animation for better responsiveness
    );
  };
  console.log('isNavigating>>>>', isNavigating);

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
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        rotateEnabled={true}
        pitchEnabled={true}
        scrollEnabled={true} // Keep scrolling enabled during navigation
        zoomEnabled={true} // Keep zoom enabled during navigation
      >
        {userLocation && parkingSpots.length > 0 && (
          <Circle
            center={
              getClusterCircleData([
                {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                },
                ...parkingSpots.map(s => ({
                  latitude: s.latitude,
                  longitude: s.longitude,
                })),
              ]).center
            }
            radius={
              getClusterCircleData([
                {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                },
                ...parkingSpots.map(s => ({
                  latitude: s.latitude,
                  longitude: s.longitude,
                })),
              ]).radius
            }
            strokeColor="rgba(187, 187, 186, 0.3)"
            fillColor="rgba(187, 187, 186, 0.3)"
          />
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
          >
            {!isNavigating ? svgImages.UserNotNav : svgImages.UserNav}
            {/* <DirectionArrowMarker heading={isNavigating ? heading : 0} /> */}
          </Marker>
        )}

        {/* All parking spots */}
        {parkingSpots.map((spot, index) => (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
            onPress={() => handleMarkerPress(spot)}
          >
            {/* {spot.id === selectedSpot.id ? (
              <PopcornMarker size={35} />
            ) : spot.isNearest ? (
              <PopcornMarker />
            ) : (
              <View
                style={[
                  styles.regularMarker,
                  spot.id === selectedSpot.id && styles.selectedMarker,
                ]}
              >
                <Text style={styles.markerText}>{spot.price}</Text>
              </View>
            )} */}
            {svgImages[`Pop${index}`]}
          </Marker>
        ))}

        {/* Route directions - Dynamic route from current location to destination */}
        {isNavigating
          ? routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={6}
                strokeColor="rgba(0, 0, 0, 0.9)"
              />
            )
          : userLocation &&
            selectedSpot && (
              <MapViewDirections
                key={`route_${isNavigating ? 'nav' : 'preview'}_${
                  selectedSpot.id
                }`}
                origin={
                  isNavigating && currentNavLocation
                    ? currentNavLocation
                    : userLocation
                } // Use current nav location during navigation
                destination={{
                  latitude: selectedSpot.latitude,
                  longitude: selectedSpot.longitude,
                }}
                apikey={CONFIG.GOOGLE_MAPS_API_KEY}
                strokeWidth={isNavigating ? 6 : 4} // Thicker line during navigation
                strokeColor={isNavigating ? '#1E40AF' : '#000000'} // Blue during navigation, black otherwise
                optimizeWaypoints={true}
                resetOnChange={true} // Force route recalculation when origin changes
                onReady={onDirectionsReady}
                onError={errorMessage => {
                  console.log('Directions error:', errorMessage);
                  // For demo purposes, create a simple straight line
                  const currentOrigin =
                    isNavigating && currentNavLocation
                      ? currentNavLocation
                      : userLocation;
                  const demoRoute = [
                    currentOrigin,
                    {
                      latitude: selectedSpot.latitude,
                      longitude: selectedSpot.longitude,
                    },
                  ];
                  setRouteCoordinates(demoRoute);
                  setRouteInfo({
                    distance: calculateDistance(currentOrigin, selectedSpot),
                    duration: selectedSpot.estimatedTime,
                  });
                }}
              />
            )}
      </MapView>

      {/* <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>⟳</Text>
      </TouchableOpacity> */}
      {/* Bottom Sheet */}
      <ActionSheet
        ref={actionSheetRef}
        closeOnTouchBackdrop={false}
        headerAlwaysVisible={true}
        defaultOverlayOpacity={0}
        backgroundInteractionEnabled
        CustomHeaderComponent={
          <View style={styles.bottomSheetHeader}>
            <View style={styles.bottomSheetHandle} />
          </View>
        }
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.spotHeader}>
            <Text style={styles.spotTitle}>
              {selectedSpot.house}, {selectedSpot.block}
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <Image
                source={require('../assets/fav.png')}
                style={{ height: 40, width: 40, marginLeft: 20 }}
              />
              <Image
                source={require('../assets/share.png')}
                style={{ height: 40, width: 40, marginLeft: 10 }}
              />
            </View>
            {!isNavigating ? (
              <CrossBtn isBlack={false} onPress={() => navigation.goBack()} />
            ) : (
              <CrossBtn isBlack={true} onPress={() => navigation.goBack()} />
            )}
          </View>

          <View style={styles.spotDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Text>🚘</Text>
              </View>
              <Text style={styles.detailText}>
                {routeInfo
                  ? `${routeInfo.duration.toFixed(2)} mins`
                  : `${selectedSpot.estimatedTime} min`}{' '}
                .{' '}
                {routeInfo
                  ? `${routeInfo.distance.toFixed(1)} miles`
                  : `${selectedSpot.distance} miles`}
              </Text>
            </View>

            <View style={styles.spotsInfo}>
              <View style={styles.spotsIcon}>
                <Text style={styles.spotsNumber}>
                  {spotCount || parkingSpots?.filter(s => s.available).length}
                </Text>
              </View>
              <Text style={styles.spotsText}>
                Available parking spots within{' '}
                <Text style={styles.boldText}>0.5 miles</Text>
              </Text>
            </View>
          </View>

          {isNavigating || (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartNavigation}
            >
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          )}
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
  recenterButton: {
    position: 'absolute',
    bottom: 500,
    right: 20,
    backgroundColor: 'red',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
    paddingBottom: 100,
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
