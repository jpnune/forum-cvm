# Roteiro

Uma fase por sessão. Prompt para iniciar: **"Leia CLAUDE.md e execute a Fase N do docs/ROTEIRO.md"**.
Ao terminar: `npm run build` ok, marcar `[x]` aqui e fazer commit.

| Fase | Modelo | Pensamento | Permissões |
|---|---|---|---|
| 0, 2, 3, 5, 6 | Sonnet | desligado/baixo | automático |
| 1, 4, 7 | Opus | ligado | manual (revisar) |

## [x] Fase 0: Setup
- [x] Next.js + TS + Tailwind, clientes Supabase, `.env.example`, docs, git
- [ ] (você) Criar projeto no Supabase e preencher `.env.local`
- [ ] (você) Repositório no GitHub + projeto na Vercel com as 2 variáveis
**Pronto quando:** a URL da Vercel abre a página inicial.

## [ ] Fase 1: Banco e segurança
- Migration `0001_init.sql`: `units` (block, number), `profiles` (user_id, unit_id, name, role `resident|admin`, status `pending|approved|rejected|blocked`), `debates` (title, body, author_id, deadline nullable, closed_at), `votes` (debate_id, unit_id, choice `for|against|abstain`, updated_at; unique debate+unit), `comments`
- RLS em todas as tabelas; `votes` sem SELECT para clientes
- Funções: `cast_vote(debate_id, choice)` (upsert pelo apartamento do usuário, valida debate aberto) e `debate_results(debate_id)` (totais), mais uma forma de o morador ver o voto atual do seu apartamento
- Seed dos 256 apartamentos (confirmar blocos/números com o usuário)
**Pronto quando:** testes SQL mostram que um morador não lê votos alheios e o voto é sobrescrito.

## [ ] Fase 2: Cadastro, login e aprovação
- Telas de cadastro (bloco/apto), login e logout; `proxy`/middleware renovando a sessão
- Tela "aguardando aprovação"; painel admin para aprovar/rejeitar/bloquear
**Pronto quando:** um usuário novo só acessa o fórum depois de aprovado.

## [ ] Fase 3: Debates
- Lista (abertos primeiro), criação, página de detalhe
- Admin: definir/remover prazo, encerrar, remover debate
**Pronto quando:** um morador cria debate e o admin consegue encerrá-lo.

## [ ] Fase 4: Votação
- Botões A favor / Contra / Abstenção, voto atual do apartamento destacado, troca de voto
- Resultado com barras, %, e "X de 256 apartamentos votaram"; atualização em tempo real (Supabase Realtime ou revalidação)
**Pronto quando:** dois moradores do mesmo apartamento votam e só o último conta.

## [ ] Fase 5: Comentários e moderação
- Comentar, listar e remover (autor ou admin); bloqueado em debate encerrado
**Pronto quando:** o admin remove um comentário e ele some para todos.

## [ ] Fase 6: E-mails (Brevo)
- Chave em `.env.local`/Vercel; envio ao abrir debate e ao encerrar (incluindo prazo vencido, via cron da Vercel ou do Supabase)
**Pronto quando:** e-mail de teste chega para os moradores aprovados.

## [ ] Fase 7: Revisão e lançamento
- Revisão de segurança (RLS), teste no celular, textos, página 404, favicon
- Criar a conta admin do síndico; divulgar o link
**Pronto quando:** o síndico usa em produção.
