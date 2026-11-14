import { pageMetadata } from "@/lib/seo";
import { getOrgaosSociais, ORGAOS_SOCIAIS } from "@/lib/conteudos";

export const metadata = pageMetadata({
  title: "Órgãos Sociais",
  description:
    "Direção, Assembleia Geral e Conselho Fiscal da Associação Unidos de Avidos.",
  path: "/sobre/orgaos-sociais",
});

// Recalcula de hora a hora; o admin também invalida a cache ao guardar.
export const revalidate = 3600;

export default async function OrgaosSociaisPage() {
  const membros = await getOrgaosSociais();
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Órgãos Sociais</h1>
      <p className="mt-4 text-lg text-gray-600">
        Composição atual dos órgãos sociais da Associação Unidos de Avidos.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {ORGAOS_SOCIAIS.map((o) => (
          <div key={o.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#00923f]">{o.nome}</h2>
            <ul className="mt-4 space-y-2 text-gray-700">
              {membros
                .filter((m) => m.orgao === o.id)
                .map((m, i) => (
                  <li key={i}>
                    <span className="font-semibold">{m.cargo}:</span> {m.nome}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
