import { z } from "@hono/zod-openapi";
import {
  defaultDeviceTokenScope,
  deviceTokenNameMaximumLength,
  deviceTokenScopes,
} from "@openmonetis/domain/device-tokens";

export const CreateDeviceTokenInputSchema = z
  .object({
    name: z.string().trim().min(1).max(deviceTokenNameMaximumLength),
    scope: z.enum(deviceTokenScopes).default(defaultDeviceTokenScope),
  })
  .strict()
  .openapi("CreateDeviceTokenInput");

export const DeviceTokenParamsSchema = z
  .object({ id: z.uuid().openapi({ param: { name: "id", in: "path" } }) })
  .openapi("DeviceTokenParams");

export const DeviceTokenOutputSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    tokenPrefix: z.string(),
    scope: z.enum(deviceTokenScopes),
    lastUsedAt: z.iso.datetime().nullable(),
    expiresAt: z.iso.datetime(),
    expiresSoon: z.boolean(),
    recentCaptureCount: z.number().int().nonnegative(),
    createdAt: z.iso.datetime(),
  })
  .openapi("DeviceToken");

export const CreatedDeviceTokenOutputSchema = DeviceTokenOutputSchema.extend({
  token: z.string(),
}).openapi("CreatedDeviceToken");

export const CompanionDeviceVerificationOutputSchema = z
  .object({
    valid: z.literal(true),
    tokenId: z.uuid(),
    tokenName: z.string(),
    expiresAt: z.iso.datetime(),
  })
  .openapi("CompanionDeviceVerification");

export const CompanionDeviceAuthenticationErrorSchema = z
  .object({ valid: z.literal(false), error: z.string() })
  .openapi("CompanionDeviceAuthenticationError");

export type CreateDeviceTokenInput = z.input<typeof CreateDeviceTokenInputSchema>;
export type DeviceTokenOutput = z.infer<typeof DeviceTokenOutputSchema>;
export type CreatedDeviceTokenOutput = z.infer<typeof CreatedDeviceTokenOutputSchema>;
