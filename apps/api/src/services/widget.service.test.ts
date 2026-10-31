import assert from "node:assert/strict";
import test from "node:test";
import type { InvoicesService } from "./invoices.service";
import { createWidgetService } from "./widget.service";

const userId = "00000000-0000-4000-8000-000000000001";
const metric = (current: number) => ({ current, previous: 0, hasPreviousData: false });
type InvoicesOutput = Awaited<ReturnType<InvoicesService["get"]>>;

function invoicesReader(periods: string[], items: Partial<InvoicesOutput["items"][number]>[] = []) {
  return {
    get: async (period: string) => {
      periods.push(`invoices:${period}`);
      return { period, totalRemaining: 0, accounts: [], items } as unknown as InvoicesOutput;
    },
  };
}

test("widget summary uses the current Brazilian month and the dashboard figures", async () => {
  const periods: string[] = [];
  const invoicePeriods: string[] = [];
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
    invoicesReader(invoicePeriods, [
      {
        cardId: "00000000-0000-4000-8000-000000000101",
        cardName: "Nubank",
        logo: "/logos/nubank.png",
        amount: 800,
        remainingAmount: 800,
      },
      {
        cardId: "00000000-0000-4000-8000-000000000102",
        cardName: "Itaú",
        logo: null,
        amount: 300,
        remainingAmount: 0,
      },
    ]),
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
    cards: [
      {
        cardId: "00000000-0000-4000-8000-000000000101",
        name: "Nubank",
        logo: "/logos/nubank.png",
        amount: 800,
        remainingAmount: 800,
        paid: false,
      },
      {
        cardId: "00000000-0000-4000-8000-000000000102",
        name: "Itaú",
        logo: null,
        amount: 300,
        remainingAmount: 0,
        paid: true,
      },
    ],
    generatedAt: "2026-11-01T02:30:00.000Z",
  });
  assert.deepEqual(periods, ["2026-10", "2026-10"]);
  assert.deepEqual(invoicePeriods, ["invoices:2026-10"]);
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
    invoicesReader(requested),
    { now: () => new Date("2026-12-31T12:00:00.000Z") },
  );

  const summary = await service.getSummary(userId, "next");
  assert.equal(summary.period, "2027-01");
  assert.equal(summary.expenses, 2500);
  assert.equal(summary.projectedBalance, 900);
  assert.equal(summary.accountsBalance, 3400);
  assert.deepEqual(requested.sort(), ["accounts:2026-12", "invoices:2027-01", "metrics:2027-01"]);
});
