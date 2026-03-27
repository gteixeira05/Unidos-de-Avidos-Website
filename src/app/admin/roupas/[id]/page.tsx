"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Roupa = {
  id: string;
  ano: number;
  tema: string;
  descricao?: string | null;
  imagemUrl?: string | null;
  conjuntoInclui?: string | null;
  regrasLavagem?: string | null;
  precoAluguer: number;
  quantidadeHomem: number;
  quantidadeMulher: number;
};

export default function AdminEditarRoupaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const id = routeParams?.id ?? params.id;
  const [item, setItem] = useState<Roupa | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/roupas/${id}`, { credentials: "include" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d?.error ?? "Erro ao carregar roupa.");
        return d;
      })
      .then((d) => {
        if (!cancelled) setItem(d?.roupa ?? null);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erro ao carregar roupa.");
        if (!cancelled) setItem(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/roupas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao guardar.");
      setItem(data.roupa);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Ocorreu um erro.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Eliminar esta roupa?")) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/roupas/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao eliminar.");
      router.push("/admin/roupas");
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Ocorreu um erro.");
    }
  }

  if (loading) return <div className="mx-auto max-w-2xl px-4 py-12 text-gray-600">A carregar…</div>;
  if (!item)
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-gray-600">
        {error || "Roupa não encontrada."}
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/admin/roupas" className="text-sm font-medium text-[#00923f] hover:underline">
        ← Voltar
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Admin · Editar roupa</h1>
        <Link
          href={`/admin/roupas/${id}/disponibilidade`}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
        >
          Gerir disponibilidade →
        </Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={save} className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Ano</label>
            <input
              value={item.ano}
              onChange={(e) => setItem({ ...item, ano: Number(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Preço (€)</label>
            <input
              value={item.precoAluguer}
              onChange={(e) => setItem({ ...item, precoAluguer: Number(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Fardas homem</label>
            <input
              type="number"
              min={0}
              value={item.quantidadeHomem}
              onChange={(e) =>
                setItem({ ...item, quantidadeHomem: Math.max(0, Math.floor(Number(e.target.value)) || 0) })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Fardas mulher</label>
            <input
              type="number"
              min={0}
              value={item.quantidadeMulher}
              onChange={(e) =>
                setItem({ ...item, quantidadeMulher: Math.max(0, Math.floor(Number(e.target.value)) || 0) })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
          <textarea
            value={item.descricao ?? ""}
            onChange={(e) => setItem({ ...item, descricao: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            rows={4}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a33] disabled:opacity-60"
        >
          {saving ? "A guardar…" : "Guardar"}
        </button>

        <button
          type="button"
          onClick={remove}
          className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
        >
          Eliminar roupa
        </button>
      </form>
    </div>
  );
}

