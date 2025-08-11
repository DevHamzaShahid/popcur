# PopCurb Parking App

A React Native parking app with 3 screens that provides pixel-perfect map integration, route navigation, and real-time location tracking.

## Features

### Screen 1: Set Price Range
- Interactive map with clustered parking spots
- Custom price range slider for filtering spots
- Floating pin button for location services
- Popcorn marker for nearest available spot
- Custom cluster markers for grouped spots

### Screen 2: Get Directions
- Route visualization with directions to selected parking spot
- Real-time route calculations using react-native-maps-directions
- Interactive spot selection with route updates
- Spot details in bottom sheet with arrival time and distance
- Share and close functionality

### Screen 3: Start Journey (Live Navigation)
- Live GPS tracking with automatic location updates
- 3D map view with heading-based rotation
- Real-time distance calculations
- Arrival detection and notifications
- Navigation overlay with turn-by-turn style interface

## Technical Implementation

### Map Features
- **Google Maps Provider**: Full Google Maps integration
- **Custom Markers**: Direction arrow, popcorn icon, and cluster markers
- **Haversine Formula**: Accurate distance calculations between coordinates
- **Route Clustering**: Intelligent grouping of nearby parking spots
- **Auto-rotation**: Map rotates based on user heading during navigation

### Navigation & Animations
- **React Navigation**: Stack navigator with smooth transitions
- **Gesture Handling**: Smooth bottom sheet interactions
- **Camera Animations**: Dynamic map camera movements
- **Real-time Updates**: Live location tracking every 5 meters

### Permissions & Platform Support
- **iOS**: Location permissions configured in Info.plist
- **Android**: Fine and coarse location permissions
- **Cross-platform**: Consistent behavior on both platforms

## Installation & Setup

### Prerequisites
- React Native development environment
- Google Maps API key (for directions)
- iOS/Android development setup

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **iOS Setup**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Google Maps API Key**
   - Get a Google Maps API key from Google Cloud Console
   - Replace `YOUR_GOOGLE_MAPS_API_KEY` in `src/screens/GetDirectionsScreen.tsx`

4. **Run the App**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── DirectionArrowMarker.tsx    # Custom arrow marker
│   ├── PopcornMarker.tsx          # Nearest spot marker
│   ├── ParkingClusterMarker.tsx   # Cluster marker
│   └── PriceRangeSlider.tsx       # Price filter slider
├── constants/          # Mock data and constants
│   └── mockData.ts     # Sample parking spots
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx
├── screens/           # Main application screens
│   ├── SetPriceRangeScreen.tsx    # Screen 1
│   ├── GetDirectionsScreen.tsx    # Screen 2
│   └── StartJourneyScreen.tsx     # Screen 3
├── types/             # TypeScript interfaces
│   └── index.ts
└── utils/             # Utility functions
    └── mapUtils.ts    # Map calculations and helpers
```

## Key Packages Used

- `react-native-maps`: Map integration with Google Maps provider
- `react-native-maps-directions`: Route directions and polylines
- `@react-native-community/geolocation`: Location services
- `react-native-actions-sheet`: Bottom sheet functionality
- `@react-navigation/native`: Navigation between screens
- `react-native-svg`: Custom vector icons and markers
- `react-native-reanimated`: Smooth animations
- `@react-native-community/slider`: Price range controls

## Configuration Notes

### Google Maps API Key
For full functionality, you need to:
1. Enable Maps SDK for Android/iOS in Google Cloud Console
2. Enable Directions API for route calculations
3. Add the API key to the project

### Location Permissions
The app requests location permissions on first launch:
- **iOS**: "When in Use" location permission
- **Android**: Fine and coarse location permissions

### Mock Data
The app includes sample parking data for San Francisco area. Replace with real data in `src/constants/mockData.ts`.

## Development Notes

### Live Navigation Features
- Uses `watchPosition` for continuous location updates
- Implements distance-based filtering (updates every 5 meters)
- Automatic arrival detection (within 50 meters)
- 3D map view with pitch and heading rotation

### Performance Optimizations
- Marker clustering for large datasets
- Distance-based location updates
- Efficient coordinate calculations using Haversine formula
- Smooth animations with React Native Reanimated

### Customization
- Easily customizable marker designs in components folder
- Configurable price ranges and spot filtering
- Adjustable map camera behavior and zoom levels
- Modular screen components for easy modification

## Troubleshooting

### Common Issues
1. **Maps not loading**: Check Google Maps API key configuration
2. **Location not working**: Verify permissions in device settings
3. **Navigation crashes**: Ensure location services are enabled
4. **Directions not showing**: Verify Directions API is enabled

### iOS Specific
- Ensure location permissions are granted in device settings
- Check Info.plist has correct usage descriptions

### Android Specific
- Verify all location permissions in AndroidManifest.xml
- Check Google Play Services are installed and updated

## License

This project is for demonstration purposes.
