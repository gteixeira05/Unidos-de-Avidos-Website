"use client";

import AdminTitulo from "@/components/admin/AdminTitulo";

import { useEffect, useMemo, useState } from "react";
import {
  labelMetodoPagamento,
  labelPagamentoEstado,
  normalizePagamentoEstado,
  type PagamentoEstado,
} from "@/lib/reservaPagamento";
import {
  calcularPrecoReserva,
  formatPrecoAluguerPublico,
  precoBaseDaReserva,
  temArcosOpcionais,
  temCalcado,
  type PrecosRoupa,
} from "@/lib/aluguerRoupasPublic";

export type AdminTab = "reservas" | "alugadas" | "arquivadas" | "avaliacoes" | "utilizadores" | "logs";

export const TITULOS: Record<AdminTab, { titulo: string; descricao: string }> = {
  reservas: { titulo: "Pedidos de reserva", descricao: "Aprovar, rejeitar ou editar pedidos." },
  alugadas: { titulo: "Roupas alugadas", descricao: "Reservas aprovadas: pagamento, caução e devolução." },
  arquivadas: { titulo: "Reservas arquivadas", descricao: "Histórico de reservas concluídas." },
  avaliacoes: { titulo: "Avaliações", descricao: "Aprovar as avaliações antes de aparecerem no site." },
  utilizadores: { titulo: "Utilizadores", descricao: "Contas registadas e permissões de administração." },
  logs: { titulo: "Registo de atividade", descricao: "Ações feitas pela equipa de administração." },
};

// --- Reservas types & content ---
type ReservaAdmin = {
  id: string;
  estado: string;
  dataInicio: string;
  dataFim: string;
  observacoes?: string | null;
  nome?: string | null;
  email?: string | null;
  telefone?: string | null;
  incluiCalcado?: boolean;
  custoExtraCalcado?: number;
  incluiArcos?: boolean;
  custoExtraArcos?: number;
  pagamentoEstado?: string | null;
  metodoPagamento?: string | null;
  caucaoPaga?: boolean;
  caucaoDevolvida?: boolean;
  caucaoDevolvidaEm?: string | null;
  arquivada?: boolean;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
  precoBase?: number | null;
  roupa: PrecosRoupa & { id: string; ano: number; tema: string };
};
const ESTADOS = ["PENDENTE", "APROVADA", "REJEITADA"] as const;

type DeleteReservaConfirmState =
  | { open: false }
  | { open: true; reserva: ReservaAdmin };
type DeleteAlugadaConfirmState =
  | { open: false }
  | { open: true; reserva: ReservaAdmin };
type EditReservaState =
  | { open: false }
  | {
      open: true;
      reserva: ReservaAdmin;
      form: {
        estado: string;
        dataInicio: string;
        dataFim: string;
        nome: string;
        email: string;
        telefone: string;
        observacoes: string;
        incluiCalcado: boolean;
        incluiArcos: boolean;
        pagamentoEstado: string;
        metodoPagamento: string;
      };
    };
function pagamentoAlugadaCompleto(r: ReservaAdmin): boolean {
  if (normalizePagamentoEstado(r.pagamentoEstado) !== "PAGO") return false;
  const m = r.metodoPagamento;
  return m === "DINHEIRO_FISICO" || m === "TRANSFERENCIA_BANCARIA";
}

function precoBaseReservaCard(r: ReservaAdmin): number {
  return precoBaseDaReserva(r);
}

function totalReservaReferencia(r: ReservaAdmin): number {
  return precoBaseReservaCard(r) + Number(r.custoExtraCalcado ?? 0) + Number(r.custoExtraArcos ?? 0);
}

function fmtExtra(custo: number | undefined): string {
  return Number(custo ?? 0) > 0 ? ` (+${Number(custo ?? 0).toFixed(2)} €)` : " (incluído)";
}

function AlugadaPagamentoSoloLeitura({ reserva }: { reserva: ReservaAdmin }) {
  return (
    <div className="mt-3 rounded-lg border border-[#00923f]/25 bg-[#00923f]/5 p-3">
      <p className="text-xs font-semibold text-gray-800">Pagamento</p>
      <p className="mt-1 text-sm text-gray-800">
        <span className="font-medium text-[#00923f]">Paga</span>
        {" · "}
        <span className="font-medium">{labelMetodoPagamento(reserva.metodoPagamento)}</span>
      </p>
      <p className="mt-2 text-xs text-gray-500">
        Para alterar estado ou método de pagamento, use &quot;Editar reserva&quot;.
      </p>
    </div>
  );
}

function AlugadaPagamentoControls({
  reserva,
  onSaved,
}: {
  reserva: ReservaAdmin;
  onSaved: () => void | Promise<void>;
}) {
  const [pe, setPe] = useState<PagamentoEstado>(normalizePagamentoEstado(reserva.pagamentoEstado));
  const [mp, setMp] = useState(() => reserva.metodoPagamento ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setPe(normalizePagamentoEstado(reserva.pagamentoEstado));
    setMp(reserva.metodoPagamento ?? "");
    setErr("");
  }, [reserva.id, reserva.pagamentoEstado, reserva.metodoPagamento]);

  const serverPe = normalizePagamentoEstado(reserva.pagamentoEstado);
  const serverMp = reserva.metodoPagamento ?? "";
  const dirty =
    pe !== serverPe || (pe === "PAGO" && mp !== serverMp);

  async function guardar() {
    setSaving(true);
    setErr("");
    try {
      const res = await fetch(`/api/admin/reservas/${reserva.id}/pagamento`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pagamentoEstado: pe,
          metodoPagamento: pe === "PAGO" ? mp : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao guardar pagamento.");
      await onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs font-semibold text-gray-800">Pagamento</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="block text-xs text-gray-700">
          <span className="mb-0.5 block font-medium">Estado</span>
          <select
            value={pe}
            onChange={(e) => {
              const v = e.target.value as PagamentoEstado;
              setPe(v);
              if (v === "POR_PAGAR") setMp("");
            }}
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="POR_PAGAR">Por pagar</option>
            <option value="PAGO">Paga</option>
          </select>
        </label>
        <label className="block text-xs text-gray-700">
          <span className="mb-0.5 block font-medium">Método (se paga)</span>
          <select
            value={mp}
            onChange={(e) => setMp(e.target.value)}
            disabled={saving || pe !== "PAGO"}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-100"
          >
            <option value="">Escolher…</option>
            <option value="DINHEIRO_FISICO">Dinheiro físico</option>
            <option value="TRANSFERENCIA_BANCARIA">Transferência bancária</option>
          </select>
        </label>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={saving || !dirty || (pe === "PAGO" && !mp)}
          className="rounded-lg bg-[#00923f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#007a33] disabled:opacity-50"
        >
          {saving ? "A guardar…" : "Guardar pagamento"}
        </button>
      </div>
      {err ? <p className="mt-2 text-xs text-red-600">{err}</p> : null}
    </div>
  );
}

function AlugadaCaucaoControls({
  reserva,
  onSaved,
}: {
  reserva: ReservaAdmin;
  onSaved: () => void | Promise<void>;
}) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [paga, setPaga] = useState(Boolean(reserva.caucaoPaga));
  const [devolvida, setDevolvida] = useState(Boolean(reserva.caucaoDevolvida));
  const [data, setData] = useState(() =>
    reserva.caucaoDevolvidaEm ? reserva.caucaoDevolvidaEm.slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setPaga(Boolean(reserva.caucaoPaga));
    setDevolvida(Boolean(reserva.caucaoDevolvida));
    setData(reserva.caucaoDevolvidaEm ? reserva.caucaoDevolvidaEm.slice(0, 10) : "");
    setErr("");
  }, [reserva.id, reserva.caucaoPaga, reserva.caucaoDevolvida, reserva.caucaoDevolvidaEm]);

  const serverPaga = Boolean(reserva.caucaoPaga);
  const serverDevolvida = Boolean(reserva.caucaoDevolvida);
  const serverData = reserva.caucaoDevolvidaEm ? reserva.caucaoDevolvidaEm.slice(0, 10) : "";
  const dirty =
    paga !== serverPaga ||
    devolvida !== serverDevolvida ||
    (devolvida && data !== serverData);
  const podeGuardar = dirty && !saving && (!devolvida || !!data);

  async function guardar() {
    setSaving(true);
    setErr("");
    try {
      const res = await fetch(`/api/admin/reservas/${reserva.id}/caucao`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caucaoPaga: paga,
          caucaoDevolvida: paga ? devolvida : false,
          caucaoDevolvidaEm: paga && devolvida ? data : null,
        }),
      });
      const resp = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resp.error ?? "Erro ao guardar a caução.");
      await onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
      <p className="text-xs font-semibold text-gray-800">Caução (100 €)</p>
      <label className="mt-2 flex items-center gap-2 text-sm text-gray-800">
        <input
          type="checkbox"
          checked={paga}
          onChange={(e) => {
            const v = e.target.checked;
            setPaga(v);
            if (!v) {
              setDevolvida(false);
              setData("");
            }
          }}
          disabled={saving}
          className="h-4 w-4 accent-[#00923f]"
        />
        Caução paga
      </label>
      <label
        className={`mt-2 flex items-center gap-2 text-sm ${paga ? "text-gray-800" : "text-gray-400"}`}
      >
        <input
          type="checkbox"
          checked={devolvida}
          onChange={(e) => {
            const v = e.target.checked;
            setDevolvida(v);
            if (v && !data) setData(hoje);
          }}
          disabled={saving || !paga}
          className="h-4 w-4 accent-[#00923f]"
        />
        Caução devolvida
      </label>
      {!paga ? (
        <p className="mt-1 text-xs text-gray-500">
          A devolução só fica disponível depois de a caução estar paga.
        </p>
      ) : null}
      {devolvida ? (
        <label className="mt-2 block text-xs text-gray-700">
          <span className="mb-0.5 block font-medium">Data de devolução</span>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm sm:w-auto"
          />
        </label>
      ) : null}
      <div className="mt-2">
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={!podeGuardar}
          className="rounded-lg bg-[#00923f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#007a33] disabled:opacity-50"
        >
          {saving ? "A guardar…" : "Guardar caução"}
        </button>
      </div>
      {err ? <p className="mt-2 text-xs text-red-600">{err}</p> : null}
    </div>
  );
}

function AdminPageInner({ tab }: { tab: AdminTab }) {
  // Reservas state
  const [estado, setEstado] = useState<(typeof ESTADOS)[number]>("PENDENTE");
  const [reservas, setReservas] = useState<ReservaAdmin[]>([]);
  const [reservasLoading, setReservasLoading] = useState(false);
  const [reservasError, setReservasError] = useState("");
  const [savingReservaId, setSavingReservaId] = useState<string | null>(null);
  const [deleteReservaState, setDeleteReservaState] = useState<DeleteReservaConfirmState>({
    open: false,
  });
  const [deletingReservaId, setDeletingReservaId] = useState<string | null>(null);
  const [alugadas, setAlugadas] = useState<ReservaAdmin[]>([]);
  const [alugadasLoading, setAlugadasLoading] = useState(false);
  const [alugadasError, setAlugadasError] = useState("");
  const [arquivadas, setArquivadas] = useState<ReservaAdmin[]>([]);
  const [arquivadasLoading, setArquivadasLoading] = useState(false);
  const [arquivadasError, setArquivadasError] = useState("");
  const [arquivandoId, setArquivandoId] = useState<string | null>(null);
  const [editReservaState, setEditReservaState] = useState<EditReservaState>({ open: false });
  const [savingEditReserva, setSavingEditReserva] = useState(false);
  /** Confirmação antes de aplicar PATCH ao guardar edição da reserva */
  const [confirmGuardarReservaOpen, setConfirmGuardarReservaOpen] = useState(false);

  // Utilizadores state
  const [deleteAlugadaState, setDeleteAlugadaState] = useState<DeleteAlugadaConfirmState>({
    open: false,
  });
  const [deleteAlugadaConfirmText, setDeleteAlugadaConfirmText] = useState("");

  const alugadasPorAno = useMemo(() => {
    const groups = new Map<number, ReservaAdmin[]>();
    for (const item of alugadas) {
      if (item.arquivada) continue;
      // Agrupar pelo ano de utilização (data de início da reserva).
      const ano = new Date(item.dataInicio).getFullYear();
      const current = groups.get(ano) ?? [];
      current.push(item);
      groups.set(ano, current);
    }
    const entries = Array.from(groups.entries()).sort((a, b) => b[0] - a[0]);
    // Dentro de cada ano de utilização, ordenar pelo ano da farda (mais recente primeiro).
    for (const [, items] of entries) {
      items.sort((r1, r2) => r2.roupa.ano - r1.roupa.ano);
    }
    return entries;
  }, [alugadas]);

  const arquivadasPorAno = useMemo(() => {
    const groups = new Map<number, ReservaAdmin[]>();
    for (const item of arquivadas) {
      const ano = item.roupa.ano;
      const current = groups.get(ano) ?? [];
      current.push(item);
      groups.set(ano, current);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0] - a[0]);
  }, [arquivadas]);


  // Load reservas when tab is reservas and estado changes
  useEffect(() => {
    if (tab !== "reservas") return;
    let cancelled = false;
    setReservasLoading(true);
    setReservasError("");
    fetch(`/api/admin/reservas?estado=${estado}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setReservas((data.items ?? []) as ReservaAdmin[]);
      })
      .catch(() => {
        if (!cancelled) setReservasError("Erro ao carregar reservas.");
      })
      .finally(() => {
        if (!cancelled) setReservasLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, estado]);

  // Load users when tab is utilizadores and query changes

  // Load alugadas when tab is alugadas
  useEffect(() => {
    if (tab !== "alugadas") return;
    let cancelled = false;
    setAlugadasLoading(true);
    setAlugadasError("");
    fetch("/api/admin/reservas?estado=APROVADA")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setAlugadas((data.items ?? []) as ReservaAdmin[]);
      })
      .catch(() => {
        if (!cancelled) setAlugadasError("Erro ao carregar reservas alugadas.");
      })
      .finally(() => {
        if (!cancelled) setAlugadasLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  // Load avaliacoes when tab is avaliacoes

  // Load arquivadas when tab is arquivadas
  useEffect(() => {
    if (tab !== "arquivadas") return;
    let cancelled = false;
    setArquivadasLoading(true);
    setArquivadasError("");
    fetch("/api/admin/reservas?arquivada=true")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setArquivadas((data.items ?? []) as ReservaAdmin[]);
      })
      .catch(() => {
        if (!cancelled) setArquivadasError("Erro ao carregar reservas arquivadas.");
      })
      .finally(() => {
        if (!cancelled) setArquivadasLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  async function setEstadoReserva(id: string, novoEstado: string) {
    setReservasError("");
    setSavingReservaId(id);
    try {
      const res = await fetch(`/api/admin/reservas/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: novoEstado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao atualizar reserva.");
      // Remove o card da lista se o novo estado não corresponde ao filtro atual
      if (novoEstado !== estado) {
        setReservas((prev) => prev.filter((r) => r.id !== id));
      } else {
        setReservas((prev) =>
          prev.map((r) => (r.id === id ? { ...r, estado: novoEstado } : r))
        );
      }
    } catch (e) {
      setReservasError(e instanceof Error ? e.message : "Ocorreu um erro.");
    } finally {
      setSavingReservaId(null);
    }
  }

  function openDeleteReservaConfirm(reserva: ReservaAdmin) {
    setDeleteReservaState({ open: true, reserva });
  }

  function closeDeleteReservaConfirm() {
    if (deletingReservaId) return;
    setDeleteReservaState({ open: false });
  }

  function openDeleteAlugadaConfirm(reserva: ReservaAdmin) {
    setDeleteAlugadaConfirmText("");
    setDeleteAlugadaState({ open: true, reserva });
  }

  function closeDeleteAlugadaConfirm() {
    if (deletingReservaId) return;
    setDeleteAlugadaConfirmText("");
    setDeleteAlugadaState({ open: false });
  }

  async function deleteReservaPermanente(id: string): Promise<boolean> {
    setReservasError("");
    setAlugadasError("");
    setDeletingReservaId(id);
    try {
      const res = await fetch(`/api/admin/reservas/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao eliminar reserva.");
      setReservas((prev) => prev.filter((r) => r.id !== id));
      await reloadAlugadas();
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ocorreu um erro.";
      setReservasError(msg);
      setAlugadasError(msg);
      return false;
    } finally {
      setDeletingReservaId(null);
    }
  }

  async function reloadReservas() {
    setReservasLoading(true);
    setReservasError("");
    try {
      const res = await fetch(`/api/admin/reservas?estado=${estado}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar reservas.");
      setReservas((data.items ?? []) as ReservaAdmin[]);
    } catch (e) {
      setReservasError(e instanceof Error ? e.message : "Ocorreu um erro.");
    } finally {
      setReservasLoading(false);
    }
  }

  async function reloadAlugadas() {
    setAlugadasLoading(true);
    setAlugadasError("");
    try {
      const res = await fetch("/api/admin/reservas?estado=APROVADA");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar reservas alugadas.");
      setAlugadas((data.items ?? []) as ReservaAdmin[]);
    } catch (e) {
      setAlugadasError(e instanceof Error ? e.message : "Ocorreu um erro.");
    } finally {
      setAlugadasLoading(false);
    }
  }

  async function reloadArquivadas() {
    setArquivadasLoading(true);
    setArquivadasError("");
    try {
      const res = await fetch("/api/admin/reservas?arquivada=true");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar reservas arquivadas.");
      setArquivadas((data.items ?? []) as ReservaAdmin[]);
    } catch (e) {
      setArquivadasError(e instanceof Error ? e.message : "Ocorreu um erro.");
    } finally {
      setArquivadasLoading(false);
    }
  }

  async function arquivarReserva(id: string, arquivar: boolean) {
    setArquivandoId(id);
    setAlugadasError("");
    setArquivadasError("");
    try {
      const res = await fetch(`/api/admin/reservas/${id}/arquivar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arquivada: arquivar }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao arquivar reserva.");
      if (arquivar) {
        setAlugadas((prev) => prev.filter((r) => r.id !== id));
      } else {
        setArquivadas((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ocorreu um erro.";
      setAlugadasError(msg);
      setArquivadasError(msg);
    } finally {
      setArquivandoId(null);
    }
  }

  function openEditReserva(reserva: ReservaAdmin) {
    const toDateInput = (value: string) => {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "";
      return d.toISOString().slice(0, 10);
    };
    setEditReservaState({
      open: true,
      reserva,
      form: {
        estado: reserva.estado,
        dataInicio: toDateInput(reserva.dataInicio),
        dataFim: toDateInput(reserva.dataFim),
        nome: reserva.nome ?? reserva.user?.name ?? "",
        email: reserva.email ?? reserva.user?.email ?? "",
        telefone: reserva.telefone ?? "",
        observacoes: reserva.observacoes ?? "",
        incluiCalcado: Boolean(reserva.incluiCalcado),
        incluiArcos: Boolean(reserva.incluiArcos),
        pagamentoEstado: normalizePagamentoEstado(reserva.pagamentoEstado),
        metodoPagamento: reserva.metodoPagamento ?? "",
      },
    });
  }

  function closeEditReserva() {
    if (savingEditReserva) return;
    setConfirmGuardarReservaOpen(false);
    setEditReservaState({ open: false });
  }

  function abrirConfirmacaoGuardarReserva() {
    if (!editReservaState.open) return;
    if (savingEditReserva) return;
    if (
      editReservaState.form.estado === "APROVADA" &&
      editReservaState.form.pagamentoEstado === "PAGO" &&
      !editReservaState.form.metodoPagamento
    ) {
      return;
    }
    setConfirmGuardarReservaOpen(true);
  }

  async function executarGuardarEdicaoReserva() {
    if (!editReservaState.open) return;
    setConfirmGuardarReservaOpen(false);
    setReservasError("");
    setAlugadasError("");
    setSavingEditReserva(true);
    try {
      const form = editReservaState.form;
      const body: Record<string, unknown> = { ...form };
      if (form.estado !== "APROVADA") {
        delete body.pagamentoEstado;
        delete body.metodoPagamento;
      }
      const res = await fetch(`/api/admin/reservas/${editReservaState.reserva.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao guardar edição da reserva.");
      await Promise.all([reloadReservas(), reloadAlugadas(), reloadArquivadas()]);
      setEditReservaState({ open: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ocorreu um erro.";
      setReservasError(message);
      setAlugadasError(message);
    } finally {
      setSavingEditReserva(false);
    }
  }

  return (
    <div>
      <AdminTitulo titulo={TITULOS[tab].titulo} descricao={TITULOS[tab].descricao} />

      {/* Conteúdo Reservas */}
      {tab === "reservas" && (
        <div className="mt-8">
          <div className="flex flex-wrap gap-2">
            {ESTADOS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEstado(e)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  estado === e
                    ? "bg-[#00923f] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          {reservasError ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {reservasError}
            </div>
          ) : null}

          {reservasLoading ? (
            <p className="mt-6 text-gray-600">A carregar…</p>
          ) : reservas.length ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {reservas.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-sm font-semibold text-[#00923f]">
                    {r.roupa.tema} ({r.roupa.ano})
                  </p>
                  <p className="mt-2 text-sm text-gray-700">
                    <span className="font-medium">Utilizador:</span>{" "}
                    {r.user?.name ?? r.nome ?? "—"} ({r.user?.email ?? r.email ?? "—"})
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    <span className="font-medium">Telefone:</span> {r.telefone ?? "—"}
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    <span className="font-medium">Período:</span>{" "}
                    {new Date(r.dataInicio).toLocaleDateString("pt-PT")} →{" "}
                    {new Date(r.dataFim).toLocaleDateString("pt-PT")}
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    <span className="font-medium">Valor base:</span>{" "}
                    {precoBaseReservaCard(r).toFixed(2)} €
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    <span className="font-medium">Calçado:</span>{" "}
                    {r.incluiCalcado ? `Sim${fmtExtra(r.custoExtraCalcado)}` : "Não"}
                  </p>
                  {r.roupa.ano === 2026 && (
                    <p className="mt-1 text-sm text-gray-700">
                      <span className="font-medium">Arcos:</span>{" "}
                      {r.incluiArcos ? `Sim${fmtExtra(r.custoExtraArcos)}` : "Não"}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-700">
                    <span className="font-medium">Total referência:</span>{" "}
                    {totalReservaReferencia(r).toFixed(2)} €
                  </p>
                  <p className="mt-2 text-sm text-gray-700">
                    <span className="font-medium">Observações:</span> {r.observacoes ?? "—"}
                  </p>
                  {r.estado === "APROVADA" ? (
                    <>
                      <p className="mt-2 text-sm text-gray-700">
                        <span className="font-medium">Pagamento:</span>{" "}
                        {labelPagamentoEstado(r.pagamentoEstado)}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        <span className="font-medium">Método:</span>{" "}
                        {normalizePagamentoEstado(r.pagamentoEstado) === "PAGO"
                          ? labelMetodoPagamento(r.metodoPagamento)
                          : "—"}
                      </p>
                    </>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {estado !== "APROVADA" && (
                      <button
                        type="button"
                        onClick={() => setEstadoReserva(r.id, "APROVADA")}
                        disabled={savingReservaId === r.id}
                        className="rounded-lg bg-[#00923f] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#007a33] disabled:opacity-60"
                      >
                        {savingReservaId === r.id ? "A processar…" : "Aprovar"}
                      </button>
                    )}
                    {estado !== "REJEITADA" && (
                      <button
                        type="button"
                        onClick={() => setEstadoReserva(r.id, "REJEITADA")}
                        disabled={savingReservaId === r.id}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                      >
                        {savingReservaId === r.id ? "A processar…" : "Rejeitar"}
                      </button>
                    )}
                    {estado !== "PENDENTE" && (
                      <button
                        type="button"
                        onClick={() => setEstadoReserva(r.id, "PENDENTE")}
                        disabled={savingReservaId === r.id || deletingReservaId === r.id}
                        className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60"
                      >
                        {savingReservaId === r.id ? "A processar…" : "Marcar pendente"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openDeleteReservaConfirm(r)}
                      disabled={savingReservaId === r.id || deletingReservaId === r.id}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      {deletingReservaId === r.id ? "A eliminar…" : "Eliminar permanentemente"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-gray-700">
              Não há reservas neste estado.
            </div>
          )}
        </div>
      )}

      {/* Conteúdo Alugadas */}
      {tab === "alugadas" && (
        <div className="mt-8">
          <p className="text-sm text-gray-600">
            Lista geral de reservas atualmente alugadas (aprovadas), agrupadas pelo ano de
            utilização (data de início da reserva).
          </p>

          {alugadasError ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {alugadasError}
            </div>
          ) : null}

          {alugadasLoading ? (
            <p className="mt-6 text-gray-600">A carregar…</p>
          ) : alugadasPorAno.length ? (
            <div className="mt-6 space-y-6">
              {alugadasPorAno.map(([ano, items]) => (
                <section key={ano} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900">Ano {ano}</h3>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    {items.map((r) => (
                      <article key={r.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm font-semibold text-[#00923f]">
                          {r.roupa.tema} — {r.roupa.ano}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-medium">Utilizador:</span>{" "}
                          {r.user?.name ?? r.nome ?? "—"} ({r.user?.email ?? r.email ?? "—"})
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-medium">Telefone:</span> {r.telefone ?? "—"}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-medium">Período:</span>{" "}
                          {new Date(r.dataInicio).toLocaleDateString("pt-PT")} →{" "}
                          {new Date(r.dataFim).toLocaleDateString("pt-PT")}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-medium">Valor base:</span>{" "}
                          {precoBaseReservaCard(r).toFixed(2)} €
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-medium">Calçado:</span>{" "}
                          {r.incluiCalcado ? `Sim${fmtExtra(r.custoExtraCalcado)}` : "Não"}
                        </p>
                        {r.roupa.ano === 2026 && (
                          <p className="mt-1 text-sm text-gray-700">
                            <span className="font-medium">Arcos:</span>{" "}
                            {r.incluiArcos ? `Sim${fmtExtra(r.custoExtraArcos)}` : "Não"}
                          </p>
                        )}
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-medium">Total referência:</span>{" "}
                          {totalReservaReferencia(r).toFixed(2)} €
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-medium">Observações:</span> {r.observacoes ?? "—"}
                        </p>
                        {pagamentoAlugadaCompleto(r) ? (
                          <AlugadaPagamentoSoloLeitura reserva={r} />
                        ) : (
                          <AlugadaPagamentoControls reserva={r} onSaved={() => void reloadAlugadas()} />
                        )}
                        <AlugadaCaucaoControls reserva={r} onSaved={() => void reloadAlugadas()} />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openEditReserva(r)}
                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                          >
                            Editar reserva
                          </button>
                          <button
                            type="button"
                            onClick={() => void arquivarReserva(r.id, true)}
                            disabled={arquivandoId === r.id}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                          >
                            {arquivandoId === r.id ? "A arquivar…" : "Arquivar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteAlugadaConfirm(r)}
                            disabled={deletingReservaId === r.id}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                          >
                            {deletingReservaId === r.id ? "A eliminar…" : "Eliminar reserva"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-gray-700">
              Ainda não existem reservas alugadas.
            </div>
          )}
        </div>
      )}

      {/* Conteúdo Arquivadas */}
      {tab === "arquivadas" && (
        <div className="mt-8">
          <p className="text-sm text-gray-600">
            Reservas arquivadas. Podem ser editadas ou desarquivadas para voltarem às reservas alugadas.
          </p>

          {arquivadasError ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {arquivadasError}
            </div>
          ) : null}

          {arquivadasLoading ? (
            <p className="mt-6 text-gray-600">A carregar…</p>
          ) : arquivadasPorAno.length ? (
            <div className="mt-6 space-y-6">
              {arquivadasPorAno.map(([ano, items]) => (
                <section key={ano} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900">Ano {ano}</h3>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    {items.map((r) => (
                      <article key={r.id} className="rounded-lg border border-amber-100 bg-amber-50/50 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                            Arquivada
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-[#00923f]">{r.roupa.tema}</p>
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-medium">Utilizador:</span>{" "}
                          {r.user?.name ?? r.nome ?? "—"} ({r.user?.email ?? r.email ?? "—"})
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-medium">Telefone:</span> {r.telefone ?? "—"}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-medium">Período:</span>{" "}
                          {new Date(r.dataInicio).toLocaleDateString("pt-PT")} →{" "}
                          {new Date(r.dataFim).toLocaleDateString("pt-PT")}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-medium">Valor base:</span>{" "}
                          {precoBaseReservaCard(r).toFixed(2)} €
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-medium">Calçado:</span>{" "}
                          {r.incluiCalcado ? `Sim${fmtExtra(r.custoExtraCalcado)}` : "Não"}
                        </p>
                        {r.roupa.ano === 2026 && (
                          <p className="mt-1 text-sm text-gray-700">
                            <span className="font-medium">Arcos:</span>{" "}
                            {r.incluiArcos ? `Sim${fmtExtra(r.custoExtraArcos)}` : "Não"}
                          </p>
                        )}
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-medium">Total referência:</span>{" "}
                          {totalReservaReferencia(r).toFixed(2)} €
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-medium">Pagamento:</span>{" "}
                          {labelPagamentoEstado(r.pagamentoEstado)}
                          {normalizePagamentoEstado(r.pagamentoEstado) === "PAGO"
                            ? ` · ${labelMetodoPagamento(r.metodoPagamento)}`
                            : ""}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-medium">Caução:</span>{" "}
                          {r.caucaoPaga
                            ? r.caucaoDevolvida
                              ? `Devolvida${r.caucaoDevolvidaEm ? ` em ${new Date(r.caucaoDevolvidaEm).toLocaleDateString("pt-PT")}` : ""}`
                              : "Paga (por devolver)"
                            : "Por pagar"}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-medium">Observações:</span> {r.observacoes ?? "—"}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openEditReserva(r)}
                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                          >
                            Editar reserva
                          </button>
                          <button
                            type="button"
                            onClick={() => void arquivarReserva(r.id, false)}
                            disabled={arquivandoId === r.id}
                            className="rounded-lg border border-[#00923f]/30 bg-[#00923f]/10 px-3 py-1.5 text-xs font-semibold text-[#00923f] hover:bg-[#00923f]/20 disabled:opacity-60"
                          >
                            {arquivandoId === r.id ? "A desarquivar…" : "Desarquivar"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-gray-700">
              Não existem reservas arquivadas.
            </div>
          )}
        </div>
      )}

      {/* Modal de edição de reserva — corpo com scroll; botões sempre visíveis (mobile) */}
      {editReservaState.open && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-reserva-titulo"
        >
          <button
            type="button"
            onClick={closeEditReserva}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
          />
          <div
            className="relative flex max-h-[min(92dvh,92vh)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl sm:max-h-[min(88vh,720px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-gray-100 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
              <h2 id="edit-reserva-titulo" className="text-lg font-bold text-gray-900">
                Editar reserva
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {editReservaState.reserva.roupa.tema} ({editReservaState.reserva.roupa.ano})
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-700">Estado</span>
                <select
                  value={editReservaState.form.estado}
                  onChange={(e) =>
                    setEditReservaState((prev) =>
                      prev.open ? { ...prev, form: { ...prev.form, estado: e.target.value } } : prev
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm"
                >
                  <option value="PENDENTE">PENDENTE</option>
                  <option value="APROVADA">APROVADA</option>
                  <option value="REJEITADA">REJEITADA</option>
                  <option value="CANCELADA">CANCELADA</option>
                </select>
              </label>
              {(() => {
                const r = editReservaState.reserva;
                const f = editReservaState.form;
                const preco = calcularPrecoReserva(r.roupa, f.dataInicio, { calcado: f.incluiCalcado, arcos: f.incluiArcos });
                const precoBase = preco.precoBase;
                const total = preco.total;
                const preEvt2026 = preco.tudoIncluido;
                return (
                  <>
                    <div className="text-sm text-gray-700">
                      <span className="mb-1 block font-medium text-gray-700">Valor base</span>
                      <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-base sm:text-sm">
                        {formatPrecoAluguerPublico(precoBase)}
                        {preEvt2026 && <span className="ml-1 text-xs text-gray-400">(tudo incluído)</span>}
                      </p>
                    </div>
                    <div className="text-sm text-gray-700">
                      <span className="mb-1 block font-medium text-gray-700">Total referência</span>
                      <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-semibold text-base sm:text-sm">
                        {formatPrecoAluguerPublico(total)}
                      </p>
                    </div>
                  </>
                );
              })()}
              <label className="min-w-0 text-sm">
                <span className="mb-1 block font-medium text-gray-700">Data início</span>
                <div className="flex min-w-0 overflow-hidden rounded-lg border border-gray-300 focus-within:border-[#00923f] focus-within:ring-1 focus-within:ring-[#00923f]">
                  <input
                    type="date"
                    value={editReservaState.form.dataInicio}
                    onChange={(e) =>
                      setEditReservaState((prev) =>
                        prev.open ? { ...prev, form: { ...prev.form, dataInicio: e.target.value } } : prev
                      )
                    }
                    className="ua-date-field h-11 min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-base outline-none sm:h-10 sm:text-sm"
                  />
                </div>
              </label>
              <label className="min-w-0 text-sm">
                <span className="mb-1 block font-medium text-gray-700">Data fim</span>
                <div className="flex min-w-0 overflow-hidden rounded-lg border border-gray-300 focus-within:border-[#00923f] focus-within:ring-1 focus-within:ring-[#00923f]">
                  <input
                    type="date"
                    value={editReservaState.form.dataFim}
                    onChange={(e) =>
                      setEditReservaState((prev) =>
                        prev.open ? { ...prev, form: { ...prev.form, dataFim: e.target.value } } : prev
                      )
                    }
                    className="ua-date-field h-11 min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-base outline-none sm:h-10 sm:text-sm"
                  />
                </div>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-700">Nome</span>
                <input
                  type="text"
                  value={editReservaState.form.nome}
                  onChange={(e) =>
                    setEditReservaState((prev) =>
                      prev.open ? { ...prev, form: { ...prev.form, nome: e.target.value } } : prev
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-700">Email</span>
                <input
                  type="email"
                  value={editReservaState.form.email}
                  onChange={(e) =>
                    setEditReservaState((prev) =>
                      prev.open ? { ...prev, form: { ...prev.form, email: e.target.value } } : prev
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-gray-700">Telefone</span>
                <input
                  type="text"
                  value={editReservaState.form.telefone}
                  onChange={(e) =>
                    setEditReservaState((prev) =>
                      prev.open ? { ...prev, form: { ...prev.form, telefone: e.target.value } } : prev
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-gray-700">Observações</span>
                <textarea
                  rows={3}
                  value={editReservaState.form.observacoes}
                  onChange={(e) =>
                    setEditReservaState((prev) =>
                      prev.open ? { ...prev, form: { ...prev.form, observacoes: e.target.value } } : prev
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm"
                />
              </label>
              {(() => {
                const r = editReservaState.reserva;
                const f = editReservaState.form;
                const preco = calcularPrecoReserva(r.roupa, f.dataInicio, { calcado: true, arcos: true });
                const extras = [
                  { key: "incluiCalcado" as const, label: "Calçado", ok: temCalcado(r.roupa), custo: preco.custoExtraCalcado },
                  { key: "incluiArcos" as const, label: "Arcos", ok: temArcosOpcionais(r.roupa), custo: preco.custoExtraArcos },
                ];
                return (
                  <>
                    {extras.map((x) => (
                      <div key={x.key} className="text-sm sm:col-span-2">
                        <span className="mb-1 block font-medium text-gray-700">{x.label}</span>
                        {x.ok ? (
                          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                            <label className="flex items-center justify-between gap-3 text-sm text-gray-700">
                              <span>
                                Incluir {x.label.toLowerCase()} nesta reserva
                                <span className="ml-1 text-xs text-gray-500">
                                  ({preco.tudoIncluido ? "incluído no preço" : `+${formatPrecoAluguerPublico(x.custo)}`})
                                </span>
                              </span>
                              <input
                                type="checkbox"
                                checked={f[x.key]}
                                onChange={(e) =>
                                  setEditReservaState((prev) =>
                                    prev.open ? { ...prev, form: { ...prev.form, [x.key]: e.target.checked } } : prev
                                  )
                                }
                                className="h-4 w-4 accent-[#00923f]"
                              />
                            </label>
                          </div>
                        ) : (
                          <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                            Não disponível para esta roupa.
                          </p>
                        )}
                      </div>
                    ))}
                  </>
                );
              })()}
              {editReservaState.form.estado === "APROVADA" ? (
                <>
                  <label className="text-sm">
                    <span className="mb-1 block font-medium text-gray-700">Pagamento</span>
                    <select
                      value={editReservaState.form.pagamentoEstado}
                      onChange={(e) =>
                        setEditReservaState((prev) =>
                          prev.open
                            ? {
                                ...prev,
                                form: {
                                  ...prev.form,
                                  pagamentoEstado: e.target.value,
                                  metodoPagamento:
                                    e.target.value === "POR_PAGAR" ? "" : prev.form.metodoPagamento,
                                },
                              }
                            : prev
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm"
                    >
                      <option value="POR_PAGAR">Por pagar</option>
                      <option value="PAGO">Paga</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block font-medium text-gray-700">Método (se paga)</span>
                    <select
                      value={editReservaState.form.metodoPagamento}
                      onChange={(e) =>
                        setEditReservaState((prev) =>
                          prev.open
                            ? { ...prev, form: { ...prev.form, metodoPagamento: e.target.value } }
                            : prev
                        )
                      }
                      disabled={editReservaState.form.pagamentoEstado !== "PAGO"}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm disabled:bg-gray-100"
                    >
                      <option value="">Escolher…</option>
                      <option value="DINHEIRO_FISICO">Dinheiro físico</option>
                      <option value="TRANSFERENCIA_BANCARIA">Transferência bancária</option>
                    </select>
                  </label>
                </>
              ) : null}
            </div>
            </div>
            <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3 sm:px-5 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeEditReserva}
                  disabled={savingEditReserva}
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={abrirConfirmacaoGuardarReserva}
                  disabled={
                    savingEditReserva ||
                    (editReservaState.form.estado === "APROVADA" &&
                      editReservaState.form.pagamentoEstado === "PAGO" &&
                      !editReservaState.form.metodoPagamento)
                  }
                  className="flex-1 rounded-lg bg-[#00923f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#007a33] disabled:opacity-60"
                >
                  {savingEditReserva ? "A guardar…" : "Guardar alterações"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação antes de guardar edição da reserva */}
      {confirmGuardarReservaOpen && editReservaState.open ? (
        <div
          className="fixed inset-0 z-[72] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-guardar-reserva-titulo"
        >
          <button
            type="button"
            onClick={() => setConfirmGuardarReservaOpen(false)}
            className="absolute inset-0 bg-black/50"
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-[#00923f]/5 p-5">
              <p className="text-sm font-semibold text-[#00923f]">Confirmar ação</p>
              <h2 id="confirm-guardar-reserva-titulo" className="mt-1 text-lg font-bold text-gray-900">
                Guardar alterações à reserva?
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {editReservaState.reserva.roupa.tema}{" "}
                <span className="text-gray-500">({editReservaState.reserva.roupa.ano})</span>
              </p>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700">
                Os dados editados vão substituir os que estavam guardados. Quer guardar estas alterações?
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setConfirmGuardarReservaOpen(false)}
                  disabled={savingEditReserva}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                >
                  Não, voltar
                </button>
                <button
                  type="button"
                  onClick={() => void executarGuardarEdicaoReserva()}
                  disabled={savingEditReserva}
                  className="rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a33] disabled:opacity-60"
                >
                  {savingEditReserva ? "A guardar…" : "Sim, guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal de confirmação (eliminar reserva alugada + libertar datas) */}
      {deleteAlugadaState.open && (
        <div
          className="fixed inset-0 z-[68] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={closeDeleteAlugadaConfirm}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-red-100 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-700">Ação crítica</p>
              <h2 className="mt-1 text-lg font-bold text-gray-900">Eliminar reserva alugada?</h2>
              <p className="mt-2 text-sm text-gray-700">
                A reserva será removida e as datas do calendário ficarão <strong>livres</strong>, exceto
                dias ainda cobertos por outra reserva aprovada ou em manutenção.
              </p>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{deleteAlugadaState.reserva.roupa.tema}</span> (
                {deleteAlugadaState.reserva.roupa.ano}) —{" "}
                {new Date(deleteAlugadaState.reserva.dataInicio).toLocaleDateString("pt-PT")} →{" "}
                {new Date(deleteAlugadaState.reserva.dataFim).toLocaleDateString("pt-PT")}
              </p>
              <p className="text-xs text-gray-600">
                Para confirmar, escreva <span className="font-bold">ELIMINAR</span> no campo abaixo.
              </p>
              <input
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={deleteAlugadaConfirmText}
                onChange={(e) => setDeleteAlugadaConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                className="ua-ios-confirm-input w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeDeleteAlugadaConfirm}
                  disabled={deletingReservaId === deleteAlugadaState.reserva.id}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!deleteAlugadaState.open) return;
                    const id = deleteAlugadaState.reserva.id;
                    const ok = await deleteReservaPermanente(id);
                    if (ok) closeDeleteAlugadaConfirm();
                  }}
                  disabled={
                    deletingReservaId === deleteAlugadaState.reserva.id ||
                    deleteAlugadaConfirmText.trim().toUpperCase() !== "ELIMINAR"
                  }
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deletingReservaId === deleteAlugadaState.reserva.id ? "A eliminar…" : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação (eliminação de reserva) */}
      {deleteReservaState.open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={closeDeleteReservaConfirm}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-red-100 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-700">Atenção</p>
              <h2 className="mt-1 text-lg font-bold text-gray-900">
                Eliminar pedido de reserva?
              </h2>
              <p className="mt-2 text-sm text-gray-700">
                Esta ação é permanente e remove o pedido da base de dados.
              </p>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{deleteReservaState.reserva.roupa.tema}</span>{" "}
                ({deleteReservaState.reserva.roupa.ano}) —{" "}
                {new Date(deleteReservaState.reserva.dataInicio).toLocaleDateString("pt-PT")} →{" "}
                {new Date(deleteReservaState.reserva.dataFim).toLocaleDateString("pt-PT")}
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeDeleteReservaConfirm}
                  disabled={deletingReservaId === deleteReservaState.reserva.id}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const { reserva } = deleteReservaState;
                    const ok = await deleteReservaPermanente(reserva.id);
                    if (ok) closeDeleteReservaConfirm();
                  }}
                  disabled={deletingReservaId === deleteReservaState.reserva.id}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deletingReservaId === deleteReservaState.reserva.id
                    ? "A eliminar…"
                    : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPainel({ tab }: { tab: AdminTab }) {
  return <AdminPageInner tab={tab} />;
}
