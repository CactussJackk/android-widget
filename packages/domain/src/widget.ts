import { addMonthsToPeriod } from "./transactions";

/**
 * Which month a home-screen widget shows. `next` follows people who pay this month's card
 * purchases in the following month: the open invoice belongs to the next period.
 */
export const widgetSummaryMonths = ["current", "next"] as const;
export type WidgetSummaryMonth = (typeof widgetSummaryMonths)[number];
export const defaultWidgetSummaryMonth: WidgetSummaryMonth = "current";

export function resolveWidgetSummaryPeriod(currentPeriod: string, month: WidgetSummaryMonth) {
  return month === "next" ? addMonthsToPeriod(currentPeriod, 1) : currentPeriod;
}
