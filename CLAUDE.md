@AGENTS.md

# Fórum do Condomínio

Fórum para os 256 apartamentos: moradores abrem debates, votam (A favor / Contra / Abstenção) e comentam.
Detalhes: `docs/PRD.md`. Fases e progresso: `docs/ROTEIRO.md`.

## Stack
- Next.js 16 (App Router, `src/`) + TypeScript + Tailwind 4
- Banco: Postgres no **Neon**, acessado via **Drizzle ORM** (`src/lib/db.ts`, schema em `src/db/schema.ts`)
- Login: **Better Auth** (e-mail + senha), tabelas no mesmo banco
- E-mail: Brevo. Deploy: Vercel. Tudo no plano grátis.
- `.npmrc` usa `legacy-peer-deps=true` (contorna bug do npm 11.4 com peers do better-auth). Não remover.

## Comandos
- `npm run dev`: servidor local (http://localhost:3000)
- `npm run build`: build de produção (rodar antes de encerrar uma fase)
- `npm run lint`: ESLint
- `npm run db:generate` / `db:migrate`: gerar e aplicar migrations (pasta `drizzle/`)
- `npm run db:studio`: ver o banco no navegador

## Convenções
- Código, nomes de tabelas e variáveis em inglês; textos da interface em pt-BR.
- Migrations: editar `src/db/schema.ts` e rodar `db:generate`; nunca editar SQL gerado à mão.
- O banco só é acessado no servidor (Server Components, Server Actions, Route Handlers). `src/lib/db.ts` usa `server-only`.
- Toda Server Action valida a sessão (Better Auth) e o status `approved` antes de agir.
- Preferir Server Components e Server Actions; Client Components só quando houver interatividade.
- Mobile-first: toda tela precisa funcionar em 375px de largura.
- Segredos só em `.env.local` (nunca commitar). Novas variáveis vão também no `.env.example`.

## Regras de negócio críticas (nunca violar)
- **Voto secreto:** nenhuma página, action ou rota devolve votos individuais (quem votou o quê). Só `src/lib/votes.ts` lê a tabela `votes`, e expõe apenas totais e o voto do próprio apartamento.
- **1 voto por apartamento:** unique (debate_id, unit_id). Qualquer morador aprovado do apartamento pode votar; o último voto sobrescreve o anterior.
- Votar/mudar voto só com o debate aberto (sem prazo ou antes do prazo, e não encerrado pelo admin).
- Usuário só age depois de aprovado pelo admin (status `approved`).

## Fluxo de trabalho (economia de tokens)
- Uma fase do ROTEIRO por sessão. Ao terminar: build ok, marcar a fase como `[x]` em `docs/ROTEIRO.md` e fazer commit.
- Não ler `node_modules` além do necessário; não reescrever arquivos inteiros quando um Edit resolve.
