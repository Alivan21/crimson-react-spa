import type { JSX } from "react";
import type { ActionFunction, LoaderFunction, RouteObject } from "react-router";

/**
 * Represents the expected structure of a page module's exports.
 */
export type PageModuleExports = {
  default: () => JSX.Element;
  loader?: LoaderFunction;
  action?: ActionFunction;
};

/**
 * Return type for route-level lazy(): partial route config resolved from a dynamic import.
 * Matches React Router 7's expectation (Component, loader, action).
 */
export type LazyRouteReturn = {
  Component: () => JSX.Element;
  loader?: LoaderFunction;
  action?: ActionFunction;
};

/**
 * Defines the type of page in the routing system.
 */
export type RouteHandle = {
  pageType: "page" | "layout";
};

/**
 * Extends the base RouteObject to include additional properties.
 * RouteObject from react-router already includes lazy; we add handle and custom fallbacks.
 */
export type ExtendedRouteObject = Omit<RouteObject, "handle" | "children"> & {
  handle?: RouteHandle;
  children?: ExtendedRouteObject[];
  HydrateFallback?: React.ComponentType;
  LoadingComponent?: React.ComponentType;
};

export type PageModule = () => Promise<PageModuleExports>;
export type LoadingModule = () => Promise<{ default: () => JSX.Element }>;
export type RouteUpdater = (route: RouteObject) => RouteObject;

export const PATH_SEPARATOR = "\\";
export const DEFAULT_FALLBACK = () => <div>Loading...</div>;
