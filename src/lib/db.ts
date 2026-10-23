import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Só o servidor acessa o banco: o navegador nunca recebe a DATABASE_URL.
export const db = drizzle({ client: neon(process.env.DATABASE_URL!) });
