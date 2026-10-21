import { Platform } from 'react-native';

// Production Cloud Backend on Render
export const PRODUCTION_API_URL = 'https://globalvista-d7uz.onrender.com';

// Production Web Frontend on Vercel (Hosts optimized H.264 videos and public gallery assets)
export const PRODUCTION_WEB_URL = 'https://global-vista-nine.vercel.app';

export const getApiBaseUrl = (): string => {
  return PRODUCTION_API_URL;
};

export const getWebBaseUrl = (): string => {
  return PRODUCTION_WEB_URL;
};

export const API_BASE_URL = getApiBaseUrl();
export const WEB_BASE_URL = getWebBaseUrl();

export const WHATSAPP_NUMBER = '94771234567';
export const WHATSAPP_DEFAULT_MSG =
  'Hello GlobalVista Concierge, I would like to inquire about your luxury travel packages and custom itineraries.';
