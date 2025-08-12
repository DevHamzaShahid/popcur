import React, { useEffect, useState, useRef } from 'react';
import { View, Animated, ImageSourcePropType, StyleSheet } from 'react-native';
import {
  magnetometer,
  accelerometer,
  SensorTypes,
  setUpdateIntervalForType,
} from 'react-native-sensors';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

interface CompassIconProps {
  icon: ImageSourcePropType;
  size?: number;
}

const CompassIcon: React.FC<CompassIconProps> = ({ icon, size = 50 }) => {
  // Start at 0° → straight north
  const [heading, setHeading] = useState(0);
  const rotation = useRef(new Animated.Value(0)).current;

  const smoothHeading = (newHeading: number, prevHeading: number) => {
    const diff = newHeading - prevHeading;
    if (Math.abs(diff) > 180) {
      if (diff > 0) return prevHeading + (diff - 360) * 0.1;
      else return prevHeading + (diff + 360) * 0.1;
    }
    return prevHeading + diff * 0.1;
  };

  useEffect(() => {
    setUpdateIntervalForType(SensorTypes.magnetometer, 100);
    setUpdateIntervalForType(SensorTypes.accelerometer, 100);

    const subscription = combineLatest([magnetometer, accelerometer])
      .pipe(
        map(([mag, acc]) => {
          const { x: mx, y: my, z: mz } = mag;
          const { x: ax, y: ay, z: az } = acc;

          // normalize accelerometer
          const normAcc = Math.sqrt(ax * ax + ay * ay + az * az);
          const axn = ax / normAcc;
          const ayn = ay / normAcc;
          const azn = az / normAcc;

          // pitch & roll
          const pitch = Math.asin(-axn);
          const roll = Math.asin(ayn / Math.cos(pitch));

          // tilt compensation
          const xh = mx * Math.cos(pitch) + mz * Math.sin(pitch);
          const yh =
            mx * Math.sin(roll) * Math.sin(pitch) +
            my * Math.cos(roll) -
            mz * Math.sin(roll) * Math.cos(pitch);

          let heading = Math.atan2(yh, xh) * (180 / Math.PI);
          heading = heading >= 0 ? heading : heading + 360;

          return heading;
        }),
      )
      .subscribe(tiltHeading => {
        setHeading(prev => smoothHeading(tiltHeading, prev));
      });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: heading,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [heading]);

  const spin = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.Image
        source={icon}
        style={{
          width: size,
          height: size,
          transform: [{ rotate: spin }],
        }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },
});

export default CompassIcon;
