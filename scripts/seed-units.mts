// Cria os 256 apartamentos: blocos A e B, 16 andares, 8 por andar.
// Número = andar + apto de 1 dígito: 11–18 (1º andar) … 161–168 (16º). Ex.: 67 = 6º andar, apto 7.
// Idempotente: pode rodar de novo sem duplicar. Uso: npm run db:seed
import { count, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { units } from "@/db/schema";

const BLOCKS = ["A", "B"];
const FLOORS = 16;
const UNITS_PER_FLOOR = 8;

// Formato antigo (101–1608, maior número possível no novo é 168): converte no lugar,
// mantendo os ids. Em dois passos para não bater no unique (ex.: 1001 → 101 já existente).
const [{ old }] = await db.select({ old: count() }).from(units).where(gt(units.number, 168));
if (old > 0) {
  await db.update(units).set({ number: sql`-${units.number}` });
  await db.update(units).set({
    number: sql`(-${units.number} / 100) * 10 + (-${units.number} % 100)`,
  });
  console.log("Apartamentos convertidos para o formato andar + apto (ex.: 67).");
}

const rows = BLOCKS.flatMap((block) =>
  Array.from({ length: FLOORS * UNITS_PER_FLOOR }, (_, i) => ({
    block,
    number: (Math.floor(i / UNITS_PER_FLOOR) + 1) * 10 + (i % UNITS_PER_FLOOR) + 1,
  })),
);

await db.insert(units).values(rows).onConflictDoNothing();
const [{ total }] = await db.select({ total: count() }).from(units);
console.log(`Apartamentos no banco: ${total}`);
