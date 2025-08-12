import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';

const LngButton = ({ title, onPress, styles }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles,
        {
          width: '90%',
          height: 50,
          backgroundColor: 'black',
          borderRadius: 30,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default LngButton;
