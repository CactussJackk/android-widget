import { type Hook, z } from "@hono/zod-openapi";
import { fail } from "@openmonetis/shared/api";
import type { ApiVariables } from "../types/context";

export const ErrorResponseSchema = z.object({
  error: z.literal(true),
  message: z.string(),
  code: z.string().optional(),
});

export function errorResponse(description: string) {
  return {
    description,
    content: { "application/json": { schema: ErrorResponseSchema } },
  } as const;
}

export const validationHook: Hook<unknown, { Variables: ApiVariables }, string, unknown> = (
  result,
  context,
) => {
  if (result.success) {
    return;
  }

  return context.json(fail("Revise os campos enviados.", "validation_error"), 400);
};

export const companionValidationHook: Hook<
  unknown,
  { Variables: ApiVariables },
  string,
  unknown
> = (result, context) => {
  if (result.success) return;
  // Server-side diagnostics only: field paths and issue codes, never the notification content.
  console.warn(
    "Companion payload rejected",
    JSON.stringify({
      path: context.req.path,
      issues: describeValidationIssues(result.error),
    }),
  );
  return context.json({ error: "Revise os dados enviados" }, 400);
};

function describeValidationIssues(error: unknown) {
  if (!(error instanceof z.ZodError)) return [];
  return error.issues.slice(0, 20).map((issue) => ({
    path: issue.path.map(String).join("."),
    code: issue.code,
  }));
}
