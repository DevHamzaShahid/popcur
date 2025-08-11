import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface DirectionArrowMarkerProps {
  heading?: number;
  size?: number;
}

const DirectionArrowMarker: React.FC<DirectionArrowMarkerProps> = ({ 
  heading = 0, 
  size = 40 
}) => {
  return (
    <View style={[styles.container, { transform: [{ rotate: `${heading}deg` }] }]}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        {/* Arrow pointing north (up) */}
        <Path
          d="M20 5 L30 25 L25 20 L20 25 L15 20 L10 25 Z"
          fill="#1E40AF"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        {/* Center dot */}
        <Path
          d="M20 20 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0"
          fill="#FFFFFF"
        />
      </Svg>
      {/* Outer circle for better visibility */}
      <View style={[styles.outerCircle, { width: size + 10, height: size + 10 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    position: 'absolute',
    borderRadius: 25,
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(30, 64, 175, 0.3)',
    zIndex: -1,
  },
});

export default DirectionArrowMarker;