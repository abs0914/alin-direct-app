// ============================================================
// ALiN Move Customer App - Main Tab Navigator
// ============================================================

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/main/HomeScreen';
import NewDeliveryScreen from '../screens/main/NewDeliveryScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
import TrackingScreen from '../screens/main/TrackingScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import Colors from '../theme/colors';

// Stack for Home tab (includes Tracking as a nested screen)
export type HomeStackParamList = {
  HomeMain: undefined;
  NewDelivery: { deliveryType?: string };
  Tracking: { jobId: number };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  History: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const TAB_ICONS: Record<string, { name: string; outline: string }> = {
  HomeTab: { name: 'home', outline: 'home-outline' },
  History: { name: 'document-text', outline: 'document-text-outline' },
  ProfileTab: { name: 'person', outline: 'person-outline' },
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600', color: Colors.text },
        headerShadowVisible: true,
      }}
    >
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{
          headerLeft: () => (
            <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text, marginLeft: 16 }}>ALiN Move</Text>
          ),
          headerTitle: () => null,
          headerRight: () => (
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 48, height: 48, marginRight: 16 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <HomeStack.Screen
        name="NewDelivery"
        component={NewDeliveryScreen}
        options={{ headerTitle: 'Book a Delivery' }}
      />
      <HomeStack.Screen
        name="Tracking"
        component={TrackingScreen}
        options={{ headerTitle: 'Track Delivery' }}
      />
    </HomeStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600', color: Colors.text },
        headerShadowVisible: true,
      }}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerTitle: 'My Profile' }}
      />
      <ProfileStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerTitle: 'Notifications' }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerTitle: 'Settings' }}
      />
    </ProfileStack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconCfg = TAB_ICONS[route.name];
          const iconName = focused ? iconCfg.name : iconCfg.outline;
          return <Ionicons name={iconName as any} size={size ?? 24} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600', color: Colors.text },
        headerShadowVisible: true,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ headerShown: false, tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ headerTitle: 'Delivery History' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ headerShown: false, tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    paddingBottom: 4,
    height: 60,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

});

