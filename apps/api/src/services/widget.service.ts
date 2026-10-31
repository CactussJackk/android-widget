import {
  defaultWidgetSummaryMonth,
  resolveWidgetSummaryPeriod,
  type WidgetSummaryMonth,
} from "@openmonetis/domain/widget";
import { getCurrentPeriodInBrazil } from "@openmonetis/shared/date-time";
import type { WidgetSummaryOutput } from "@openmonetis/validators/widget";
import type { DashboardService } from "./dashboard.service";

type DashboardReader = Pick<DashboardService, "getMetrics" | "getAccounts">;

/**
 * Read-only summary for home-screen widgets. It reuses the dashboard calculations, so the
 * numbers always match the Visão Geral of the displayed month. The account balance is always
 * the current one, whichever month is displayed.
 */
export function createWidgetService(
  dashboard: DashboardReader,
  options: { now?: () => Date } = {},
) {
  const now = options.now ?? (() => new Date());

  return {
    async getSummary(
      userId: string,
      month: WidgetSummaryMonth = defaultWidgetSummaryMonth,
    ): Promise<WidgetSummaryOutput> {
      const generatedAt = now();
      const currentPeriod = getCurrentPeriodInBrazil(generatedAt);
      const period = resolveWidgetSummaryPeriod(currentPeriod, month);
      const [metrics, accounts] = await Promise.all([
        dashboard.getMetrics(period, userId),
        dashboard.getAccounts(currentPeriod, userId),
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
