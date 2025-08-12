import { TouchableOpacity, Image } from 'react-native';
import React from 'react';

const CrossBtn = ({ onPress, isBlack }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      {isBlack ? (
        <Image
          source={require('../../assets/blackCross.png')}
          style={{ height: 30, width: 30 }}
        />
      ) : (
        <Image
          source={require('../../assets/greyCross.png')}
          style={{ height: 30, width: 30 }}
        />
      )}
    </TouchableOpacity>
  );
};

export default CrossBtn;
