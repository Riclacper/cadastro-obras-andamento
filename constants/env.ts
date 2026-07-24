const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

// Expo exposes EXPO_PUBLIC_* variables to the client bundle. Keep a local
// fallback so the app can still start in a simulator without an .env file.
export const API_URL = (configuredApiUrl || 'http://localhost:5000').replace(/\/+$/, '');
