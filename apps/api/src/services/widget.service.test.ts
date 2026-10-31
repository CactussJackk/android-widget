import assert from "node:assert/strict";
import test from "node:test";
import { createWidgetService } from "./widget.service";

const userId = "00000000-0000-4000-8000-000000000001";
const metric = (current: number) => ({ current, previous: 0, hasPreviousData: false });

test("widget summary uses the current Brazilian month and the dashboard figures", async () => {
  const periods: string[] = [];
  const service = createWidgetService(
    {
      getMetrics: async (period, owner) => {
        periods.push(period);
        assert.equal(owner, userId);
        return {
          period,
          previousPeriod: "2026-09",
          income: metric(5000),
          expenses: metric(1234.56),
          balance: metric(3765.44),
          projected: metric(2100.1),
          history: [],
        };
      },
      getAccounts: async (period) => {
        periods.push(period);
        return {
          period,
          scope: { accountingBasis: "cash", includePending: false, personScope: "primary" },
          totalBalance: 4321.09,
          items: [],
        };
      },
    },
    // 31/10 23:30 em Brasília ainda é outubro, embora já seja 01/11 em UTC.
    { now: () => new Date("2026-11-01T02:30:00.000Z") },
  );

  assert.deepEqual(await service.getSummary(userId), {
    period: "2026-10",
    expenses: 1234.56,
    income: 5000,
    balance: 3765.44,
    projectedBalance: 2100.1,
    accountsBalance: 4321.09,
    generatedAt: "2026-11-01T02:30:00.000Z",
  });
  assert.deepEqual(periods, ["2026-10", "2026-10"]);
});

test("next-month widget summary shows the open invoice month and the current account balance", async () => {
  const requested: string[] = [];
  const service = createWidgetService(
    {
      getMetrics: async (period) => {
        requested.push(`metrics:${period}`);
        return {
          period,
          previousPeriod: "2026-11",
          income: metric(0),
          expenses: metric(2500),
          balance: metric(-2500),
          projected: metric(900),
          history: [],
        };
      },
      getAccounts: async (period) => {
        requested.push(`accounts:${period}`);
        return {
          period,
          scope: { accountingBasis: "cash", includePending: false, personScope: "primary" },
          totalBalance: 3400,
          items: [],
        };
      },
    },
    { now: () => new Date("2026-12-31T12:00:00.000Z") },
  );

  const summary = await service.getSummary(userId, "next");
  assert.equal(summary.period, "2027-01");
  assert.equal(summary.expenses, 2500);
  assert.equal(summary.projectedBalance, 900);
  assert.equal(summary.accountsBalance, 3400);
  assert.deepEqual(requested.sort(), ["accounts:2026-12", "metrics:2027-01"]);
});
