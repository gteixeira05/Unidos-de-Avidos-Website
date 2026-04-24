"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import GaleriaSetCoverButton from "@/components/admin/GaleriaSetCoverButton";
import { GALLERY_FILE_INPUT_ACCEPT } from "@/lib/gallery-images";
import { withAssetVersion } from "@/lib/media/versioned-asset-url";

type Photo = {
  id: string;
  imageUrl: string;
  caption?: string | null;
  order: number;
};

export default function AdminGaleriaAnoPage({ params }: { params: { ano: string } }) {
  const ano = params.ano;
  const [items, setItems] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Popup adicionar fotos
  const [addOpen, setAddOpen] = useState(false);
  const [addFiles, setAddFiles] = useState<File[]>([]);
  const [addSaving, setAddSaving] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverUpdatedAt, setCoverUpdatedAt] = useState<string | null>(null);
  const [coverOpen, setCoverOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverSaving, setCoverSaving] = useState(false);
  const [coverError, setCoverError] = useState("");
  const coverInputRef = useRef<HTMLInputElement>(null);

  const loadYearMeta = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/galeria/anos?ano=${encodeURIComponent(ano)}`);
      const data = await res.json();
      if (res.ok && data.item) {
        setCoverImageUrl((data.item.coverImageUrl as string | null) ?? null);
        setCoverUpdatedAt((data.item.updatedAt as string | undefined) ?? null);
      }
    } catch {
      /* ignorar */
    }
  }, [ano]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await loadYearMeta();
      const fotosRes = await fetch(`/api/admin/galeria/fotos?ano=${encodeURIComponent(ano)}`);
      const data = await fotosRes.json();
      if (!fotosRes.ok) throw new Error(data.error ?? "Erro ao carregar fotos.");
      setItems((data.items ?? []) as Photo[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocorreu um erro.");
    } finally {
      setLoading(false);
    }
  }, [ano, loadYearMeta]);

  useEffect(() => {
    void load();
  }, [load]);

  function openAdd() {
    setAddOpen(true);
    setAddFiles([]);
    setAddSaving(false);
    setError("");
    if (addInputRef.current) {
      addInputRef.current.value = "";
    }
  }
  function closeAdd() {
    setAddOpen(false);
  }

  function openCover() {
    setCoverOpen(true);
    setCoverFile(null);
    setCoverSaving(false);
    setCoverError("");
    if (coverInputRef.current) coverInputRef.current.value = "";
  }
  function closeCover() {
    setCoverOpen(false);
  }

  async function submitCover(e: FormEvent) {
    e.preventDefault();
    if (!coverFile || coverFile.size === 0) {
      setCoverError("Selecione uma imagem.");
      return;
    }
    setCoverSaving(true);
    setCoverError("");
    try {
      const formData = new FormData();
      formData.set("ano", ano);
      formData.set("cover", coverFile);
      const res = await fetch("/api/admin/galeria/anos", {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao atualizar a capa.");
      setCoverImageUrl(data.item?.coverImageUrl ?? null);
      setCoverUpdatedAt(data.item?.updatedAt ?? new Date().toISOString());
      closeCover();
    } catch (e2) {
      setCoverError(e2 instanceof Error ? e2.message : "Erro.");
    } finally {
      setCoverSaving(false);
    }
  }

  function onAddFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) {
      setAddFiles([]);
      return;
    }
    setAddFiles(Array.from(files));
  }

  async function submitAdd(e: FormEvent) {
    e.preventDefault();
    if (!addFiles.length) {
      setError("Selecione pelo menos uma foto.");
      return;
    }
    setAddSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("ano", ano);
      addFiles.forEach((f) => formData.append("files", f));
      const res = await fetch("/api/admin/galeria/fotos", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao adicionar fotos.");
      closeAdd();
      await load();
    } catch (e2) {
      const raw = e2 instanceof Error ? e2.message : "";
      if (
        raw.includes("did not match the expected pattern") ||
        raw.includes("expected pattern")
      ) {
        setError(
          "O navegador rejeitou o tipo de ficheiros (erro conhecido no Safari). Atualize a página e tente outra vez; se persistir, envie menos fotos de cada vez (ex.: 10) ou use JPG/PNG."
        );
      } else {
        setError(raw || "Ocorreu um erro.");
      }
    } finally {
      setAddSaving(false);
    }
  }

  async function removePhoto(id: string) {
    if (!confirm("Remover esta foto?")) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/galeria/fotos?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao remover foto.");
      await load();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Ocorreu um erro.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/galeria"
          className="text-sm font-medium text-[#00923f] hover:underline"
        >
          ← Voltar à galeria
        </Link>
      </div>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">Admin · Galeria {ano}</h1>
      <p className="mt-4 text-lg text-gray-600">Gerir capa e fotos deste ano.</p>

      <div className="mt-6 rounded-xl border border-[#00923f]/20 bg-[#00923f]/5 p-4">
        <p className="text-sm font-semibold text-[#00923f]">Foto de capa (lista galeria)</p>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          {coverImageUrl ? (
            <div className="h-24 w-40 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withAssetVersion(coverImageUrl, coverUpdatedAt ?? Date.now())}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <p className="text-sm text-gray-600">Ainda sem capa definida.</p>
          )}
          <button
            type="button"
            onClick={openCover}
            className="rounded-lg border border-[#00923f]/40 bg-white px-4 py-2 text-sm font-semibold text-[#00923f] hover:bg-[#00923f]/5"
          >
            Alterar capa (upload)
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-600">
          Ou use &quot;Usar como capa&quot; numa foto abaixo.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a33]"
        >
          Adicionar fotos
        </button>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="mt-6 text-gray-600">A carregar…</p>
      ) : items.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt={p.caption ?? `Foto ${ano}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <GaleriaSetCoverButton
                  ano={ano}
                  imageUrl={p.imageUrl}
                  onDone={() => void loadYearMeta()}
                />
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 sm:w-auto sm:min-w-[8rem]"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-gray-700">
          Ainda não há fotos. Use &quot;Adicionar fotos&quot; para enviar imagens da galeria do dispositivo.
        </div>
      )}

      {coverOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-cover-title"
        >
          <button
            type="button"
            onClick={closeCover}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-[#00923f]/5 p-5">
              <h2 id="admin-cover-title" className="text-lg font-bold text-gray-900">
                Nova foto de capa — {ano}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                A imagem será otimizada no servidor (inclui HEIC do iPhone).
              </p>
            </div>
            <form noValidate onSubmit={submitCover} className="p-5">
              {coverError ? (
                <p className="mb-3 text-sm text-red-700">{coverError}</p>
              ) : null}
              <input
                ref={coverInputRef}
                type="file"
                accept={GALLERY_FILE_INPUT_ACCEPT}
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#00923f]/10 file:px-3 file:py-2 file:text-[#00923f] file:font-semibold"
              />
              {coverFile ? (
                <p className="mt-2 text-sm text-gray-600">1 ficheiro selecionado.</p>
              ) : null}
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={closeCover}
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={coverSaving || !coverFile}
                  className="flex-1 rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a33] disabled:opacity-60"
                >
                  {coverSaving ? "A guardar…" : "Guardar capa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup: Adicionar fotos (upload múltiplo da galeria) */}
      {addOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-photos-title"
        >
          <button
            type="button"
            onClick={closeAdd}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-[#00923f]/5 p-5">
              <h2 id="add-photos-title" className="text-lg font-bold text-gray-900">
                Adicionar fotos
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Escolha uma ou várias fotos da galeria do dispositivo.
              </p>
            </div>
            <form noValidate onSubmit={submitAdd} className="p-5">
              {error ? (
                <p className="mb-3 text-sm text-red-700">{error}</p>
              ) : null}
              <input
                ref={addInputRef}
                type="file"
                accept={GALLERY_FILE_INPUT_ACCEPT}
                multiple
                onChange={onAddFileChange}
                className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#00923f]/10 file:px-3 file:py-2 file:text-[#00923f] file:font-semibold"
              />
              {addFiles.length > 0 ? (
                <p className="mt-2 text-sm text-gray-600">
                  {addFiles.length} foto(s) selecionada(s).
                </p>
              ) : null}
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={closeAdd}
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addSaving || addFiles.length === 0}
                  className="flex-1 rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a33] disabled:opacity-60"
                >
                  {addSaving ? "A enviar…" : "Enviar fotos"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
