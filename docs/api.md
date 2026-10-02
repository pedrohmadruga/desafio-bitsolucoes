# API — Portal de Solicitações Internas

Base URL (desenvolvimento): `http://localhost:3333`

Autenticação: cookie `token` (httpOnly), obtido via `POST /api/auth/login`. Em clientes HTTP, envie cookies nas chamadas seguintes.

Formato de erro padrão:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [{ "field": "title", "message": "…" }]
  }
}
```

Códigos comuns: `VALIDATION_ERROR` (400), `UNAUTHENTICATED` / `INVALID_CREDENTIALS` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `REQUEST_NOT_OPEN` / `INVALID_STATUS_TRANSITION` (409), `TOO_MANY_REQUESTS` (429), `PAYLOAD_TOO_LARGE` (413), `INTERNAL_ERROR` (500 — mensagem genérica).

Arquivo complementar para REST Client / VS Code: [`requests.http`](./requests.http).

---

## Health

### `GET /api/health`

Sem autenticação.

**200**

```json
{ "status": "ok" }
```

---

## Auth

### `POST /api/auth/login`

Body:

```json
{ "username": "ana.silva", "password": "senha123" }
```

**200** + `Set-Cookie: token=…; HttpOnly`

```json
{
  "user": { "id": 1, "name": "Ana Silva", "username": "ana.silva" }
}
```

### `POST /api/auth/logout`

Auth obrigatória. **204** (sem corpo).

### `GET /api/auth/me`

Auth obrigatória. **200**

```json
{
  "user": { "id": 1, "name": "Ana Silva", "username": "ana.silva" }
}
```

---

## Categories

### `GET /api/categories`

Auth obrigatória. Lista ordenada por nome.

**200**

```json
{
  "categories": [
    { "id": 1, "name": "Compras" },
    { "id": 2, "name": "Financeiro" }
  ]
}
```

---

## Requests

### `GET /api/requests`

Auth obrigatória. Query opcional:

| Param | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `from` / `to` | `YYYY-MM-DD` | — | UTC−3 (início/fim do dia); `from <= to` |
| `categoryId` | int | — | |
| `status` | enum | — | `ABERTO` \| `EM_ATENDIMENTO` \| `CONCLUIDO` |
| `q` | string | — | busca parcial no título (case-insensitive) |
| `page` | int ≥ 1 | 1 | |
| `pageSize` | 1–50 | 10 | |

**200**

```json
{
  "data": [
    {
      "id": 42,
      "code": "SOL-000042",
      "title": "Impressora do 2º andar sem toner",
      "description": "…",
      "status": "ABERTO",
      "category": { "id": 1, "name": "TI" },
      "requester": { "id": 1, "name": "Ana Silva" },
      "createdAt": "2026-09-30T14:20:00.000Z",
      "updatedAt": "2026-09-30T14:20:00.000Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 10, "total": 1, "totalPages": 1 }
}
```

### `POST /api/requests`

Auth obrigatória. Status inicial sempre `ABERTO`; solicitante = usuário do token (`requesterId`/`status` no body são ignorados).

```json
{
  "title": "Impressora sem toner",
  "description": "A impressora do 2º andar parou de imprimir.",
  "categoryId": 1
}
```

**201** → `{ "request": { … } }` (mesmo formato do item da listagem).

### `GET /api/requests/:id`

Auth obrigatória. **200** `{ "request": { … } }` · **404** se inexistente · **400** se `id` inválido.

### `PUT /api/requests/:id`

Auth obrigatória. Só o **dono** e só se status = `ABERTO`.

Body igual ao create. **200** `{ "request": { … } }` · **403** · **409** `REQUEST_NOT_OPEN` · **404**.

### `DELETE /api/requests/:id`

Auth obrigatória. Só o **dono** e só se `ABERTO`. **204** · **403** · **409** · **404**.

### `PATCH /api/requests/:id/status`

Auth obrigatória. Qualquer usuário autenticado.

```json
{ "status": "EM_ATENDIMENTO" }
```

Transições permitidas:

- `ABERTO` → `EM_ATENDIMENTO`
- `EM_ATENDIMENTO` → `ABERTO` ou `CONCLUIDO`
- `CONCLUIDO` → (nenhuma)

**200** `{ "request": { … } }` · **409** `INVALID_STATUS_TRANSITION`.

---

## Dashboard

### `GET /api/dashboard`

Auth obrigatória.

**200**

```json
{
  "total": 12,
  "aberto": 5,
  "emAtendimento": 4,
  "concluido": 3
}
```

Status ausentes no banco vêm como `0`.

---

## Credenciais demo (seed)

| Usuário | Senha |
| --- | --- |
| `ana.silva` | `senha123` |
| `carlos.souza` | `senha123` |
