"use client";

import AdminTitulo from "@/components/admin/AdminTitulo";
import { useEffect, useState } from "react";
import { TITULOS } from "@/components/admin/AdminPainel";

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

export default function AdminLogs() {
  // Secção extraída do painel: o "separador" é fixo.
  const tab: string = "logs";
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

  return (
    <div>
      <AdminTitulo titulo={TITULOS.logs.titulo} descricao={TITULOS.logs.descricao} />
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
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Data</th>
                      <th className="px-4 py-3 font-semibold">Admin</th>
                      <th className="px-4 py-3 font-semibold">Ação</th>
                      <th className="w-full px-4 py-3 font-semibold">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="align-top">
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                          {new Date(log.createdAt).toLocaleString("pt-PT")}
                        </td>
                        <td className="px-4 py-3">
                          <p className="whitespace-nowrap font-medium text-gray-900">{log.actorName}</p>
                          <p className="text-xs text-gray-600">{log.actorEmail}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block whitespace-nowrap rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800">
                            {log.action}
                          </span>
                          <p className="mt-1 whitespace-nowrap text-xs text-gray-500">
                            {log.entityType}
                            {log.entityId && (
                              <span className="font-mono" title={log.entityId}>
                                {" "}· …{log.entityId.slice(-6)}
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{log.description ?? "—"}</td>
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

    </div>
  );
}
