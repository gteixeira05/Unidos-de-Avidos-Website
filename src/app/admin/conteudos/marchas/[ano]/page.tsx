"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import AdminTitulo from "@/components/admin/AdminTitulo";
import { btnPerigo, btnPrimario, btnSecundario, Campo, cartao, inputClass, Mensagem, pedido } from "@/components/admin/Form";

type Linha = { pos: string; nome: string; pontos: string; premios: string };
type Bloco = { titulo: string; texto: string };
type Form = {
  tema: string;
  descricaoCard: string;
  subtitulo: string;
  youtubeUrl: string;
  mensagem: string;
  classificacao: Linha[];
  outros: Bloco[];
};

export default function AdminMarchaAnoPage() {
  const { ano } = useParams<{ ano: string }>();
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  useEffect(() => {
    pedido<{ marcha: Record<string, unknown> }>(`/api/admin/conteudos/marchas/${ano}`)
      .then(({ marcha: m }) =>
        setForm({
          tema: (m.tema as string) ?? "",
          descricaoCard: (m.descricaoCard as string) ?? "",
          subtitulo: (m.subtitulo as string) ?? "",
          youtubeUrl: (m.youtubeUrl as string) ?? "",
          mensagem: (m.mensagem as string) ?? "",
          classificacao: ((m.classificacao as Partial<Linha>[]) ?? []).map((c) => ({
            pos: c.pos ?? "",
            nome: c.nome ?? "",
            pontos: c.pontos ?? "",
            premios: c.premios ?? "",
          })),
          outros: (m.outros as Bloco[]) ?? [],
        })
      )
      .catch((e) => setErro(e.message));
  }, [ano]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setOk(null);
    setAGuardar(true);
    try {
      await pedido(`/api/admin/conteudos/marchas/${ano}`, { method: "PUT", body: JSON.stringify(form) });
      setOk("Guardado. A página pública já mostra as alterações.");
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setAGuardar(false);
    }
  }

  async function apagar() {
    if (!confirm(`Apagar as Marchas ${ano}? Deixa de aparecer na página das Marchas.`)) return;
    try {
      await pedido(`/api/admin/conteudos/marchas/${ano}`, { method: "DELETE" });
      router.push("/admin/conteudos/marchas");
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  if (!form) {
    return (
      <div className="min-w-0">
        <Mensagem erro={erro} />
        {!erro && <p className="text-sm text-gray-500">A carregar…</p>}
      </div>
    );
  }

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });
  const setLinha = (i: number, k: keyof Linha, v: string) =>
    setForm({ ...form, classificacao: form.classificacao.map((l, j) => (j === i ? { ...l, [k]: v } : l)) });
  const setBloco = (i: number, k: keyof Bloco, v: string) =>
    setForm({ ...form, outros: form.outros.map((b, j) => (j === i ? { ...b, [k]: v } : b)) });

  return (
    <div className="min-w-0">
      <Link href="/admin/conteudos/marchas" className="text-sm font-medium text-[#00923f] hover:underline">
        ← Marchas
      </Link>
      <div className="mt-3">
        <AdminTitulo
          titulo={`Marchas Antoninas ${ano}`}
          acoes={
            <div className="flex flex-wrap gap-2">
              <Link href={`/sobre/marchas/${ano}`} target="_blank" className={btnSecundario}>
                Ver no site ↗
              </Link>
              <button type="button" onClick={apagar} className={btnPerigo}>
                Apagar ano
              </button>
            </div>
          }
        />
      </div>

      <form onSubmit={guardar} className="space-y-4">
        <Mensagem erro={erro} ok={ok} />

        <section className={`${cartao} space-y-4`}>
          <Campo id="m-tema" label="Tema" ajuda="Também é o nome da roupa deste ano no aluguer.">
            <input id="m-tema" value={form.tema} onChange={set("tema")} className={inputClass} />
          </Campo>
          <Campo id="m-desc" label="Descrição" ajuda="Aparece no cartão da lista de anos e no topo da página do ano.">
            <textarea id="m-desc" rows={3} value={form.descricaoCard} onChange={set("descricaoCard")} className={inputClass} />
          </Campo>
          <Campo id="m-yt" label="Vídeo da atuação (YouTube)">
            <input id="m-yt" type="url" placeholder="https://www.youtube.com/watch?v=…" value={form.youtubeUrl} onChange={set("youtubeUrl")} className={inputClass} />
          </Campo>
        </section>

        <section className={`${cartao} space-y-3`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-semibold text-gray-900">Classificação</h2>
            <div className="w-full sm:w-64">
              <Campo id="m-sub" label="Subtítulo (opcional)">
                <input id="m-sub" placeholder="Classificação" value={form.subtitulo} onChange={set("subtitulo")} className={inputClass} />
              </Campo>
            </div>
          </div>
          {form.classificacao.map((l, i) => (
            <div key={i} className="grid grid-cols-[4rem_1fr_auto] gap-2 xl:grid-cols-[4rem_1fr_8rem_12rem_auto]">
              <input aria-label="Posição" placeholder="1º" value={l.pos} onChange={(e) => setLinha(i, "pos", e.target.value)} className={inputClass} />
              <input aria-label="Associação" placeholder="Associação" value={l.nome} onChange={(e) => setLinha(i, "nome", e.target.value)} className={inputClass} />
              <button type="button" aria-label="Remover linha" onClick={() => setForm({ ...form, classificacao: form.classificacao.filter((_, j) => j !== i) })} className="row-span-2 self-center rounded p-2 text-red-600 hover:bg-red-50 xl:order-last xl:row-span-1">
                <Trash2 className="h-4 w-4" />
              </button>
              <input aria-label="Pontos" placeholder="Pontos" value={l.pontos} onChange={(e) => setLinha(i, "pontos", e.target.value)} className={`${inputClass} col-start-2 xl:col-start-auto`} />
              <input aria-label="Prémios" placeholder="Prémios" value={l.premios} onChange={(e) => setLinha(i, "premios", e.target.value)} className={`${inputClass} col-start-2 xl:col-start-auto`} />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setForm({ ...form, classificacao: [...form.classificacao, { pos: `${form.classificacao.length + 1}º`, nome: "", pontos: "", premios: "" }] })}
            className={btnSecundario}
          >
            + Acrescentar linha
          </button>
        </section>

        <section className={`${cartao} space-y-4`}>
          <Campo id="m-msg" label="Mensagem (opcional)">
            <textarea id="m-msg" rows={4} value={form.mensagem} onChange={set("mensagem")} className={inputClass} />
          </Campo>
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Outros blocos de texto (opcional)</p>
            {form.outros.map((b, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-gray-200 p-3">
                <div className="flex gap-2">
                  <input aria-label="Título do bloco" placeholder="Título" value={b.titulo} onChange={(e) => setBloco(i, "titulo", e.target.value)} className={inputClass} />
                  <button type="button" aria-label="Remover bloco" onClick={() => setForm({ ...form, outros: form.outros.filter((_, j) => j !== i) })} className="rounded p-2 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea aria-label="Texto do bloco" rows={3} value={b.texto} onChange={(e) => setBloco(i, "texto", e.target.value)} className={inputClass} />
              </div>
            ))}
            <button type="button" onClick={() => setForm({ ...form, outros: [...form.outros, { titulo: "", texto: "" }] })} className={btnSecundario}>
              + Acrescentar bloco
            </button>
          </div>
        </section>

        <div className="sticky bottom-4 flex justify-end">
          <button type="submit" disabled={aGuardar} className={`${btnPrimario} shadow-lg`}>
            {aGuardar ? "A guardar…" : "Guardar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
