import { steps } from "../constants/learningSteps/steps";

/**
 * Static client-side routes that must exist as `index.html` files in the
 * production build. S3/CloudFront has no SPA fallback, so a request for
 * `/learn/module1` only returns 200 if `learn/module1/index.html` is in the
 * bucket. Keep this list derived from the learning pathway rather than
 * hardcoding it a second time.
 *
 * `/` is omitted: Vite already emits `dist/index.html`.
 */
export function getStaticSpaRoutes(): string[] {
  const routes = new Set<string>(["/learn"]);
  for (const step of steps) {
    if (step.link && step.link !== "/") {
      routes.add(step.link);
    }
  }
  return Array.from(routes);
}

/** Relative `index.html` paths to write under `dist/` for S3 deep links. */
export function spaFallbackIndexPaths(routes: string[] = getStaticSpaRoutes()): string[] {
  return routes
    .map((route) => route.replace(/^\/+|\/+$/g, ""))
    .filter((route) => route.length > 0)
    .map((route) => `${route}/index.html`);
}
