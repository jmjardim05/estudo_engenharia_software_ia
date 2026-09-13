# Demo Better Auth + GitHub + SQLite

Demo simples em Next.js App Router com Better Auth, GitHub OAuth e SQLite local.

## Requisitos

- Node.js 20+
- npm
- GitHub OAuth App válido

## Variáveis de ambiente

Configure o arquivo `.env.local`:

```bash
GITHUB_CLIENT_ID=seu_client_id
GITHUB_CLIENT_SECRET=seu_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

A URL de callback do GitHub deve ser:

```bash
http://localhost:3000/api/auth/callback/github
```

## Rodar localmente

```bash
npm install
npx @better-auth/cli migrate
npm run dev
```

Acesse: http://localhost:3000

## O que o demo faz

- Login com GitHub
- Sessão armazenada em SQLite
- Página home mostrando o estado da sessão
- Botão de logout
