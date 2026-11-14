"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import AdminTitulo from "@/components/admin/AdminTitulo";
import { btnPrimario, btnSecundario, cartao, inputClass, Mensagem, pedido } from "@/components/admin/Form";

const ORGAOS = [
  { id: "DIRECAO", nome: "Direção" },
  { id: "ASSEMBLEIA_GERAL", nome: "Assembleia Geral" },
  { id: "CONSELHO_FISCAL", nome: "Conselho Fiscal" },
];

type Membro = { key: number; orgao: string; cargo: string; nome: string };
let seq = 0;

export default function AdminOrgaosPage() {
  const [membros, setMembros] = useState<Membro[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  useEffect(() => {
    pedido<{ items: Omit<Membro, "key">[] }>("/api/admin/conteudos/orgaos")
      .then((d) => setMembros(d.items.map((m) => ({ key: seq++, orgao: m.orgao, cargo: m.cargo, nome: m.nome }))))
      .catch((e) => setErro(e.message));
  }, []);

  const lista = membros ?? [];
  const atualizar = (key: number, campo: "cargo" | "nome", valor: string) =>
    setMembros(lista.map((m) => (m.key === key ? { ...m, [campo]: valor } : m)));

  function mover(key: number, delta: -1 | 1) {
    const doOrgao = lista.filter((m) => m.orgao === lista.find((x) => x.key === key)!.orgao);
    const i = doOrgao.findIndex((m) => m.key === key);
    const j = i + delta;
    if (j < 0 || j >= doOrgao.length) return;
    const a = lista.indexOf(doOrgao[i]);
    const b = lista.indexOf(doOrgao[j]);
    const nova = [...lista];
    [nova[a], nova[b]] = [nova[b], nova[a]];
    setMembros(nova);
  }

  async function guardar() {
    setErro(null);
    setOk(null);
    setAGuardar(true);
    try {
      await pedido("/api/admin/conteudos/orgaos", {
        method: "PUT",
        body: JSON.stringify({ items: lista.map(({ orgao, cargo, nome }) => ({ orgao, cargo, nome })) }),
      });
      setOk("Órgãos sociais guardados. O site já mostra a nova composição.");
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <div className="min-w-0">
      <AdminTitulo
        titulo="Órgãos sociais"
        descricao="Composição da Direção, Assembleia Geral e Conselho Fiscal (página Sobre → Órgãos Sociais)."
        acoes={
          <button type="button" onClick={guardar} disabled={aGuardar || !membros} className={btnPrimario}>
            {aGuardar ? "A guardar…" : "Guardar alterações"}
          </button>
        }
      />
      <div className="space-y-4">
        <Mensagem erro={erro} ok={ok} />
        {!membros ? (
          <p className="text-sm text-gray-500">A carregar…</p>
        ) : (
          ORGAOS.map((o) => {
            const doOrgao = lista.filter((m) => m.orgao === o.id);
            return (
              <section key={o.id} className={cartao}>
                <h2 className="mb-3 font-semibold text-[#00923f]">{o.nome}</h2>
                <div className="space-y-2">
                  {doOrgao.map((m, i) => (
                    <div key={m.key} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                      <input
                        aria-label="Cargo"
                        placeholder="Cargo (ex.: Presidente)"
                        value={m.cargo}
                        onChange={(e) => atualizar(m.key, "cargo", e.target.value)}
                        className={`${inputClass} sm:w-44`}
                      />
                      <input
                        aria-label="Nome"
                        placeholder="Nome (ex.: Sócio nº68 - Nome Completo)"
                        value={m.nome}
                        onChange={(e) => atualizar(m.key, "nome", e.target.value)}
                        className={inputClass}
                      />
                      <div className="flex shrink-0 gap-1">
                        <button type="button" aria-label="Subir" disabled={i === 0} onClick={() => mover(m.key, -1)} className="rounded p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30">
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button type="button" aria-label="Descer" disabled={i === doOrgao.length - 1} onClick={() => mover(m.key, 1)} className="rounded p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30">
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button type="button" aria-label="Remover" onClick={() => setMembros(lista.filter((x) => x.key !== m.key))} className="rounded p-2 text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setMembros([...lista, { key: seq++, orgao: o.id, cargo: "", nome: "" }])}
                  className={`${btnSecundario} mt-3`}
                >
                  + Acrescentar a {o.nome}
                </button>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
