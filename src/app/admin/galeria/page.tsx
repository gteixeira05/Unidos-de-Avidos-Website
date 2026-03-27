"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type GalleryYear = {
  id: string;
  ano: number;
  title?: string | null;
  coverImageUrl?: string | null;
};

type DeleteConfirmState =
  | { open: false }
  | { open: true; year: GalleryYear; step: 1 }
  | { open: true; year: GalleryYear; step: 2 };

export default function AdminGaleriaPage() {
  const [items, setItems] = useState<GalleryYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Criar álbum popup
  const [createOpen, setCreateOpen] = useState(false);
  const [createAno, setCreateAno] = useState("");
  const [createCover, setCreateCover] = useState<File | null>(null);
  const [createSaving, setCreateSaving] = useState(false);
  const createCoverInputRef = useRef<HTMLInputElement>(null);

  // Eliminar álbum: dupla confirmação
  const [deleteState, setDeleteState] = useState<DeleteConfirmState>({ open: false });

  // Alterar capa de álbum existente
  const [coverEditYear, setCoverEditYear] = useState<GalleryYear | null>(null);
  const [coverEditFile, setCoverEditFile] = useState<File | null>(null);
  const [coverEditSaving, setCoverEditSaving] = useState(false);
  const coverEditInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/galeria/anos");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar anos.");
      setItems((data.items ?? []) as GalleryYear[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocorreu um erro.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

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
      await load();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Ocorreu um erro.");
    } finally {
      setCreateSaving(false);
    }
  }

  function openDelete(year: GalleryYear) {
    setDeleteState({ open: true, year, step: 1 });
  }
  function closeDelete() {
    setDeleteState({ open: false });
  }
  function deleteStep2() {
    if (deleteState.open && deleteState.step === 1) {
      setDeleteState({ ...deleteState, step: 2 });
    }
  }
  function openCoverEdit(y: GalleryYear) {
    setCoverEditYear(y);
    setCoverEditFile(null);
    setCoverEditSaving(false);
    setError("");
    if (coverEditInputRef.current) coverEditInputRef.current.value = "";
  }
  function closeCoverEdit() {
    setCoverEditYear(null);
  }

  async function submitCoverEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!coverEditYear || !coverEditFile || coverEditFile.size === 0) {
      setError("Selecione uma imagem para a capa.");
      return;
    }
    setCoverEditSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("ano", String(coverEditYear.ano));
      formData.set("cover", coverEditFile);
      const res = await fetch("/api/admin/galeria/anos", {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao atualizar a capa.");
      closeCoverEdit();
      await load();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Ocorreu um erro.");
    } finally {
      setCoverEditSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteState.open || deleteState.step !== 2) return;
    const { year } = deleteState;
    setError("");
    try {
      const res = await fetch(
        `/api/admin/galeria/anos?ano=${encodeURIComponent(year.ano)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao eliminar álbum.");
      closeDelete();
      await load();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Ocorreu um erro.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Admin · Galeria</h1>
      <p className="mt-4 text-lg text-gray-600">
        Criar álbuns por ano e gerir fotos (upload da galeria do dispositivo).
      </p>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6">
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a33]"
        >
          Criar novo álbum
        </button>
      </div>

      {loading ? (
        <p className="mt-6 text-gray-600">A carregar…</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((y) => (
            <div
              key={y.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gray-300"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/admin/galeria/${y.ano}`}
                  className="min-w-0 flex-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00923f]"
                >
                  <p className="text-sm font-semibold text-[#00923f]">Ano {y.ano}</p>
                  {y.coverImageUrl ? (
                    <div className="mt-2 aspect-video overflow-hidden rounded-lg bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={y.coverImageUrl}
                        alt={`Capa ${y.ano}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">Sem capa</p>
                  )}
                  <span className="mt-4 inline-block text-sm font-medium text-[#00923f]">
                    Gerir fotos →
                  </span>
                </Link>
                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      openCoverEdit(y);
                    }}
                    className="rounded-lg border border-[#00923f]/40 bg-white px-3 py-2 text-sm font-semibold text-[#00923f] hover:bg-[#00923f]/5"
                  >
                    Alterar capa
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      openDelete(y);
                    }}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                    aria-label={`Eliminar álbum ${y.ano}`}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!items.length ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-700">
              Ainda não existem álbuns. Crie um com o botão acima.
            </div>
          ) : null}
        </div>
      )}

      {/* Popup: Criar novo álbum */}
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
              {error ? (
                <p className="mb-3 text-sm text-red-700">{error}</p>
              ) : null}
              <label className="block text-sm font-medium text-gray-700">
                Ano
              </label>
              <input
                type="number"
                min="1900"
                max="2100"
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

      {/* Popup: Alterar capa */}
      {coverEditYear && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-cover-title"
        >
          <button
            type="button"
            onClick={closeCoverEdit}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-[#00923f]/5 p-5">
              <h2 id="edit-cover-title" className="text-lg font-bold text-gray-900">
                Nova capa — {coverEditYear.ano}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                A imagem será otimizada no servidor (inclui HEIC do iPhone).
              </p>
            </div>
            <form noValidate onSubmit={submitCoverEdit} className="p-5">
              {error ? (
                <p className="mb-3 text-sm text-red-700">{error}</p>
              ) : null}
              <input
                ref={coverEditInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/dng,.dng,application/octet-stream"
                onChange={(e) => setCoverEditFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#00923f]/10 file:px-3 file:py-2 file:text-[#00923f] file:font-semibold"
              />
              {coverEditFile ? (
                <p className="mt-2 text-sm text-gray-600">1 ficheiro selecionado.</p>
              ) : null}
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={closeCoverEdit}
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={coverEditSaving || !coverEditFile}
                  className="flex-1 rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a33] disabled:opacity-60"
                >
                  {coverEditSaving ? "A guardar…" : "Guardar capa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup: Eliminar álbum (dupla confirmação) */}
      {deleteState.open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-album-title"
        >
          <button
            type="button"
            onClick={closeDelete}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-red-50/80 p-5">
              <h2 id="delete-album-title" className="text-lg font-bold text-gray-900">
                {deleteState.step === 1
                  ? "Eliminar álbum?"
                  : "Tem a certeza que quer eliminar?"}
              </h2>
              <p className="mt-1 text-sm text-gray-700">
                {deleteState.step === 1
                  ? `O álbum do ano ${deleteState.year.ano} e todas as fotos serão eliminados.`
                  : "Esta ação não pode ser desfeita."}
              </p>
            </div>
            <div className="p-5">
              <div className="flex gap-2">
                {deleteState.step === 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={closeDelete}
                      className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={deleteStep2}
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Sim, eliminar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={closeDelete}
                      className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                    >
                      Não, cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmDelete}
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Confirmar eliminação
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
