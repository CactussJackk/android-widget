import { z } from "@hono/zod-openapi";

const periodSchema = z.string().regex(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/);

export const WidgetSummaryOutputSchema = z
  .object({
    period: periodSchema.openapi({ example: "2026-10" }),
    expenses: z.number().finite().nonnegative().openapi({
      description: "Despesas do mês, no mesmo critério da Visão Geral",
    }),
    income: z.number().finite().nonnegative().openapi({ description: "Receitas do mês" }),
    balance: z.number().finite().openapi({ description: "Receitas menos despesas do mês" }),
    projectedBalance: z.number().finite().openapi({
      description: "Saldo previsto ao fim do mês, considerando lançamentos pendentes",
    }),
    accountsBalance: z.number().finite().openapi({
      description: "Saldo atual somado das contas que entram no saldo consolidado",
    }),
    generatedAt: z.iso.datetime(),
  })
  .openapi("WidgetSummary");

export type WidgetSummaryOutput = z.infer<typeof WidgetSummaryOutputSchema>;
