"use client";

import { useEffect, useState } from "react";
import AdminTitulo from "@/components/admin/AdminTitulo";
import { btnPrimario, Campo, cartao, inputClass, Mensagem, pedido } from "@/components/admin/Form";
import type { Contactos } from "@/lib/contactos";

/** Os campos com várias linhas editam-se como texto (uma por linha). */
type Form = Omit<Contactos, "morada" | "telefones"> & { morada: string; telefones: string };

export default function AdminContactosPage() {
  const [form, setForm] = useState<Form | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  useEffect(() => {
    pedido<{ contactos: Contactos }>("/api/admin/conteudos/contactos")
      .then(({ contactos: c }) => setForm({ ...c, morada: c.morada.join("\n"), telefones: c.telefones.join("\n") }))
      .catch((e) => setErro(e.message));
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setErro(null);
    setOk(null);
    setAGuardar(true);
    try {
      const linhas = (t: string) => t.split("\n").map((l) => l.trim()).filter(Boolean);
      await pedido("/api/admin/conteudos/contactos", {
        method: "PUT",
        body: JSON.stringify({ ...form, morada: linhas(form.morada), telefones: linhas(form.telefones) }),
      });
      setOk("Contactos guardados. O rodapé, a página Fale Connosco e os botões de WhatsApp já usam os novos dados.");
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setAGuardar(false);
    }
  }

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => (f ? { ...f, [k]: e.target.value } : f));

  return (
    <div className="min-w-0 max-w-3xl">
      <AdminTitulo titulo="Contactos" descricao="Mostrados no rodapé, na página Fale Connosco e nos botões de WhatsApp das roupas." />
      <Mensagem erro={erro} ok={ok} />
      {!form ? (
        <p className="text-sm text-gray-500">A carregar…</p>
      ) : (
        <form onSubmit={guardar} className={`${cartao} mt-4 space-y-4`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="c-email" label="Email">
              <input id="c-email" type="email" required value={form.email} onChange={set("email")} className={inputClass} />
            </Campo>
            <Campo id="c-nif" label="NIF">
              <input id="c-nif" inputMode="numeric" value={form.nif} onChange={set("nif")} className={inputClass} />
            </Campo>
            <Campo id="c-tel" label="Telefones" ajuda='Um por linha, como devem aparecer (ex.: "914 884 537").'>
              <textarea id="c-tel" rows={3} value={form.telefones} onChange={set("telefones")} className={inputClass} />
            </Campo>
            <Campo id="c-wa" label="WhatsApp" ajuda="Número que recebe as mensagens (ex.: 914 838 942).">
              <input id="c-wa" inputMode="tel" value={form.whatsapp} onChange={set("whatsapp")} className={inputClass} />
            </Campo>
            <Campo id="c-morada" label="Morada" ajuda="Uma linha por linha do rodapé.">
              <textarea id="c-morada" rows={3} required value={form.morada} onChange={set("morada")} className={inputClass} />
            </Campo>
            <Campo id="c-mapa" label="Morada para o mapa" ajuda="Texto pesquisado no Google Maps da página de contacto.">
              <textarea id="c-mapa" rows={3} value={form.moradaMapa} onChange={set("moradaMapa")} className={inputClass} />
            </Campo>
            <Campo id="c-fb" label="Facebook (link)">
              <input id="c-fb" type="url" placeholder="https://" value={form.facebook} onChange={set("facebook")} className={inputClass} />
            </Campo>
            <Campo id="c-ig" label="Instagram (link)">
              <input id="c-ig" type="url" placeholder="https://" value={form.instagram} onChange={set("instagram")} className={inputClass} />
            </Campo>
          </div>
          <button type="submit" disabled={aGuardar} className={btnPrimario}>
            {aGuardar ? "A guardar…" : "Guardar"}
          </button>
        </form>
      )}
    </div>
  );
}
