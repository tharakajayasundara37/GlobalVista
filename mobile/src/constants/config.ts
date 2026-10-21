import { Platform } from 'react-native';

// For physical devices on the same Wi-Fi, use your machine's Wi-Fi IPv4 address.
// If using Android emulator, use 10.0.2.2. If iOS simulator or Web, use localhost.
const LOCAL_MACHINE_IP = '192.168.1.180';

export const getApiBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3001';
  }
  // Default to LAN IP so physical devices on Wi-Fi connect seamlessly
  return `http://${LOCAL_MACHINE_IP}:3001`;
};

export const API_BASE_URL = getApiBaseUrl();

export const WHATSAPP_NUMBER = '94771234567';
export const WHATSAPP_DEFAULT_MSG =
  'Hello GlobalVista Concierge, I would like to inquire about your luxury travel packages and custom itineraries.';
