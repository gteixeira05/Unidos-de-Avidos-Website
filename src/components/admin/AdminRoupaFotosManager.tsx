"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

type Photo = { id: string; imageUrl: string; order: number };

export default function AdminRoupaFotosManager({
  roupaId,
  initialCoverUrl,
}: {
  roupaId: string;
  initialCoverUrl: string | null;
}) {
  const router = useRouter();
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [addFiles, setAddFiles] = useState<File[]>([]);
  const [addSaving, setAddSaving] = useState(false);
  const addRef = useRef<HTMLInputElement>(null);

  const [coverOpen, setCoverOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverSaving, setCoverSaving] = useState(false);
  const [clearingCover, setClearingCover] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [fRes, rRes] = await Promise.all([
        fetch(`/api/admin/roupas/${roupaId}/fotos`, { credentials: "include" }),
        fetch(`/api/admin/roupas/${roupaId}`, { credentials: "include" }),
      ]);
      const fData = await fRes.json();
      const rData = await rRes.json();
      if (!fRes.ok) throw new Error(fData.error ?? "Erro ao carregar fotos.");
      setPhotos((fData.items ?? []) as Photo[]);
      if (rRes.ok && rData.roupa) {
        setCoverUrl(rData.roupa.imagemUrl ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [roupaId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setCoverUrl(initialCoverUrl);
  }, [initialCoverUrl]);

  function openAdd() {
    setAddOpen(true);
    setAddFiles([]);
    setAddSaving(false);
    setError("");
    if (addRef.current) addRef.current.value = "";
  }
  function closeAdd() {
    setAddOpen(false);
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
      addFiles.forEach((f) => formData.append("files", f));
      const res = await fetch(`/api/admin/roupas/${roupaId}/fotos`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar.");
      closeAdd();
      await load();
      router.refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Erro.");
    } finally {
      setAddSaving(false);
    }
  }

  function openCover() {
    setCoverOpen(true);
    setCoverFile(null);
    setCoverSaving(false);
    setError("");
    if (coverRef.current) coverRef.current.value = "";
  }
  function closeCover() {
    setCoverOpen(false);
  }

  async function submitCover(e: FormEvent) {
    e.preventDefault();
    if (!coverFile?.size) {
      setError("Selecione uma imagem.");
      return;
    }
    setCoverSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("cover", coverFile);
      const res = await fetch(`/api/admin/roupas/${roupaId}/capa`, {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao atualizar capa.");
      setCoverUrl(data.roupa?.imagemUrl ?? null);
      closeCover();
      await load();
      router.refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Erro.");
    } finally {
      setCoverSaving(false);
    }
  }

  async function removeCoverCatalog() {
    if (!coverUrl) return;
    if (
      !confirm(
        "Remover a foto de capa do catálogo? Depois pode definir uma nova (upload ou foto da galeria)."
      )
    ) {
      return;
    }
    setClearingCover(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/roupas/${roupaId}/capa`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ clear: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao remover a capa.");
      setCoverUrl(data.roupa?.imagemUrl ?? null);
      await load();
      router.refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Erro.");
    } finally {
      setClearingCover(false);
    }
  }

  async function setCoverFromGallery(imageUrl: string) {
    setError("");
    try {
      const res = await fetch(`/api/admin/roupas/${roupaId}/capa`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao definir capa.");
      setCoverUrl(data.roupa?.imagemUrl ?? null);
      await load();
      router.refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Erro.");
    }
  }

  async function removePhoto(photoId: string) {
    if (!confirm("Remover esta foto da galeria?")) return;
    setError("");
    try {
      const res = await fetch(
        `/api/admin/roupas/${roupaId}/fotos?photoId=${encodeURIComponent(photoId)}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao remover.");
      await load();
      router.refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Erro.");
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-[#00923f]/20 bg-[#00923f]/5 p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-[#00923f]">Fotos da roupa (admin)</h3>
      <p className="mt-1 text-sm text-gray-700">
        A <strong>capa</strong> aparece no catálogo. As outras fotos aparecem na página desta roupa.
      </p>

      {error && !addOpen && !coverOpen ? (
        <p className="mt-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={openCover}
          disabled={clearingCover}
          className="rounded-lg border border-[#00923f]/40 bg-white px-4 py-2 text-sm font-semibold text-[#00923f] hover:bg-[#00923f]/5 disabled:opacity-50"
        >
          {coverUrl ? "Alterar foto de capa" : "Definir foto de capa"}
        </button>
        {coverUrl ? (
          <button
            type="button"
            onClick={() => void removeCoverCatalog()}
            disabled={clearingCover}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
          >
            {clearingCover ? "A remover…" : "Remover capa do catálogo"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={openAdd}
          disabled={clearingCover}
          className="rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a33] disabled:opacity-50"
        >
          Adicionar fotos à galeria
        </button>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-gray-600">Pré-visualização da capa (catálogo)</p>
        <div className="mt-2 flex h-32 w-full max-w-md items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt="Capa"
              width={400}
              height={200}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm text-gray-500">Sem capa — use o botão acima ou &quot;Usar como capa&quot; numa foto.</span>
          )}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold text-gray-900">Galeria</p>
        {loading ? (
          <p className="mt-2 text-sm text-gray-600">A carregar…</p>
        ) : photos.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600">Ainda não há fotos na galeria.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((p) => (
              <div
                key={p.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3] bg-gray-100">
                  <Image
                    src={p.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 200px"
                  />
                  {coverUrl === p.imageUrl ? (
                    <span className="absolute left-2 top-2 rounded bg-[#00923f] px-2 py-0.5 text-xs font-semibold text-white">
                      Capa
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1 p-2">
                  <button
                    type="button"
                    onClick={() => void setCoverFromGallery(p.imageUrl)}
                    disabled={coverUrl === p.imageUrl}
                    className="rounded-lg bg-[#00923f]/10 px-2 py-1.5 text-xs font-semibold text-[#00923f] hover:bg-[#00923f]/15 disabled:opacity-50"
                  >
                    {coverUrl === p.imageUrl ? "Já é a capa" : "Usar como capa"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void removePhoto(p.id)}
                    className="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {addOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={closeAdd}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-[#00923f]/5 p-5">
              <h2 className="text-lg font-bold text-gray-900">Adicionar fotos</h2>
              <p className="mt-1 text-sm text-gray-600">Uma ou várias imagens (HEIC do iPhone incluído).</p>
            </div>
            <form noValidate onSubmit={submitAdd} className="p-5">
              {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
              <input
                ref={addRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setAddFiles(e.target.files ? Array.from(e.target.files) : [])}
                className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#00923f]/10 file:px-3 file:py-2 file:font-semibold file:text-[#00923f]"
              />
              {addFiles.length > 0 ? (
                <p className="mt-2 text-sm text-gray-600">{addFiles.length} ficheiro(s).</p>
              ) : null}
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={closeAdd}
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addSaving || addFiles.length === 0}
                  className="flex-1 rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {addSaving ? "A enviar…" : "Enviar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {coverOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={closeCover}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-[#00923f]/5 p-5">
              <h2 className="text-lg font-bold text-gray-900">Foto de capa (catálogo)</h2>
              <p className="mt-1 text-sm text-gray-600">
                Imagem otimizada no servidor. Em produção (Vercel), use ficheiros até 4 MB.
              </p>
            </div>
            <form noValidate onSubmit={submitCover} className="p-5">
              {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
              <input
                ref={coverRef}
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#00923f]/10 file:px-3 file:py-2 file:font-semibold file:text-[#00923f]"
              />
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={closeCover}
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={coverSaving || !coverFile}
                  className="flex-1 rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {coverSaving ? "A guardar…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
