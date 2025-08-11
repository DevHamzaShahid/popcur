import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  onValueChange: (min: number, max: number) => void;
  initialMin?: number;
  initialMax?: number;
}

const { width: screenWidth } = Dimensions.get('window');

const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  min,
  max,
  onValueChange,
  initialMin = min,
  initialMax = max,
}) => {
  const [minValue, setMinValue] = useState(initialMin);
  const [maxValue, setMaxValue] = useState(initialMax);

  const handleMinChange = (value: number) => {
    const newMin = Math.min(value, maxValue - 1);
    setMinValue(newMin);
    onValueChange(newMin, maxValue);
  };

  const handleMaxChange = (value: number) => {
    const newMax = Math.max(value, minValue + 1);
    setMaxValue(newMax);
    onValueChange(minValue, newMax);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Price Range</Text>

      <View style={styles.sliderContainer}>
        <Text style={styles.label}>Min: ${minValue}</Text>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          value={minValue}
          onValueChange={handleMinChange}
          minimumTrackTintColor="#000000"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#000000"
          step={1}
        />
      </View>

      <View style={styles.sliderContainer}>
        <Text style={styles.label}>Max: ${maxValue}</Text>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          value={maxValue}
          onValueChange={handleMaxChange}
          minimumTrackTintColor="#000000"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#000000"
          step={1}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  sliderContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  // Thumb and track styling are controlled via native props
});

export default PriceRangeSlider;
