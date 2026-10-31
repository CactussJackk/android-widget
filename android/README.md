# OpenMonetis Widget (Android)

Widget de tela inicial que mostra o gasto do mês, o saldo previsto e o saldo das contas a partir de
`GET /api/widget/summary` (veja `docs/widget-api.md`).

## Instalação

1. Baixe o APK mais recente em **Releases** (`Widget Android N`) pelo celular e instale.
2. No OpenMonetis, abra **Ajustes → Integrações → Widgets da tela inicial → Conectar widget**.
3. No app, toque em **Escanear QR Code**. O código traz o endereço do servidor e o token.
4. Na tela inicial, toque e segure um espaço vazio, escolha **Widgets** e adicione o
   **OpenMonetis Widget**.

O widget atualiza a cada 30 minutos (quando há rede) e pelo botão de atualizar. Tocar no widget abre
o OpenMonetis. Em instalações acessíveis só pela tailnet, o Tailscale precisa estar ligado.

## Build

O workflow `.github/workflows/android-widget.yml` gera o APK a cada push em `android/` na branch
`feature/widget` e publica uma pre-release `widget-apk-N`. Localmente:
`cd android && ./gradlew assembleRelease`.

A assinatura usa `app/widget.jks`, guardado no repositório para que cada build instale por cima do
anterior. É uma chave de uso pessoal deste fork; para distribuir o app a terceiros, troque-a por uma
chave mantida em segredo do repositório.
