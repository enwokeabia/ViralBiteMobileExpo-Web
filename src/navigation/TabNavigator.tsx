import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FeedScreen from '../screens/FeedScreen';
import BookingsScreen from '../screens/BookingsScreen';
import SavedRestaurantsScreen from '../screens/SavedRestaurantsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

interface TabNavigatorProps {
  onShowAuth: (mode?: 'signin' | 'signup') => void;
}

export default function TabNavigator({ onShowAuth }: TabNavigatorProps) {
  return (
    <Tab.Navigator
      screenOptions={({
        route,
      }) => ({
        headerShown: false,

        // ---- style/look (same as yours) ----
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => <View style={styles.tabBarBackground} />,

        // ---- colors ----
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',

        // ---- use built-in label + icon ----
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize:10,
          fontWeight: '600',
          lineHeight: 14,
        },

        // ---- icons per route ----
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'restaurant';
          if (route.name === 'Feed') iconName = 'restaurant';
          if (route.name === 'Bookings') iconName = 'calendar';
          if (route.name === 'Saved') iconName = 'heart';
          if (route.name === 'Profile') iconName = 'person';
          return <Ionicons name={iconName} size={26} color={focused ? '#007AFF' : '#8E8E93'} />;
        },
      })}
    >
      <Tab.Screen
        name="Feed"
        options={{ tabBarLabel: 'Feed' }}
      >
        {() => <FeedScreen onShowAuth={onShowAuth} />}
      </Tab.Screen>

      <Tab.Screen
        name="Bookings"
        options={{ tabBarLabel: 'Bookings' }}
      >
        {() => <BookingsScreen onShowAuth={onShowAuth} />}
      </Tab.Screen>

      <Tab.Screen
        name="Saved"
        options={{ tabBarLabel: 'Saved' }}
      >
        {() => <SavedRestaurantsScreen onShowAuth={onShowAuth} />}
      </Tab.Screen>

      <Tab.Screen
        name="Profile"
        options={{ tabBarLabel: 'Profile' }}
      >
        {() => <ProfileScreen onShowAuth={onShowAuth} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    paddingTop: 8,
    paddingHorizontal: 5,
  },
  tabBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
});
