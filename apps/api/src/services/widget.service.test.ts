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
