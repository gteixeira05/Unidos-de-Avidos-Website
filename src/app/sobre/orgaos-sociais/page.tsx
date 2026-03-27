export default function OrgaosSociaisPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Órgãos Sociais</h1>
      <p className="mt-4 text-lg text-gray-600">
        Composição atual dos órgãos sociais da Associação Unidos de Avidos.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#00923f]">Direção</h2>
          <ul className="mt-4 space-y-2 text-gray-700">
            <li>
              <span className="font-semibold">Presidente:</span> Sócio nº68 - Cláudio
              Miguel Sousa Teixeira
            </li>
            <li>
              <span className="font-semibold">Vice-Presidente:</span> Sócio nº89 -
              Raquel Sofia Pereira Andrade
            </li>
            <li>
              <span className="font-semibold">Tesoureiro:</span> Sócio nº100 - Maria
              Alice Monteiro Silva Freitas Campos
            </li>
            <li>
              <span className="font-semibold">Secretário:</span> Sócio nº86 - Ricardo
              Fernando Fernandes Almeida
            </li>
            <li>
              <span className="font-semibold">Vogal:</span> Sócio nº107 - Deolinda
              Fernandes Silva
            </li>
            <li>
              <span className="font-semibold">Vogal:</span> Sócio nº140 - Delfim
              Manuel Mendes Silva
            </li>
            <li>
              <span className="font-semibold">Vogal:</span> Sócio nº33 - Maria
              Conceição Branco Fontes Silva
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#00923f]">Assembleia Geral</h2>
          <ul className="mt-4 space-y-2 text-gray-700">
            <li>
              <span className="font-semibold">Presidente:</span> Sócio nº2 - António
              Augusto Campos Sousa
            </li>
            <li>
              <span className="font-semibold">Secretário:</span> Sócio nº110 - Idália
              Azevedo Pereira
            </li>
            <li>
              <span className="font-semibold">Secretário:</span> Sócio nº95 -
              Domingos Sérgio Pereira Andrade
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#00923f]">Conselho Fiscal</h2>
          <ul className="mt-4 space-y-2 text-gray-700">
            <li>
              <span className="font-semibold">Presidente:</span> Sócio nº123 - José
              Luís Ascensão Moreira
            </li>
            <li>
              <span className="font-semibold">Vogal:</span> Sócio nº64 - Hélder Jesus
              Ferreira Freitas
            </li>
            <li>
              <span className="font-semibold">Vogal:</span> Sócio nº9 - Sérgio Miguel
              Fernandes Tinoco Sampaio
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

