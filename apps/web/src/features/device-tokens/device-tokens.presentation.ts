import { deviceTokenActivityWindowDays } from "@openmonetis/domain/device-tokens";
import { formatDateInBrazil } from "@openmonetis/shared/date-time";

export function formatDeviceTokenDate(value: string) {
  return formatDateInBrazil(new Date(value), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).replace(" de ", " ");
}

export function formatDeviceTokenLastUsed(value: string | null) {
  if (!value) return "Ainda não usado";
  return `Usado em ${formatDeviceTokenDate(value)}`;
}

export function formatDeviceTokenQrCodeValue(token: string) {
  return `openmonetis://companion/token?v=1&token=${encodeURIComponent(token)}`;
}

export function formatDeviceTokenRecentCaptures(count: number) {
  const period = `nos últimos ${deviceTokenActivityWindowDays} dias`;
  if (count === 0) return `Nenhuma captura ${period}`;
  return `${count} ${count === 1 ? "captura" : "capturas"} ${period}`;
}

/**
 * QR payload for the home-screen widget app. It carries the public origin so a single scan
 * configures both the server address and the read-only token.
 */
export function formatWidgetTokenQrCodeValue(token: string, origin: string) {
  return `openmonetis://widget/token?v=1&token=${encodeURIComponent(token)}&url=${encodeURIComponent(origin)}`;
}

export const deviceTokenScopeCopy = {
  inbox: {
    title: "Aparelhos do Companion",
    description: "Autorize cada Android que pode enviar capturas para sua conta.",
    listTitle: "Aparelhos autorizados",
    listDescription: "Gerencie os aparelhos conectados e remova os acessos que não utiliza mais.",
    connectLabel: "Conectar aparelho",
    emptyMessage: "Você ainda não conectou um aparelho ao Companion.",
    namePlaceholder: "Ex.: Celular pessoal",
    waitingMessage: "Aguardando conexão no Companion",
    qrLabel: "QR Code do token do Companion",
    qrHint: "Escaneie com o OpenMonetis Companion",
    setupHint: "No Companion, configure o endereço HTTPS da API antes de escanear.",
    revokeDescription:
      "deixará de enviar notificações imediatamente. Capturas já recebidas serão mantidas.",
  },
  widget: {
    title: "Widgets da tela inicial",
    description:
      "Autorize widgets que mostram gastos e saldo do mês. O acesso é somente leitura e não envia capturas.",
    listTitle: "Widgets autorizados",
    listDescription: "Cada widget usa um token próprio, que pode ser revogado a qualquer momento.",
    connectLabel: "Conectar widget",
    emptyMessage: "Você ainda não conectou um widget.",
    namePlaceholder: "Ex.: Widget do celular",
    waitingMessage: "Aguardando a primeira atualização do widget",
    qrLabel: "QR Code do token do widget",
    qrHint: "Escaneie com o app do widget. O endereço deste site vai junto no código.",
    setupHint:
      "Abra este site pelo endereço que o celular usa para acessá-lo antes de gerar o QR Code.",
    revokeDescription: "deixará de mostrar seus valores imediatamente.",
  },
} as const;
