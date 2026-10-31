export const deviceTokenNameMaximumLength = 80;
export const deviceTokenLifetimeDays = 365;
export const deviceTokenMaximumActiveCount = 10;
export const deviceTokenPrefix = "opm_";
export const deviceTokenExpiringSoonDays = 30;
export const deviceTokenActivityWindowDays = 7;

const dayInMilliseconds = 24 * 60 * 60 * 1_000;

export function normalizeDeviceTokenName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function getDeviceTokenExpiration(createdAt = new Date()) {
  return new Date(createdAt.getTime() + deviceTokenLifetimeDays * dayInMilliseconds);
}

export function isDeviceTokenExpiringSoon(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() - now.getTime() <= deviceTokenExpiringSoonDays * dayInMilliseconds;
}

export function getDeviceTokenActivityStart(now = new Date()) {
  return new Date(now.getTime() - deviceTokenActivityWindowDays * dayInMilliseconds);
}

export function hasDeviceTokenFormat(value: string) {
  return new RegExp(`^${deviceTokenPrefix}[A-Za-z0-9_-]{43}$`).test(value);
}

/**
 * What a device token may access. `inbox` tokens belong to the Companion and only ingest
 * notifications; `widget` tokens are read-only and only fetch the home-screen summary.
 * Tokens created before scopes existed are `inbox`, preserving the Companion contract.
 */
export const deviceTokenScopes = ["inbox", "widget"] as const;
export type DeviceTokenScope = (typeof deviceTokenScopes)[number];
export const defaultDeviceTokenScope: DeviceTokenScope = "inbox";

export function deviceTokenHasScope(scope: DeviceTokenScope, required: DeviceTokenScope) {
  return scope === required;
}
