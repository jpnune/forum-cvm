@AGENTS.md

# Fórum do Condomínio

Fórum para os 256 apartamentos: moradores abrem debates, votam (A favor / Contra / Abstenção) e comentam.
Detalhes: `docs/PRD.md`. Fases e progresso: `docs/ROTEIRO.md`.

## Stack
- Next.js 16 (App Router, `src/`) + TypeScript + Tailwind 4
- Supabase: Auth + Postgres + RLS (clientes em `src/lib/supabase/{client,server}.ts`)
- E-mail: Brevo. Deploy: Vercel. Tudo no plano grátis.

## Comandos
- `npm run dev`: servidor local (http://localhost:3000)
- `npm run build`: build de produção (rodar antes de encerrar uma fase)
- `npm run lint`: ESLint

## Convenções
- Código, nomes de tabelas e variáveis em inglês; textos da interface em pt-BR.
- Migrations SQL em `supabase/migrations/`, numeradas (`0001_*.sql`).
- Preferir Server Components e Server Actions; Client Components só quando houver interatividade.
- Mobile-first: toda tela precisa funcionar em 375px de largura.
- Segredos só em `.env.local` (nunca commitar). Novas variáveis vão também no `.env.example`.

## Regras de negócio críticas (nunca violar)
- **Voto secreto:** nenhuma consulta do cliente pode ler votos individuais. Os totais saem só de uma função SQL agregada. A RLS da tabela de votos bloqueia SELECT.
- **1 voto por apartamento:** unique (debate_id, unit_id). Qualquer morador aprovado do apartamento pode votar; o último voto sobrescreve o anterior.
- Votar/mudar voto só com o debate aberto (sem prazo ou antes do prazo, e não encerrado pelo admin).
- Usuário só age depois de aprovado pelo admin (status `approved`).

## Fluxo de trabalho (economia de tokens)
- Uma fase do ROTEIRO por sessão. Ao terminar: build ok, marcar a fase como `[x]` em `docs/ROTEIRO.md` e fazer commit.
- Não ler `node_modules` além do necessário; não reescrever arquivos inteiros quando um Edit resolve.
