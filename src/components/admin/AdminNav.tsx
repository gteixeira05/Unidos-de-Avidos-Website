"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Archive,
  CalendarDays,
  ClipboardList,
  ExternalLink,
  Images,
  Inbox,
  Landmark,
  Music,
  Phone,
  ScrollText,
  Shirt,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";

type Resumo = { reservasPendentes: number; avaliacoesPendentes: number; caucoesPorDevolver: number };
type Item = { href: string; label: string; icon: LucideIcon; contador?: keyof Resumo; exato?: boolean };

const GRUPOS: { titulo: string; itens: Item[]; superAdmin?: boolean }[] = [
  {
    titulo: "Reservas",
    itens: [
      { href: "/admin/reservas", label: "Pedidos", icon: Inbox, contador: "reservasPendentes", exato: true },
      { href: "/admin/reservas/alugadas", label: "Alugadas", icon: ClipboardList, contador: "caucoesPorDevolver" },
      { href: "/admin/reservas/arquivadas", label: "Arquivadas", icon: Archive },
    ],
  },
  {
    titulo: "Catálogo",
    itens: [
      { href: "/admin/roupas", label: "Roupas", icon: Shirt },
      { href: "/admin/galeria", label: "Galeria", icon: Images },
    ],
  },
  {
    titulo: "Conteúdos",
    itens: [
      { href: "/admin/conteudos/agenda", label: "Agenda", icon: CalendarDays },
      { href: "/admin/conteudos/marchas", label: "Marchas", icon: Music },
      { href: "/admin/conteudos/orgaos", label: "Órgãos sociais", icon: Landmark },
      { href: "/admin/conteudos/contactos", label: "Contactos", icon: Phone },
    ],
  },
  {
    titulo: "Comunidade",
    itens: [
      { href: "/admin/avaliacoes", label: "Avaliações", icon: Star, contador: "avaliacoesPendentes" },
      { href: "/admin/utilizadores", label: "Utilizadores", icon: Users },
    ],
  },
  { titulo: "Sistema", superAdmin: true, itens: [{ href: "/admin/logs", label: "Registo de atividade", icon: ScrollText }] },
];

const DICA_CONTADOR: Record<keyof Resumo, string> = {
  reservasPendentes: "pedidos por responder",
  avaliacoesPendentes: "avaliações por aprovar",
  caucoesPorDevolver: "cauções por devolver",
};

/** Menu do admin: barra lateral no computador, separadores com scroll no telemóvel. */
export default function AdminNav({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const barraTelemovel = useRef<HTMLDivElement>(null);

  // No telemóvel, mostra o separador ativo (pode estar fora do ecrã).
  useEffect(() => {
    barraTelemovel.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [pathname]);

  useEffect(() => {
    let cancelado = false;
    fetch("/api/admin/resumo", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelado && d && setResumo(d))
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [pathname]);

  const grupos = GRUPOS.filter((g) => !g.superAdmin || isSuperAdmin);
  const ativo = (i: Item) => (i.exato ? pathname === i.href : pathname === i.href || pathname.startsWith(`${i.href}/`));

  const link = (i: Item, compacto: boolean) => {
    const n = i.contador && resumo ? resumo[i.contador] : 0;
    const on = ativo(i);
    return (
      <Link
        key={i.href}
        href={i.href}
        aria-current={on ? "page" : undefined}
        className={`flex items-center gap-2.5 rounded-lg text-sm font-medium transition ${
          compacto ? "shrink-0 px-3 py-2" : "px-3 py-2"
        } ${on ? "bg-[#00923f] text-white" : "text-gray-700 hover:bg-gray-100"}`}
      >
        <i.icon className="h-4 w-4 shrink-0" aria-hidden />
        <span className={compacto ? "whitespace-nowrap" : "flex-1"}>{i.label}</span>
        {n > 0 && (
          <span
            title={`${n} ${DICA_CONTADOR[i.contador!]}`}
            className={`rounded-full px-1.5 text-xs font-semibold tabular-nums ${
              on ? "bg-white/25 text-white" : "bg-amber-100 text-amber-800"
            }`}
          >
            {n}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Telemóvel e tablet */}
      <nav aria-label="Menu do admin" className="-mx-4 mb-6 border-b border-gray-200 px-4 pb-3 lg:hidden">
        <div ref={barraTelemovel} className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {grupos.flatMap((g) => g.itens).map((i) => link(i, true))}
        </div>
      </nav>

      {/* Computador */}
      <nav aria-label="Menu do admin" className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-28 space-y-5">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-[#00923f]">Administração</p>
          {grupos.map((g) => (
            <div key={g.titulo}>
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">{g.titulo}</p>
              <div className="space-y-0.5">{g.itens.map((i) => link(i, false))}</div>
            </div>
          ))}
          <Link
            href="/"
            className="flex items-center gap-2 px-3 text-sm text-gray-500 hover:text-[#00923f]"
          >
            <ExternalLink className="h-4 w-4" aria-hidden /> Ver o site
          </Link>
        </div>
      </nav>
    </>
  );
}
