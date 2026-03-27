import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidade | Unidos de Avidos",
  description:
    "Política de Privacidade da Associação Unidos de Avidos, em conformidade com o RGPD e a legislação portuguesa aplicável.",
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#00923f]">Legal</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Política de Privacidade
      </h1>
      <p className="mt-4 text-sm text-gray-500">Última atualização: março de 2026</p>

      <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-gray-700">
        <p>
          A presente Política de Privacidade regula o tratamento de dados pessoais efetuado pela{" "}
          <strong>Associação Unidos de Avidos</strong>, com sede em N204-5, 4770-778 Avidos, Vila Nova
          de Famalicão, NIPC 508195551, no âmbito da utilização deste website, da criação de contas de
          utilizador e da gestão de pedidos de reserva de aluguer de fardas/roupas.
        </p>
        <p>
          O tratamento é realizado em conformidade com o <strong>Regulamento (UE) 2016/679 (RGPD)</strong>,
          a <strong>Lei n.º 58/2019</strong> e demais legislação nacional e europeia aplicável em
          matéria de proteção de dados.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">1. Responsável pelo Tratamento</h2>
        <p>
          O responsável pelo tratamento dos dados pessoais é a Associação Unidos de Avidos.
          Para qualquer questão relacionada com o tratamento de dados pessoais, o titular dos dados
          poderá contactar:
        </p>
        <ul className="list-inside list-disc space-y-1 pl-1">
          <li>
            Email:{" "}
            <a href="mailto:unidosdeavidos@gmail.com" className="text-[#00923f] underline">
              unidosdeavidos@gmail.com
            </a>
          </li>
          <li>Morada: N204-5, 4770-778 Avidos, Vila Nova de Famalicão</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900">2. Categorias de Dados Pessoais</h2>
        <p>No contexto das funcionalidades disponibilizadas no website, podem ser tratados:</p>
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>
            Dados de identificação e contacto: nome, endereço de correio eletrónico, telefone
            (quando fornecido);
          </li>
          <li>
            Dados de conta de utilizador: identificador interno de conta, credenciais de autenticação
            (palavra-passe sob forma cifrada/hash), preferências de notificações;
          </li>
          <li>
            Dados associados a pedidos de reserva: identificação da peça, período pretendido, estado da
            reserva e observações submetidas pelo utilizador;
          </li>
          <li>
            Dados técnicos estritamente necessários à segurança e operação do serviço (incluindo dados
            de sessão e registos técnicos indispensáveis à deteção e mitigação de abuso).
          </li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900">3. Finalidades e Fundamentos de Licitude</h2>
        <p>Os dados pessoais são tratados para as seguintes finalidades:</p>
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>
            <strong>Gestão de registo, autenticação e sessão</strong> — fundamento: execução de diligências
            pré-contratuais e contratuais (artigo 6.º, n.º 1, alínea b) do RGPD);
          </li>
          <li>
            <strong>Gestão de pedidos de reserva e comunicações associadas</strong> — fundamento: execução
            de diligências pré-contratuais e contratuais (artigo 6.º, n.º 1, alínea b) do RGPD);
          </li>
          <li>
            <strong>Resposta a pedidos de contacto e apoio</strong> — fundamento: interesse legítimo da
            associação em responder às solicitações recebidas (artigo 6.º, n.º 1, alínea f) do RGPD);
          </li>
          <li>
            <strong>Segurança da plataforma, prevenção de fraude/abuso e integridade dos sistemas</strong>{" "}
            — fundamento: interesse legítimo (artigo 6.º, n.º 1, alínea f) do RGPD);
          </li>
          <li>
            <strong>Cumprimento de obrigações legais</strong> — fundamento: cumprimento de obrigação
            jurídica (artigo 6.º, n.º 1, alínea c) do RGPD).
          </li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900">4. Conservação dos Dados</h2>
        <p>
          Os dados são conservados apenas pelo período estritamente necessário às finalidades acima
          descritas, sem prejuízo dos prazos de conservação legalmente impostos.
        </p>
        <p>
          Em termos gerais: dados de conta são mantidos enquanto a conta estiver ativa; dados de
          reservas são conservados durante o período necessário à gestão da relação com o utilizador e
          eventual defesa de direitos; dados técnicos e de segurança são retidos por prazos proporcionais
          à finalidade de segurança e auditoria.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">5. Destinatários e Subcontratantes</h2>
        <p>
          Os dados podem ser tratados por entidades subcontratantes, em nome e por conta da associação,
          para efeitos de alojamento, base de dados, envio de comunicações eletrónicas e armazenamento
          de conteúdos multimédia. A associação assegura a celebração dos instrumentos jurídicos exigidos
          pelo artigo 28.º do RGPD.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">6. Transferências Internacionais</h2>
        <p>
          Sempre que, por via de fornecedores tecnológicos, ocorra transferência de dados para países
          terceiros ao Espaço Económico Europeu, a mesma será realizada com base em mecanismos de
          garantia adequados previstos no RGPD, designadamente cláusulas contratuais-tipo adotadas pela
          Comissão Europeia, quando aplicável.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">7. Direitos dos Titulares dos Dados</h2>
        <p>
          Nos termos da lei, o titular dos dados pode exercer os direitos de acesso, retificação,
          apagamento, limitação do tratamento, portabilidade e oposição, bem como retirar consentimento
          quando este constitua o fundamento de licitude.
        </p>
        <p>
          O exercício de direitos deverá ser solicitado por escrito para o contacto indicado na secção 1.
          A associação poderá solicitar informação adicional para validação de identidade, quando
          estritamente necessário.
        </p>
        <p>
          O titular dos dados tem, ainda, o direito de apresentar reclamação junto da autoridade de
          controlo competente em Portugal:{" "}
          <a
            href="https://www.cnpd.pt"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00923f] underline"
          >
            Comissão Nacional de Proteção de Dados (CNPD)
          </a>
          .
        </p>

        <h2 className="text-lg font-semibold text-gray-900">8. Segurança da Informação</h2>
        <p>
          A associação adota medidas técnicas e organizativas adequadas à proteção dos dados pessoais,
          incluindo mecanismos de autenticação, controlo de acesso, proteção da sessão e medidas de
          mitigação de acesso abusivo. Não obstante, nenhuma transmissão de dados em ambiente de internet
          pode ser garantida como absolutamente inviolável.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">9. Alterações à Política</h2>
        <p>
          A Associação Unidos de Avidos reserva-se o direito de, a qualquer momento, atualizar a presente
          Política de Privacidade, sendo publicada no website a versão em vigor, com indicação da data de
          última atualização.
        </p>

        <p className="border-t border-gray-200 pt-6 text-sm text-gray-600">
          Documentos complementares:{" "}
          <Link href="/politica-cookies" className="font-medium text-[#00923f] underline">
            Política de Cookies
          </Link>{" "}
          e{" "}
          <Link href="/termos" className="font-medium text-[#00923f] underline">
            Termos e Condições
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
