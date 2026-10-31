# API de widgets

Resumo financeiro do mês para widgets de tela inicial. A rota é somente leitura e usa um token de
aparelho com escopo `widget`, separado do token do Companion.

## Escopos dos tokens de aparelho

| Escopo | Uso | Rotas permitidas |
| --- | --- | --- |
| `inbox` (padrão) | Companion Android | `POST /api/auth/device/verify`, `POST /api/inbox`, `POST /api/inbox/batch` |
| `widget` | Widgets de tela inicial | `POST /api/auth/device/verify`, `GET /api/widget/summary` |

Tokens criados antes dos escopos recebem `inbox` pela migration `0021_device_token_scope`, então o
Companion continua funcionando sem alterações. Um token usado fora do seu escopo recebe HTTP `403`:

```json
{ "valid": false, "error": "Token sem permissão para este recurso" }
```

Para criar um token de widget, use **Ajustes → Integrações → Widgets da tela inicial**. Pela API,
a sessão web envia `POST /device-tokens` com `{ "name": "Widget", "scope": "widget" }`. Rotacionar
o token preserva o escopo.

### Pareamento por QR Code

O QR Code do widget usa o payload versionado:

```text
openmonetis://widget/token?v=1&token=opm_<credencial>&url=<origem-pública-codificada>
```

`url` é a origem pela qual o site foi aberto ao gerar o código (por exemplo,
`https://maquinamortifera.tail5a45b8.ts.net:7443`), para que uma única leitura configure o endereço
e o token. Como no Companion, o payload é uma credencial secreta e não deve ser registrado em logs.

## `GET /api/widget/summary`

Exige `Authorization: Bearer <token-widget>`. O parâmetro opcional `month` escolhe o mês exibido:
`current` (padrão) ou `next`, o mês seguinte, onde fica a fatura do cartão em aberto para quem paga no
mês seguinte o que gasta no mês atual. Outros valores retornam HTTP `400` com
`{ "error": "Parâmetro inválido" }`. Responde sem envelope, com `Cache-Control: private,
no-store`, e aceita até 30 requisições por minuto por token.

```json
{
  "period": "2026-10",
  "expenses": 1234.56,
  "income": 5000,
  "balance": 3765.44,
  "projectedBalance": 2100.1,
  "accountsBalance": 4321.09,
  "cards": [
    {
      "cardId": "8f0c…",
      "name": "Nubank",
      "logo": "/logos/nubank.png",
      "amount": 800,
      "remainingAmount": 800,
      "paid": false
    }
  ],
  "generatedAt": "2026-10-31T12:00:00.000Z"
}
```

| Campo | Significado |
| --- | --- |
| `period` | Mês exibido, calculado a partir do mês corrente no horário de Brasília |
| `expenses` / `income` | Despesas e receitas do mês, no mesmo critério da Visão Geral |
| `balance` | Receitas menos despesas do mês |
| `projectedBalance` | Saldo previsto ao fim do mês |
| `cards` | Faturas com valor no mês exibido: cartão, logo (caminho no site), total, restante e se está paga |
| `accountsBalance` | Saldo atual das contas incluídas no saldo consolidado, sempre do mês corrente |

Os valores vêm dos mesmos cálculos do dashboard e consideram a pessoa administradora.
