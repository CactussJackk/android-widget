import { z } from "@hono/zod-openapi";
import { defaultWidgetSummaryMonth, widgetSummaryMonths } from "@openmonetis/domain/widget";

const periodSchema = z.string().regex(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/);

export const WidgetSummaryQuerySchema = z
  .object({
    month: z
      .enum(widgetSummaryMonths)
      .default(defaultWidgetSummaryMonth)
      .openapi({
        param: { name: "month", in: "query" },
        description:
          "`current` mostra o mês corrente; `next` mostra o mês seguinte, onde fica a fatura em aberto",
        example: "next",
      }),
  })
  .openapi("WidgetSummaryQuery");

export const WidgetSummaryOutputSchema = z
  .object({
    period: periodSchema.openapi({ example: "2026-11", description: "Mês exibido" }),
    expenses: z.number().finite().nonnegative().openapi({
      description: "Despesas do mês, no mesmo critério da Visão Geral",
    }),
    income: z.number().finite().nonnegative().openapi({ description: "Receitas do mês" }),
    balance: z.number().finite().openapi({ description: "Receitas menos despesas do mês" }),
    projectedBalance: z.number().finite().openapi({
      description: "Saldo previsto ao fim do mês, considerando lançamentos pendentes",
    }),
    accountsBalance: z.number().finite().openapi({
      description:
        "Saldo atual somado das contas que entram no saldo consolidado, sempre do mês corrente",
    }),
    generatedAt: z.iso.datetime(),
  })
  .openapi("WidgetSummary");

export type WidgetSummaryQuery = z.infer<typeof WidgetSummaryQuerySchema>;
export type WidgetSummaryOutput = z.infer<typeof WidgetSummaryOutputSchema>;
