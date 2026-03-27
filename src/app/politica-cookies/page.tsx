import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de cookies | Unidos de Avidos",
  description:
    "Política de Cookies da Associação Unidos de Avidos, com informação sobre cookies essenciais e tecnologias equivalentes.",
};

export default function PoliticaCookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#00923f]">Legal</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Política de Cookies
      </h1>
      <p className="mt-4 text-sm text-gray-500">Última atualização: março de 2026</p>

      <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-gray-700">
        <p>
          A presente Política de Cookies descreve o modo como o website da{" "}
          <strong>Associação Unidos de Avidos</strong> utiliza cookies e tecnologias equivalentes, em
          conformidade com a legislação aplicável, designadamente a Lei n.º 41/2004, de 18 de agosto
          (na redação em vigor), em articulação com o RGPD e com a nossa{" "}
          <Link href="/privacidade" className="font-medium text-[#00923f] underline">
            Política de Privacidade
          </Link>
          .
        </p>

        <h2 className="text-lg font-semibold text-gray-900">1. Conceito de Cookie</h2>
        <p>
          Cookies são pequenos ficheiros de texto armazenados no equipamento terminal do utilizador
          (computador, telemóvel ou outro dispositivo), através do navegador de internet, com o objetivo
          de permitir ou melhorar o funcionamento do website. Para efeitos da presente política,
          consideram-se igualmente tecnologias equivalentes, nomeadamente mecanismos de armazenamento local.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">2. Cookies Utilizados neste Website</h2>
        <p>
          Atualmente, este website utiliza cookies estritamente necessários à disponibilização segura da
          funcionalidade de conta e sessão de utilizador, bem como um mecanismo técnico de registo da
          escolha relativa ao aviso de cookies.
        </p>

        <h3 className="text-base font-semibold text-gray-800">2.1 Cookies estritamente necessários</h3>
        <p>
          Estes cookies são indispensáveis ao funcionamento do website e à prestação dos serviços
          expressamente solicitados pelo utilizador, não sendo possível desativá-los sem comprometer
          funcionalidades essenciais.
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50/80 text-sm">
          <table className="w-full min-w-[280px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-100/80">
                <th className="px-3 py-2 font-semibold text-gray-900">Identificação</th>
                <th className="px-3 py-2 font-semibold text-gray-900">Finalidade</th>
                <th className="px-3 py-2 font-semibold text-gray-900">Duração</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b border-gray-100">
                <td className="px-3 py-2 align-top font-mono text-xs sm:text-sm">ua_session</td>
                <td className="px-3 py-2">
                  Gestão de sessão autenticada, controlo de acesso e segurança da sessão (cookie
                  HTTP-only definido pelo servidor).
                </td>
                <td className="px-3 py-2 align-top">Até 7 dias (ou prazo técnico aplicável)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-base font-semibold text-gray-800">2.2 Preferência de aviso de cookies</h3>
        <p>
          Após aceitação do aviso de cookies, pode ser armazenado no navegador um registo técnico dessa
          preferência (por exemplo via <code className="rounded bg-gray-100 px-1 text-xs">localStorage</code>),
          com a única finalidade de evitar a sua repetida apresentação.
        </p>

        <h3 className="text-base font-semibold text-gray-800">2.3 Conteúdos de terceiros</h3>
        <p>
          A integração de conteúdos de terceiros (por exemplo, serviços de mapas) poderá implicar a
          instalação de cookies por tais entidades. Nesses casos, o terceiro atua como responsável
          autónomo pelo tratamento dos dados, devendo o utilizador consultar as respetivas políticas.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">3. Gestão de Cookies pelo Utilizador</h2>
        <p>
          O utilizador pode, a qualquer momento, configurar o seu navegador para bloquear, limitar ou
          eliminar cookies. Tal configuração poderá, contudo, impedir o normal funcionamento de áreas
          reservadas e serviços que dependam de autenticação.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">4. Fundamento Jurídico</h2>
        <p>
          Os cookies estritamente necessários são tratados ao abrigo da necessidade de prestação do
          serviço solicitado e do interesse legítimo da associação na segurança e operacionalidade do
          website. Sempre que venham a ser introduzidos cookies não necessários, será previamente
          solicitado consentimento nos termos legais.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">5. Contactos e Direitos</h2>
        <p>
          Para qualquer questão sobre cookies e tratamento de dados pessoais, o utilizador poderá contactar{" "}
          <a href="mailto:unidosdeavidos@gmail.com" className="text-[#00923f] underline">
            unidosdeavidos@gmail.com
          </a>
          . O regime de direitos dos titulares encontra-se descrito na{" "}
          <Link href="/privacidade" className="font-medium text-[#00923f] underline">
            Política de Privacidade
          </Link>
          .
        </p>

        <h2 className="text-lg font-semibold text-gray-900">6. Alterações à Política de Cookies</h2>
        <p>
          A Associação Unidos de Avidos reserva-se o direito de atualizar a presente Política de Cookies
          sempre que necessário. A versão atualizada será publicada nesta página com indicação da data
          de revisão.
        </p>
      </div>
    </div>
  );
}
