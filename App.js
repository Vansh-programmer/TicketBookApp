import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
  CardStyleInterpolators,
  TransitionPresets,
  createStackNavigator,
} from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from './src/components/ToastProvider';
import { initializeSoundEffects } from './src/config/soundManifest';
import { SessionProvider } from './src/context/SessionProvider';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import MyTicketsScreen from './src/screens/MyTicketsScreen';
import MovieDetailsScreen from './src/screens/MovieDetailsScreen';
import MovieListScreen from './src/screens/MovieListScreen';
import LocationSelectionScreen from './src/screens/LocationSelectionScreen';
import DateSelectionScreen from './src/screens/DateSelectionScreen';
import SeatSelectionScreen from './src/screens/SeatSelectionScreen';
import DigitalTicketScreen from './src/screens/DigitalTicketScreen';
import PlayerScreen from './src/screens/PlayerScreen';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    initializeSoundEffects();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SessionProvider>
          <ToastProvider>
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                  headerShown: false,
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                  ...TransitionPresets.SlideFromRightIOS,
                  cardStyleInterpolator:
                    Platform.OS === 'ios'
                      ? CardStyleInterpolators.forHorizontalIOS
                      : CardStyleInterpolators.forFadeFromBottomAndroid,
                  cardStyle: {
                    backgroundColor: '#050505',
                  },
                }}
              >
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Signup" component={SignupScreen} />
                <Stack.Screen name="Home" component={MainTabNavigator} />
                <Stack.Screen name="MyTickets" component={MyTicketsScreen} />
                <Stack.Screen name="Movies" component={MovieListScreen} />
                <Stack.Screen name="MovieDetails" component={MovieDetailsScreen} />
                <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} />
                <Stack.Screen name="DateSelection" component={DateSelectionScreen} />
                <Stack.Screen name="SeatSelection" component={SeatSelectionScreen} />
                <Stack.Screen name="DigitalTicket" component={DigitalTicketScreen} />
                <Stack.Screen
                  name="Player"
                  component={PlayerScreen}
                  options={{
                    gestureDirection: 'vertical',
                    ...TransitionPresets.ModalSlideFromBottomIOS,
                  }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </ToastProvider>
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
