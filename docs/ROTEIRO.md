# Roteiro

Uma fase por sessão. Prompt para iniciar: **"Leia CLAUDE.md e execute a Fase N do docs/ROTEIRO.md"**.
Ao terminar: `npm run build` ok, marcar `[x]` aqui e fazer commit.

| Fase | Modelo | Pensamento | Permissões |
|---|---|---|---|
| 0, 2, 3, 5, 6 | Sonnet | desligado/baixo | automático |
| 1, 4, 7 | Opus | ligado | manual (revisar) |

## [x] Fase 0: Setup
- [x] Next.js + TS + Tailwind, Neon + Drizzle + Better Auth instalados, `.env.example`, docs, git
- [ ] (você) Criar projeto grátis em neon.tech e preencher `.env.local` (DATABASE_URL + BETTER_AUTH_SECRET)
- [ ] (você) Repositório no GitHub + projeto na Vercel com as 3 variáveis (BETTER_AUTH_URL = URL da Vercel)
**Pronto quando:** a URL da Vercel abre a página inicial.

## [x] Fase 1: Banco e segurança
Feito: 9 tabelas no Neon, 256 apartamentos (blocos A e B, 16 andares × 8; número = andar + apto: 11–18 … 161–168, ex.: 67 = 6º andar apto 7) via `npm run db:seed`, regras de voto testadas com `npm run db:test-votes`. Para regenerar as tabelas do Better Auth, o CLI exige um config sem `server-only`.
- `src/db/schema.ts`: tabelas do Better Auth (gerar com `npx @better-auth/cli generate`) + `units` (block, number), `profiles` (user_id, unit_id, name, role `resident|admin`, status `pending|approved|rejected|blocked`), `debates` (title, body, author_id, deadline nullable, closed_at), `votes` (debate_id, unit_id, user_id, choice `for|against|abstain`, updated_at; unique debate+unit), `comments`
- `src/lib/auth.ts`: Better Auth com adapter Drizzle (só configuração, telas na Fase 2)
- `src/lib/votes.ts`: único lugar que toca `votes`: `castVote` (upsert pelo apartamento, valida debate aberto), `getResults` (totais) e `getMyUnitVote`
- `db:generate` + `db:migrate`; script de seed dos 256 apartamentos (confirmar blocos/números com o usuário)
**Pronto quando:** as tabelas existem no Neon, o seed rodou e um script de teste mostra o voto sendo sobrescrito por apartamento.

## [x] Fase 2: Cadastro, login e aprovação
Feito: sessão e permissões em `src/lib/session.ts` (`requireUser`/`requireApproved`/`requireAdmin`, sem cache: aprovar/bloquear vale na hora); `src/proxy.ts` só checa o cookie. Primeiro admin: cadastrar pelo site e rodar `npm run db:make-admin -- email`. Testado no navegador: pendente não acessa `/` nem `/admin`, admin aprova e o morador entra.
- Rota do Better Auth (`src/app/api/auth/[...all]/route.ts`), telas de cadastro (bloco/apto), login e logout; `proxy` protegendo as páginas
- Tela "aguardando aprovação"; painel admin para aprovar/rejeitar/bloquear
**Pronto quando:** um usuário novo só acessa o fórum depois de aprovado.

## [x] Fase 3: Debates
Feito: leitura em `src/lib/debates.ts` (lista com abertos primeiro, detalhe, datas no horário de Brasília); actions em `src/app/debates/actions.ts`. Debate nasce sem prazo; prazo é digitado em horário de Brasília e precisa ser no futuro. Encerrar grava `closed_at` com o `now()` do banco; não há "reabrir". Testado no navegador (inclusive em 375px): criar, definir/remover prazo, encerrar, remover; morador comum não vê os controles.
- Lista (abertos primeiro), criação, página de detalhe
- Admin: definir/remover prazo, encerrar, remover debate
**Pronto quando:** um morador cria debate e o admin consegue encerrá-lo.

## [x] Fase 4: Votação
Feito: action `vote` em `src/app/debates/actions.ts` (chama `castVote`; o apartamento vem do perfil). Botões em `vote-form.tsx` com destaque otimista; resultado (barras, %, "X de N apartamentos votaram", N contado da tabela `units`) renderizado no servidor; `auto-refresh.tsx` faz `router.refresh()` a cada 10s só com o debate aberto e a aba visível. Encerrado: mostra "Resultado final" e o voto do apartamento, sem botões. Testado no navegador (inclusive 375px) com dois moradores do B-168: só o último voto contou; voto após encerrar foi recusado.
- Botões A favor / Contra / Abstenção, voto atual do apartamento destacado, troca de voto
- Resultado com barras, %, e "X de 256 apartamentos votaram"; atualização imediata após votar + refresh a cada ~10s na página do debate
**Pronto quando:** dois moradores do mesmo apartamento votam e só o último conta.

## [x] Fase 5: Comentários e moderação
Feito: `src/lib/comments.ts` (listar, `addComment` só insere se o debate estiver aberto, na mesma consulta; `removeComment`: admin sempre, autor só com o debate aberto); actions `comment`/`deleteComment` em `src/app/debates/actions.ts`; lista e formulário na página do debate. Regras testadas com `npm run db:test-comments`. Testado no navegador (inclusive 375px) com morador e admin: morador só vê "Remover" no próprio comentário, admin remove de qualquer um, encerrado esconde o formulário.
- Comentar, listar e remover (autor ou admin); bloqueado em debate encerrado
**Pronto quando:** o admin remove um comentário e ele some para todos.

## [x] Fase 6: E-mails (Brevo)
Feito: `src/lib/email.ts` (POST na API do Brevo, um destinatário por versão, sem chave = pula) e `src/lib/notifications.ts`. Debate novo: avisa todos os aprovados menos o autor, via `after()` em `createDebate`. Encerramento (com resultado em totais): `notifyClosedDebates` reserva cada debate num único UPDATE (`debates.close_notified_at`), então nunca avisa duas vezes; libera de novo se o Brevo falhar; ignora encerramentos com mais de 3 dias. Roda ao encerrar, no cron diário (`/api/cron`, `vercel.json`, 8h de Brasília, exige `CRON_SECRET`) e ao abrir a lista/um debate (prazo vencido avisa na próxima visita). Regras testadas com `npm run db:test-emails` (sem enviar nada). Atenção: o plano grátis do Brevo manda 300 e-mails/dia; cada aviso gasta 1 por morador aprovado.
- [x] Envio ao abrir debate e ao encerrar (incluindo prazo vencido, via cron da Vercel)
- [ ] (você) Conta no Brevo: verificar o remetente e criar a chave de API; preencher `BREVO_API_KEY`, `EMAIL_FROM` (e `EMAIL_FROM_NAME`) no `.env.local` e na Vercel, mais `CRON_SECRET` na Vercel
- [ ] (você) `npm run email:test -- seu@email` e depois `npm run email:test -- --aprovados`
**Pronto quando:** e-mail de teste chega para os moradores aprovados.

## [ ] Fase 7: Revisão e lançamento
- Revisão de segurança (nenhuma rota expõe votos individuais; toda action checa sessão/aprovação), teste no celular, textos, página 404, favicon
- Criar a conta admin do síndico; divulgar o link
**Pronto quando:** o síndico usa em produção.
