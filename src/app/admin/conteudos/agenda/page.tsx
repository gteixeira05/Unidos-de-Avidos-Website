"use client";

import { useCallback, useEffect, useState } from "react";
import AdminTitulo from "@/components/admin/AdminTitulo";
import { btnPerigo, btnPrimario, btnSecundario, Campo, cartao, inputClass, Mensagem, pedido } from "@/components/admin/Form";
import { formatarDataEvento } from "@/lib/agenda";

type EventoApi = { id: string; titulo: string; data: string; descricao: string | null; imagemUrl: string | null };
type Form = { id?: string; titulo: string; data: string; descricao: string; imagemUrl: string };
const VAZIO: Form = { titulo: "", data: "", descricao: "", imagemUrl: "" };

export default function AdminAgendaPage() {
  const [eventos, setEventos] = useState<EventoApi[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const [aEnviarImagem, setAEnviarImagem] = useState(false);

  const carregar = useCallback(() => {
    pedido<{ items: EventoApi[] }>("/api/admin/conteudos/eventos")
      .then((d) => setEventos(d.items))
      .catch((e) => setErro(e.message));
  }, []);
  useEffect(carregar, [carregar]);

  const hoje = new Date().toISOString().slice(0, 10);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setErro(null);
    setAGuardar(true);
    try {
      const body = JSON.stringify({ titulo: form.titulo, data: form.data, descricao: form.descricao, imagemUrl: form.imagemUrl });
      if (form.id) await pedido(`/api/admin/conteudos/eventos/${form.id}`, { method: "PATCH", body });
      else await pedido("/api/admin/conteudos/eventos", { method: "POST", body });
      setOk(form.id ? "Evento atualizado." : "Evento criado.");
      setForm(null);
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setAGuardar(false);
    }
  }

  async function apagar(ev: EventoApi) {
    if (!confirm(`Apagar o evento "${ev.titulo}"?`)) return;
    setErro(null);
    try {
      await pedido(`/api/admin/conteudos/eventos/${ev.id}`, { method: "DELETE" });
      setOk("Evento apagado.");
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function enviarImagem(file: File) {
    setErro(null);
    setAEnviarImagem(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await pedido<{ url: string }>("/api/admin/conteudos/imagem", { method: "POST", body: fd });
      setForm((f) => (f ? { ...f, imagemUrl: url } : f));
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setAEnviarImagem(false);
    }
  }

  return (
    <div className="min-w-0">
      <AdminTitulo
        titulo="Agenda"
        descricao="Eventos mostrados na Agenda e na página inicial. Os eventos passados deixam de aparecer sozinhos."
        acoes={
          !form && (
            <button type="button" onClick={() => { setForm(VAZIO); setOk(null); }} className={btnPrimario}>
              + Novo evento
            </button>
          )
        }
      />
      <div className="space-y-4">
        <Mensagem erro={erro} ok={ok} />

        {form && (
          <form onSubmit={guardar} className={`${cartao} space-y-4`}>
            <p className="font-semibold text-gray-900">{form.id ? "Editar evento" : "Novo evento"}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="ev-titulo" label="Título">
                <input id="ev-titulo" required maxLength={120} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className={inputClass} />
              </Campo>
              <Campo id="ev-data" label="Data">
                <input id="ev-data" type="date" required value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className={inputClass} />
              </Campo>
            </div>
            <Campo id="ev-desc" label="Descrição (opcional)">
              <textarea id="ev-desc" rows={3} maxLength={1000} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className={inputClass} />
            </Campo>
            <Campo id="ev-img" label="Imagem (opcional)" ajuda="JPG, PNG, WebP ou HEIC.">
              <div className="flex flex-wrap items-center gap-3">
                {form.imagemUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.imagemUrl} alt="" className="h-20 w-28 rounded-lg border border-gray-200 object-cover" />
                )}
                <input
                  id="ev-img"
                  type="file"
                  accept="image/*,.heic,.heif"
                  disabled={aEnviarImagem}
                  onChange={(e) => e.target.files?.[0] && enviarImagem(e.target.files[0])}
                  className="text-sm"
                />
                {aEnviarImagem && <span className="text-sm text-gray-500">A enviar…</span>}
                {form.imagemUrl && (
                  <button type="button" onClick={() => setForm({ ...form, imagemUrl: "" })} className={btnSecundario}>
                    Remover imagem
                  </button>
                )}
              </div>
            </Campo>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={aGuardar || aEnviarImagem} className={btnPrimario}>
                {aGuardar ? "A guardar…" : "Guardar"}
              </button>
              <button type="button" onClick={() => setForm(null)} className={btnSecundario}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {eventos === null ? (
          <p className="text-sm text-gray-500">A carregar…</p>
        ) : eventos.length === 0 ? (
          <p className="text-sm text-gray-600">Ainda não há eventos.</p>
        ) : (
          <ul className="space-y-3">
            {eventos.map((ev) => {
              const dia = ev.data.slice(0, 10);
              const passado = dia < hoje;
              return (
                <li key={ev.id} className={`${cartao} flex flex-wrap items-center gap-4 ${passado ? "opacity-60" : ""}`}>
                  {ev.imagemUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ev.imagemUrl} alt="" className="h-16 w-24 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{ev.titulo}</p>
                    <p className="text-sm text-gray-600">
                      {formatarDataEvento(dia)}
                      {passado && <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs">já passou</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOk(null);
                        setForm({ id: ev.id, titulo: ev.titulo, data: dia, descricao: ev.descricao ?? "", imagemUrl: ev.imagemUrl ?? "" });
                      }}
                      className={btnSecundario}
                    >
                      Editar
                    </button>
                    <button type="button" onClick={() => apagar(ev)} className={btnPerigo}>
                      Apagar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
