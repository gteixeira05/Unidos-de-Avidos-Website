import Link from "next/link";

export const metadata = { title: "Página não encontrada" };

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/aluguer-roupas", label: "Aluguer de Roupas" },
  { href: "/galeria", label: "Galeria" },
  { href: "/fale-connosco", label: "Fale Connosco" },
];

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#00923f]">Erro 404</p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Página não encontrada</h1>
      <p className="mt-4 text-lg text-gray-600">
        A página que procura não existe ou mudou de endereço.
      </p>
      <nav aria-label="Páginas principais" className="mt-8 flex flex-wrap justify-center gap-3">
        {LINKS.map((l, i) => (
          <Link
            key={l.href}
            href={l.href}
            className={
              i === 0
                ? "rounded-lg bg-[#00923f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007a33]"
                : "rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#00923f] hover:text-[#00923f]"
            }
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
