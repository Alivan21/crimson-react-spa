import axios from "axios";
import { env } from "@/common/constants/env";
import {
  AUTHORIZATION_HEADER_KEY,
  AUTHORIZATION_HEADER_PREFIX,
  sessionCookie,
  getSharedAccessToken,
  setSharedAccessToken,
  getSharedAuthActionFlags,
  notifyUnauthorizedSession,
} from "@/common/constants/session-auth";

const httpClient = axios.create({
  baseURL: env.VITE_BASE_API_URL,
});

httpClient.interceptors.request.use((config) => {
  const token = getSharedAccessToken() ?? sessionCookie.get() ?? null;
  if (!token) {
    if (config.headers) {
      delete config.headers[AUTHORIZATION_HEADER_KEY];
    }
    return config;
  }

  setSharedAccessToken(token);
  config.headers.set(AUTHORIZATION_HEADER_KEY, `${AUTHORIZATION_HEADER_PREFIX} ${token}`);
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const statusCode = error?.response?.status;
    if (statusCode === 401) {
      const { isLoggingIn, isLoggingOut } = getSharedAuthActionFlags();
      if (!isLoggingIn && !isLoggingOut) {
        sessionCookie.remove();
        setSharedAccessToken(null);
        delete httpClient.defaults.headers.common[AUTHORIZATION_HEADER_KEY];
        notifyUnauthorizedSession();
      }
    }

    return Promise.reject(error);
  }
);

export default httpClient;
