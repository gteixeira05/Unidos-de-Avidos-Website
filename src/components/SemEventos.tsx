import Link from "next/link";
export default function SemEventos() {
  return (
    <div className="mt-10 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
      <p className="text-lg font-semibold text-gray-900">Novas datas em breve</p>
      <p className="mt-2 text-gray-600">
        Estamos a preparar os próximos eventos. Volte em breve ou{" "}
        <Link href="/fale-connosco" className="font-medium text-[#00923f] hover:underline">
          fale connosco
        </Link>
        .
      </p>
    </div>
  );
}
