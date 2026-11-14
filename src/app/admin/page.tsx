import { redirect } from "next/navigation";

// Links antigos (/admin?tab=...) continuam a funcionar.
const DESTINOS: Record<string, string> = {
  reservas: "/admin/reservas",
  alugadas: "/admin/reservas/alugadas",
  arquivadas: "/admin/reservas/arquivadas",
  avaliacoes: "/admin/avaliacoes",
  utilizadores: "/admin/utilizadores",
  logs: "/admin/logs",
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  redirect(DESTINOS[tab ?? ""] ?? "/admin/reservas");
}
