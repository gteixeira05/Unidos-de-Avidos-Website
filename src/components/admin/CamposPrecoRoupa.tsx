"use client";

import type { PrecosRoupa } from "@/lib/aluguerRoupasPublic";

/** Valores do formulário (texto, como nos inputs). Vazio = sem valor. */
export type PrecosForm = {
  precoAluguer: string;
  precoCalcado: string;
  precoArcos: string;
  arcosDisponiveis: string;
  precoTudoIncluido: string;
  tudoIncluidoAte: string;
};

const txt = (v: number | null | undefined) => (v == null ? "" : String(v));

export function precosParaForm(r: Partial<PrecosRoupa>): PrecosForm {
  return {
    precoAluguer: txt(r.precoAluguer),
    precoCalcado: txt(r.precoCalcado),
    precoArcos: txt(r.precoArcos),
    arcosDisponiveis: txt(r.arcosDisponiveis),
    precoTudoIncluido: txt(r.precoTudoIncluido),
    tudoIncluidoAte: r.tudoIncluidoAte ? String(typeof r.tudoIncluidoAte === "string" ? r.tudoIncluidoAte : r.tudoIncluidoAte.toISOString()).slice(0, 10) : "",
  };
}

/** Corpo para a API (vazio vira null; a API valida). */
export function formParaPrecos(f: PrecosForm) {
  const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));
  return {
    precoAluguer: num(f.precoAluguer) ?? 0,
    precoCalcado: num(f.precoCalcado),
    precoArcos: num(f.precoArcos),
    arcosDisponiveis: num(f.arcosDisponiveis),
    precoTudoIncluido: num(f.precoTudoIncluido),
    tudoIncluidoAte: f.tudoIncluidoAte || null,
  };
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#00923f] focus:outline-none focus:ring-1 focus:ring-[#00923f] sm:text-sm";

function Campo({
  id,
  label,
  ajuda,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  ajuda?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={type === "text" ? "decimal" : undefined}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
      {ajuda && <p className="mt-1 text-xs text-gray-500">{ajuda}</p>}
    </div>
  );
}

/** Campos de preço de uma roupa (usado nos editores do admin). */
export default function CamposPrecoRoupa({
  value,
  onChange,
  idPrefix = "preco",
}: {
  value: PrecosForm;
  onChange: (v: PrecosForm) => void;
  idPrefix?: string;
}) {
  const set = (k: keyof PrecosForm) => (v: string) => onChange({ ...value, [k]: v });
  return (
    <fieldset className="space-y-4 rounded-lg border border-gray-200 p-4">
      <legend className="px-1 text-sm font-semibold text-gray-900">Preços</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id={`${idPrefix}-base`}
          label="Preço base (€)"
          ajuda="Figurino + acessórios."
          value={value.precoAluguer}
          onChange={set("precoAluguer")}
        />
        <Campo
          id={`${idPrefix}-calcado`}
          label="Calçado (€, opcional)"
          ajuda="Acréscimo. Vazio = sem calçado para alugar."
          value={value.precoCalcado}
          onChange={set("precoCalcado")}
          placeholder="sem calçado"
        />
        <Campo
          id={`${idPrefix}-arcos`}
          label="Arcos (€, opcional)"
          ajuda="Acréscimo. Vazio = arcos não se alugam à parte."
          value={value.precoArcos}
          onChange={set("precoArcos")}
          placeholder="não se alugam"
        />
        <Campo
          id={`${idPrefix}-arcos-qtd`}
          label="Arcos em stock"
          ajuda='Só informativo ("10 arcos disponíveis"). Vazio = não mostrar.'
          value={value.arcosDisponiveis}
          onChange={set("arcosDisponiveis")}
        />
      </div>
      <div className="rounded-lg bg-gray-50 p-3">
        <p className="text-sm font-medium text-gray-800">Preço especial com tudo incluído (opcional)</p>
        <p className="mt-0.5 text-xs text-gray-500">
          Para reservas que começam antes da data indicada: preço fixo com calçado e arcos incluídos. Depois dessa data
          aplica-se o preço base + extras. Deixe vazio se não se aplicar.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Campo
            id={`${idPrefix}-tudo`}
            label="Preço tudo incluído (€)"
            value={value.precoTudoIncluido}
            onChange={set("precoTudoIncluido")}
          />
          <Campo
            id={`${idPrefix}-tudo-ate`}
            label="Válido para reservas que comecem antes de"
            type="date"
            value={value.tudoIncluidoAte}
            onChange={set("tudoIncluidoAte")}
          />
        </div>
      </div>
    </fieldset>
  );
}
