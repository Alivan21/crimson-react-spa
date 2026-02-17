import { useCallback, useEffect, useEffectEvent, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

/**
 * Parses a URL string value based on the type of the default value
 */
function parseUrlValue(urlValue: string, defaultValue: unknown): unknown {
  if (Array.isArray(defaultValue)) {
    const isNumberArray = typeof defaultValue[0] === "number";
    return isNumberArray ? urlValue.split(",").map(Number) : urlValue.split(",");
  }

  const typeParsers = {
    number: () => Number(urlValue),
    boolean: () => urlValue === "true",
    string: () => urlValue,
  } as const;

  const parser = typeParsers[typeof defaultValue as keyof typeof typeParsers];
  return parser ? parser() : urlValue;
}

/**
 * Serializes a value for URL storage
 */
function serializeValue(value: unknown): string {
  return Array.isArray(value) ? value.join(",") : String(value);
}

function getUrlKey(key: string, prefix?: string): string {
  return prefix ? `${prefix}:${key}` : key;
}

function isFilterKey(urlKey: string, prefix: string | undefined, filterKeys: string[]): boolean {
  if (prefix) {
    if (!urlKey.startsWith(`${prefix}:`)) return false;
    const keyWithoutPrefix = urlKey.slice(prefix.length + 1);
    return filterKeys.includes(keyWithoutPrefix);
  }
  return filterKeys.includes(urlKey);
}

type UseFiltersOptions = {
  replace?: boolean;
};

/**
 * Custom hook for managing URL search parameters with state synchronization
 * Supports complex types like arrays and objects through serialization
 * @param initialState - Initial state values for filters
 * @param prefix - Optional prefix to namespace URL parameters (e.g., "chef" -> "chef:search")
 * @param options - Optional; replace: false pushes a new history entry on filter change (default true)
 */
export function useFilters<T extends Record<string, unknown>>(
  initialState: T,
  prefix?: string,
  options?: UseFiltersOptions
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const replace = options?.replace ?? true;
  const filterKeys = Object.keys(initialState);

  const [state, setState] = useState<T>(() => {
    const urlState = { ...initialState };

    (Object.keys(initialState) as Array<keyof T>).forEach((key) => {
      const urlKey = getUrlKey(key as string, prefix);
      const urlValue = searchParams.get(urlKey);
      if (urlValue !== null) {
        (urlState as Record<keyof T, unknown>)[key] = parseUrlValue(urlValue, initialState[key]);
      }
    });

    return urlState;
  });

  const filterValues = useMemo(() => {
    const result: Partial<T> = {};

    (Object.keys(state) as Array<keyof T>).forEach((key) => {
      const value = state[key];
      const initialValue = initialState[key];

      if (JSON.stringify(value) !== JSON.stringify(initialValue)) {
        result[key] = value;
      }
    });

    return result;
  }, [state, initialState]);

  const updateFilters = useCallback((updates: Partial<T>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setState(initialState);
  }, [initialState]);

  const syncStateToUrl = useEffectEvent((currentState: T, replaceUrl: boolean) => {
    const newSearchParams = new URLSearchParams();

    searchParams.forEach((value, key) => {
      if (!isFilterKey(key, prefix, filterKeys)) {
        newSearchParams.set(key, value);
      }
    });

    (Object.keys(currentState) as Array<keyof T>).forEach((key) => {
      const value = currentState[key];
      const initialValue = initialState[key];

      if (JSON.stringify(value) !== JSON.stringify(initialValue)) {
        const urlKey = getUrlKey(key as string, prefix);
        newSearchParams.set(urlKey, serializeValue(value));
      }
    });

    const currentParams = searchParams.toString();
    const newParams = newSearchParams.toString();
    if (currentParams !== newParams) {
      setSearchParams(newSearchParams, { replace: replaceUrl });
    }
  });

  useEffect(() => {
    syncStateToUrl(state, replace);
  }, [state, replace]);

  return {
    filters: state,
    updateFilters,
    resetFilters,
    filterValues,
  };
}
