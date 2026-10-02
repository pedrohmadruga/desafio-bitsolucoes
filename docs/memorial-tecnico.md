# MEMORIAL TÉCNICO DE DESENVOLVIMENTO

Portal de Solicitações Internas — Processo seletivo bit Soluções (DEV Jr. 09/2026)

Documento vivo. Atualizo conforme avanço no desenvolvimento; as seções abaixo refletem o que já foi decidido e o que ainda está em aberto.

---

## 1. Introdução

Este memorial registra o raciocínio por trás das escolhas técnicas e de negócio do Portal de Solicitações Internas, mini-projeto da segunda etapa do processo seletivo.

O sistema permite que colaboradores autenticados registrem demandas internas (TI, RH, Compras, etc.), acompanhem o andamento e consultem indicadores simples. A entrega prevê backend, frontend, persistência em banco SQL, documentação de execução e este memorial.

Organizei o documento assim: tecnologias e justificativas; decisões de arquitetura e de negócio; e um registro cronológico do que fui decidindo no caminho. Ao fim do **Dia 1** já existem backend Express com autenticação, Postgres via Compose, seed, Dockerfile da API e testes de integração do módulo auth; faltam os módulos de solicitações/dashboard e todo o frontend.

---

## 2. Tecnologias utilizadas

Stack definida na fase de planejamento. 


| Categoria            | Tecnologia                               | Situação / versão                          |
| -------------------- | ---------------------------------------- | ------------------------------------------ |
| Runtime              | Node.js                                  | **24+** recomendado (`engines`: 20.19+ / 22.12+ / 24+) |
| Linguagem            | TypeScript (backend e frontend)          | Definida                                   |
| Backend              | Express                                  | Definida                                   |
| Frontend             | React + Vite + React Router              | Definida                                   |
| Banco de dados       | PostgreSQL                               | 16 (Compose)                               |
| ORM / acesso a dados | Prisma (+ scripts SQL entregues à parte) | **7.10.0** (+ `@prisma/adapter-pg`, `pg`)  |
| Validação            | Zod                                      | Definida                                   |
| Autenticação         | JWT em cookie `httpOnly` + bcrypt        | **Implementado** (login/logout/me)         |
| Estilização          | Tailwind CSS                             | Planejado (frontend)                       |
| Cliente HTTP         | axios (`withCredentials`)                | Planejado (frontend)                       |
| Testes (backend)     | Vitest + Supertest                       | **Auth:** 9 testes verdes                  |
| Containerização      | Docker + Docker Compose                  | `db` + `api` (web depois)                  |
| CI                   | GitHub Actions                           | Pasta reservada, workflow ainda não criado |


---

## 3. Justificativa técnica

### 3.1 TypeScript (backend e frontend)

- **Motivo da escolha:** o domínio tem regras explícitas (status, dono da solicitação, filtros, paginação). Tipagem estática reduz inconsistência entre o que a API devolve e o que a interface consome, e isso importa num projeto com prazo curto, em que regressões custam caro.
- **Benefícios para o cenário:** contratos mais claros entre camadas; autocompletar e erros em tempo de compilação em vez de falha só no navegador ou no Postman.
- **Vantagens em relação a alternativas:** JavaScript puro seria mais rápido de “começar”, mas em validações e DTOs eu pagaria depois com checagens manuais. Outras linguagens (Python, PHP, Java) funcionariam, mas TypeScript me permite manter a mesma linguagem e o mesmo modelo mental nos dois lados da aplicação.
- **Impacto:** menos atrito na manutenção e na evolução dos endpoints. O custo inicial é configurar `tsconfig` e o pipeline de build, o que compensa já nas primeiras rotas.

### 3.2 Node.js + Express

- **Motivo da escolha:** a API é REST, CRUD e regras de negócio modestas. Express cobre isso sem impor uma estrutura monolítica, de modo que eu possa montar as camadas (routes → controller → service → repository) do jeito que o escopo pede.
- **Benefícios para o cenário:** middleware nativo para autenticação, erros e rate limit no login; ecossistema maduro para JWT, cookies e validação.
- **Vantagens em relação a alternativas:** NestJS traria módulos e DI “de fábrica”, mas também mais cerimônia e curva para um prazo de poucos dias. Express ainda é a referência mais comum em material e em revisões de código júnior, o que facilita a leitura por quem avaliar. Um backend em outra stack quebraria a unidade TypeScript ponta a ponta.
- **Impacto:** produtividade alta no início e a organização em camadas fica sob minha responsabilidade. Por isso documentei a estrutura de pastas antes de codar.
- **Versão do Node:** documentei o requisito em `engines` no `package.json` do backend (Node 20.19+, 22.12+ ou 24+). O Prisma 7 exige isso; o ambiente local estava em 20.18.2 e o `npm install` falhava no preinstall. Subir o runtime foi pré-requisito para a ORM na versão que adotei.

### 3.3 React + Vite + React Router

- **Motivo da escolha:** a interface tem formulários, listagem com filtros, detalhe e dashboard. Componentização ajuda a não repetir input, badge de status, paginação e estados de loading/erro/vazio.
- **Benefícios para o cenário:** Vite sobe o ambiente de desenvolvimento rápido e o build de produção é direto para servir via nginx depois. React Router resolve login, rotas protegidas e navegação entre as telas pedidas no edital.
- **Vantagens em relação a alternativas:** Next.js adicionaria SSR/SSG que este portal interno não exige. Permaneci no React pela familiaridade e pela quantidade de padrões estáveis para auth client-side e formulários.
- **Impacto:** ciclo de feedback curto no frontend.

### 3.4 PostgreSQL

- **Motivo da escolha:** o edital pede banco SQL, listagens filtráveis e indicadores agregados. O modelo relacional encaixa em usuários, categorias e solicitações com FKs e integridade de status.
- **Benefícios para o cenário:** enums, índices em colunas de filtro (`status`, `category_id`, `created_at`) e `ILIKE` para busca textual no título.
- **Vantagens em relação a alternativas:** MySQL também serviria. PostgreSQL lida bem com enums nativos e com a stack Prisma/Node sem atrito. SQLite simplificaria o setup local, mas enfraquece o discurso de ambiente próximo de produção e o Compose com serviço `db` dedicado. NoSQL não casa com o dicionário de dados e os scripts SQL pedidos.
- **Impacto:** migrations reproduzíveis e base sólida para o dicionário de dados; exige subir o serviço (Docker) cedo para não deixar a persistência para o fim.

### 3.5 Prisma (+ SQL à parte) — v7.10.0

- **Motivo da escolha:** preciso de schema versionado, tipagem das queries e seed de demonstração, sem escrever na mão todo o mapeamento objeto-relacional.
- **Benefícios para o cenário:** `migrate deploy` no container alinha o banco ao código; o client tipado reduz erro em joins de categoria/solicitante; consigo entregar `database/schema.sql` gerado a partir das migrations para cumprir o requisito de scripts SQL.
- **Vantagens em relação a alternativas:** SQL puro dá controle total, mas aumenta código repetitivo e risco de drift entre documentação e banco. TypeORM/Sequelize são opções, mas a tipagem do Prisma no fluxo TypeScript costuma ser mais previsível no dia a dia.
- **Impacto:** ganho de velocidade e rastreabilidade de schema no Git.
- **Por que Prisma 7 (e não 6 nem 8 RC):** tentei o caminho clássico (URL no `schema.prisma`, na linha do Prisma 6), mas a ferramenta/docs atuais e o language server do editor já tratam `url` no schema como inválido — a conexão de migrate vai para `prisma.config.ts`, e o `PrismaClient` em runtime recebe um **driver adapter** (`@prisma/adapter-pg` + `pg`). Fixei **7.10.0** (estável) nos dois pacotes (`prisma` e `@prisma/client`) para não misturar major. Evitei o **Prisma 8 RC**: o `prisma init` da RC instalou pastas de “skills” para agents (`.agents`, `.claude`, `.cursor`, `.devin`) e um `postinstall` que não agrega ao produto; para um desafio com prazo curto, RC é risco desnecessário.
- **Como ficou no projeto:** `prisma/schema.prisma` só declara `provider = "postgresql"`; `prisma.config.ts` lê `DATABASE_URL`; `src/database/prisma.ts` instancia o client com o adapter. No **Dockerfile**, o `prisma generate` do build precisa que `DATABASE_URL` exista ao carregar o config — usei um placeholder no stage da imagem; a URL real (`@db:5432`) vem do Compose em runtime. Quem for rodar local precisa de Node na faixa do `engines` do backend.

### 3.6 Zod

- **Motivo da escolha:** validação de body, query e params não pode ficar só no TypeScript (pois tipos somem em runtime). Zod valida na porta de entrada da API e ainda infere tipos TypeScript a partir do schema.
- **Benefícios para o cenário:** mensagens de campo (`title`, `categoryId`, datas do filtro) alinhadas ao formato de erro único da API; o mesmo tipo de schema pode espelhar regras no frontend (formulário).
- **Vantagens em relação a alternativas:** Joi e Yup resolvem validação, mas a inferência de tipos com Zod encaixa melhor no TypeScript. Validar “na mão” em cada controller escala mal e diverge entre rotas.
- **Impacto:** contrato de entrada consistente; um pouco de código a mais nos schemas, mas menos discussão sobre “de quem é a culpa” quando o client manda lixo.

### 3.7 JWT em cookie httpOnly + bcrypt

- **Motivo da escolha:** o edital pede login, sessão e logout, com acesso só para autenticados. JWT com expiração modela a sessão sem armazenar estado de sessão no servidor neste escopo; `httpOnly` impede leitura do token via JavaScript no browser, e o bcrypt cobre o hash das senhas.
- **Benefícios para o cenário:** logout = limpar cookie; `GET /auth/me` restaura a sessão após F5; a API continua stateless em relação à sessão.
- **Vantagens em relação a alternativas:** sessão server-side (Redis/memória) seria mais “clássica”, mas adiciona infraestrutura. Token só no `Authorization` header funciona, porém o front precisaria guardar o JWT em lugar acessível ao JS. OAuth/SSO seria excesso para usuários demo em seed.
- **Impacto:** implementação enxuta e alinhada a segurança básica pedida na avaliação. Em produção eu endureceria HTTPS, flag `secure` e rotação/refresh.

### 3.8 Tailwind CSS

- **Motivo da escolha:** o diferencial de responsividade pede ajuste rápido mobile/desktop sem montar um design do zero.
- **Benefícios para o cenário:** utilitários no markup aceleram listagem, formulários e dashboard; mobile-first fica natural (`flex-col` → `md:flex-row`).
- **Vantagens em relação a alternativas:** CSS Modules isolam escopo, mas custam mais tempo em layout responsivo. UI kits (MUI, etc.) aceleram, porém pesam no visual genérico e no bundle. Para um portal interno pequeno, Tailwind me deixa no controle sem reinventar grid e espaçamento.
- **Impacto:** entrega visual aceitável no prazo; preciso de disciplina para não espalhar classes demais (componentes de UI reutilizáveis).

### 3.9 axios

- **Motivo da escolha:** o front precisa enviar cookies de sessão (`withCredentials`) e tratar 401 de forma centralizada.
- **Benefícios para o cenário:** um client único para auth, requests, categories e dashboard; menos código repetido de `fetch`.
- **Vantagens em relação a alternativas:** `fetch` nativo basta, mas interceptors e API de erro são mais manuais. Em escopo deste tamanho, axios reduz atrito sem ser dependência pesada demais.
- **Impacto:** comportamento de sessão previsível no SPA; acoplamento leve a uma lib HTTP (aceitável).

### 3.10 Vitest + Supertest

- **Motivo da escolha:** regras de negócio (dono, status Aberto, transições) são exatamente o tipo de coisa que quebra sem teste. Quero poucos testes, nos fluxos que importam, contra um Postgres real de teste.
- **Benefícios para o cenário:** Vitest é rápido e familiar a quem já viu Jest, enquanto Supertest exercita a API HTTP de ponta a ponta (cookie, status code, body de erro).
- **Vantagens em relação a alternativas:** Jest também serviria, mas Vitest integra melhor com ESM/Vite e é mais leve de configurar hoje. Testes só unitários com mock de Prisma não pegariam regressão de middleware e serialização, por isso priorizo integração na API.
- **Impacto:** confiança para refatorar auth com regressão rápida. Configurei Vitest com `fileParallelism: false`, schema Postgres `test` (isolado do `public` de desenvolvimento), truncate a cada teste e helpers (`createUser`, `loginAs`).

### 3.11 Docker + Docker Compose

- **Motivo da escolha:** o edital exige execução sem adaptações. Compose com `db`, `api` e `web` é o caminho mais honesto para quem for avaliar clonar e subir.
- **Benefícios para o cenário:** mesmo Postgres para todos; migrations/seed no start da API; frontend estático atrás de nginx com proxy `/api`.
- **Vantagens em relação a alternativas:** instruções só com “instale Node 22, Postgres 16, configure PATH…” falham em máquinas diferente.
- **Impacto:** investir em conteinerização no dia 1 evita surpresa na entrega. Dockerfile multi-stage da API já aplica migrate + seed no start. No host WSL a porta 5432 já estava ocupada por outro Postgres — mapeei o Compose para **5433:5432** e ajustei o `DATABASE_URL` local; dentro da rede Docker a API continua falando com `db:5432`.

### 3.12 GitHub Actions (diferencial, ainda não implementado)

- **Motivo da escolha:** CI (lint, typecheck, testes, build) é diferencial do edital, não requisito. Reservei `.github/workflows/` na estrutura inicial para não misturar isso depois com pressa.
- **Benefícios para o cenário:** se sobrar tempo, o avaliador vê checagem automática no push. Se não sobrar, a pasta vazia (com `.gitkeep`) não atrapalha a entrega.
- **Vantagens em relação a alternativas:** Actions é o padrão no GitHub, onde o repositório deve ficar.
- **Impacto:** baixo por enquanto; prioridade menor que app funcionando, Docker, README e este memorial.

---

## 4. Justificativa conceitual

### 4.1 Estrutura geral da aplicação

Optei por três processos distintos no Compose: banco, API e interface. O navegador fala com o frontend; em produção containerizada, o nginx serve o build e encaminha `/api` para o backend. O backend é a única porta de escrita/leitura no PostgreSQL.

Antes de codar, registrei em `docs/system-design.excalidraw` a modelagem, os casos de uso e a superfície de endpoints. Não foi um exercício estético: serviu para mapear o que autenticar, o que filtrar, o que o dashboard agrega e para ter material visual que posso reaproveitar na documentação.

### 4.2 Organização do repositório (monorepo)

Coloquei backend e frontend no **mesmo repositório Git**, em pastas `backend/` e `frontend/`, cada uma com seu próprio `package.json` quando forem scaffoldadas.

Nomeei `backend` e `frontend` de propósito. `api`/`web` também funcionaria e alinha aos nomes dos serviços no Compose. mantive `backend`/`frontend` por legibilidade.

Pastas adicionais já criadas:

- `database/` — scripts SQL e dicionário de dados (requisito explícito).
- `docs/` — memorial, evidências e o Excalidraw de design.
- `.github/workflows/` — reservado ao diferencial de CI.

### 4.3 Organização em módulos e camadas (backend)

O código de domínio fica em `modules/` (por feature). Dentro de cada módulo mantenho a sequência **routes → controller → service** (repository entra quando a persistência do módulo crescer). Auth já segue esse padrão; middlewares transversais (`authenticate`, `errorHandler`, rate limit) ficam em `middlewares/`.

- Controllers lidam com HTTP e validação de entrada (Zod).
- Services concentram regra de negócio **sem** conhecer Express.
- Prisma fica encapsulado no service/helpers de dados por enquanto.

Isso atende “uso adequado de camadas” sem espalhar pastas globais `controllers/` / `services/` no início do projeto.

### 4.4 Modelagem de dados (direção)

Três entidades principais: `User`, `Category`, `ServiceRequest` (nome do model evita colisão com `Request` do Express/DOM). Categorias estão em tabela própria, pois dessa maneira, incluir categoria nova não exige alterar enum de código.

Detalhamento de campos, índices e transições está no Excalidraw e já foi refletido em `backend/prisma/schema.prisma` (models `User`, `Category`, `ServiceRequest` e enum `RequestStatus`).

### 4.5 Autenticação e comunicação front ↔ back

A comunicação entre frontend e backend segue o estilo REST com payloads em JSON, e as rotas da API ficam sob o prefixo `/api` (por exemplo `/api/auth/login`). Esse prefixo separa endpoint de página: o nginx (ou o proxy do Vite) encaminha `/api` para o Express.

A sessão **já está implementada** no backend: cookie `token` com JWT `httpOnly`, `sameSite: 'lax'` e `secure` configurável; logout limpa o cookie; `GET /api/auth/me` reconstitui o usuário. Mensagens de falha de login são genéricas (“Usuário ou senha inválidos”) para não distinguir usuário inexistente de senha errada. Há rate limit no login (10 / 15 min), desligado em `NODE_ENV=test`.

Erros seguem formato único (`error.code`, `error.message`, `details` opcional) via `errorHandler` centralizado. O frontend ainda não consome a API; quando existir, o proxy do Vite deve facilitar cookie e origem no mesmo site lógico.

### 4.6 Estratégia de `.gitignore`

Ignorei `node_modules`, artefatos de build (`dist`), cobertura, logs e **todos** os `.env` reais, mantendo versionáveis apenas `.env.example` / `.env.*.example`.

---

## 5. Decisões de negócio

O PDF acerca do projeto não fecha algumas regras. Assumi o seguinte para não bloquear a implementação:


| Ponto                    | Decisão                                                                                                          | Por quê                                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visibilidade da listagem | Todo usuário autenticado vê todas as solicitações                                                                | A listagem pedida inclui coluna “Solicitante”, o que indica visão ampla, não “só as minhas”                                                                          |
| Editar / excluir         | Apenas o solicitante, e só com status **Aberto**                                                                 | O edital restringe editar/excluir a solicitação aberta; limitar ao dono é controle mínimo de autorização (403 se não for dono; 409 se não estiver aberta)            |
| Alterar status           | Qualquer autenticado                                                                                             | O enunciado não define papéis; a autorização mínima coerente é “estar logado”. Restringir a atendente/admin exigiria RBAC fora do pedido. Fica como melhoria futura. |
| Transições               | `ABERTO → EM_ATENDIMENTO`; `EM_ATENDIMENTO → CONCLUIDO` ou de volta para`→ ABERTO`; `CONCLUIDO` é o estado final | Evita saltos incoerentes (ex.: Aberto → Concluído sem atendimento). Transição inválida retorna código HTTP 409                                                       |
| Código exibido           | Derivado do `id` (`SOL-000042`)                                                                                  | Atende o campo “Código” na listagem sem denormalizar                                                                                                                 |
| Filtro por período       | `YYYY-MM-DD`, dia inteiro em UTC-3                                                                               | Brasil não possui horário de verão desde 2019. Usar um fuso fixo é limitação consciente e documentada                                                                |
| Paginação                | 10 por página (máx. 50)                                                                                          | Mesmo com pouco volume, evita listagem aberta e ensina contrato com `meta`                                                                                           |
| Exclusão                 | Física (hard delete)                                                                                             | Escopo pequeno. soft delete/auditoria entram como melhorias futuras                                                                                                  |


---

## 6. Qualidade

Diretrizes em uso no backend:

- Validação Zod nas entradas; erros 400 com `details` por campo.
- `AppError` + `errorHandler` (Zod / AppError / payload grande / 500 genérico sem stack na resposta).
- Testes de integração (auth, categories, requests, dashboard) com Vitest + Supertest + Postgres schema `test`.
- Segurança básica: bcrypt, cookie httpOnly, mensagem genérica de login, rate limit no login, `helmet`, CORS restrito a `CORS_ORIGIN`, `express.json({ limit: '100kb' })`.
- Endpoints protegidos por `authenticate`, exceto `GET /api/health` e `POST /api/auth/login`.
- Documentação de endpoints em `docs/api.md` e `docs/requests.http`.

---

## 7. Como executar

**Dia a dia (backend):** `docker compose up -d db` e, em `backend/`, `npm run dev` (hot reload; `DATABASE_URL` em `localhost:5433`).

**Entrega / smoke Docker:** na raiz, `cp .env.example .env` (se ainda não houver) e `docker compose up --build` — sobe `db` + `api` (migrate + seed no start da API). Health: `GET http://localhost:3333/api/health`.

Credenciais demo (seed): `ana.silva` / `senha123` e `carlos.souza` / `senha123`.

O README completo (front + web no Compose) ainda será escrito na fase de documentação.

---

## 8. Análise crítica

### 8.1 Limitações (já previsíveis)

- Sem papéis (qualquer autenticado altera status).
- Sem histórico de mudança de status nem comentários/anexos.
- Exclusão física.
- Fuso fixo no filtro de datas.
- Sem auto-cadastro nem recuperação de senha — o edital cobre login/sessão/logout, não gestão de contas. Usuários demo vêm do seed; cadastro e reset ficam como melhoria futura.
- CI ainda não implementado.
- A exclusão de solicitação usa `deleteMany` com `id` + `requesterId` + `status = ABERTO` numa única operação, o que reduz (mas não elimina por completo em todos os caminhos) a janela de corrida entre “checar se ainda está aberta” e “apagar”. Na edição ainda faço busca + validação + `update`; dois pedidos concorrentes (ex.: alguém muda o status enquanto o dono edita) ainda podem gerar condição de corrida rara. Em produção eu usaria `updateMany` com o mesmo filtro composto ou bloqueio otimista (`updatedAt` / versão).

### 8.2 Melhorias futuras

Perfis (solicitante/atendente/admin), auditoria de status, soft delete, anexos, notificações, prioridade/SLA, busca mais rica, sistema de cadastro de usuário.

### 8.3 Requisitos que o enunciado poderia ter fechado

Quem altera status; se a listagem é global ou por solicitante; se solicitação concluída pode reabrir; limites exatos de tamanho de texto.

### 8.4 O que eu faria diferente em produção

HTTPS obrigatório e cookie `secure`; segredos em gerenciador; logs estruturados; rate limit distribuído; ambientes staging/prod; backup e política de migração; autenticação corporativa (SSO) se o portal for interno de verdade.

---

## 9. Conclusão

No **Dia 1** fechei fundação e autenticação do backend: monorepo, Prisma 7.10, Compose (`db` + `api`), seed idempotente, Express com erros centralizados, módulo `auth` (login/logout/me, JWT em cookie, rate limit) e bateria de testes de integração. O próximo passo é o backend de categorias, solicitações e dashboard (Dia 2), depois o frontend.

---

## 10. Registro de decisões (cronológico)

### 30/09–01/10/2026 — Fundação do repositório e desenho

- Li o edital e montei o plano de desenvolvimento em etapas diárias (prazo oficial 05/10; meta pessoal 04/10).
- Criei o memorial como documento vivo e o board Excalidraw com três blocos apenas: modelagem, casos de uso e endpoints (evitei diagramar stack/containers no mesmo quadro para não misturar níveis).
- Adotei monorepo com `backend/`, `frontend/`, `database/`, `docs/` e `.github/workflows/`.
- Populei o `.gitignore` para excluir dependências, builds, cobertura, logs e `.env` reais, preservando examples; incluí pastas de agents (`.agents`, `.claude`, `.cursor`, `.devin`).
- Reservei GitHub Actions como diferencial opcional; não depende disso a entrega mínima.
- Fechei a stack (TypeScript, Express, React/Vite, PostgreSQL, Prisma, Zod, JWT httpOnly, Docker Compose) e as regras de negócio da seção 5 deste memorial.
- Compose inicial só com `db` (PostgreSQL 16) e `.env.example` na raiz; scaffold do backend com `tsconfig`, `src/config/env.ts` (Zod) e `.env` local.

### 01/10/2026 — Prisma 7.10 e requisito de Node

- O `prisma init` na linha **8 RC** gerou config de skills para agents em vez do fluxo clássico de schema; descartei RC e pastas geradas.
- Passei por Prisma **6.19** (URL no schema), mas o modelo atual da ferramenta/editor rejeita `url` no `schema.prisma`.
- Adotei **Prisma 7.10.0** estável: URL em `prisma.config.ts`, client com `@prisma/adapter-pg` + `pg` em `src/database/prisma.ts`; `schema.prisma` só com provider e models.
- Exigi Node na faixa do Prisma 7 (20.19+ / 22.12+ / 24+) porque o install falhava em 20.18.2; documentei isso em `engines` no `package.json` do backend.
- Motivo resumido: alinhar à API oficial da v7, evitar RC instável e ter ambiente reproduzível para quem clonar o repo.

### 01/10/2026 — Fim do dia (API, Docker, auth, testes)

- Migration inicial + seed idempotente (categorias, `ana.silva` / `carlos.souza`, solicitações de exemplo).
- Express base: `app.ts` / `server.ts` separados, `helmet`, CORS, cookie parser, `/api/health`, `notFound` + `errorHandler`.
- Porta do Postgres no host: **5433** (5432 já ocupada no ambiente); na rede Compose a API usa `@db:5432`.
- Dockerfile multi-stage da API; Compose com serviço `api` (`depends_on` + `service_healthy`). Placeholder de `DATABASE_URL` no build por causa do Prisma 7.
- Módulo auth: schemas Zod, service (mensagem genérica de credencial), cookie JWT, `authenticate`, rate limit no login, rotas `/api/auth/*`.
- Vitest configurado (`fileParallelism: false`); `.env.test` com schema `test`; 9 testes de auth verdes (login, me, logout, cookie inválido/expirado).
- Fluxo de trabalho: desenvolver com `db` + `npm run dev`; validar entrega com `docker compose up --build`.

