import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { CurrencyProvider } from './src/context/CurrencyContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <AuthProvider>
            <StatusBar style="dark" />
            <AppNavigator />
          </AuthProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
