import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Compass, Calendar, UserRound } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { HomeScreen } from '../screens/HomeScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { MyTripsScreen } from '../screens/MyTripsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useLanguage } from '../context/LanguageContext';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  const { t } = useLanguage();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: t.tabHome,
            tabBarIcon: ({ color, size, focused }) => (
              <View style={focused ? styles.activeIconWrap : undefined}>
                <Home size={21} color={color} strokeWidth={focused ? 2.4 : 1.9} />
              </View>
            ),
          }}
        />

        <Tab.Screen
          name="Explore"
          component={ExploreScreen}
          options={{
            tabBarLabel: t.tabExplore,
            tabBarIcon: ({ color, size, focused }) => (
              <View style={focused ? styles.activeIconWrap : undefined}>
                <Compass size={21} color={color} strokeWidth={focused ? 2.4 : 1.9} />
              </View>
            ),
          }}
        />

        <Tab.Screen
          name="My Trips"
          component={MyTripsScreen}
          options={{
            tabBarLabel: t.tabTrips,
            tabBarIcon: ({ color, size, focused }) => (
              <View style={focused ? styles.activeIconWrap : undefined}>
                <Calendar size={21} color={color} strokeWidth={focused ? 2.4 : 1.9} />
              </View>
            ),
          }}
        />

        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: t.tabProfile,
            tabBarIcon: ({ color, size, focused }) => (
              <View style={focused ? styles.activeIconWrap : undefined}>
                <UserRound size={21} color={color} strokeWidth={focused ? 2.4 : 1.9} />
              </View>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    height: Platform.OS === 'ios' ? 86 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    ...SHADOWS.medium,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  activeIconWrap: {
    transform: [{ scale: 1.05 }],
  },
});
