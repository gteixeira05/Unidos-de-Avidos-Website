import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MARCHAS_INFO } from "@/lib/marchasAntoninas";

const ANOS_PARTICIPACAO = [
  2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2017, 2018,
  2019, 2024, 2025,
];

const SEM_TEMA_TITULO = "Ainda não há informação";
const SEM_TEMA_DESCRICAO =
  "Informação sobre a participação neste ano ainda não disponível.";

function descricaoParaAno(
  descricaoRoupa: string | null | undefined,
  descricaoCard: string | undefined
): string {
  if (descricaoCard) return descricaoCard;
  if (descricaoRoupa?.trim()) return descricaoRoupa;
  return "Consulte a página do ano para tema, classificação e galeria quando disponíveis.";
}

export default async function MarchasAntoninasPage() {
  const roupas = await prisma.roupa.findMany({
    where: { ano: { in: ANOS_PARTICIPACAO } },
    orderBy: { ano: "desc" },
    select: {
      id: true,
      ano: true,
      tema: true,
      descricao: true,
    },
  });

  // Garantir ordem e presença de todos os anos (mesmo que falte algum registo)
  const byAno = new Map(roupas.map((r) => [r.ano, r]));
  const cards = [...ANOS_PARTICIPACAO].sort((a, b) => b - a).map((ano) => {
    const r = byAno.get(ano);
    const info = MARCHAS_INFO[ano];
    // Só usar tema que esteja em MARCHAS_INFO (fonte oficial); ignorar tema da BD para não mostrar temas aleatórios
    const temaOficial = info?.tema?.trim();
    const temTema = !!temaOficial;
    const tema = temTema ? temaOficial : SEM_TEMA_TITULO;
    const descricao = temTema
      ? descricaoParaAno(r?.descricao, info?.descricaoCard)
      : SEM_TEMA_DESCRICAO;
    return { ano, tema, descricao };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Marchas Antoninas</h1>
      <p className="mt-4 text-lg text-gray-600">
        Participações da Associação Unidos de Avidos nas Marchas Antoninas (desde
        2005).
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.ano}
            href={`/sobre/marchas/${c.ano}`}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-[#00923f] hover:shadow-md"
          >
            <p className="text-sm font-semibold text-[#00923f]">Ano {c.ano}</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">
              {c.tema}
            </h3>
            <p className="mt-2 line-clamp-3 text-sm text-gray-600">
              {c.descricao}
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-[#00923f]">
              Ver detalhes →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

