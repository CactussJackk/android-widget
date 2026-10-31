import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { WidgetSummaryOutputSchema } from "@openmonetis/validators/widget";
import type { WidgetService } from "../services/widget.service";
import type { ApiVariables } from "../types/context";

const deviceErrorSchema = z
  .object({ valid: z.literal(false), error: z.string() })
  .openapi("WidgetAuthenticationError");

/** Mounted under `/api/widget`, authenticated by a device token with the `widget` scope. */
export function createWidgetRoute(service: WidgetService) {
  const route = new OpenAPIHono<{ Variables: ApiVariables }>();

  route.openapi(
    createRoute({
      method: "get",
      path: "/summary",
      tags: ["Widget"],
      security: [{ deviceBearer: [] }],
      responses: {
        200: {
          description: "Monthly summary for home-screen widgets",
          content: { "application/json": { schema: WidgetSummaryOutputSchema } },
        },
        401: {
          description: "Missing, invalid or expired device token",
          content: { "application/json": { schema: deviceErrorSchema } },
        },
        403: {
          description: "Device token without the widget scope",
          content: { "application/json": { schema: deviceErrorSchema } },
        },
        429: {
          description: "Too many requests",
          content: { "application/json": { schema: z.object({ error: z.string() }) } },
        },
      },
    }),
    async (context) => context.json(await service.getSummary(context.get("userId")), 200),
  );

  return route;
}
