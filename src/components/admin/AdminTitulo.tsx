import type { ReactNode } from "react";

/** Cabeçalho de uma secção do admin. */
export default function AdminTitulo({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-gray-600">{descricao}</p>}
      </div>
      {acoes}
    </div>
  );
}
