"use client";

import Link from "next/link";

export default function TermsConsentField({
  id,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        id={id}
        type="checkbox"
        required
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-[#00923f] focus:ring-[#00923f] disabled:opacity-60"
      />
      <span className="text-sm leading-snug text-gray-700">
        Li e aceito os{" "}
        <Link
          href="/termos"
          className="font-medium text-[#00923f] underline decoration-[#00923f]/40 underline-offset-2 hover:decoration-[#00923f]"
        >
          Termos e Condições
        </Link>
        , incluindo as regras de utilização do site e as condições gerais de aluguer.
      </span>
    </label>
  );
}
