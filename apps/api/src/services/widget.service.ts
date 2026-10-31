import { getCurrentPeriodInBrazil } from "@openmonetis/shared/date-time";
import type { WidgetSummaryOutput } from "@openmonetis/validators/widget";
import type { DashboardService } from "./dashboard.service";

type DashboardReader = Pick<DashboardService, "getMetrics" | "getAccounts">;

/**
 * Read-only summary for home-screen widgets. It reuses the dashboard calculations, so the
 * numbers always match the Visão Geral for the current month in Brazil.
 */
export function createWidgetService(
  dashboard: DashboardReader,
  options: { now?: () => Date } = {},
) {
  const now = options.now ?? (() => new Date());

  return {
    async getSummary(userId: string): Promise<WidgetSummaryOutput> {
      const generatedAt = now();
      const period = getCurrentPeriodInBrazil(generatedAt);
      const [metrics, accounts] = await Promise.all([
        dashboard.getMetrics(period, userId),
        dashboard.getAccounts(period, userId),
      ]);

      return {
        period,
        expenses: metrics.expenses.current,
        income: metrics.income.current,
        balance: metrics.balance.current,
        projectedBalance: metrics.projected.current,
        accountsBalance: accounts.totalBalance,
        generatedAt: generatedAt.toISOString(),
      };
    },
  };
}

export type WidgetService = ReturnType<typeof createWidgetService>;
