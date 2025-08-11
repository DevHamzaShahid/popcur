import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ParkingClusterMarkerProps {
  count: number;
  size?: number;
}

const ParkingClusterMarker: React.FC<ParkingClusterMarkerProps> = ({ 
  count, 
  size = 40 
}) => {
  const backgroundColor = count > 5 ? '#DC2626' : count > 2 ? '#F59E0B' : '#10B981';
  
  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }]}>
      <Text style={[styles.text, { fontSize: size * 0.3 }]}>{count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ParkingClusterMarker;