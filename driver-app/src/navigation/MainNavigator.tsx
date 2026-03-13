// ============================================================
// ALiN Move Driver App - Main Tab Navigator
// ============================================================

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/main/HomeScreen';
import ActiveJobScreen from '../screens/main/ActiveJobScreen';
import JobsScreen from '../screens/main/JobsScreen';
import EarningsScreen from '../screens/main/EarningsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import DocumentUploadScreen from '../screens/main/DocumentUploadScreen';
import ApplicationStatusScreen from '../screens/main/ApplicationStatusScreen';
import ProofOfDeliveryScreen from '../screens/main/ProofOfDeliveryScreen';
import Colors from '../theme/colors';

// Stack for Home tab
export type HomeStackParamList = {
  HomeMain: undefined;
  ActiveJob: { jobId: number };
  ProofOfDelivery: { jobId: number };
};

// Stack for Profile tab
export type ProfileStackParamList = {
  ProfileMain: undefined;
  Notifications: undefined;
  Settings: undefined;
  DocumentUpload: undefined;
  ApplicationStatus: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  Jobs: undefined;
  Earnings: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();

const TAB_ICONS: Record<string, { name: string; outline: string }> = {
  HomeTab: { name: 'home', outline: 'home-outline' },
  Jobs: { name: 'document-text', outline: 'document-text-outline' },
  Earnings: { name: 'wallet', outline: 'wallet-outline' },
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
        name="ActiveJob"
        component={ActiveJobScreen}
        options={{ headerTitle: 'Active Delivery' }}
      />
      <HomeStack.Screen
        name="ProofOfDelivery"
        component={ProofOfDeliveryScreen}
        options={{ headerTitle: 'Proof of Delivery' }}
      />
    </HomeStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600', color: Colors.text },
        headerShadowVisible: true,
      }}
    >
      <ProfileStackNav.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerTitle: 'My Profile' }}
      />
      <ProfileStackNav.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerTitle: 'Notifications' }}
      />
      <ProfileStackNav.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerTitle: 'Settings' }}
      />
      <ProfileStackNav.Screen
        name="DocumentUpload"
        component={DocumentUploadScreen}
        options={{ headerTitle: 'Documents (KYC)' }}
      />
      <ProfileStackNav.Screen
        name="ApplicationStatus"
        component={ApplicationStatusScreen}
        options={{ headerTitle: 'Application Status' }}
      />
    </ProfileStackNav.Navigator>
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
        name="Jobs"
        component={JobsScreen}
        options={{ headerTitle: 'Delivery History' }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ headerTitle: 'My Earnings' }}
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

