"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { useState } from "react";
import HeroCarousel from "@/components/HeroCarousel";
import PrivacyConsentField from "@/components/PrivacyConsentField";

const eventosFuturos = [
  {
    titulo: "Festa da Flor",
    data: "10 de Maio 2026",
    imagem: "/evento-festa-da-flor.png",
    slug: "festa-da-flor",
  },
  {
    titulo: "Marchas Antoninas",
    data: "12 de junho 2026",
    imagem: "/evento-marchas-antoninas.png",
    slug: "marchas-antoninas",
  },
];

export default function Home() {
  const [enviado, setEnviado] = useState(false);
  const [erroContacto, setErroContacto] = useState<string | null>(null);
  const [aEnviar, setAEnviar] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [consentimento, setConsentimento] = useState(false);

  const handleSubmitContacto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentimento) return;
    setErroContacto(null);
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
      setErroContacto(err instanceof Error ? err.message : "Erro ao enviar. Tente novamente.");
    } finally {
      setAEnviar(false);
    }
  };

  return (
    <div>
      <HeroCarousel />

      {/* 1. Quem Somos */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#00923f]">
          Quem somos?
        </p>
        <h2 className="mt-3 text-3xl font-bold uppercase leading-tight text-gray-900 sm:text-4xl md:text-5xl">
          Somos os Unidos de Avidos
        </h2>
        <div className="mt-6 max-w-2xl space-y-5 text-lg leading-[1.7] text-gray-600">
          <p>
            Uma associação sem fins lucrativos movida pelo amor à nossa terra e às nossas gentes.
            Criamos e participamos em eventos que aproximam a comunidade e mantêm vivas as
            tradições locais.
          </p>
          <p>
            O nosso maior orgulho e o grande ponto alto do nosso ano é a marcante participação
            nas Marchas Antoninas de Famalicão. Somos um ponto de encontro onde a cultura
            acontece e onde Avidos ganha ainda mais vida.
          </p>
        </div>
        <Link
          href="/sobre/historia"
          className="mt-10 inline-block rounded-lg bg-[#00923f] px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#007a33]"
        >
          Conheça-nos melhor
        </Link>
      </section>

      {/* 2. Aluguer de Roupas */}
      <section className="border-t border-gray-100 bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#00923f]">
            Aluguer
          </p>
          <h2 className="mt-3 text-3xl font-bold uppercase leading-tight text-gray-900 sm:text-4xl md:text-5xl">
            Roupas de marchas anteriores
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            Temos disponíveis para aluguer as fardas e acessórios dos anos anteriores das
            Marchas Antoninas. Ideal para grupos, eventos, festas temáticas e celebrações.
          </p>
          <Link
            href="/aluguer-roupas"
            className="mt-8 inline-block rounded-lg bg-[#00923f] px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#007a33]"
          >
            Ver catálogo
          </Link>
        </div>
      </section>

      {/* 3. Torne-se Sócio */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#00923f]">
            Junte-se a nós!
          </p>
          <h2 className="mt-3 text-3xl font-bold uppercase leading-tight text-gray-900 sm:text-4xl md:text-5xl">
            Torne-se sócio
          </h2>
          <Link
            href="/tornar-socio"
            className="mt-10 inline-block w-full max-w-xs rounded-lg bg-[#00923f] px-8 py-4 text-base font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#007a33] sm:w-auto"
          >
            Ver mais
          </Link>
        </div>
      </section>

      {/* 4. Eventos Futuros */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#00923f]">
          Eventos
        </p>
        <h2 className="mt-2 text-3xl font-bold uppercase text-gray-900 sm:text-4xl">
          Eventos futuros
        </h2>
        <Link
          href="/agenda"
          className="mt-4 inline-block rounded-lg bg-[#00923f] px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#007a33]"
        >
          Ver mais
        </Link>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {eventosFuturos.map((evento) => (
            <article
              key={evento.slug}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                <Image
                  src={evento.imagem}
                  alt={evento.titulo}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900">{evento.titulo}</h3>
                <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.8} aria-hidden />
                  {evento.data}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 5. Fale Connosco (formulário) */}
      <section className="border-t border-gray-200 bg-gray-50 py-16">
        <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#00923f]">
            Tem dúvidas?
          </p>
          <h2 className="mt-1 text-3xl font-bold uppercase text-gray-900 sm:text-4xl">
            Fale connosco
          </h2>

          {enviado ? (
            <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-6 text-green-800">
              A sua mensagem foi registada. Obrigado pelo contacto!
            </div>
          ) : (
            <>
            {erroContacto && (
              <p className="mt-6 text-sm text-red-600">{erroContacto}</p>
            )}
            <form onSubmit={handleSubmitContacto} className="mt-8 space-y-6">
              <div className="border-b border-gray-300 pb-2">
                <label htmlFor="home-nome" className="sr-only">
                  O seu nome
                </label>
                <input
                  id="home-nome"
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="O seu nome"
                  className="w-full bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none"
                />
              </div>
              <div className="border-b border-gray-300 pb-2">
                <label htmlFor="home-email" className="sr-only">
                  O seu email
                </label>
                <input
                  id="home-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="O seu email"
                  className="w-full bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none"
                />
              </div>
              <div className="border-b border-gray-300 pb-2">
                <label htmlFor="home-mensagem" className="sr-only">
                  A sua mensagem
                </label>
                <textarea
                  id="home-mensagem"
                  rows={4}
                  required
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="A sua mensagem"
                  className="w-full resize-none bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none"
                />
              </div>
              <PrivacyConsentField
                id="home-consent-privacy"
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
        </div>
      </section>
    </div>
  );
}
