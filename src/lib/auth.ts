import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";

// Só configuração do servidor; rota e telas de login ficam na Fase 2.
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  // nextCookies precisa ser o último plugin (grava cookies em Server Actions).
  plugins: [nextCookies()],
});
