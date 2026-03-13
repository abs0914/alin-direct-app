// ============================================================
// ALiN Move Driver App - Auth Stack Navigator
// ============================================================

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import VerifyOtpScreen from '../screens/auth/VerifyOtpScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import Colors from '../theme/colors';

export type AuthStackParamList = {
  Login: undefined;
  VerifyOtp: { phone: string };
  Register: { phone: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="VerifyOtp"
        component={VerifyOtpScreen}
        options={{ headerShown: true, headerTitle: 'Verify OTP', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: true, headerTitle: 'Register', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
}

