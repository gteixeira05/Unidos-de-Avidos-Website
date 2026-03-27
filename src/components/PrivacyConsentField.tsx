"use client";

import Link from "next/link";

type Purpose = "contact" | "account" | "reservation";

function ConsentText({ purpose }: { purpose: Purpose }) {
  const link = (
    <Link
      href="/privacidade"
      className="font-medium text-[#00923f] underline decoration-[#00923f]/40 underline-offset-2 hover:decoration-[#00923f]"
    >
      política de privacidade
    </Link>
  );

  if (purpose === "contact") {
    return (
      <>
        Li a {link} e aceito o tratamento dos meus dados para responder a este contacto.
      </>
    );
  }
  if (purpose === "account") {
    return (
      <>
        Li a {link} e aceito o tratamento dos meus dados pessoais para criação e gestão da minha
        conta.
      </>
    );
  }
  return (
    <>
      Li a {link} e aceito o tratamento dos dados indicados para gestão do pedido de aluguer.
    </>
  );
}

export default function PrivacyConsentField({
  id,
  purpose,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  purpose: Purpose;
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
        <ConsentText purpose={purpose} />
      </span>
    </label>
  );
}
