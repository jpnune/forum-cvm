// Cria os 256 apartamentos: blocos A e B, 16 andares, 8 por andar (101–108 … 1601–1608).
// Idempotente: pode rodar de novo sem duplicar. Uso: npm run db:seed
import { count } from "drizzle-orm";
import { db } from "@/lib/db";
import { units } from "@/db/schema";

const BLOCKS = ["A", "B"];
const FLOORS = 16;
const UNITS_PER_FLOOR = 8;

const rows = BLOCKS.flatMap((block) =>
  Array.from({ length: FLOORS * UNITS_PER_FLOOR }, (_, i) => ({
    block,
    number: (Math.floor(i / UNITS_PER_FLOOR) + 1) * 100 + (i % UNITS_PER_FLOOR) + 1,
  })),
);

await db.insert(units).values(rows).onConflictDoNothing();
const [{ total }] = await db.select({ total: count() }).from(units);
console.log(`Apartamentos no banco: ${total}`);
