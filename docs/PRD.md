# PRD: Fórum do Condomínio

## Objetivo
Dar aos moradores (256 apartamentos) um lugar oficial para propor assuntos, discutir e medir a opinião do condomínio com votos confiáveis: 1 por apartamento e secretos.

## Perfis
- **Morador:** se cadastra, aguarda aprovação, cria debates, vota e comenta.
- **Admin (síndico/conselho):** aprova cadastros, define prazos, encerra/remove debates e modera comentários. Também é morador.

## Funcionalidades (MVP)
1. **Cadastro e login:** e-mail + senha, informando bloco e apartamento. A conta fica `pending` até o admin aprovar (ou rejeitar).
2. **Painel do admin:** lista de cadastros pendentes (aprovar/rejeitar) e moradores ativos (bloquear).
3. **Debates:** título, descrição, autor, data. Qualquer morador aprovado cria. Status: aberto ou encerrado.
4. **Prazo:** o admin define, em cada debate, se é sem prazo ou com data/hora de encerramento. O admin pode encerrar manualmente.
5. **Votação:** A favor / Contra / Abstenção. Vale 1 voto por apartamento; qualquer morador do apartamento vota e o último voto vale. Pode mudar enquanto o debate estiver aberto. O morador vê o voto atual do seu apartamento.
6. **Resultado:** totais (e %) visíveis para todos e atualizados em poucos segundos, sem revelar quem votou o quê. Mostra também quantos apartamentos votaram, dos 256.
7. **Comentários:** moradores comentam nos debates. O admin pode remover comentários e debates.
8. **E-mails (Brevo):** aviso a todos os aprovados quando abre um debate novo e quando um debate encerra (com o resultado).

## Regras
- Ninguém, nem o admin pela interface, vê votos individuais.
- Debate encerrado: votos e comentários congelados.
- Interface em português, responsiva (celular e PC).

## Fora do escopo do MVP
WhatsApp, quórum mínimo, anexos/imagens, vários condomínios, app nativo, edição de debate após receber votos.

## Métricas de sucesso
- Mais de 50% dos apartamentos cadastrados no primeiro mês.
- Debates com participação acima de 30% dos apartamentos.
