import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  AUTHORIZATION_HEADER_KEY,
  AUTHORIZATION_HEADER_PREFIX,
  sessionCookie,
  setSharedAccessToken,
  setSharedLoginFlag,
  setSharedLogoutFlag,
  subscribeToUnauthorizedSession,
} from "@/common/constants/session-auth";
import type { JwtPayload } from "@/common/utils/jwt";
import { decodeJwt } from "@/common/utils/jwt";
import httpClient from "@/libs/axios";

export type SessionUser = JwtPayload;

type SessionState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  user: SessionUser | null;
};

export type SessionContextValue = SessionState & {
  login: (token: string) => void;
  logout: () => void;
};

type SessionProviderProps = {
  children: React.ReactNode;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const createUnauthenticatedState = (isLoading: boolean): SessionState => ({
  isLoading,
  isAuthenticated: false,
  accessToken: null,
  user: null,
});

const isJwtExpired = (payload: JwtPayload): boolean => {
  if (typeof payload.exp !== "number") {
    return false;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
};

const getValidPayloadFromToken = (token: string): SessionUser | null => {
  try {
    const payload = decodeJwt<SessionUser>(token);
    if (isJwtExpired(payload)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

const buildAuthenticatedState = (token: string, payload: SessionUser): SessionState => ({
  isLoading: false,
  isAuthenticated: true,
  accessToken: token,
  user: payload,
});

const getInitialSessionState = (): SessionState => {
  const accessTokenFromCookie = sessionCookie.get() ?? null;
  if (!accessTokenFromCookie) {
    return createUnauthenticatedState(false);
  }

  const payload = getValidPayloadFromToken(accessTokenFromCookie);
  if (!payload) {
    sessionCookie.remove();
    return createUnauthenticatedState(false);
  }

  return buildAuthenticatedState(accessTokenFromCookie, payload);
};

const clearAuthorizationHeader = (): void => {
  delete httpClient.defaults.headers.common[AUTHORIZATION_HEADER_KEY];
};

const syncAuthorizationHeader = (token: string | null): void => {
  if (!token) {
    clearAuthorizationHeader();
    return;
  }

  httpClient.defaults.headers.common[AUTHORIZATION_HEADER_KEY] =
    `${AUTHORIZATION_HEADER_PREFIX} ${token}`;
};

export function SessionProvider({ children }: SessionProviderProps) {
  const [sessionState, setSessionState] = useState<SessionState>(getInitialSessionState);

  const applyUnauthenticatedState = useCallback((isLoading: boolean) => {
    sessionCookie.remove();
    setSharedAccessToken(null);
    setSharedLoginFlag(false);
    setSharedLogoutFlag(false);
    clearAuthorizationHeader();
    setSessionState(createUnauthenticatedState(isLoading));
  }, []);

  useEffect(() => {
    setSharedAccessToken(sessionState.accessToken);
    syncAuthorizationHeader(sessionState.accessToken);
  }, [sessionState.accessToken]);

  useEffect(() => {
    const unsubscribe = subscribeToUnauthorizedSession(() => {
      applyUnauthenticatedState(false);
    });

    return unsubscribe;
  }, [applyUnauthenticatedState]);

  const login = useCallback(
    (token: string) => {
      setSharedLoginFlag(true);
      setSessionState((prevState) => ({ ...prevState, isLoading: true }));

      const payload = getValidPayloadFromToken(token);
      if (!payload) {
        applyUnauthenticatedState(false);
        return;
      }

      sessionCookie.set(token);
      setSharedAccessToken(token);
      syncAuthorizationHeader(token);
      setSessionState(buildAuthenticatedState(token, payload));
      setSharedLoginFlag(false);
    },
    [applyUnauthenticatedState]
  );

  const logout = useCallback(() => {
    setSharedLogoutFlag(true);
    setSessionState((prevState) => ({ ...prevState, isLoading: true }));
    applyUnauthenticatedState(false);
    setSharedLogoutFlag(false);
  }, [applyUnauthenticatedState]);

  const contextValue = useMemo<SessionContextValue>(
    () => ({
      ...sessionState,
      login,
      logout,
    }),
    [sessionState, login, logout]
  );

  return <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider.");
  }

  return context;
}
