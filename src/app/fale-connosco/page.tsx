"use client";

import { useState } from "react";
import { ChevronDown, Mail, MessageCircle, Phone } from "lucide-react";
import PrivacyConsentField from "@/components/PrivacyConsentField";

const TELEFONE_1 = "914 884 537";
const TELEFONE_1_LIMPO = "351914884537";
const TELEFONE_2 = "914 838 942";
const TELEFONE_2_LIMPO = "351914838942";
const EMAIL = "unidosdeavidos@gmail.com";
const WHATSAPP_URL = `https://wa.me/${TELEFONE_1_LIMPO}`;

export default function FaleConnoscoPage() {
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aEnviar, setAEnviar] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [consentimento, setConsentimento] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentimento) return;
    setErro(null);
    setAEnviar(true);
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, mensagem }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar");
      setEnviado(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar. Tente novamente.");
    } finally {
      setAEnviar(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* 1. Secção de contacto (como na foto) */}
      <section className="text-center">
        <h1 className="text-3xl font-bold uppercase tracking-wide text-[#00923f] sm:text-4xl">
          Fale Connosco
        </h1>
        <ChevronDown className="mx-auto mt-3 h-8 w-8 text-[#00923f]" strokeWidth={2.5} />
        <div className="mt-8 flex flex-col items-center gap-6 sm:gap-8">
          <a
            href={`tel:+${TELEFONE_1_LIMPO}`}
            className="flex items-center gap-3 text-gray-700 transition-colors hover:text-[#00923f]"
          >
            <Phone className="h-6 w-6 shrink-0 text-[#00923f]" strokeWidth={2} />
            <span className="text-lg">{TELEFONE_1}</span>
          </a>
          <a
            href={`tel:+${TELEFONE_2_LIMPO}`}
            className="flex items-center gap-3 text-gray-700 transition-colors hover:text-[#00923f]"
          >
            <Phone className="h-6 w-6 shrink-0 text-[#00923f]" strokeWidth={2} />
            <span className="text-lg">{TELEFONE_2}</span>
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="flex items-center gap-3 text-gray-700 underline decoration-[#00923f]/50 underline-offset-2 transition-colors hover:text-[#00923f]"
          >
            <Mail className="h-6 w-6 shrink-0 text-[#00923f]" strokeWidth={2} />
            <span className="text-lg">{EMAIL}</span>
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-base font-medium text-white shadow-sm transition hover:bg-[#20bd5a]"
          >
            <MessageCircle className="h-5 w-5" strokeWidth={2} />
            Falar pelo WhatsApp
          </a>
        </div>
      </section>

      {/* 2. Mapa */}
      <section className="mt-14">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Localização</h2>
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <iframe
            title="Localização - Unidos de Avidos"
            src="https://www.google.com/maps?q=Av.+Coemndador+Jos%C3%A9+Costa+Oliveira+14&z=17&output=embed"
            className="h-72 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      {/* 3. Formulário de contacto (igual ao da home) */}
      <section className="mt-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#00923f]">
          Tem dúvidas?
        </p>
        <h2 className="mt-1 text-2xl font-bold uppercase text-gray-900 sm:text-3xl">
          Fale connosco
        </h2>

        {enviado ? (
          <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-6 text-green-800">
            A sua mensagem foi registada. Obrigado pelo contacto!
          </div>
        ) : (
          <>
          {erro && (
            <p className="mt-6 text-sm text-red-600">{erro}</p>
          )}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="border-b border-gray-300 pb-2">
              <label htmlFor="fc-nome" className="sr-only">
                O seu nome
              </label>
              <input
                id="fc-nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="O seu nome"
                className="w-full bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none"
              />
            </div>
            <div className="border-b border-gray-300 pb-2">
              <label htmlFor="fc-email" className="sr-only">
                O seu email
              </label>
              <input
                id="fc-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="O seu email"
                className="w-full bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none"
              />
            </div>
            <div className="border-b border-gray-300 pb-2">
              <label htmlFor="fc-mensagem" className="sr-only">
                A sua mensagem
              </label>
              <textarea
                id="fc-mensagem"
                rows={4}
                required
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="A sua mensagem"
                className="w-full resize-none bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none"
              />
            </div>
            <PrivacyConsentField
              id="fc-consent-privacy"
              purpose="contact"
              checked={consentimento}
              onChange={setConsentimento}
              disabled={aEnviar}
            />
            <button
              type="submit"
              disabled={aEnviar}
              className="w-full rounded-lg bg-[#00923f] py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#007a33] disabled:opacity-70 sm:w-auto sm:px-10"
            >
              {aEnviar ? "A enviar…" : "Enviar"}
            </button>
          </form>
          </>
        )}
      </section>
    </div>
  );
}
