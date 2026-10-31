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

Para criar um token de widget, a sessão web envia `POST /device-tokens` com
`{ "name": "Widget", "scope": "widget" }`. Rotacionar o token preserva o escopo.

## `GET /api/widget/summary`

Exige `Authorization: Bearer <token-widget>`. Responde sem envelope, com `Cache-Control: private,
no-store`, e aceita até 30 requisições por minuto por token.

```json
{
  "period": "2026-10",
  "expenses": 1234.56,
  "income": 5000,
  "balance": 3765.44,
  "projectedBalance": 2100.1,
  "accountsBalance": 4321.09,
  "generatedAt": "2026-10-31T12:00:00.000Z"
}
```

| Campo | Significado |
| --- | --- |
| `period` | Mês corrente no horário de Brasília |
| `expenses` / `income` | Despesas e receitas do mês, no mesmo critério da Visão Geral |
| `balance` | Receitas menos despesas do mês |
| `projectedBalance` | Saldo previsto ao fim do mês |
| `accountsBalance` | Saldo atual das contas incluídas no saldo consolidado |

Os valores vêm dos mesmos cálculos do dashboard e consideram a pessoa administradora.
