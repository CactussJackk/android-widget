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

export const WidgetCardInvoiceOutputSchema = z
  .object({
    cardId: z.uuid(),
    name: z.string(),
    logo: z.string().nullable().openapi({
      description: "Caminho do logo servido pelo site, por exemplo `/logos/nubank.png`",
    }),
    amount: z.number().finite().nonnegative().openapi({ description: "Total da fatura do mês" }),
    remainingAmount: z.number().finite().nonnegative(),
    paid: z.boolean(),
  })
  .openapi("WidgetCardInvoice");

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
    cards: z.array(WidgetCardInvoiceOutputSchema).openapi({
      description: "Faturas com valor no mês exibido, uma por cartão",
    }),
    generatedAt: z.iso.datetime(),
  })
  .openapi("WidgetSummary");

export type WidgetSummaryQuery = z.infer<typeof WidgetSummaryQuerySchema>;
export type WidgetCardInvoiceOutput = z.infer<typeof WidgetCardInvoiceOutputSchema>;
export type WidgetSummaryOutput = z.infer<typeof WidgetSummaryOutputSchema>;
