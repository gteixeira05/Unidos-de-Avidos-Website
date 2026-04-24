"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { isSuperAdminEmail } from "@/lib/super-admin";
import {
  labelMetodoPagamento,
  labelPagamentoEstado,
  normalizePagamentoEstado,
  type PagamentoEstado,
} from "@/lib/reservaPagamento";
import {
  getPrecoCalcadoPorAno,
  temCalcadoDisponivel,
} from "@/lib/aluguerRoupasPublic";

type AdminTab = "reservas" | "alugadas" | "utilizadores" | "logs";

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
  pagamentoEstado?: string | null;
  metodoPagamento?: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
  roupa: { id: string; ano: number; tema: string; precoAluguer: number };
};
const ESTADOS = ["PENDENTE", "APROVADA", "REJEITADA"] as const;

// --- Utilizadores types ---
type UserItem = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
};

function userRoleLabel(u: UserItem): string {
  return isSuperAdminEmail(u.email) ? "SUPER_ADMIN" : u.role;
}

function userRoleBadgeClass(u: UserItem): string {
  if (isSuperAdminEmail(u.email)) return "bg-amber-100 text-amber-900";
  return u.role === "ADMIN"
    ? "bg-[#00923f]/10 text-[#00923f]"
    : "bg-gray-100 text-gray-700";
}

type ConfirmState =
  | { open: false }
  | { open: true; user: UserItem; targetRole: "USER" | "ADMIN" };
type DeleteUserConfirmState = | { open: false } | { open: true; user: UserItem };
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
        pagamentoEstado: string;
        metodoPagamento: string;
      };
    };
type AdminLogItem = {
  id: string;
  actorEmail: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  description?: string | null;
  createdAt: string;
};
type LogFilters = {
  actions: string[];
  entityTypes: string[];
  actors: { actorUserId: string; label: string }[];
};
type LogsApiResponse = {
  items: AdminLogItem[];
  nextCursor: string | null;
  filters: LogFilters;
};

/** Pagamento considerado fechado: paga com método válido (só editável no modal "Editar reserva"). */
function pagamentoAlugadaCompleto(r: ReservaAdmin): boolean {
  if (normalizePagamentoEstado(r.pagamentoEstado) !== "PAGO") return false;
  const m = r.metodoPagamento;
  return m === "DINHEIRO_FISICO" || m === "TRANSFERENCIA_BANCARIA";
}

function totalReservaReferencia(r: ReservaAdmin): number {
  return Number(r.roupa.precoAluguer) + Number(r.custoExtraCalcado ?? 0);
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

function AdminPageInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab =
    tabParam === "utilizadores" ||
    tabParam === "reservas" ||
    tabParam === "alugadas" ||
    tabParam === "logs"
      ? tabParam
      : "reservas";
  const [tab, setTab] = useState<AdminTab>(initialTab);

  useEffect(() => {
    if (
      tabParam === "utilizadores" ||
      tabParam === "reservas" ||
      tabParam === "alugadas" ||
      tabParam === "logs"
    ) {
      setTab(tabParam);
    }
  }, [tabParam]);

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
  const [editReservaState, setEditReservaState] = useState<EditReservaState>({ open: false });
  const [savingEditReserva, setSavingEditReserva] = useState(false);
  /** Confirmação antes de aplicar PATCH ao guardar edição da reserva */
  const [confirmGuardarReservaOpen, setConfirmGuardarReservaOpen] = useState(false);

  // Utilizadores state
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [confirmState, setConfirmState] = useState<ConfirmState>({ open: false });
  const [roleSavingId, setRoleSavingId] = useState<string | null>(null);
  const [deleteUserState, setDeleteUserState] = useState<DeleteUserConfirmState>({ open: false });
  const [deleteUserConfirmText, setDeleteUserConfirmText] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deleteAlugadaState, setDeleteAlugadaState] = useState<DeleteAlugadaConfirmState>({
    open: false,
  });
  const [deleteAlugadaConfirmText, setDeleteAlugadaConfirmText] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [logs, setLogs] = useState<AdminLogItem[]>([]);
  const [logsError, setLogsError] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsNextCursor, setLogsNextCursor] = useState<string | null>(null);
  const [logsPageSize, setLogsPageSize] = useState(50);
  const [logsLoadingMore, setLogsLoadingMore] = useState(false);
  const [logsFilters, setLogsFilters] = useState<LogFilters>({
    actions: [],
    entityTypes: [],
    actors: [],
  });
  const [logsQ, setLogsQ] = useState("");
  /** Texto de pesquisa aplicado ao pedido (debounce para não disparar corrida de pedidos). */
  const [logsQDebounced, setLogsQDebounced] = useState("");
  const [logsAction, setLogsAction] = useState("");
  const [logsEntityType, setLogsEntityType] = useState("");
  const [logsActorUserId, setLogsActorUserId] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setLogsQDebounced(logsQ.trim()), 350);
    return () => window.clearTimeout(t);
  }, [logsQ]);

  const query = useMemo(() => q.trim(), [q]);
  const alugadasPorAno = useMemo(() => {
    const groups = new Map<number, ReservaAdmin[]>();
    for (const item of alugadas) {
      const ano = item.roupa.ano;
      const current = groups.get(ano) ?? [];
      current.push(item);
      groups.set(ano, current);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0] - a[0]);
  }, [alugadas]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setIsSuperAdmin(d?.user?.role === "SUPER_ADMIN");
      })
      .catch(() => {
        if (!cancelled) setIsSuperAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
  useEffect(() => {
    if (tab !== "utilizadores") return;
    let cancelled = false;
    setUsersLoading(true);
    setUsersError("");
    fetch(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setUsers((data.items ?? []) as UserItem[]);
      })
      .catch(() => {
        if (!cancelled) setUsersError("Erro ao carregar utilizadores.");
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, query]);

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

  useEffect(() => {
    if (tab !== "logs" || !isSuperAdmin) return;
    let cancelled = false;
    setLogsLoading(true);
    setLogsError("");
    setLogsNextCursor(null);
    const sp = new URLSearchParams();
    if (logsQDebounced) sp.set("q", logsQDebounced);
    if (logsAction) sp.set("action", logsAction);
    if (logsEntityType) sp.set("entityType", logsEntityType);
    if (logsActorUserId) sp.set("actorUserId", logsActorUserId);
    sp.set("pageSize", String(logsPageSize));

    fetch(`/api/admin/logs?${sp.toString()}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error ?? "Erro ao carregar logs.");
        return data as LogsApiResponse;
      })
      .then((data) => {
        if (cancelled) return;
        setLogs((data.items ?? []) as AdminLogItem[]);
        setLogsNextCursor(data.nextCursor ?? null);
        setLogsFilters(
          (data.filters as LogFilters) ?? { actions: [], entityTypes: [], actors: [] }
        );
      })
      .catch((e) => {
        if (!cancelled) setLogsError(e instanceof Error ? e.message : "Erro ao carregar logs.");
      })
      .finally(() => {
        if (!cancelled) setLogsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, isSuperAdmin, logsQDebounced, logsAction, logsEntityType, logsActorUserId, logsPageSize]);

  async function loadMoreLogs() {
    if (!logsNextCursor || logsLoadingMore || logsLoading) return;
    setLogsLoadingMore(true);
    setLogsError("");
    try {
      const sp = new URLSearchParams();
      if (logsQDebounced) sp.set("q", logsQDebounced);
      if (logsAction) sp.set("action", logsAction);
      if (logsEntityType) sp.set("entityType", logsEntityType);
      if (logsActorUserId) sp.set("actorUserId", logsActorUserId);
      sp.set("pageSize", String(logsPageSize));
      sp.set("cursor", logsNextCursor);
      const res = await fetch(`/api/admin/logs?${sp.toString()}`);
      const data = (await res.json().catch(() => ({}))) as Partial<LogsApiResponse> & {
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar mais logs.");
      setLogs((prev) => [...prev, ...((data.items ?? []) as AdminLogItem[])]);
      setLogsNextCursor((data.nextCursor as string | null) ?? null);
      // filtros não mudam, mas se vierem atualizados aceitamos
      if (data.filters) setLogsFilters(data.filters as LogFilters);
    } catch (e) {
      setLogsError(e instanceof Error ? e.message : "Erro ao carregar mais logs.");
    } finally {
      setLogsLoadingMore(false);
    }
  }

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

  async function setRole(id: string, role: "USER" | "ADMIN") {
    setUsersError("");
    setRoleSavingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao atualizar role.");
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: data.user.role } : u))
      );
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : "Ocorreu um erro.");
    } finally {
      setRoleSavingId(null);
    }
  }

  function openConfirm(user: UserItem, targetRole: "USER" | "ADMIN") {
    setConfirmState({ open: true, user, targetRole });
  }
  function closeConfirm() {
    setConfirmState({ open: false });
  }

  function openDeleteUserConfirm(user: UserItem) {
    setDeleteUserConfirmText("");
    setDeleteUserState({ open: true, user });
  }

  function closeDeleteUserConfirm() {
    if (deletingUserId) return;
    setDeleteUserConfirmText("");
    setDeleteUserState({ open: false });
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
      await Promise.all([reloadReservas(), reloadAlugadas()]);
      setEditReservaState({ open: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ocorreu um erro.";
      setReservasError(message);
      setAlugadasError(message);
    } finally {
      setSavingEditReserva(false);
    }
  }

  async function reloadUsers() {
    setUsersLoading(true);
    setUsersError("");
    try {
      const res = await fetch(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar utilizadores.");
      setUsers((data.items ?? []) as UserItem[]);
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : "Ocorreu um erro.");
    } finally {
      setUsersLoading(false);
    }
  }

  async function deleteUserPermanente(id: string) {
    setUsersError("");
    setDeletingUserId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao eliminar utilizador.");
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setDeleteUserState({ open: false });
      setDeleteUserConfirmText("");
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : "Ocorreu um erro.");
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Admin</h1>
      <p className="mt-4 text-lg text-gray-600">Ferramentas de gestão.</p>

      <div className="mt-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("reservas")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === "reservas"
              ? "bg-[#00923f] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Gerir Reservas
        </button>
        <button
          type="button"
          onClick={() => setTab("alugadas")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === "alugadas"
              ? "bg-[#00923f] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Reservas Alugadas
        </button>
        <button
          type="button"
          onClick={() => setTab("utilizadores")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === "utilizadores"
              ? "bg-[#00923f] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Gerir Utilizadores
        </button>
        {isSuperAdmin ? (
          <button
            type="button"
            onClick={() => setTab("logs")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === "logs"
                ? "bg-[#00923f] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Logs
          </button>
        ) : null}
      </div>

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
                    {Number(r.roupa.precoAluguer).toFixed(2)} €
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    <span className="font-medium">Calçado:</span>{" "}
                    {r.incluiCalcado
                      ? `Sim (+${Number(r.custoExtraCalcado ?? 0).toFixed(2)} €)`
                      : "Não"}
                  </p>
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
            Lista geral de reservas atualmente alugadas (aprovadas), agrupadas por ano.
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
                          {Number(r.roupa.precoAluguer).toFixed(2)} €
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-medium">Calçado:</span>{" "}
                          {r.incluiCalcado
                            ? `Sim (+${Number(r.custoExtraCalcado ?? 0).toFixed(2)} €)`
                            : "Não"}
                        </p>
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

      {/* Conteúdo Utilizadores */}
      {tab === "utilizadores" && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar por nome ou email…"
              className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2"
            />
            <button
              type="button"
              onClick={reloadUsers}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
            >
              Recarregar
            </button>
          </div>

          {usersError ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {usersError}
            </div>
          ) : null}

          {usersLoading ? (
            <p className="mt-6 text-gray-600">A carregar…</p>
          ) : (
            <>
              <div className="mt-6 grid gap-3 md:hidden">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {u.name}
                        </p>
                        <p className="truncate text-sm text-gray-600">{u.email}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${userRoleBadgeClass(u)}`}
                      >
                        {userRoleLabel(u)}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {isSuperAdminEmail(u.email) ? (
                        <span className="w-full rounded-lg bg-gray-50 px-3 py-2 text-center text-xs text-gray-600">
                          Super Admin (email)
                        </span>
                      ) : u.role === "ADMIN" ? (
                        <button
                          type="button"
                          onClick={() => openConfirm(u, "USER")}
                          disabled={roleSavingId === u.id}
                          className="w-full rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                        >
                          {roleSavingId === u.id ? "A atualizar…" : "Remover admin"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openConfirm(u, "ADMIN")}
                          disabled={roleSavingId === u.id}
                          className="w-full rounded-lg bg-[#00923f] px-3 py-2 text-sm font-semibold text-white hover:bg-[#007a33] disabled:opacity-60"
                        >
                          {roleSavingId === u.id ? "A atualizar…" : "Promover a admin"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openDeleteUserConfirm(u)}
                        disabled={
                          roleSavingId === u.id ||
                          deletingUserId === u.id ||
                          isSuperAdminEmail(u.email)
                        }
                        className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                      >
                        {deletingUserId === u.id ? "A eliminar…" : "Eliminar"}
                      </button>
                    </div>
                  </div>
                ))}
                {!users.length ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-700">
                    Sem utilizadores encontrados.
                  </div>
                ) : null}
              </div>

              <div className="mt-6 hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Nome</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                        <td className="px-4 py-3 text-gray-700">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${userRoleBadgeClass(u)}`}
                          >
                            {userRoleLabel(u)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            {isSuperAdminEmail(u.email) ? (
                              <span className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                                —
                              </span>
                            ) : u.role === "ADMIN" ? (
                              <button
                                type="button"
                                onClick={() => openConfirm(u, "USER")}
                                disabled={roleSavingId === u.id}
                                className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                              >
                                {roleSavingId === u.id ? "A atualizar…" : "Despromover"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openConfirm(u, "ADMIN")}
                                disabled={roleSavingId === u.id}
                                className="rounded-lg bg-[#00923f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#007a33] disabled:opacity-60"
                              >
                                {roleSavingId === u.id ? "A atualizar…" : "Promover"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openDeleteUserConfirm(u)}
                              disabled={
                                roleSavingId === u.id ||
                                deletingUserId === u.id ||
                                isSuperAdminEmail(u.email)
                              }
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                            >
                              {deletingUserId === u.id ? "A eliminar…" : "Eliminar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!users.length ? (
                      <tr>
                        <td className="px-4 py-6 text-gray-600" colSpan={4}>
                          Sem utilizadores encontrados.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "logs" && isSuperAdmin && (
        <div className="mt-8">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <input
              value={logsQ}
              onChange={(e) => setLogsQ(e.target.value)}
              placeholder="Pesquisar (ator, ação, descrição)"
              className="min-w-0 w-full rounded-lg border border-gray-300 px-4 py-2"
            />
            <select
              value={logsAction}
              onChange={(e) => setLogsAction(e.target.value)}
              className="min-w-0 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
            >
              <option value="">Todas as ações</option>
              {logsFilters.actions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              value={logsEntityType}
              onChange={(e) => setLogsEntityType(e.target.value)}
              className="min-w-0 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
            >
              <option value="">Todas as entidades</option>
              {logsFilters.entityTypes.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              value={logsActorUserId}
              onChange={(e) => setLogsActorUserId(e.target.value)}
              className="min-w-0 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
            >
              <option value="">Todos os admins</option>
              {logsFilters.actors.map((actor) => (
                <option key={actor.actorUserId} value={actor.actorUserId}>
                  {actor.label}
                </option>
              ))}
            </select>
            <select
              value={String(logsPageSize)}
              onChange={(e) => setLogsPageSize(Number(e.target.value) || 50)}
              className="min-w-0 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
              title="Logs por página"
            >
              <option value="25">25 / página</option>
              <option value="50">50 / página</option>
              <option value="100">100 / página</option>
            </select>
          </div>

          {logsError ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {logsError}
            </div>
          ) : null}

          {logsLoading ? (
            <p className="mt-6 text-gray-600">A carregar logs…</p>
          ) : logs.length ? (
            <>
              <div className="mt-6 grid gap-3 md:hidden">
                {logs.map((log) => (
                  <article
                    key={log.id}
                    className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#00923f]">
                      {new Date(log.createdAt).toLocaleString("pt-PT")}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{log.actorName}</p>
                    <p className="break-all text-xs text-gray-600">{log.actorEmail}</p>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Ação</p>
                        <p className="break-all font-medium text-gray-800">{log.action}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Entidade</p>
                        <p className="break-all font-medium text-gray-800">{log.entityType}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-500">ID</p>
                      <p className="break-all font-mono text-xs text-gray-700">
                        {log.entityId ?? "—"}
                      </p>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-500">Descrição</p>
                      <p className="text-sm text-gray-700">{log.description ?? "—"}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-6 hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm md:block">
                <table className="min-w-[980px] text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Data</th>
                      <th className="px-4 py-3 font-semibold">Admin</th>
                      <th className="px-4 py-3 font-semibold">Ação</th>
                      <th className="px-4 py-3 font-semibold">Entidade</th>
                      <th className="px-4 py-3 font-semibold">ID</th>
                      <th className="px-4 py-3 font-semibold">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                          {new Date(log.createdAt).toLocaleString("pt-PT")}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{log.actorName}</p>
                          <p className="text-xs text-gray-600">{log.actorEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{log.action}</td>
                        <td className="px-4 py-3 text-gray-700">{log.entityType}</td>
                        <td className="max-w-[220px] break-all px-4 py-3 font-mono text-xs text-gray-700">
                          {log.entityId ?? "—"}
                        </td>
                        <td className="max-w-[320px] px-4 py-3 text-gray-700">{log.description ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                  A mostrar {logs.length} log(s){logsNextCursor ? " (há mais)" : ""}.
                </p>
                {logsNextCursor ? (
                  <button
                    type="button"
                    onClick={() => void loadMoreLogs()}
                    disabled={logsLoadingMore}
                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                  >
                    {logsLoadingMore ? "A carregar…" : "Carregar mais"}
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-gray-700">
              Sem logs para os filtros selecionados.
            </div>
          )}
        </div>
      )}
      {tab === "logs" && !isSuperAdmin ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Apenas o Super Admin pode aceder aos logs.
        </div>
      ) : null}

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
              <div className="text-sm text-gray-700">
                <span className="mb-1 block font-medium text-gray-700">Valor base</span>
                <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-base sm:text-sm">
                  {Number(editReservaState.reserva.roupa.precoAluguer).toFixed(2)} €
                </p>
              </div>
              <div className="text-sm text-gray-700">
                <span className="mb-1 block font-medium text-gray-700">Calçado</span>
                <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-base sm:text-sm">
                  {editReservaState.form.incluiCalcado
                    ? `Sim (+${Number(getPrecoCalcadoPorAno(editReservaState.reserva.roupa.ano) ?? 0).toFixed(2)} €)`
                    : "Não"}
                </p>
              </div>
              <div className="text-sm text-gray-700">
                <span className="mb-1 block font-medium text-gray-700">Total referência</span>
                <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-base sm:text-sm">
                  {(
                    Number(editReservaState.reserva.roupa.precoAluguer) +
                    Number(
                      editReservaState.form.incluiCalcado
                        ? (getPrecoCalcadoPorAno(editReservaState.reserva.roupa.ano) ?? 0)
                        : 0
                    )
                  ).toFixed(2)} €
                </p>
              </div>
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
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-gray-700">Calçado</span>
                {temCalcadoDisponivel(editReservaState.reserva.roupa.ano) ? (
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <label className="flex items-center justify-between gap-3 text-sm text-gray-700">
                      <span>
                        Incluir calçado nesta reserva
                        <span className="ml-1 text-xs text-gray-500">
                          (+{Number(getPrecoCalcadoPorAno(editReservaState.reserva.roupa.ano) ?? 0).toFixed(2)} €)
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        checked={editReservaState.form.incluiCalcado}
                        onChange={(e) =>
                          setEditReservaState((prev) =>
                            prev.open
                              ? { ...prev, form: { ...prev.form, incluiCalcado: e.target.checked } }
                              : prev
                          )
                        }
                        className="h-4 w-4 accent-[#00923f]"
                      />
                    </label>
                  </div>
                ) : (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                    Não disponível para este ano.
                  </p>
                )}
              </label>
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

      {/* Modal de confirmação (utilizadores) */}
      {confirmState.open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={closeConfirm}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-[#00923f]/5 p-5">
              <p className="text-sm font-semibold text-[#00923f]">Confirmar ação</p>
              <h2 className="mt-1 text-lg font-bold text-gray-900">
                {confirmState.targetRole === "ADMIN"
                  ? "Promover a administrador?"
                  : "Remover permissões de administrador?"}
              </h2>
              <p className="mt-2 text-sm text-gray-700">
                <span className="font-semibold">{confirmState.user.name}</span>{" "}
                <span className="text-gray-500">({confirmState.user.email})</span>
              </p>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700">
                {confirmState.targetRole === "ADMIN"
                  ? "Este utilizador passará a ter acesso às ferramentas de administração."
                  : "Este utilizador deixará de ter acesso às ferramentas de administração."}
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeConfirm}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const { user, targetRole } = confirmState;
                    closeConfirm();
                    await setRole(user.id, targetRole);
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                    confirmState.targetRole === "ADMIN"
                      ? "bg-[#00923f] hover:bg-[#007a33]"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação (eliminação de utilizador) */}
      {deleteUserState.open && (
        <div
          className="fixed inset-0 z-[62] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={closeDeleteUserConfirm}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-red-100 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-700">Ação crítica</p>
              <h2 className="mt-1 text-lg font-bold text-gray-900">Eliminar utilizador permanentemente?</h2>
              <p className="mt-2 text-sm text-gray-700">
                Esta ação remove a conta de forma definitiva.
              </p>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{deleteUserState.user.name}</span>{" "}
                <span className="text-gray-500">({deleteUserState.user.email})</span>
              </p>
              <p className="text-xs text-gray-600">
                Para confirmar, escreva <span className="font-bold">ELIMINAR</span> no campo abaixo.
              </p>
              <input
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={deleteUserConfirmText}
                onChange={(e) => setDeleteUserConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                className="ua-ios-confirm-input w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeDeleteUserConfirm}
                  disabled={deletingUserId === deleteUserState.user.id}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void deleteUserPermanente(deleteUserState.user.id)}
                  disabled={
                    deletingUserId === deleteUserState.user.id ||
                    deleteUserConfirmText.trim().toUpperCase() !== "ELIMINAR"
                  }
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deletingUserId === deleteUserState.user.id ? "A eliminar…" : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-zinc-500">
          A carregar…
        </div>
      }
    >
      <AdminPageInner />
    </Suspense>
  );
}
