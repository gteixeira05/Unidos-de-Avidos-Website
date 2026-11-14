"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminTitulo from "@/components/admin/AdminTitulo";
import { btnPrimario, cartao, inputClass, Mensagem, pedido } from "@/components/admin/Form";

type MarchaResumo = { ano: number; tema: string | null; youtubeUrl: string | null; classificacao: unknown[] | null };

export default function AdminMarchasPage() {
  const router = useRouter();
  const [marchas, setMarchas] = useState<MarchaResumo[] | null>(null);
  const [novoAno, setNovoAno] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    pedido<{ items: MarchaResumo[] }>("/api/admin/conteudos/marchas")
      .then((d) => setMarchas(d.items))
      .catch((e) => setErro(e.message));
  }, []);

  async function acrescentar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await pedido("/api/admin/conteudos/marchas", { method: "POST", body: JSON.stringify({ ano: Number(novoAno) }) });
      router.push(`/admin/conteudos/marchas/${novoAno}`);
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  return (
    <div className="min-w-0">
      <AdminTitulo
        titulo="Marchas Antoninas"
        descricao="Tema, classificação, vídeo e textos de cada ano (página Sobre → Marchas). O tema também dá o nome às roupas no aluguer."
        acoes={
          <form onSubmit={acrescentar} className="flex gap-2">
            <input
              aria-label="Ano a acrescentar"
              type="number"
              min={1990}
              max={2100}
              required
              placeholder="Ano"
              value={novoAno}
              onChange={(e) => setNovoAno(e.target.value)}
              className={`${inputClass} w-28`}
            />
            <button type="submit" className={btnPrimario}>
              + Acrescentar ano
            </button>
          </form>
        }
      />
      <Mensagem erro={erro} />
      {!marchas ? (
        <p className="text-sm text-gray-500">A carregar…</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {marchas.map((m) => (
            <li key={m.ano}>
              <Link href={`/admin/conteudos/marchas/${m.ano}`} className={`${cartao} block h-full transition hover:border-[#00923f]`}>
                <p className="text-sm font-semibold text-[#00923f]">{m.ano}</p>
                <p className="mt-1 line-clamp-2 font-medium text-gray-900">
                  {m.tema || <span className="text-gray-400">Sem tema</span>}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {(m.classificacao?.length ?? 0) > 0 ? "Com classificação" : "Sem classificação"} ·{" "}
                  {m.youtubeUrl ? "com vídeo" : "sem vídeo"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
