"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { pt } from "date-fns/locale";

interface Disponibilidade {
  data: string;
  estado: string;
}

export default function CalendarioDisponibilidade({
  roupaId,
}: {
  roupaId: string;
}) {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [disponibilidades, setDisponibilidades] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDisponibilidade() {
      setLoading(true);
      // Datas civis (não toISOString): evita que fim = "23:59 local" fique, em alguns casos, antes
      // do 31 às 00:00:00.000Z na base e o último dia do mês não venha do API.
      const inicioCivil = format(startOfMonth(mesAtual), "yyyy-MM-dd");
      const fimCivil = format(endOfMonth(mesAtual), "yyyy-MM-dd");
      const res = await fetch(
        `/api/disponibilidade?roupaId=${roupaId}&inicio=${inicioCivil}&fim=${fimCivil}`
      );
      const data: Disponibilidade[] = await res.json();
      const map: Record<string, string> = {};
      data.forEach((d) => {
        const key = d.data.split("T")[0];
        map[key] = d.estado;
      });
      setDisponibilidades(map);
      setLoading(false);
    }
    fetchDisponibilidade();
  }, [roupaId, mesAtual]);

  const dias = eachDayOfInterval({
    start: startOfMonth(mesAtual),
    end: endOfMonth(mesAtual),
  });

  // Calendário com semana a começar na segunda (Portugal)
  const primeiroDia = startOfMonth(mesAtual);
  const diaSemana = primeiroDia.getDay(); // 0=Dom, 1=Seg, ...
  const diasVazios = diaSemana === 0 ? 6 : diaSemana - 1;

  const getEstadoDia = (data: Date) => {
    const key = format(data, "yyyy-MM-dd");
    return disponibilidades[key] || "LIVRE";
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm overflow-hidden">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900">
          Calendário de Disponibilidade
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setMesAtual(subMonths(mesAtual, 1))}
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
          >
            ←
          </button>
          <span className="text-center text-sm font-medium sm:text-base">
            {format(mesAtual, "MMMM yyyy", { locale: pt })}
          </span>
          <button
            onClick={() => setMesAtual(addMonths(mesAtual, 1))}
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
          >
            →
          </button>
        </div>
      </div>

      {/* Legenda */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-green-500" />
          Livre
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-red-500" />
          Alugada
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-orange-400" />
          Manutenção
        </span>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00923f] border-t-transparent" />
        </div>
      ) : (
        <div className="grid w-full grid-cols-7 gap-[2px]">
          {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((dia) => (
            <div
              key={dia}
              className="py-1 text-center text-xs font-medium text-gray-500"
            >
              {dia}
            </div>
          ))}
          {Array.from({ length: diasVazios }).map(
            (_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            )
          )}
          {dias.map((dia) => {
            const estado = getEstadoDia(dia);
            const cor =
              estado === "LIVRE"
                ? "bg-green-500"
                : estado === "ALUGADA"
                  ? "bg-red-500"
                  : "bg-orange-400";
            return (
              <div
                key={dia.toISOString()}
                className="aspect-square p-[2px]"
                title={`${format(dia, "dd/MM/yyyy")} - ${estado}`}
              >
                <div
                  className={`flex h-full items-center justify-center rounded-lg text-xs font-medium text-white ${cor} ${
                    isToday(dia) ? "ring-2 ring-[#00923f] ring-offset-1" : ""
                  }`}
                >
                  {format(dia, "d")}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
