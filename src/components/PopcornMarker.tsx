import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface PopcornMarkerProps {
  size?: number;
}

const PopcornMarker: React.FC<PopcornMarkerProps> = ({ size = 30 }) => {
  return (
    <View style={styles.container}>
      <Svg width={size} height={size + 5} viewBox="0 0 30 35">
        {/* Popcorn kernel shapes */}
        <Circle cx="15" cy="12" r="8" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
        <Circle cx="10" cy="8" r="5" fill="#FFE55C" stroke="#FFA500" strokeWidth="1" />
        <Circle cx="20" cy="9" r="4" fill="#FFE55C" stroke="#FFA500" strokeWidth="1" />
        <Circle cx="8" cy="15" r="4" fill="#FFE55C" stroke="#FFA500" strokeWidth="1" />
        <Circle cx="22" cy="16" r="3" fill="#FFE55C" stroke="#FFA500" strokeWidth="1" />
        <Circle cx="12" cy="20" r="3" fill="#FFE55C" stroke="#FFA500" strokeWidth="1" />
        <Circle cx="18" cy="22" r="2.5" fill="#FFE55C" stroke="#FFA500" strokeWidth="1" />
        
        {/* Pointer */}
        <Path
          d="M15 28 L12 32 L18 32 Z"
          fill="#FFD700"
          stroke="#FFA500"
          strokeWidth="1"
        />
      </Svg>
      
      {/* Shadow/outline for better visibility */}
      <View style={[styles.shadow, { width: size + 6, height: size + 6 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    position: 'absolute',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: -1,
    top: 2,
  },
});

export default PopcornMarker;