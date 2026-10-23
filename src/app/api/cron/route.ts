import { notifyClosedDebates } from "@/lib/notifications";

// Chamado pela Vercel (vercel.json > crons), que manda "Authorization: Bearer $CRON_SECRET".
// Envia o aviso dos debates cujo prazo venceu.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Não autorizado", { status: 401 });
  }
  await notifyClosedDebates();
  return Response.json({ ok: true });
}
