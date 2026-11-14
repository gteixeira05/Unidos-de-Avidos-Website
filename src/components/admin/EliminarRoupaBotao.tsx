"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EliminarRoupaBotao({ id }: { id: string }) {
  const router = useRouter();
  const [aEliminar, setAEliminar] = useState(false);

  async function eliminar() {
    if (!confirm("Eliminar esta roupa? As fotos e a disponibilidade também são apagadas.")) return;
    setAEliminar(true);
    const res = await fetch(`/api/admin/roupas/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setAEliminar(false);
    if (!res.ok) {
      alert(data.error ?? "Erro ao eliminar.");
      return;
    }
    router.push("/admin/roupas");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={eliminar}
      disabled={aEliminar}
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
    >
      {aEliminar ? "A eliminar…" : "Eliminar roupa"}
    </button>
  );
}
