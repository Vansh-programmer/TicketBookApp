import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from './src/components/ToastProvider';
import { initializeSoundEffects } from './src/config/soundManifest';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import MyTicketsScreen from './src/screens/MyTicketsScreen';
import MovieDetailsScreen from './src/screens/MovieDetailsScreen';
import MovieListScreen from './src/screens/MovieListScreen';
import LocationSelectionScreen from './src/screens/LocationSelectionScreen';
import DateSelectionScreen from './src/screens/DateSelectionScreen';
import SeatSelectionScreen from './src/screens/SeatSelectionScreen';
import DigitalTicketScreen from './src/screens/DigitalTicketScreen';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    initializeSoundEffects();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Splash"
              screenOptions={{
                headerShown: false,
                cardStyle: {
                  backgroundColor: '#050505',
                },
              }}
            >
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="MyTickets" component={MyTicketsScreen} />
              <Stack.Screen name="Movies" component={MovieListScreen} />
              <Stack.Screen name="MovieDetails" component={MovieDetailsScreen} />
              <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} />
              <Stack.Screen name="DateSelection" component={DateSelectionScreen} />
              <Stack.Screen name="SeatSelection" component={SeatSelectionScreen} />
              <Stack.Screen name="DigitalTicket" component={DigitalTicketScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
