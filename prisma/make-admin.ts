import { prisma } from "@/lib/prisma";

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Uso: npx tsx prisma/make-admin.ts email@exemplo.com");
    process.exit(1);
  }

  const user = await prisma.user.updateMany({
    where: { email },
    data: { role: "ADMIN" },
  });

  if (user.count === 0) {
    console.error("Nenhum utilizador encontrado com esse email.");
  } else {
    console.log(`Utilizador ${email} promovido a ADMIN.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

