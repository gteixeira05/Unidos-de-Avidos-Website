"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Roupa = {
  id: string;
  ano: number;
  tema: string;
  precoAluguer: number;
};

export default function AdminRoupasPage() {
  const [items, setItems] = useState<Roupa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/roupas")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setItems((d?.items ?? []) as Roupa[]);
      })
      .catch(() => {
        if (!cancelled) setError("Erro ao carregar roupas.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin · Roupas</h1>
          <p className="mt-2 text-gray-600">Criar e editar roupas para aluguer.</p>
        </div>
        <Link
          href="/admin/roupas/novo"
          className="rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a33]"
        >
          + Nova roupa
        </Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="mt-6 text-gray-600">A carregar…</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Ano</th>
                <th className="px-4 py-3 font-semibold">Tema</th>
                <th className="px-4 py-3 font-semibold">Preço</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{r.ano}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.tema}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {Number(r.precoAluguer).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/roupas/${r.id}`}
                      className="text-[#00923f] hover:underline"
                    >
                      Editar →
                    </Link>
                  </td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td className="px-4 py-6 text-gray-600" colSpan={4}>
                    Ainda não existem roupas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

