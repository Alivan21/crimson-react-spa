import Cookies, { type CookieSetOptions } from "universal-cookie";

const DEFAULT_OPTIONS: CookieSetOptions = {
  path: "/",
  secure: import.meta.env.PROD,
  sameSite: "strict",
};

const cookies = new Cookies();

export type CookieHelpers = {
  get: () => string | null | undefined;
  set: (value: string, options?: Partial<CookieSetOptions>) => void;
  remove: () => void;
};

/**
 * Create get/set/remove helpers for a cookie by name
 * @param name Cookie name
 * @param defaultOptions Optional defaults (merged with global defaults)
 */
export const createCookies = (
  name: string,
  defaultOptions?: Partial<CookieSetOptions>
): CookieHelpers => {
  const baseOptions = { ...DEFAULT_OPTIONS, ...defaultOptions };

  return {
    get: () => cookies.get<string>(name),
    set: (value, options) => {
      cookies.set(name, value, { ...baseOptions, ...options });
    },
    remove: () => {
      cookies.remove(name, { path: baseOptions.path ?? "/" });
    },
  };
};
