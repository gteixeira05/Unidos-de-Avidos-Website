import Image from "next/image";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { formatarDataEvento, proximosEventos } from "@/lib/agenda";
import SemEventos from "@/components/SemEventos";

export const metadata = pageMetadata({
  title: "Agenda",
  description:
    "Próximos eventos da Associação Unidos de Avidos: Festa da Flor, Marchas Antoninas e outras iniciativas.",
  path: "/agenda",
});

// Recalcula de hora a hora para os eventos passados saírem sozinhos.
export const revalidate = 3600;

export default function AgendaPage() {
  const eventos = proximosEventos();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
      <p className="mt-2 text-lg text-gray-600">
        Consulte os nossos próximos eventos e atividades.
      </p>

      {eventos.length === 0 && <SemEventos />}

      <div className="mt-10 space-y-10">
        {eventos.map((evento) => (
          <article
            key={evento.slug}
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
                <time dateTime={evento.data} className="text-sm font-medium text-[#00923f]">
                  {formatarDataEvento(evento.data)}
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
