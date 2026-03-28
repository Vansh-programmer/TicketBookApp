import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import StreamScreen from '../screens/StreamScreen';
import CommunityScreen from '../screens/CommunityScreen';
import MyTicketsScreen from '../screens/MyTicketsScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import { useSession } from '../context/SessionProvider';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Discover: ['compass-outline', 'compass'],
  Stream: ['play-circle-outline', 'play-circle'],
  Community: ['people-outline', 'people'],
  Tickets: ['ticket-outline', 'ticket'],
  Admin: ['shield-outline', 'shield'],
};

const getTabBarIcon = (routeName, focused) => {
  const [defaultIcon, focusedIcon] = TAB_ICONS[routeName] || ['ellipse-outline', 'ellipse'];
  return focused ? focusedIcon : defaultIcon;
};

const MainTabNavigator = () => {
  const { isAdmin } = useSession();

  return (
    <Tab.Navigator
      initialRouteName="Discover"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#8B8B8B',
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#0B0B0D',
          borderTopColor: 'rgba(255,255,255,0.08)',
          height: Platform.OS === 'ios' ? 86 : 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={getTabBarIcon(route.name, focused)}
            size={size}
            color={color}
          />
        ),
        sceneStyle: {
          backgroundColor: '#050505',
        },
      })}
    >
      <Tab.Screen name="Discover" component={HomeScreen} />
      <Tab.Screen name="Stream" component={StreamScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Tickets" component={MyTicketsScreen} />
      {isAdmin ? <Tab.Screen name="Admin" component={AdminPanelScreen} /> : null}
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
