"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import PrivacyConsentField from "@/components/PrivacyConsentField";
import TermsConsentField from "@/components/TermsConsentField";
import { formatPrecoAluguerPublico } from "@/lib/aluguerRoupasPublic";

interface Roupa {
  id: string;
  ano: number;
  tema: string;
  precoAluguer: number;
}

export default function FormularioReserva({ roupa }: { roupa: Roupa }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [consentimentoPrivacidade, setConsentimentoPrivacidade] = useState(false);
  const [aceitaTermos, setAceitaTermos] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const u = d?.user as { id: string; name?: string; email?: string } | null;
        if (!u?.id) return;
        setUserId(u.id);
        if (u.name) setNome(u.name);
        if (u.email) setEmail(u.email);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    if (!dataInicio || !dataFim) {
      setErro("Por favor, selecione as datas de início e fim.");
      setLoading(false);
      return;
    }

    if (!consentimentoPrivacidade) {
      setErro("Tem de aceitar a política de privacidade para enviar o pedido.");
      setLoading(false);
      return;
    }

    if (!aceitaTermos) {
      setErro("Tem de aceitar os Termos e Condições para enviar o pedido.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roupaId: roupa.id,
          dataInicio,
          dataFim,
          observacoes,
          nome,
          email,
          telefone,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao enviar pedido");
      }
      setEnviado(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Ocorreu um erro.");
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
          <h3 className="text-lg font-semibold text-green-800">
            Pedido enviado com sucesso!
          </h3>
          <p className="mt-2 text-green-800/95">
            O seu pedido de reserva foi registado. Será contactado após a análise
            e validação do stock físico pela equipa. O pagamento será acordado após
            aprovação.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-700 shadow-sm">
          <p className="font-semibold text-gray-900">Como acompanhar o pedido</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">
            <li>
              Sempre que o estado do pedido mudar (por exemplo, aprovação ou recusa), receberá uma{" "}
              <strong className="text-gray-800">notificação neste site</strong> (ícone junto ao menu)
              e <strong className="text-gray-800">um email</strong> para o endereço da sua conta.
            </li>
            <li>
              Pode ver todos os seus pedidos e o respetivo estado na página{" "}
              <Link
                href="/perfil#sec-reservas"
                className="font-medium text-[#00923f] underline decoration-[#00923f]/35 underline-offset-2 hover:decoration-[#00923f]"
              >
                Perfil → As minhas reservas
              </Link>
              .
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-6">
        <h3 className="text-lg font-semibold text-yellow-800">
          Inicie sessão para reservar
        </h3>
        <p className="mt-2 text-sm text-yellow-800">
          Para enviar um pedido de reserva precisa de estar autenticado.
        </p>
        <Link
          href="/auth"
          className="mt-4 inline-block rounded-lg bg-[#00923f] px-4 py-2 text-sm font-medium text-white hover:bg-[#007a33]"
        >
          Fazer login ou criar conta
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Solicitar Reserva
      </h3>
      <p className="mb-4 text-sm text-gray-600">
        O pedido não confirma a reserva de imediato. A equipa validará o stock
        e contactá-lo-á para aprovação. O preço de aluguer anual de referência
        desta farda é{" "}
        <strong className="text-gray-800">{formatPrecoAluguerPublico(roupa.precoAluguer)}</strong>
        {", "}
        referente ao ano completo, independentemente da quantidade de fardas
        levantadas.
      </p>

      <div className="mb-5 flex gap-3 rounded-lg border border-[#00923f]/20 bg-[#00923f]/[0.06] p-4 text-sm text-gray-700">
        <Bell
          className="mt-0.5 h-5 w-5 shrink-0 text-[#00923f]"
          strokeWidth={1.75}
          aria-hidden
        />
        <div className="min-w-0 space-y-2">
          <p className="font-medium text-gray-900">Após enviar o pedido</p>
          <p className="leading-relaxed text-gray-600">
            Quando houver qualquer atualização ao seu pedido, será avisado com uma{" "}
            <strong className="font-medium text-gray-800">notificação no site</strong> e com{" "}
            <strong className="font-medium text-gray-800">email</strong> para a conta com que
            iniciou sessão. Pode consultar o estado das reservas em qualquer momento em{" "}
            <Link
              href="/perfil#sec-reservas"
              className="font-medium text-[#00923f] underline decoration-[#00923f]/35 underline-offset-2 hover:decoration-[#00923f]"
            >
              Perfil → As minhas reservas
            </Link>
            .
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nome *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#00923f] focus:outline-none focus:ring-1 focus:ring-[#00923f]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#00923f] focus:outline-none focus:ring-1 focus:ring-[#00923f]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Telefone *
            </label>
            <input
              type="tel"
              required
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#00923f] focus:outline-none focus:ring-1 focus:ring-[#00923f]"
            />
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Data de início
            </label>
            <div className="flex min-w-0 overflow-hidden rounded-lg border border-gray-300 focus-within:border-[#00923f] focus-within:ring-1 focus-within:ring-[#00923f]">
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="ua-date-field h-11 min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-base outline-none sm:h-10 sm:text-sm"
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Data de fim
            </label>
            <div className="flex min-w-0 overflow-hidden rounded-lg border border-gray-300 focus-within:border-[#00923f] focus-within:ring-1 focus-within:ring-[#00923f]">
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                min={dataInicio || undefined}
                className="ua-date-field h-11 min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-base outline-none sm:h-10 sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Observações
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#00923f] focus:outline-none focus:ring-1 focus:ring-[#00923f]"
          />
        </div>

        {erro && (
          <p className="text-sm text-red-600">{erro}</p>
        )}

        <PrivacyConsentField
          id="reserva-consent-privacy"
          purpose="reservation"
          checked={consentimentoPrivacidade}
          onChange={setConsentimentoPrivacidade}
          disabled={loading}
        />

        <TermsConsentField
          id="reserva-consent-termos"
          checked={aceitaTermos}
          onChange={setAceitaTermos}
          disabled={loading}
        />

        <p className="text-sm text-gray-500">
          Preço de referência do aluguer anual:{" "}
          {formatPrecoAluguerPublico(roupa.precoAluguer)} (o pedido continua
          sujeito a aprovação e confirmação de stock).
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#00923f] px-4 py-3 font-medium text-white transition-colors hover:bg-[#007a33] disabled:opacity-50"
        >
          {loading ? "A enviar..." : "Enviar Pedido de Reserva"}
        </button>
      </form>
    </div>
  );
}
