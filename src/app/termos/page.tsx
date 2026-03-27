import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos e Condições | Unidos de Avidos",
  description:
    "Termos e Condições de utilização do website e do serviço de reserva/aluguer da Associação Unidos de Avidos.",
};

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#00923f]">Legal</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Termos e Condições
      </h1>
      <p className="mt-4 text-sm text-gray-500">Última atualização: março de 2026</p>

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-gray-700">
        <p className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 text-sm">
          O presente documento estabelece os termos jurídicos aplicáveis à utilização deste website e ao
          serviço de reserva/aluguer de fardas e roupas da <strong>Associação Unidos de Avidos</strong>.
          A utilização do website implica a leitura e aceitação integral destes Termos e Condições.
        </p>
        <p>
          Para efeitos de tratamento de dados pessoais e utilização de cookies, o utilizador deverá
          consultar a{" "}
          <Link href="/privacidade" className="font-medium text-[#00923f] underline">
            Política de Privacidade
          </Link>{" "}
          e a{" "}
          <Link href="/politica-cookies" className="font-medium text-[#00923f] underline">
            Política de Cookies
          </Link>
          .
        </p>

        <section className="space-y-4">
          <h2 className="border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900">
            CAPÍTULO I — DISPOSIÇÕES GERAIS
          </h2>

          <h3 className="text-base font-semibold text-gray-900">Artigo 1.º (Identificação da entidade)</h3>
          <p>
            O website é operado pela <strong>Associação Unidos de Avidos</strong>, com sede em N204-5,
            4770-778 Avidos, Vila Nova de Famalicão, NIPC 508195551.
          </p>
          <p>
            Contacto oficial para efeitos pré-contratuais, contratuais e de apoio ao utilizador:{" "}
            <a href="mailto:unidosdeavidos@gmail.com" className="text-[#00923f] underline">
              unidosdeavidos@gmail.com
            </a>
            .
          </p>

          <h3 className="text-base font-semibold text-gray-900">Artigo 2.º (Objeto e âmbito)</h3>
          <p>
            O website destina-se à divulgação institucional da associação e disponibiliza funcionalidades
            de registo de conta, autenticação, contacto e submissão de pedidos de reserva de
            fardas/roupas.
          </p>
          <p>
            O utilizador declara possuir capacidade jurídica para aceitar os presentes termos e praticar
            os atos inerentes à utilização da plataforma.
          </p>

          <h3 className="text-base font-semibold text-gray-900">Artigo 3.º (Conta de utilizador)</h3>
          <p>
            O utilizador obriga-se a fornecer dados verdadeiros, completos e atualizados, sendo
            responsável pela confidencialidade das respetivas credenciais de acesso.
          </p>
          <p>
            A associação poderá limitar, suspender ou cancelar contas em caso de indícios de uso ilícito,
            abusivo ou contrário aos presentes termos, sem prejuízo da responsabilidade legal aplicável.
          </p>

          <h3 className="text-base font-semibold text-gray-900">Artigo 4.º (Utilização permitida e proibições)</h3>
          <p>
            O utilizador compromete-se a utilizar o website em conformidade com a lei e com os presentes
            termos, abstendo-se, designadamente, de:
          </p>
          <ul className="list-inside list-disc space-y-1 pl-1">
            <li>introduzir conteúdos falsos, ofensivos, difamatórios ou ilícitos;</li>
            <li>aceder ou tentar aceder a áreas reservadas sem autorização;</li>
            <li>utilizar sistemas automatizados de extração de dados sem autorização prévia;</li>
            <li>praticar atos que comprometam a segurança, estabilidade ou disponibilidade do serviço.</li>
          </ul>

          <h3 className="text-base font-semibold text-gray-900">Artigo 5.º (Propriedade intelectual)</h3>
          <p>
            Todos os conteúdos do website, incluindo textos, imagens, design, logótipos e demais
            elementos distintivos, encontram-se protegidos por direitos de propriedade intelectual, sendo
            proibida a sua utilização sem autorização prévia, salvo nos casos legalmente permitidos.
          </p>

          <h3 className="text-base font-semibold text-gray-900">Artigo 6.º (Serviços de terceiros)</h3>
          <p>
            A existência de hiperligações ou integrações com serviços de terceiros não implica assunção
            de responsabilidade pela associação quanto aos respetivos conteúdos, políticas ou condições
            de utilização.
          </p>

          <h3 className="text-base font-semibold text-gray-900">Artigo 7.º (Disponibilidade e responsabilidade)</h3>
          <p>
            A associação envidará os esforços razoáveis para assegurar o bom funcionamento do website,
            não garantindo, contudo, disponibilidade ininterrupta, ausência de erro ou inexistência de
            falhas técnicas.
          </p>
          <p>
            Na máxima extensão legalmente admissível, a associação não responde por danos indiretos,
            lucros cessantes ou prejuízos decorrentes de indisponibilidades técnicas ou utilização
            indevida por terceiros.
          </p>

          <h3 className="text-base font-semibold text-gray-900">Artigo 8.º (Alterações)</h3>
          <p>
            A associação reserva-se o direito de atualizar os presentes Termos e Condições, produzindo
            efeitos a partir da respetiva publicação no website.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900">
            CAPÍTULO II — CONDIÇÕES DE RESERVA E ALUGUER
          </h2>

          <h3 className="text-base font-semibold text-gray-900">Artigo 9.º (Natureza do serviço)</h3>
          <p>
            O serviço disponibilizado corresponde a um sistema de pedido de reserva de fardas/roupas,
            sujeito à disponibilidade efetiva e validação interna da associação.
          </p>

          <h3 className="text-base font-semibold text-gray-900">Artigo 10.º (Pedido de reserva)</h3>
          <p>
            O pedido submetido no website não constitui, por si só, confirmação contratual definitiva.
            A reserva apenas se considera efetiva após confirmação expressa da associação.
          </p>
          <p>
            A confirmação depende da verificação de disponibilidade, validação do período solicitado e
            acordo sobre as condições essenciais do aluguer.
          </p>

          <h3 className="text-base font-semibold text-gray-900">Artigo 11.º (Preço e pagamento)</h3>
          <p>
            Os preços apresentados no website têm natureza informativa. O valor final aplicável e as
            condições de pagamento são comunicados no momento da confirmação da reserva.
          </p>

          <h3 className="text-base font-semibold text-gray-900">Artigo 12.º (Utilização e conservação)</h3>
          <p>
            O utilizador obriga-se a utilizar as peças com diligência e de acordo com as instruções de
            conservação e devolução comunicadas pela associação.
          </p>
          <p>
            Em caso de perda, dano anormal ou utilização indevida, o utilizador responde nos termos
            legalmente aplicáveis e das condições específicas acordadas.
          </p>

          <h3 className="text-base font-semibold text-gray-900">Artigo 13.º (Entrega e devolução)</h3>
          <p>
            As condições de levantamento, entrega e devolução são fixadas pela associação no ato de
            confirmação da reserva. O incumprimento dessas condições poderá determinar limitações em
            pedidos futuros e outras consequências legalmente admissíveis.
          </p>

          <h3 className="text-base font-semibold text-gray-900">Artigo 14.º (Cancelamentos e alterações)</h3>
          <p>
            Cancelamentos e pedidos de alteração devem ser comunicados com a maior antecedência possível,
            ficando sujeitos à apreciação da associação em função da disponibilidade e compromissos já
            assumidos.
          </p>

          <h3 className="text-base font-semibold text-gray-900">Artigo 15.º (Lei aplicável)</h3>
          <p>
            Os presentes termos regem-se pela lei portuguesa, sem prejuízo das normas imperativas de
            proteção do consumidor legalmente aplicáveis.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900">
            CAPÍTULO III — LITÍGIOS, RAL E ENTIDADE FISCALIZADORA
          </h2>

          <h3 className="text-base font-semibold text-gray-900">Artigo 16.º (Resolução alternativa de litígios)</h3>
          <p>
            Nos termos da Lei n.º 144/2015, de 8 de setembro (na redação em vigor), em caso de litígio
            de consumo, o consumidor pode recorrer a entidade de Resolução Alternativa de Litígios (RAL).
          </p>

          <h3 className="text-base font-semibold text-gray-900">Artigo 17.º (TRIAVE)</h3>
          <p>
            Para a área territorial aplicável, a entidade RAL de referência é o{" "}
            <strong>TRIAVE — Centro de Arbitragem de Conflitos de Consumo do Vale do Ave</strong>, com
            informação disponível em{" "}
            <a
              href="https://www.triave.pt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00923f] underline"
            >
              www.triave.pt
            </a>
            .
          </p>

          <h3 className="text-base font-semibold text-gray-900">Artigo 18.º (Plataforma RLL)</h3>
          <p>
            O consumidor pode igualmente recorrer à Plataforma Europeia de Resolução de Litígios em
            Linha (RLL), disponível em{" "}
            <a
              href="https://ec.europa.eu/consumers/odr/main/index.cfm?event=main.home2.show"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00923f] underline break-all"
            >
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>

          <h3 className="text-base font-semibold text-gray-900">Artigo 19.º (Entidade fiscalizadora)</h3>
          <p>
            Sem prejuízo da competência de outras entidades legalmente habilitadas, a atividade de
            prestação de serviços ao consumidor encontra-se sujeita à fiscalização da{" "}
            <strong>ASAE — Autoridade de Segurança Alimentar e Económica</strong>, em{" "}
            <a
              href="https://www.asae.gov.pt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00923f] underline"
            >
              www.asae.gov.pt
            </a>
            .
          </p>
        </section>

        <p className="border-t border-gray-200 pt-6 text-sm text-gray-600">
          Documentos complementares:{" "}
          <Link href="/privacidade" className="font-medium text-[#00923f] underline">
            Política de Privacidade
          </Link>
          {" "}e{" "}
          <Link href="/politica-cookies" className="font-medium text-[#00923f] underline">
            Política de Cookies
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
