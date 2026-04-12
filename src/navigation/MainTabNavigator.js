import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import StreamScreen from '../screens/StreamScreen';
import CommunityScreen from '../screens/CommunityScreen';
import AIRecommendationsScreen from '../screens/AIRecommendationsScreen';
import MyTicketsScreen from '../screens/MyTicketsScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import { useSession } from '../context/SessionProvider';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Discover: ['compass-outline', 'compass'],
  Picks: ['film-outline', 'film'],
  Stream: ['play-circle-outline', 'play-circle'],
  Community: ['people-outline', 'people'],
  Tickets: ['ticket-outline', 'ticket'],
  Admin: ['shield-outline', 'shield'],
};

const getTabBarIcon = (routeName, focused) => {
  const [defaultIcon, focusedIcon] = TAB_ICONS[routeName] || ['ellipse-outline', 'ellipse'];
  return focused ? focusedIcon : defaultIcon;
};

const TabIcon = ({ routeName, focused, color, size }) => (
  <Ionicons
    name={getTabBarIcon(routeName, focused)}
    size={focused ? size + 1 : size}
    color={color}
  />
);

const MainTabNavigator = () => {
  const { isAdmin } = useSession();

  return (
    <Tab.Navigator
      initialRouteName="Discover"
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#98A2B3',
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarActiveBackgroundColor: 'rgba(255,255,255,0.08)',
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: Platform.OS === 'ios' ? 18 : 12,
          height: Platform.OS === 'ios' ? 82 : 72,
          backgroundColor: 'rgba(8, 10, 14, 0.94)',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          borderRadius: 8,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          elevation: 0,
          ...(Platform.OS === 'web'
            ? {
                boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.22)',
              }
            : {
                shadowColor: '#000000',
                shadowOffset: {
                  width: 0,
                  height: 10,
                },
                shadowOpacity: 0.22,
                shadowRadius: 20,
              }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarItemStyle: {
          borderRadius: 8,
          marginHorizontal: 4,
          marginVertical: 6,
        },
        tabBarIcon: ({ focused, color, size }) => (
          <TabIcon
            routeName={route.name}
            focused={focused}
            color={color}
            size={size}
          />
        ),
        sceneStyle: {
          backgroundColor: '#06090E',
        },
      })}
    >
      <Tab.Screen name="Discover" component={HomeScreen} />
      <Tab.Screen name="Picks" component={AIRecommendationsScreen} />
      <Tab.Screen name="Stream" component={StreamScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Tickets" component={MyTicketsScreen} />
      {isAdmin ? <Tab.Screen name="Admin" component={AdminPanelScreen} /> : null}
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
