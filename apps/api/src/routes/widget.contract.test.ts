import assert from "node:assert/strict";
import test from "node:test";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { DeviceTokenScope } from "@openmonetis/domain/device-tokens";
import { createRequireDeviceToken } from "../middlewares/device-auth";
import { errorHandler, notFoundHandler } from "../middlewares/errors";
import type { WidgetService } from "../services/widget.service";
import type { ApiVariables } from "../types/context";
import { createCompanionInboxRoute } from "./inbox";
import { createWidgetRoute } from "./widget";

const userId = "00000000-0000-4000-8000-000000000002";
const widgetToken = `opm_${"w".repeat(43)}`;
const inboxToken = `opm_${"i".repeat(43)}`;

const summary = {
  period: "2026-10",
  expenses: 1234.56,
  income: 5000,
  balance: 3765.44,
  projectedBalance: 2100.1,
  accountsBalance: 4321.09,
  generatedAt: "2026-10-31T12:00:00.000Z",
};

function principal(scope: DeviceTokenScope) {
  return {
    tokenId:
      scope === "widget"
        ? "00000000-0000-4000-8000-000000000010"
        : "00000000-0000-4000-8000-000000000011",
    tokenName: scope,
    userId,
    scope,
    expiresAt: new Date("2027-01-01T00:00:00.000Z"),
  };
}

const authenticate = async (token: string | null) =>
  token === widgetToken ? principal("widget") : token === inboxToken ? principal("inbox") : null;

function createTestApp(requestedUsers: string[] = [], requestedMonths: string[] = []) {
  const app = new OpenAPIHono<{ Variables: ApiVariables }>();
  app.onError(errorHandler);
  app.notFound(notFoundHandler);
  app.use("/api/widget/*", createRequireDeviceToken({ authenticate }, { scope: "widget" }));
  app.use("/api/inbox", createRequireDeviceToken({ authenticate }, { scope: "inbox" }));
  const service: WidgetService = {
    getSummary: async (id, month) => {
      requestedUsers.push(id);
      requestedMonths.push(month ?? "unset");
      return summary;
    },
  };
  app.route("/api/widget", createWidgetRoute(service));
  app.route(
    "/api/inbox",
    createCompanionInboxRoute({
      ingest: async () => ({ id: userId, clientId: null, duplicate: false }),
      ingestBatch: async () => [],
    }),
  );
  return app;
}

test("widget summary requires a valid device token", async () => {
  const response = await createTestApp().request("/api/widget/summary");
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { valid: false, error: "Token inválido ou expirado" });
});

test("widget summary returns the owner's monthly summary for widget tokens", async () => {
  const requestedUsers: string[] = [];
  const response = await createTestApp(requestedUsers).request("/api/widget/summary", {
    headers: { Authorization: `Bearer ${widgetToken}` },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), summary);
  assert.deepEqual(requestedUsers, [userId]);
});

test("Companion inbox tokens cannot read the widget summary", async () => {
  const response = await createTestApp().request("/api/widget/summary", {
    headers: { Authorization: `Bearer ${inboxToken}` },
  });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    valid: false,
    error: "Token sem permissão para este recurso",
  });
});

test("widget tokens cannot ingest into the Companion inbox", async () => {
  const response = await createTestApp().request("/api/inbox", {
    method: "POST",
    headers: { Authorization: `Bearer ${widgetToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceApp: "com.nu.production",
      originalText: "Compra aprovada",
      notificationTimestamp: "2026-10-31T12:00:00.000Z",
    }),
  });
  assert.equal(response.status, 403);
});

test("widget summary accepts the month to display and rejects unknown values", async () => {
  const requestedMonths: string[] = [];
  const app = createTestApp([], requestedMonths);
  const headers = { Authorization: `Bearer ${widgetToken}` };

  assert.equal((await app.request("/api/widget/summary", { headers })).status, 200);
  assert.equal((await app.request("/api/widget/summary?month=next", { headers })).status, 200);
  const invalid = await app.request("/api/widget/summary?month=last", { headers });
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { error: "Parâmetro inválido" });
  assert.deepEqual(requestedMonths, ["current", "next"]);
});
