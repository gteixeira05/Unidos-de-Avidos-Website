import Image from "next/image";
import Link from "next/link";

const eventos = [
  {
    titulo: "Festa da Flor",
    data: "10 de Maio 2026",
    imagem: "/evento-festa-da-flor.png",
    descricao: "Celebração da Festa da Flor com a comunidade de Avidos.",
  },
  {
    titulo: "Marchas Antoninas",
    data: "12 de junho 2026",
    imagem: "/evento-marchas-antoninas.png",
    descricao: "Participação nas Marchas Antoninas de Vila Nova de Famalicão.",
  },
];

export default function AgendaPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
      <p className="mt-2 text-lg text-gray-600">
        Consulte os nossos próximos eventos e atividades.
      </p>

      <div className="mt-10 space-y-10">
        {eventos.map((evento, index) => (
          <article
            key={index}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="sm:flex">
              <div className="relative h-56 w-full shrink-0 sm:h-64 sm:w-80">
                <Image
                  src={evento.imagem}
                  alt={evento.titulo}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 320px"
                />
              </div>
              <div className="flex flex-col justify-center p-6">
                <time className="text-sm font-medium text-[#00923f]">
                  {evento.data}
                </time>
                <h2 className="mt-1 text-xl font-bold text-gray-900">
                  {evento.titulo}
                </h2>
                <p className="mt-2 text-gray-600">{evento.descricao}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-12 text-center text-gray-600">
        <Link href="/" className="font-medium text-[#00923f] hover:underline">
          ← Voltar ao início
        </Link>
      </p>
    </div>
  );
}
