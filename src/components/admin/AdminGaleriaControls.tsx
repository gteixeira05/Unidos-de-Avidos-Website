"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export type DbYearForCard = {
  id: string;
  ano: number;
  coverImageUrl?: string | null;
};

type DeleteStep = 1 | 2;

function DoubleDeleteAlbumModal({
  open,
  ano,
  step,
  deleting,
  onClose,
  onStep2,
  onConfirm,
}: {
  open: boolean;
  ano: number;
  step: DeleteStep;
  deleting: boolean;
  onClose: () => void;
  onStep2: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-album-title"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-100 bg-red-50/80 p-5">
          <h2 id="delete-album-title" className="text-lg font-bold text-gray-900">
            {step === 1 ? "Eliminar álbum?" : "Tem a certeza que quer eliminar?"}
          </h2>
          <p className="mt-1 text-sm text-gray-700">
            {step === 1
              ? `O álbum do ano ${ano} e todas as fotos serão eliminados.`
              : "Esta ação não pode ser desfeita."}
          </p>
        </div>
        <div className="p-5">
          <div className="flex gap-2">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onStep2}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Sim, eliminar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Não, cancelar
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? "A eliminar…" : "Confirmar eliminação"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Botão "Criar novo álbum" + popup (topo da página Galeria). */
export default function AdminGaleriaControls() {
  const router = useRouter();
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createAno, setCreateAno] = useState("");
  const [createCover, setCreateCover] = useState<File | null>(null);
  const [createSaving, setCreateSaving] = useState(false);
  const createCoverInputRef = useRef<HTMLInputElement>(null);

  function openCreate() {
    setCreateOpen(true);
    setCreateAno("");
    setCreateCover(null);
    setCreateSaving(false);
    setError("");
  }
  function closeCreate() {
    setCreateOpen(false);
    if (createCoverInputRef.current) createCoverInputRef.current.value = "";
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    const anoNum = Number(createAno);
    if (!Number.isFinite(anoNum)) {
      setError("Indique um ano válido.");
      return;
    }
    if (!createCover || createCover.size === 0) {
      setError("Selecione a foto de capa do álbum.");
      return;
    }
    setCreateSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("ano", String(anoNum));
      formData.set("cover", createCover);
      const res = await fetch("/api/admin/galeria/anos", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar álbum.");
      closeCreate();
      router.refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Ocorreu um erro.");
    } finally {
      setCreateSaving(false);
    }
  }

  return (
    <>
      <div className="mt-6 rounded-xl border border-[#00923f]/20 bg-[#00923f]/5 p-4">
        <h2 className="text-lg font-semibold text-[#00923f]">Modo Admin</h2>
        <p className="mt-1 text-sm text-gray-700">
          Crie álbuns com foto de capa (upload do telemóvel ou computador). Gestão
          extra em{" "}
          <Link href="/admin/galeria" className="font-medium underline">
            Admin · Galeria
          </Link>
          .
        </p>
        {error && !createOpen ? (
          <p className="mt-2 text-sm text-red-700">{error}</p>
        ) : null}
        <button
          type="button"
          onClick={openCreate}
          className="mt-3 rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a33]"
        >
          Criar novo álbum
        </button>
      </div>

      {createOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-album-title"
        >
          <button
            type="button"
            onClick={closeCreate}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-[#00923f]/5 p-5">
              <h2 id="create-album-title" className="text-lg font-bold text-gray-900">
                Criar novo álbum
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Indique o ano e escolha a foto de capa (uma só).
              </p>
            </div>
            <form noValidate onSubmit={submitCreate} className="p-5">
              {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
              <label className="block text-sm font-medium text-gray-700">Ano</label>
              <input
                type="number"
                min={1900}
                max={2100}
                value={createAno}
                onChange={(e) => setCreateAno(e.target.value)}
                placeholder="ex: 2025"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                required
              />
              <label className="mt-4 block text-sm font-medium text-gray-700">
                Foto de capa
              </label>
              <input
                ref={createCoverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/dng,.dng,application/octet-stream"
                onChange={(e) => setCreateCover(e.target.files?.[0] ?? null)}
                className="mt-1 w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#00923f]/10 file:px-3 file:py-2 file:text-[#00923f] file:font-semibold"
              />
              {createCover ? (
                <p className="mt-1 text-xs text-gray-500">
                  {createCover.name} ({(createCover.size / 1024).toFixed(1)} KB)
                </p>
              ) : null}
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={closeCreate}
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createSaving}
                  className="flex-1 rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a33] disabled:opacity-60"
                >
                  {createSaving ? "A criar…" : "Criar álbum"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/** Card do ano na galeria pública com botão Eliminar (só anos na BD). */
export function AdminGaleriaYearCardShell({
  ano,
  coverSrc,
  dbYear,
}: {
  ano: number;
  coverSrc: string;
  dbYear: DbYearForCard | null;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<DeleteStep>(1);
  const [deleteErr, setDeleteErr] = useState("");
  const [deleting, setDeleting] = useState(false);

  function openDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!dbYear) return;
    setDeleteStep(1);
    setDeleteErr("");
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!dbYear) return;
    setDeleting(true);
    setDeleteErr("");
    try {
      const res = await fetch(
        `/api/admin/galeria/anos?ano=${encodeURIComponent(dbYear.ano)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao eliminar.");
      setDeleteOpen(false);
      router.refresh();
    } catch (err) {
      setDeleteErr(err instanceof Error ? err.message : "Erro.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="relative">
      <Link
        href={`/galeria/${ano}`}
        className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-[#00923f] hover:shadow-md"
      >
        <div className="relative h-40 bg-gray-100">
          <Image
            src={coverSrc}
            alt={`Galeria ${ano}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/15" />
        </div>
        <div className="flex items-end justify-between gap-3 p-5">
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-semibold text-gray-900">{ano}</h3>
            <p className="mt-1 text-sm text-gray-600">Ver fotografias deste ano →</p>
          </div>
          {dbYear ? (
            <button
              type="button"
              onClick={openDelete}
              className="shrink-0 self-end rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              Eliminar
            </button>
          ) : null}
        </div>
      </Link>

      <DoubleDeleteAlbumModal
        open={deleteOpen}
        ano={ano}
        step={deleteStep}
        onClose={() => setDeleteOpen(false)}
        onStep2={() => setDeleteStep(2)}
        deleting={deleting}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
      {deleteErr && deleteOpen ? (
        <div className="fixed bottom-24 left-1/2 z-[70] max-w-sm -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg">
          {deleteErr}
        </div>
      ) : null}
    </div>
  );
}
