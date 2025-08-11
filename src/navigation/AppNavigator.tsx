import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import SetPriceRangeScreen from '../screens/SetPriceRangeScreen';
import GetDirectionsScreen from '../screens/GetDirectionsScreen';
import StartJourneyScreen from '../screens/StartJourneyScreen';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SetPriceRange"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        <Stack.Screen 
          name="SetPriceRange" 
          component={SetPriceRangeScreen}
          options={{ title: 'Set Price Range' }}
        />
        <Stack.Screen 
          name="GetDirections" 
          component={GetDirectionsScreen}
          options={{ title: 'Get Directions' }}
        />
        <Stack.Screen 
          name="StartJourney" 
          component={StartJourneyScreen}
          options={{ title: 'Start Journey' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;