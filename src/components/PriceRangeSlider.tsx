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

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Price Range</Text>
      <View style={styles.sliderRow}>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          value={minValue}
          onValueChange={handleMinChange}
          minimumTrackTintColor="#000"
          maximumTrackTintColor="#D1D5DB"
          thumbTintColor="#000"
          step={1}
          thumbImage={require('../assets/locationPin.jpg')}
        />
        <View style={styles.priceBox}>
          <Text style={styles.priceText}>${minValue}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  sliderRow: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 60,
  },
  priceBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  priceText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
});

export default PriceRangeSlider;
