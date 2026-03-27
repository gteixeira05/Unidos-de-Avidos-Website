import { PrismaClient } from "@prisma/client";
import { MARCHAS_INFO } from "../src/lib/marchasAntoninas";

const prisma = new PrismaClient();

async function main() {
  const roupas = await prisma.roupa.findMany({
    select: { id: true, ano: true, tema: true },
    orderBy: { ano: "asc" },
  });

  let changed = 0;
  let skipped = 0;

  for (const r of roupas) {
    const oficial = MARCHAS_INFO[r.ano]?.tema?.trim();
    if (!oficial) {
      skipped++;
      continue;
    }
    if (r.tema.trim() === oficial) {
      skipped++;
      continue;
    }

    await prisma.roupa.update({
      where: { id: r.id },
      data: { tema: oficial },
    });
    changed++;
  }

  console.log(
    `✅ Temas corrigidos: ${changed}. Sem alteração (sem tema oficial/igual): ${skipped}. Total: ${roupas.length}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

