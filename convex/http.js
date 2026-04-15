import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();
const SESSION_COOKIE_NAME = "ddse_session";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

function allowedOrigins() {
  return new Set([
    process.env.APP_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ].filter(Boolean));
}

function corsHeaders(request, extra = {}) {
  const origin = request.headers.get("origin");
  const headers = {
    Vary: "Origin",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...extra,
  };

  if (origin && allowedOrigins().has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function json(request, data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request, init.headers),
    },
  });
}

function preflight(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

function parseCookies(request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieMap = new Map();
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) continue;
    cookieMap.set(rawKey, rawValue.join("="));
  }
  return cookieMap;
}

function sessionCookie(sessionToken) {
  if (!sessionToken) {
    return `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=None; Secure; Max-Age=0`;
  }

  return `${SESSION_COOKIE_NAME}=${sessionToken}; HttpOnly; Path=/; SameSite=None; Secure; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

function readSessionToken(request) {
  return parseCookies(request).get(SESSION_COOKIE_NAME) ?? null;
}

async function requireSession(ctx, request) {
  const sessionToken = readSessionToken(request);
  if (!sessionToken) {
    return { error: json(request, { error: "Authentication required." }, { status: 401 }) };
  }

  const principal = await ctx.runQuery(api.auth.sessionPrincipal, { sessionToken });
  if (!principal) {
    return {
      error: json(request, { error: "Session is no longer valid." }, {
        status: 401,
        headers: { "Set-Cookie": sessionCookie(null) },
      }),
    };
  }

  return { sessionToken, principal };
}

const rpcHandlers = {
  getPendingApprovals: (ctx, sessionToken) =>
    ctx.runQuery(api.auth.pendingApprovals, { sessionToken }),
  approveRegistration: (ctx, sessionToken, payload) =>
    ctx.runMutation(api.auth.approveRegistration, { sessionToken, ...payload }),
  getCommandCenterSummary: (ctx, sessionToken, payload) =>
    ctx.runQuery(api.dashboard.commandCenter, { sessionToken, ...payload }),
  getModules: (ctx, sessionToken) =>
    ctx.runQuery(api.catalog.listModules, { sessionToken }),
  exportCommandReport: (ctx, sessionToken, payload) =>
    ctx.runQuery(api.dashboard.exportCommandReport, { sessionToken, ...payload }),
  listInspections: (ctx, sessionToken, payload) =>
    ctx.runQuery(api.inspections.listInspections, { sessionToken, ...payload }),
  createInspection: (ctx, sessionToken, payload) =>
    ctx.runMutation(api.inspections.createInspection, { sessionToken, ...payload }),
  getInspectionDetail: (ctx, sessionToken, payload) =>
    ctx.runQuery(api.inspections.getInspectionDetail, { sessionToken, ...payload }),
  saveInspectionResponse: (ctx, sessionToken, payload) =>
    ctx.runMutation(api.inspections.saveResponse, { sessionToken, ...payload }),
  transitionInspection: (ctx, sessionToken, payload) =>
    ctx.runMutation(api.inspections.transitionInspection, { sessionToken, ...payload }),
  addCorrectiveAction: (ctx, sessionToken, payload) =>
    ctx.runMutation(api.inspections.addCorrectiveAction, { sessionToken, ...payload }),
  createFinding: (ctx, sessionToken, payload) =>
    ctx.runMutation(api.inspections.createFinding, { sessionToken, ...payload }),
  updateFinding: (ctx, sessionToken, payload) =>
    ctx.runMutation(api.inspections.updateFinding, { sessionToken, ...payload }),
  deleteFinding: (ctx, sessionToken, payload) =>
    ctx.runMutation(api.inspections.deleteFinding, { sessionToken, ...payload }),
  addReviewComment: (ctx, sessionToken, payload) =>
    ctx.runMutation(api.inspections.addReviewComment, { sessionToken, ...payload }),
  resolveReviewComment: (ctx, sessionToken, payload) =>
    ctx.runMutation(api.inspections.resolveReviewComment, { sessionToken, ...payload }),
  generateEvidenceUploadUrl: (ctx, sessionToken, payload) =>
    ctx.runMutation(api.inspections.generateEvidenceUploadUrl, { sessionToken, ...payload }),
  attachEvidence: (ctx, sessionToken, payload) =>
    ctx.runMutation(api.inspections.attachEvidence, { sessionToken, ...payload }),
  getEvidenceDownloadUrl: (ctx, sessionToken, payload) =>
    ctx.runMutation(api.inspections.getEvidenceDownloadUrl, { sessionToken, ...payload }),
};

function routeActionJson(path, target) {
  http.route({
    path,
    method: "OPTIONS",
    handler: httpAction(async (_ctx, request) => preflight(request)),
  });

  http.route({
    path,
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const payload = await request.json();
      const result = await ctx.runAction(target, payload);
      return json(request, result);
    }),
  });
}

routeActionJson("/api/auth/register", api.authNode.register);
routeActionJson("/api/auth/verify-registration", api.authNode.verifyRegistration);
routeActionJson("/api/auth/resend-challenge", api.authNode.resendChallenge);
routeActionJson("/api/auth/password-reset/request", api.authNode.requestPasswordReset);
routeActionJson("/api/auth/password-reset/verify", api.authNode.verifyPasswordReset);
routeActionJson("/api/auth/password-reset/complete", api.authNode.resetPassword);

http.route({
  path: "/api/auth/sign-in",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => preflight(request)),
});

http.route({
  path: "/api/auth/sign-in",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json();
    const result = await ctx.runAction(api.authNode.signIn, payload);

    if (!result.sessionToken) {
      return json(request, result);
    }

    return json(
      request,
      {
        expiresAt: result.expiresAt,
        user: result.user,
      },
      {
        headers: { "Set-Cookie": sessionCookie(result.sessionToken) },
      },
    );
  }),
});

http.route({
  path: "/api/auth/verify-sign-in",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => preflight(request)),
});

http.route({
  path: "/api/auth/verify-sign-in",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json();
    const result = await ctx.runAction(api.authNode.verifySignIn, payload);

    return json(
      request,
      {
        expiresAt: result.expiresAt,
        user: result.user,
      },
      {
        headers: { "Set-Cookie": sessionCookie(result.sessionToken) },
      },
    );
  }),
});

http.route({
  path: "/api/auth/session",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => preflight(request)),
});

http.route({
  path: "/api/auth/session",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const sessionToken = readSessionToken(request);
    if (!sessionToken) {
      return json(request, null);
    }

    const restored = await ctx.runQuery(api.auth.currentSession, { sessionToken });
    if (!restored) {
      return json(request, null, {
        headers: { "Set-Cookie": sessionCookie(null) },
      });
    }

    await ctx.runMutation(api.auth.touchSessionInternal, { sessionToken });
    return json(request, restored);
  }),
});

http.route({
  path: "/api/auth/sign-out",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => preflight(request)),
});

http.route({
  path: "/api/auth/sign-out",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const sessionToken = readSessionToken(request);
    if (sessionToken) {
      await ctx.runMutation(api.auth.signOut, { sessionToken });
    }

    return json(request, { ok: true }, {
      headers: { "Set-Cookie": sessionCookie(null) },
    });
  }),
});

http.route({
  path: "/api/auth/sessions",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => preflight(request)),
});

http.route({
  path: "/api/auth/sessions",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const auth = await requireSession(ctx, request);
    if (auth.error) return auth.error;
    const result = await ctx.runQuery(api.auth.listSessions, { sessionToken: auth.sessionToken });
    return json(request, result);
  }),
});

http.route({
  path: "/api/auth/sessions/revoke",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => preflight(request)),
});

http.route({
  path: "/api/auth/sessions/revoke",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await requireSession(ctx, request);
    if (auth.error) return auth.error;
    const payload = await request.json();
    const result = await ctx.runMutation(api.auth.revokeSession, {
      sessionToken: auth.sessionToken,
      targetSessionId: payload.targetSessionId,
    });
    return json(request, result);
  }),
});

http.route({
  path: "/api/auth/sessions/revoke-others",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => preflight(request)),
});

http.route({
  path: "/api/auth/sessions/revoke-others",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await requireSession(ctx, request);
    if (auth.error) return auth.error;
    const result = await ctx.runMutation(api.auth.revokeOtherSessions, {
      sessionToken: auth.sessionToken,
    });
    return json(request, result);
  }),
});

http.route({
  path: "/api/rpc",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => preflight(request)),
});

http.route({
  path: "/api/rpc",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await requireSession(ctx, request);
    if (auth.error) return auth.error;

    const { operation, payload } = await request.json();
    const handler = rpcHandlers[operation];
    if (!handler) {
      return json(request, { error: "Unsupported operation." }, { status: 400 });
    }

    const result = await handler(ctx, auth.sessionToken, payload ?? {});
    return json(request, result);
  }),
});

export default http;
