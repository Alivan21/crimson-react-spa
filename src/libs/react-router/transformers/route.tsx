import type { JSX } from "react";
import type { ActionFunction, LoaderFunction } from "react-router";
import { DEFAULT_FALLBACK, PATH_SEPARATOR, type ExtendedRouteObject } from "../types/route";
import { isDynamicRoute } from "../utils/path";

type LazyRouteFn = () => Promise<{
  Component: () => JSX.Element;
  loader?: LoaderFunction;
  action?: ActionFunction;
}>;

type CreateRouteLazyArgs = {
  segments: string[];
  lazy: LazyRouteFn;
  LoadingComponent?: React.ComponentType;
};

/**
 * Creates a new route configuration based on path segments and React Router 7's route-level lazy.
 * Sets route.lazy and HydrateFallback; the router fills element/loader/action from the lazy result.
 */
export function createRoute(args: CreateRouteLazyArgs): ExtendedRouteObject {
  const [current, ...rest] = args.segments;
  const [cleanPath, pageType] = current.split(PATH_SEPARATOR);
  const route: ExtendedRouteObject = { path: cleanPath };

  if (pageType === "page" || pageType === "layout") {
    const FallbackComponent = args.LoadingComponent ?? DEFAULT_FALLBACK;

    route.lazy = args.lazy;
    route.HydrateFallback = FallbackComponent;
    route.LoadingComponent = FallbackComponent;
    route.handle = { pageType };
  }

  if (rest.length > 0) {
    handleNestedRoutes(route, rest, args);
  }

  return route;
}

function handleNestedRoutes(
  route: ExtendedRouteObject,
  rest: string[],
  args: CreateRouteLazyArgs
): void {
  const nextSegment = rest[0].split(PATH_SEPARATOR)[0];
  const cleanPath = route.path ?? "";

  if (isDynamicRoute(cleanPath)) {
    route.children = route.children ?? [];
    route.children.push(createNestedRoute(nextSegment, args));
    return;
  }

  const childRoute = createRoute({ ...args, segments: rest });
  route.children = route.children ?? [];
  route.children.push(childRoute);
}

/**
 * Creates a nested route for a dynamic segment (e.g. [id]).
 */
export function createNestedRoute(
  editSegment: string,
  args: CreateRouteLazyArgs
): ExtendedRouteObject {
  const FallbackComponent = args.LoadingComponent ?? DEFAULT_FALLBACK;

  return {
    path: editSegment,
    lazy: args.lazy,
    HydrateFallback: FallbackComponent,
    handle: { pageType: "page" },
  };
}
