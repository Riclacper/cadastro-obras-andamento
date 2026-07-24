import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN_KEY = "cadastro-obras.auth-token";
const AUTH_USER_KEY = "cadastro-obras.auth-user";

export type AuthUser = { id: string; nome: string; email: string; role: "admin" | "fiscal" };

export async function getAuthToken() {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string) {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const value = await AsyncStorage.getItem(AUTH_USER_KEY);
  if (!value) return null;
  try { return JSON.parse(value) as AuthUser; } catch { return null; }
}

export async function setAuthUser(user: AuthUser) {
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export async function clearAuthToken() {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  await AsyncStorage.removeItem(AUTH_USER_KEY);
}
