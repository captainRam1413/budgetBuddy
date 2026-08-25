import { STORAGE_KEYS } from '../constant';

export const CONFIG = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.46:5000/api',
  TIMEOUT: 10000,
  STORAGE_KEYS,
};

export default CONFIG;
