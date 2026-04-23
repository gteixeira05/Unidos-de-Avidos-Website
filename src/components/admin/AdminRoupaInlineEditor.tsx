"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  labelMetodoPagamento,
  labelPagamentoEstado,
  normalizePagamentoEstado,
} from "@/lib/reservaPagamento";

type Props = {
  roupa: {
    id: string;
    ano: number;
    tema: string;
    descricao?: string | null;
    conjuntoInclui?: string | null;
    regrasLavagem?: string | null;
    precoAluguer: number;
    quantidadeHomem: number;
    quantidadeMulher: number;
  };
};

const ESTADOS_DISP = ["LIVRE", "ALUGADA", "MANUTENCAO"] as const;
type EstadoDisp = (typeof ESTADOS_DISP)[number];

type Interval = { inicio: string; fim: string };
type AlugadaItem = Interval & {
  reservaId: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  observacoes: string | null;
  pagamentoEstado?: string | null;
  metodoPagamento?: string | null;
};
type Pendente = Interval & {
  id: string;
  nome?: string | null;
  email?: string | null;
  telefone?: string | null;
  observacoes?: string | null;
};

function formatKeyPt(key: string) {
  return new Date(`${key}T00:00:00.000Z`).toLocaleDateString("pt-PT");
}

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone,
  busy,
  extra,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: "red" | "dark" | "green";
  busy: boolean;
  extra?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const confirmClasses =
    tone === "red"
      ? "bg-red-600 hover:bg-red-700"
      : tone === "green"
        ? "bg-[#00923f] hover:bg-[#007a33]"
        : "bg-gray-900 hover:bg-gray-800";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-100 bg-[#00923f]/5 p-5">
          <p className="text-sm font-semibold text-[#00923f]">Confirmar ação</p>
          <h2 className="mt-1 text-lg font-bold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm text-gray-700">{message}</p>
        </div>
        <div className="p-5">
          {extra ? <div className="mb-4">{extra}</div> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${confirmClasses} disabled:opacity-60`}
            >
              {busy ? "A processar…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminRoupaInlineEditor({ roupa }: Props) {
  const router = useRouter();
  // ---- Editar roupa ----
  const [form, setForm] = useState({
    ano: String(roupa.ano),
    descricao: roupa.descricao ?? "",
    conjuntoInclui: roupa.conjuntoInclui ?? "",
    regrasLavagem: roupa.regrasLavagem ?? "",
    precoAluguer: String(roupa.precoAluguer),
  });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // ---- Disponibilidade (campos) ----
  const [dispInicio, setDispInicio] = useState("");
  const [dispFim, setDispFim] = useState("");
  const [estadoSelecionado, setEstadoSelecionado] = useState<EstadoDisp>("MANUTENCAO");

  const [alugNome, setAlugNome] = useState("");
  const [alugEmail, setAlugEmail] = useState("");
  const [alugTelefone, setAlugTelefone] = useState("");
  const [alugObs, setAlugObs] = useState("");

  const [dispErr, setDispErr] = useState("");
  const [dispMsg, setDispMsg] = useState("");

  // ---- Intervalos ALUGADA/PENDENTE ----
  const [intervalosLoading, setIntervalosLoading] = useState(false);
  const [intervalosError, setIntervalosError] = useState("");
  const [alugadas, setAlugadas] = useState<AlugadaItem[]>([]);
  const [pendentes, setPendentes] = useState<Pendente[]>([]);

  const refreshKeyRef = useRef(0);
  const [refreshKey, setRefreshKey] = useState(0);

  function triggerRefresh() {
    refreshKeyRef.current += 1;
    setRefreshKey(refreshKeyRef.current);
  }

  async function loadIntervalos() {
    setIntervalosLoading(true);
    setIntervalosError("");
    try {
      const res = await fetch(`/api/admin/roupas/${roupa.id}/estados`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar intervalos.");
      setAlugadas((data.alugadas ?? []) as AlugadaItem[]);
      setPendentes((data.pendentes ?? []) as Pendente[]);
    } catch (e2) {
      setIntervalosError(e2 instanceof Error ? e2.message : "Ocorreu um erro.");
    } finally {
      setIntervalosLoading(false);
    }
  }

  useEffect(() => {
    void loadIntervalos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roupa.id, refreshKey]);

  // ---- Popups confirm ----
  type ConfirmState =
    | { open: false }
    | { open: true; kind: "SAVE_ROUPA" }
    | {
        open: true;
        kind: "UPDATE_DISP";
        inicioISO: string;
        fimISO: string;
        estado: EstadoDisp;
        reservaId?: string;
        aluguerManual?: {
          nome: string;
          email: string;
          telefone: string;
          observacoes: string;
        };
      }
    | {
        open: true;
        kind: "TRANSFER_ALUGADA_TO_PENDENTE";
        reservaId: string;
        inicioISO: string;
        fimISO: string;
      };

  // Reservas PENDENTE (não queremos listar “pessoa”, mas sim intervalo + ações)
  // Ao aprovar uma reserva PENDENTE, transformamos em ALUGADA e exigimos nota.
  // Ao eliminar/rejeitar, removemos da lista PENDENTE.
  type ConfirmReservaState =
    | { open: true; kind: "DELETE_PENDENTE"; reservaId: string }
    | { open: true; kind: "REJEITAR_PENDENTE"; reservaId: string }
    | {
        open: true;
        kind: "APROVAR_PENDENTE";
        reservaId: string;
        inicioISO: string;
        fimISO: string;
        nota: string;
      };

  type ConfirmFullState = ConfirmState | ConfirmReservaState;

  const [confirmState, setConfirmState] = useState<ConfirmFullState>({ open: false });
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmErr, setConfirmErr] = useState("");

  const confirmConfig = useMemo(() => {
    if (!confirmState.open) return null;
    if (confirmState.kind === "SAVE_ROUPA") {
      return {
        title: "Guardar alterações",
        message: `Guardar os dados da roupa “${roupa.tema}” (${roupa.ano})?`,
        confirmLabel: "Guardar",
        cancelLabel: "Cancelar",
        tone: "green" as const,
      };
    }

    if (confirmState.kind === "UPDATE_DISP") {
      const inicioKey = confirmState.inicioISO;
      const fimKey = confirmState.fimISO;
      const extra =
        confirmState.estado === "ALUGADA" && confirmState.aluguerManual
          ? ` Dados: ${confirmState.aluguerManual.nome} (${confirmState.aluguerManual.email}).`
          : "";
      return {
        title: "Atualizar disponibilidade",
        message: `Aplicar ${confirmState.estado} de ${formatKeyPt(inicioKey)} até ${formatKeyPt(fimKey)}.${extra}`,
        confirmLabel: "Confirmar",
        cancelLabel: "Cancelar",
        tone: "dark" as const,
      };
    }

    if (confirmState.kind === "DELETE_PENDENTE") {
      return {
        title: "Eliminar reserva pendente",
        message: "Esta ação é permanente e a reserva deixará de existir (as datas ficam livres).",
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        tone: "red" as const,
      };
    }

    if (confirmState.kind === "REJEITAR_PENDENTE") {
      return {
        title: "Rejeitar reserva pendente",
        message: "A reserva ficará REJEITADA e as datas ficam livres.",
        confirmLabel: "Confirmar",
        cancelLabel: "Cancelar",
        tone: "dark" as const,
      };
    }

    if (confirmState.kind === "APROVAR_PENDENTE") {
      const inicioKey = confirmState.inicioISO;
      const fimKey = confirmState.fimISO;
      return {
        title: "Aprovar e bloquear como ALUGADA",
        message: `Confirmar que a reserva fica como APROVADA e as datas ficam ALUGADA de ${formatKeyPt(inicioKey)} até ${formatKeyPt(fimKey)}.`,
        confirmLabel: "Confirmar",
        cancelLabel: "Cancelar",
        tone: "dark" as const,
      };
    }

    if (confirmState.kind === "TRANSFER_ALUGADA_TO_PENDENTE") {
      const inicioKey = confirmState.inicioISO;
      const fimKey = confirmState.fimISO;
      return {
        title: "Trocar para PENDENTE",
        message: `A reserva passa para PENDENTE e o calendário fica livre entre ${formatKeyPt(inicioKey)} e ${formatKeyPt(fimKey)}.`,
        confirmLabel: "Confirmar",
        cancelLabel: "Cancelar",
        tone: "dark" as const,
      };
    }

    return null;
  }, [confirmState, roupa.tema, roupa.ano]);

  async function doConfirmAction() {
    if (!confirmState.open) return;
    setConfirmBusy(true);
    setConfirmErr("");
    try {
      if (confirmState.kind === "SAVE_ROUPA") {
        const res = await fetch(`/api/admin/roupas/${roupa.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ano: Number(form.ano),
            descricao: form.descricao,
            conjuntoInclui: form.conjuntoInclui,
            regrasLavagem: form.regrasLavagem,
            precoAluguer: Number(form.precoAluguer),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erro ao guardar.");
        setMsg("Guardado com sucesso.");
        setErr("");
        router.refresh();
      }

      if (confirmState.kind === "UPDATE_DISP") {
        const payload: Record<string, unknown> = {
          roupaId: roupa.id,
          inicio: confirmState.inicioISO,
          fim: confirmState.fimISO,
          estado: confirmState.estado,
        };
        if (confirmState.estado === "LIVRE" && confirmState.reservaId) {
          payload.reservaId = confirmState.reservaId;
        }
        if (confirmState.estado === "ALUGADA" && confirmState.aluguerManual) {
          payload.aluguerManual = confirmState.aluguerManual;
        }
        const res = await fetch("/api/admin/disponibilidade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erro ao atualizar disponibilidade.");
        setDispMsg("Disponibilidade atualizada.");
        setDispErr("");
        setDispInicio("");
        setDispFim("");
        setAlugNome("");
        setAlugEmail("");
        setAlugTelefone("");
        setAlugObs("");
        await loadIntervalos();
        triggerRefresh();
      }

      if (confirmState.kind === "DELETE_PENDENTE") {
        const res = await fetch(`/api/admin/reservas/${confirmState.reservaId}`, {
          method: "DELETE",
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Erro ao eliminar reserva pendente.");
        await loadIntervalos();
        triggerRefresh();
      }

      if (confirmState.kind === "REJEITAR_PENDENTE") {
        const res = await fetch(`/api/admin/reservas/${confirmState.reservaId}/estado`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ estado: "REJEITADA" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erro ao rejeitar reserva pendente.");
        await loadIntervalos();
        triggerRefresh();
      }

      if (confirmState.kind === "APROVAR_PENDENTE") {
        const patchRes = await fetch(
          `/api/admin/reservas/${confirmState.reservaId}/estado`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              estado: "APROVADA",
              ...(confirmState.nota.trim()
                ? { adminNota: confirmState.nota.trim() }
                : {}),
            }),
          }
        );
        const patchData = await patchRes.json().catch(() => ({}));
        if (!patchRes.ok)
          throw new Error(patchData.error ?? "Erro ao aprovar reserva pendente.");

        setDispMsg("Reserva aprovada e calendário atualizado.");
        setDispErr("");

        await loadIntervalos();
        triggerRefresh();
      }

      if (confirmState.kind === "TRANSFER_ALUGADA_TO_PENDENTE") {
        const patchRes = await fetch(
          `/api/admin/reservas/${confirmState.reservaId}/estado`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ estado: "PENDENTE" }),
          }
        );
        const patchData = await patchRes.json().catch(() => ({}));
        if (!patchRes.ok) {
          throw new Error(patchData.error ?? "Erro ao trocar reserva para PENDENTE.");
        }

        const dispRes = await fetch("/api/admin/disponibilidade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            roupaId: roupa.id,
            inicio: confirmState.inicioISO,
            fim: confirmState.fimISO,
            estado: "LIVRE",
          }),
        });
        const dispData = await dispRes.json().catch(() => ({}));
        if (!dispRes.ok) {
          throw new Error(dispData.error ?? "Erro ao libertar datas no calendário.");
        }

        setDispMsg("Troca para PENDENTE concluída.");
        setDispErr("");
        triggerRefresh();
        await loadIntervalos();
      }

      setConfirmState({ open: false });
    } catch (e2) {
      setConfirmErr(e2 instanceof Error ? e2.message : "Ocorreu um erro.");
    } finally {
      setConfirmBusy(false);
    }
  }

  // ---- Handlers ----
  async function onSubmitSaveRoupa(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setConfirmState({ open: true, kind: "SAVE_ROUPA" });
  }

  function onSubmitAvailability(e: React.FormEvent) {
    e.preventDefault();
    setDispErr("");
    setDispMsg("");
    if (!dispInicio || !dispFim) {
      setDispErr("Indique a data de início e a data de fim.");
      return;
    }
    if (dispInicio > dispFim) {
      setDispErr("A data de início não pode ser depois da data de fim.");
      return;
    }
    if (estadoSelecionado === "ALUGADA") {
      if (!alugNome.trim() || !alugTelefone.trim()) {
        setDispErr("Para ALUGADA preencha nome e telefone (email é opcional).");
        return;
      }
      setConfirmState({
        open: true,
        kind: "UPDATE_DISP",
        inicioISO: dispInicio,
        fimISO: dispFim,
        estado: "ALUGADA",
        aluguerManual: {
          nome: alugNome.trim(),
          email: alugEmail.trim(),
          telefone: alugTelefone.trim(),
          observacoes: alugObs.trim(),
        },
      });
      return;
    }
    setConfirmState({
      open: true,
      kind: "UPDATE_DISP",
      inicioISO: dispInicio,
      fimISO: dispFim,
      estado: estadoSelecionado,
    });
  }

  return (
    <div className="mt-6 min-w-0 max-w-full rounded-xl border border-[#00923f]/20 bg-[#00923f]/5 p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-[#00923f]">Modo Admin</h3>

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form: editar roupa */}
        <form
          onSubmit={onSubmitSaveRoupa}
          className="min-w-0 space-y-4 rounded-xl border border-gray-200 bg-white p-4"
        >
          <p className="text-sm font-semibold text-gray-900">Editar roupa</p>
          {err ? <p className="text-sm text-red-700">{err}</p> : null}
          {msg ? <p className="text-sm text-green-700">{msg}</p> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ano</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={form.ano}
                onChange={(e) => setForm({ ...form, ano: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Preço (€)</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={form.precoAluguer}
                onChange={(e) => setForm({ ...form, precoAluguer: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              className="min-h-[11rem] w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm sm:min-h-[9rem]"
              rows={8}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Conjunto inclui</label>
            <textarea
              className="min-h-[8rem] w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm"
              rows={5}
              value={form.conjuntoInclui}
              onChange={(e) => setForm({ ...form, conjuntoInclui: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Regras de lavagem/estado</label>
            <textarea
              className="min-h-[8rem] w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm"
              rows={5}
              value={form.regrasLavagem}
              onChange={(e) => setForm({ ...form, regrasLavagem: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={confirmState.open || confirmBusy}
            className="w-full rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a33] disabled:opacity-60"
          >
            Guardar alterações
          </button>
        </form>

        {/* Form: disponibilidade + intervalos */}
        <div className="min-w-0 space-y-4 rounded-xl border border-gray-200 bg-white p-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Editar disponibilidade</p>
            {dispErr ? <p className="mt-1 text-sm text-red-700">{dispErr}</p> : null}
            {dispMsg ? <p className="mt-1 text-sm text-green-700">{dispMsg}</p> : null}
          </div>

          <form onSubmit={onSubmitAvailability} className="space-y-3">
            <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-3">
              <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-gray-900">Intervalo</div>
                <button
                  type="button"
                  onClick={() => {
                    setDispInicio("");
                    setDispFim("");
                    setAlugNome("");
                    setAlugEmail("");
                    setAlugTelefone("");
                    setAlugObs("");
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                >
                  Limpar
                </button>
              </div>
              <p className="mb-3 text-xs text-gray-600">
                Legenda no calendário da página:{" "}
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded-sm bg-green-500" /> Livre
                </span>
                {", "}
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded-sm bg-red-500" /> Alugada
                </span>
                {", "}
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded-sm bg-orange-400" /> Manutenção
                </span>
                .
              </p>
              <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="min-w-0 w-full max-w-full">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Data de início
                  </label>
                  <div className="flex min-w-0 w-full max-w-full overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-[#00923f] focus-within:ring-2 focus-within:ring-[#00923f]/20">
                    <input
                      type="date"
                      className="ua-date-field h-11 min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-base outline-none sm:h-10 sm:text-sm"
                      value={dispInicio}
                      onChange={(e) => setDispInicio(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="min-w-0 w-full max-w-full">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Data de fim</label>
                  <div className="flex min-w-0 w-full max-w-full overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-[#00923f] focus-within:ring-2 focus-within:ring-[#00923f]/20">
                    <input
                      type="date"
                      className="ua-date-field h-11 min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-base outline-none sm:h-10 sm:text-sm"
                      value={dispFim}
                      onChange={(e) => setDispFim(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <label className="block text-sm font-medium text-gray-700">Estado a aplicar</label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={estadoSelecionado}
                onChange={(e) => setEstadoSelecionado(e.target.value as EstadoDisp)}
              >
                {ESTADOS_DISP.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>

              {estadoSelecionado === "ALUGADA" ? (
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-gray-600">
                    Nome e telefone obrigatórios; email opcional.
                  </p>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      value={alugNome}
                      onChange={(e) => setAlugNome(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Email (opcional)
                    </label>
                    <input
                      type="email"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      value={alugEmail}
                      onChange={(e) => setAlugEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="—"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Telefone</label>
                    <input
                      type="tel"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      value={alugTelefone}
                      onChange={(e) => setAlugTelefone(e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Observações (opcional)
                    </label>
                    <textarea
                      className="mt-1 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      rows={2}
                      value={alugObs}
                      onChange={(e) => setAlugObs(e.target.value)}
                      placeholder="Notas internas ou do cliente"
                    />
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={confirmState.open || confirmBusy}
                className="mt-3 w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
              >
                Atualizar disponibilidade
              </button>
            </div>
          </form>

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Estados da roupa</p>
                <p className="text-sm text-gray-600">ALUGADA e PENDENTE por intervalo.</p>
              </div>
              <button
                type="button"
                onClick={() => void loadIntervalos()}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
              >
                Recarregar
              </button>
            </div>

            {intervalosLoading ? (
              <p className="text-sm text-gray-600">A carregar…</p>
            ) : intervalosError ? (
              <p className="text-sm text-red-700">{intervalosError}</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-red-700">ALUGADA</p>
                  {alugadas.length ? (
                    <ul className="mt-2 space-y-2">
                      {alugadas.map((i) => (
                        <li
                          key={i.reservaId}
                          className="rounded-lg border border-red-100 bg-red-50/20 px-3 py-2 text-sm"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <span className="font-semibold text-red-700">ALUGADA</span>
                              <div className="text-gray-800">
                                {formatKeyPt(i.inicio)} → {formatKeyPt(i.fim)}
                              </div>
                              <p className="mt-1 text-xs text-gray-700">
                                <span className="font-medium">Cliente:</span>{" "}
                                {i.nome || "—"} {i.email ? `(${i.email})` : ""}
                              </p>
                              <p className="mt-1 text-xs text-gray-700">
                                <span className="font-medium">Telefone:</span> {i.telefone || "—"}
                              </p>
                              <p className="mt-1 text-xs text-gray-700">
                                <span className="font-medium">Observações:</span> {i.observacoes || "—"}
                              </p>
                              <p className="mt-1 text-xs text-gray-700">
                                <span className="font-medium">Pagamento:</span>{" "}
                                {labelPagamentoEstado(i.pagamentoEstado)}
                                {normalizePagamentoEstado(i.pagamentoEstado) === "PAGO"
                                  ? ` · ${labelMetodoPagamento(i.metodoPagamento)}`
                                  : ""}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmState({
                                    open: true,
                                    kind: "UPDATE_DISP",
                                    inicioISO: i.inicio,
                                    fimISO: i.fim,
                                    estado: "LIVRE",
                                    reservaId: i.reservaId,
                                  })
                                }
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                              >
                                Eliminar (livre)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmState({
                                    open: true,
                                    kind: "TRANSFER_ALUGADA_TO_PENDENTE",
                                    reservaId: i.reservaId,
                                    inicioISO: i.inicio,
                                    fimISO: i.fim,
                                  })
                                }
                                className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-200"
                              >
                                Trocar para Pendente
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-gray-600">Sem períodos ALUGADA.</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">PENDENTE</p>
                  {pendentes.length ? (
                    <ul className="mt-2 space-y-2">
                      {pendentes.map((i) => (
                        <li
                          key={i.id}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <span className="font-semibold text-gray-800">PENDENTE</span>
                              <div className="text-gray-800">
                                {formatKeyPt(i.inicio)} → {formatKeyPt(i.fim)}
                              </div>
                              {(i.nome || i.email) && (
                                <p className="mt-1 text-xs text-gray-700">
                                  <span className="font-medium">Utilizador:</span>{" "}
                                  {i.nome || "Sem nome"} {i.email ? `(${i.email})` : ""}
                                </p>
                              )}
                              <p className="mt-1 text-xs text-gray-700">
                                <span className="font-medium">Telefone:</span> {i.telefone || "—"}
                              </p>
                              <p className="mt-1 text-xs text-gray-700">
                                <span className="font-medium">Observações:</span> {i.observacoes || "—"}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmState({
                                    open: true,
                                    kind: "DELETE_PENDENTE",
                                    reservaId: i.id,
                                  })
                                }
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                              >
                                Eliminar
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmState({
                                    open: true,
                                    kind: "APROVAR_PENDENTE",
                                    reservaId: i.id,
                                    inicioISO: i.inicio,
                                    fimISO: i.fim,
                                    nota: "",
                                  })
                                }
                                className="rounded-lg bg-[#00923f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#007a33]"
                              >
                                Aprovar
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmState({
                                    open: true,
                                    kind: "REJEITAR_PENDENTE",
                                    reservaId: i.id,
                                  })
                                }
                                className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-200"
                              >
                                Rejeitar
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-gray-600">Sem reservas PENDENTE.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmConfig ? (
        <ConfirmModal
          open={confirmState.open}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmLabel={confirmConfig.confirmLabel}
          cancelLabel={confirmConfig.cancelLabel}
          tone={confirmConfig.tone}
          busy={confirmBusy}
          onClose={() => setConfirmState({ open: false })}
          onConfirm={() => void doConfirmAction()}
          extra={
            confirmState.open && confirmState.kind === "APROVAR_PENDENTE" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Motivo/nota para bloquear como ALUGADA
                </label>
                <textarea
                  className="mt-1 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  rows={3}
                  value={confirmState.nota}
                  onChange={(e) =>
                    setConfirmState({
                      ...confirmState,
                      nota: e.target.value,
                    })
                  }
                  placeholder="Ex: Alugada a rebolido"
                />
              </div>
            ) : undefined
          }
        />
      ) : null}

      {confirmErr && confirmState.open ? (
        <div className="fixed bottom-6 left-1/2 z-[85] w-full max-w-md -translate-x-1/2 px-4">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow">
            {confirmErr}
          </div>
        </div>
      ) : null}
    </div>
  );
}

