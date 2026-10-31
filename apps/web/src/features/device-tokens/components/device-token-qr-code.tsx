import type { DeviceTokenScope } from "@openmonetis/domain/device-tokens";
import { QRCodeSVG } from "qrcode.react";
import {
  deviceTokenScopeCopy,
  formatDeviceTokenQrCodeValue,
  formatWidgetTokenQrCodeValue,
} from "../device-tokens.presentation";

interface DeviceTokenQrCodeProps {
  token: string;
  scope?: DeviceTokenScope;
}

export function DeviceTokenQrCode({ token, scope = "inbox" }: DeviceTokenQrCodeProps) {
  const copy = deviceTokenScopeCopy[scope];
  const value =
    scope === "widget"
      ? formatWidgetTokenQrCodeValue(token, window.location.origin)
      : formatDeviceTokenQrCodeValue(token);

  return (
    <div className="grid justify-items-center gap-2 text-center">
      <div
        aria-label={copy.qrLabel}
        className="overflow-hidden rounded-xl border bg-background p-2 shadow-sm"
        role="img"
      >
        <QRCodeSVG
          aria-hidden="true"
          className="size-52 max-w-full"
          level="M"
          marginSize={3}
          size={208}
          value={value}
        />
      </div>
      <p className="text-muted-foreground text-xs">{copy.qrHint}</p>
    </div>
  );
}
