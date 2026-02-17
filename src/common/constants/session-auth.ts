import { createCookies } from "@/libs/cookies";

export const ACCESS_TOKEN_COOKIE_KEY = "access_token";
export const AUTHORIZATION_HEADER_KEY = "Authorization";
export const AUTHORIZATION_HEADER_PREFIX = "Bearer";
export const sessionCookie = createCookies(ACCESS_TOKEN_COOKIE_KEY);

type AuthActionFlags = {
  isLoggingIn: boolean;
  isLoggingOut: boolean;
};

const sharedAuthActionFlags: AuthActionFlags = {
  isLoggingIn: false,
  isLoggingOut: false,
};

let sharedAccessToken: string | null = null;

const unauthorizedListeners = new Set<() => void>();

export const setSharedLoginFlag = (isLoggingIn: boolean): void => {
  sharedAuthActionFlags.isLoggingIn = isLoggingIn;
};

export const setSharedLogoutFlag = (isLoggingOut: boolean): void => {
  sharedAuthActionFlags.isLoggingOut = isLoggingOut;
};

export const getSharedAuthActionFlags = (): AuthActionFlags => {
  return { ...sharedAuthActionFlags };
};

export const setSharedAccessToken = (token: string | null): void => {
  sharedAccessToken = token;
};

export const getSharedAccessToken = (): string | null => {
  return sharedAccessToken;
};

export const subscribeToUnauthorizedSession = (listener: () => void): (() => void) => {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
};

export const notifyUnauthorizedSession = (): void => {
  unauthorizedListeners.forEach((listener) => listener());
};
