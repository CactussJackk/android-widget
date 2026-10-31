import { type DeviceTokenScope, deviceTokenHasScope } from "@openmonetis/domain/device-tokens";
import { createMiddleware } from "hono/factory";
import type { DeviceTokensService } from "../services/device-tokens.service";
import type { ApiVariables } from "../types/context";

/**
 * Authenticates a device by its Bearer token. With `scope`, tokens issued for another purpose
 * are rejected with 403, so a read-only widget token cannot ingest into the inbox and a
 * Companion token cannot read financial summaries.
 */
export function createRequireDeviceToken(
  service: Pick<DeviceTokensService, "authenticate">,
  options: { scope?: DeviceTokenScope } = {},
) {
  return createMiddleware<{ Variables: ApiVariables }>(async (context, next) => {
    const principal = await service.authenticate(
      extractBearerToken(context.req.header("Authorization")),
    );

    if (!principal) {
      return context.json({ valid: false, error: "Token inválido ou expirado" }, 401);
    }

    if (options.scope && !deviceTokenHasScope(principal.scope, options.scope)) {
      return context.json({ valid: false, error: "Token sem permissão para este recurso" }, 403);
    }

    context.set("userId", principal.userId);
    context.set("deviceTokenId", principal.tokenId);
    context.set("deviceTokenName", principal.tokenName);
    context.set("deviceTokenExpiresAt", principal.expiresAt);
    await next();
  });
}

function extractBearerToken(value: string | undefined) {
  if (!value || value.length > 256) return null;
  return /^Bearer ([^\s]+)$/i.exec(value)?.[1] ?? null;
}
