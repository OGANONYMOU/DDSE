import { ConvexHttpClient } from 'convex/browser';
// @ts-expect-error generated at runtime by Convex codegen; local shim is intentional during bootstrap.
import { api } from '../../convex/_generated/api';

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error('VITE_CONVEX_URL is required for the Convex live backend.');
}

export const convex = new ConvexHttpClient(convexUrl);
export { api };
