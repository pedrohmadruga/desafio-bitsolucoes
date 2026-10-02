# Portal de Solicitações Internas

Mini-projeto full stack do processo seletivo **bit Soluções** (DEV Jr. 09/2026).

Colaboradores autenticados registram e acompanham demandas internas (TI, RH, Compras, etc.).

> README completo (front, Compose final, dicionário SQL) na fase de documentação. Abaixo: o necessário para desenvolver o **backend** hoje.

## Estado atual

- Backend Express + TypeScript + Prisma 7 + PostgreSQL
- Auth: login / logout / me (JWT em cookie `httpOnly`)
- Docker Compose: serviços `db` e `api`
- Testes de integração do auth (Vitest + Supertest)

## Pré-requisitos

- Node.js **20.19+**, **22.12+** ou **24+**
- Docker + Docker Compose
- npm

## Subir o banco

Na raiz do repositório:

```bash
cp .env.example .env   # se ainda não existir
docker compose up -d db
```

Postgres no host: `localhost:5433` (usuário/senha/db: `portal`).

## Backend (desenvolvimento)

```bash
cd backend
cp .env.example .env   # se ainda não existir
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

API: `http://localhost:3333`  
Health: `GET /api/health`

### Credenciais demo (após o seed)

| Usuário       | Senha    |
|---------------|----------|
| ana.silva     | senha123 |
| carlos.souza  | senha123 |

### Testes

Com o Postgres no ar:

```bash
cd backend
cp .env.test.example .env.test   # se ainda não existir
npm test
```

## Docker (API + banco)

```bash
docker compose up --build
```

Sobe `db` + `api` (migrate e seed no start). Não use junto com `npm run dev` na porta 3333.

## Documentação

- [Memorial técnico](docs/memorial-tecnico.md) — decisões e justificativas
- [API](docs/api.md) — endpoints e exemplos (`docs/requests.http` para REST Client)
- [System design (Excalidraw)](docs/system-design.excalidraw)
