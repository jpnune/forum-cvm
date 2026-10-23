// Torna um usuário já cadastrado admin (e aprovado). Uso: npm run db:make-admin -- email@exemplo.com
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, user } from "@/db/schema";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) throw new Error("Informe o e-mail: npm run db:make-admin -- email@exemplo.com");

const [found] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
if (!found) throw new Error(`Nenhum usuário com o e-mail ${email}. Cadastre-se pelo site antes.`);

const updated = await db
  .update(profiles)
  .set({ role: "admin", status: "approved" })
  .where(eq(profiles.userId, found.id))
  .returning({ name: profiles.name });
if (updated.length === 0) throw new Error("Usuário sem perfil de morador.");

console.log(`${updated[0].name} (${email}) agora é admin.`);
