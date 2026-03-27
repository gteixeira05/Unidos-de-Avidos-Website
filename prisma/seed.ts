import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Limpar dados de exemplo anteriores (mantém utilizadores)
  await prisma.reserva.deleteMany();
  await prisma.disponibilidade.deleteMany();
  await prisma.roupa.deleteMany();

  const anos = [
    2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2017,
    2018, 2019, 2024, 2025,
  ];

  const temasPorAno: Record<number, string> = {
    2005: "As Vindimas",
    2006: "Avidos Florido",
    2007: "As Pescas",
    2008: "Santos Populares",
    2009: "Namoricos de Santo António",
    2010: "As Tradições",
    2011: "A Primavera",
    2012: "Nossos corações em festa",
    2013: "O Sol",
    2014: "As Maravilhas de Avidos",
    2015: "As festas de Santo António",
    2017: "Noites de Santo António",
    2018: "O Pão de Santo António",
    2019: "Júlio Brandão",
    2024: "Centenário da Capela de Santo António",
    2025: "Camilo Castelo Branco em Vila Nova de Famalicão",
  };

  const roupas = anos.map((ano) => ({
    ano,
    tema: temasPorAno[ano] || `Marchas ${ano}`,
    descricao:
      "Conjunto completo associado à participação nas Marchas Antoninas. Informação detalhada e fotos serão adicionadas mais tarde.",
    quantidadeHomem: ano < 2015 ? 10 : 16,
    quantidadeMulher: ano < 2015 ? 12 : 18,
    conjuntoInclui:
      "Camisa/blusa, calças/saia, faixa/cinto, e acessórios (conforme o tema do ano).",
    regrasLavagem:
      "Devolver limpo e em bom estado. Não usar lixívia. Em caso de dúvida, contactar a associação.",
    precoAluguer: ano < 2010 ? 20 : ano < 2020 ? 25 : 30,
    imagemUrl: null as string | null,
  }));

  await prisma.roupa.createMany({ data: roupas });

  // Criar disponibilidades de exemplo para o ano mais recente (2025)
  const roupa2025 = await prisma.roupa.findFirst({ where: { ano: 2025 } });
  if (roupa2025) {
    const hoje = new Date();
    for (let i = 0; i < 120; i++) {
      const data = new Date(hoje);
      data.setDate(data.getDate() + i);
      data.setHours(0, 0, 0, 0);
      const rand = Math.random();
      const estado: "LIVRE" | "ALUGADA" | "MANUTENCAO" =
        rand < 0.75 ? "LIVRE" : rand < 0.92 ? "ALUGADA" : "MANUTENCAO";
      await prisma.disponibilidade.create({
        data: {
          roupaId: roupa2025.id,
          data,
          estado,
        },
      });
    }
  }

  console.log(
    `✅ Seed concluído - ${roupas.length} roupas e disponibilidades criadas!`
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
