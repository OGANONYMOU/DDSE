/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authNode from "../authNode.js";
import type * as catalog from "../catalog.js";
import type * as dashboard from "../dashboard.js";
import type * as inspections from "../inspections.js";
import type * as lib_authz from "../lib/authz.js";
import type * as lib_security from "../lib/security.js";
import type * as lib_workflow from "../lib/workflow.js";
import type * as otp from "../otp.js";
import type * as platform from "../platform.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authNode: typeof authNode;
  catalog: typeof catalog;
  dashboard: typeof dashboard;
  inspections: typeof inspections;
  "lib/authz": typeof lib_authz;
  "lib/security": typeof lib_security;
  "lib/workflow": typeof lib_workflow;
  otp: typeof otp;
  platform: typeof platform;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
