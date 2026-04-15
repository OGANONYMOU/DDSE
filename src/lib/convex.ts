import { ConvexHttpClient } from 'convex/browser';
// @ts-ignore generated at runtime by Convex codegen; local shim is intentional during bootstrap.
import { api } from '../../convex/_generated/api';
import { assertAppConfig } from './config';

const convexUrl = assertAppConfig().convexUrl;

export const convex = new ConvexHttpClient(convexUrl);
export { api };
