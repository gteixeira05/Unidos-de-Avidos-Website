export default function SobrePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Sobre Nós</h1>
      <p className="mt-4 text-lg text-gray-600">
        Conheça a nossa história e os órgãos sociais da associação.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <a
          href="/sobre/historia"
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-[#00923f] hover:shadow-md"
        >
          <h2 className="text-xl font-semibold text-[#00923f]">História</h2>
          <p className="mt-2 text-sm text-gray-600">
            Como nasceu a associação e o que nos move.
          </p>
        </a>
        <a
          href="/sobre/orgaos-sociais"
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-[#00923f] hover:shadow-md"
        >
          <h2 className="text-xl font-semibold text-[#00923f]">Órgãos Sociais</h2>
          <p className="mt-2 text-sm text-gray-600">
            Direção, Assembleia Geral e Conselho Fiscal (exemplo).
          </p>
        </a>
      </div>
    </div>
  );
}
