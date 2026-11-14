import Link from "next/link";
import { getMarchas } from "@/lib/conteudos";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Marchas Antoninas",
  description:
    "Todas as participações dos Unidos de Avidos nas Marchas Antoninas de Vila Nova de Famalicão, ano a ano, desde 2005.",
  path: "/sobre/marchas",
});

export const revalidate = 3600;

const SEM_TEMA_TITULO = "Ainda não há informação";
const SEM_TEMA_DESCRICAO =
  "Informação sobre a participação neste ano ainda não disponível.";

function descricaoParaAno(descricaoCard: string | null): string {
  if (descricaoCard) return descricaoCard;
  return "Consulte a página do ano para tema, classificação e galeria quando disponíveis.";
}

export default async function MarchasAntoninasPage() {
  const marchas = await getMarchas();
  const cards = marchas.map((info) => {
    const temaOficial = info.tema?.trim();
    const tema = temaOficial || SEM_TEMA_TITULO;
    const descricao = temaOficial ? descricaoParaAno(info.descricaoCard) : SEM_TEMA_DESCRICAO;
    return { ano: info.ano, tema, descricao };
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

