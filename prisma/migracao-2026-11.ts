/**
 * Migração única (novembro 2026): passa para a base de dados o que estava escrito no código.
 * Pode correr-se mais do que uma vez: só preenche o que ainda está vazio.
 *
 *   npx tsx prisma/migracao-2026-11.ts            (mostra o que faria)
 *   npx tsx prisma/migracao-2026-11.ts --aplicar  (grava)
 */
import "dotenv/config";
import { PrismaClient, type Prisma } from "@prisma/client";
import { ANOS_PARTICIPACAO, MARCHAS_INFO } from "./dados/marchas";
import { EVENTOS, ORGAOS } from "./dados/conteudos";
import { CONTACTOS_PADRAO } from "../src/lib/contactos";

const prisma = new PrismaClient();
const APLICAR = process.argv.includes("--aplicar");

// Regras antigas (src/lib/aluguerRoupasPublic.ts antes desta migração)
const PRECO_CALCADO_POR_ANO: Record<number, number> = { 2017: 100, 2018: 100, 2019: 150, 2024: 150, 2025: 150 };
const ANOS_COM_ARCOS = [2024, 2025, 2026];
const CORTE_2026 = "2027-01-01";

async function precos() {
  const roupas = await prisma.roupa.findMany();
  const porId = new Map(roupas.map((r) => [r.id, r]));

  // 1) Guardar o preço base nas reservas antigas, com as regras antigas (antes de mudar as roupas).
  const reservas = await prisma.reserva.findMany({ where: { OR: [{ precoBase: null }, { precoBase: { isSet: false } }] } });
  let nReservas = 0;
  for (const res of reservas) {
    const roupa = porId.get(res.roupaId);
    if (!roupa || roupa.precoTudoIncluido != null) continue; // roupa já migrada: a app calcula
    const dia = res.dataInicio.toISOString().slice(0, 10);
    const precoBase = roupa.ano === 2026 && dia >= CORTE_2026 ? 1600 : roupa.precoAluguer;
    nReservas++;
    if (APLICAR) await prisma.reserva.update({ where: { id: res.id }, data: { precoBase } });
  }
  console.log(`Reservas com preço base preenchido: ${nReservas}`);

  // 2) Preços extra em cada roupa.
  for (const r of roupas) {
    const data: Record<string, unknown> = {};
    if (r.precoCalcado == null && PRECO_CALCADO_POR_ANO[r.ano] != null) data.precoCalcado = PRECO_CALCADO_POR_ANO[r.ano];
    if (r.arcosDisponiveis == null && ANOS_COM_ARCOS.includes(r.ano)) data.arcosDisponiveis = 10;
    if (r.ano === 2026 && r.precoTudoIncluido == null) {
      Object.assign(data, {
        precoTudoIncluido: r.precoAluguer, // 2000 € tudo incluído até ao fim de 2026
        tudoIncluidoAte: new Date(`${CORTE_2026}T00:00:00Z`),
        precoAluguer: 1600,
        precoCalcado: 200,
        precoArcos: 200,
      });
    }
    if (Object.keys(data).length === 0) continue;
    console.log(`Roupa ${r.ano} (${r.tema.slice(0, 40)}):`, data);
    if (APLICAR) await prisma.roupa.update({ where: { id: r.id }, data });
  }
}

/** Conteúdos que estavam no código: só importa se ainda não existirem na BD. */
async function conteudos() {
  if ((await prisma.evento.count()) === 0) {
    console.log(`Eventos a importar: ${EVENTOS.length}`);
    if (APLICAR)
      await prisma.evento.createMany({
        data: EVENTOS.map((e) => ({ ...e, data: new Date(`${e.data}T00:00:00Z`) })),
      });
  } else console.log("Eventos: já existem, nada a fazer.");

  if ((await prisma.orgaoSocialMembro.count()) === 0) {
    console.log(`Membros dos órgãos sociais a importar: ${ORGAOS.length}`);
    if (APLICAR) await prisma.orgaoSocialMembro.createMany({ data: ORGAOS.map((m, ordem) => ({ ...m, ordem })) });
  } else console.log("Órgãos sociais: já existem, nada a fazer.");

  const existentes = new Set((await prisma.marchaAno.findMany({ select: { ano: true } })).map((m) => m.ano));
  const anos = [...new Set([...ANOS_PARTICIPACAO, ...Object.keys(MARCHAS_INFO).map(Number)])].filter(
    (a) => !existentes.has(a)
  );
  console.log(`Anos das Marchas a importar: ${anos.length}`);
  for (const ano of anos) {
    const i = MARCHAS_INFO[ano] ?? {};
    if (APLICAR)
      await prisma.marchaAno.create({
        data: {
          ano,
          tema: i.tema ?? null,
          descricaoCard: i.descricaoCard ?? null,
          subtitulo: i.subtitulo ?? null,
          classificacao: (i.classificacao ?? []) as Prisma.InputJsonValue,
          mensagem: i.mensagem ?? null,
          outros: (i.outros ?? []) as Prisma.InputJsonValue,
          youtubeUrl: i.youtubeUrl ?? null,
        },
      });
  }

  if (!(await prisma.siteConfig.findUnique({ where: { chave: "contactos" } }))) {
    console.log("Contactos a importar:", CONTACTOS_PADRAO);
    if (APLICAR)
      await prisma.siteConfig.create({
        data: { chave: "contactos", valor: CONTACTOS_PADRAO as unknown as Prisma.InputJsonValue },
      });
  } else console.log("Contactos: já existem, nada a fazer.");
}

async function main() {
  console.log(APLICAR ? "== A APLICAR ==" : "== Simulação (use --aplicar para gravar) ==");
  await precos();
  await conteudos();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
