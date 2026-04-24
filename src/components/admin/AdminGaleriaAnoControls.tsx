"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { GALLERY_FILE_INPUT_ACCEPT } from "@/lib/gallery-images";
import { withAssetVersion } from "@/lib/media/versioned-asset-url";

type Props = {
  ano: string;
  hasDbYear: boolean;
  /** Capa atual (lista galeria / página do álbum). */
  coverImageUrl?: string | null;
  coverUpdatedAt?: string | Date;
};

/** Barra no topo do álbum: capa, adicionar fotos, eliminar álbum. */
export default function AdminGaleriaAnoControls({
  ano,
  hasDbYear,
  coverImageUrl,
  coverUpdatedAt,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [addFiles, setAddFiles] = useState<File[]>([]);
  const [addSaving, setAddSaving] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const [coverOpen, setCoverOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverSaving, setCoverSaving] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  function openAdd() {
    if (!hasDbYear) return;
    setAddOpen(true);
    setAddFiles([]);
    setAddSaving(false);
    setError("");
    if (addInputRef.current) addInputRef.current.value = "";
  }
  function closeAdd() {
    setAddOpen(false);
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
      router.refresh();
    } catch (e2) {
      const raw = e2 instanceof Error ? e2.message : "";
      if (
        raw.includes("did not match the expected pattern") ||
        raw.includes("expected pattern")
      ) {
        setError(
          "O navegador rejeitou o tipo de ficheiros (erro conhecido no Safari com muitas fotos). Atualize a página e tente outra vez; se persistir, envie menos fotos de cada vez (ex.: 10) ou use JPG/PNG."
        );
      } else {
        setError(raw || "Ocorreu um erro.");
      }
    } finally {
      setAddSaving(false);
    }
  }

  function openCover() {
    if (!hasDbYear) return;
    setCoverOpen(true);
    setCoverFile(null);
    setCoverSaving(false);
    setError("");
    if (coverInputRef.current) coverInputRef.current.value = "";
  }
  function closeCover() {
    setCoverOpen(false);
  }

  function onCoverFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setCoverFile(f ?? null);
  }

  async function submitCover(e: FormEvent) {
    e.preventDefault();
    if (!coverFile || coverFile.size === 0) {
      setError("Selecione uma imagem para a capa.");
      return;
    }
    setCoverSaving(true);
    setError("");
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
      closeCover();
      router.refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Ocorreu um erro.");
    } finally {
      setCoverSaving(false);
    }
  }

  async function confirmDeleteAlbum() {
    setDeleteSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/galeria/anos?ano=${encodeURIComponent(ano)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao eliminar álbum.");
      setDeleteOpen(false);
      window.location.href = "/galeria";
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Ocorreu um erro.");
    } finally {
      setDeleteSaving(false);
    }
  }

  return (
    <>
      <div className="mt-6 rounded-xl border border-[#00923f]/20 bg-[#00923f]/5 p-4">
        <h2 className="text-lg font-semibold text-[#00923f]">Modo Admin</h2>
        <p className="mt-1 text-sm text-gray-700">
          Alterar capa, adicionar fotos ou eliminar o álbum. Também pode usar &quot;Usar como
          capa&quot; numa foto abaixo.
        </p>
        {coverImageUrl && hasDbYear ? (
          <div className="mt-3 flex items-center gap-3">
            <p className="text-xs font-medium text-gray-600">Capa atual:</p>
            <div className="h-14 w-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withAssetVersion(coverImageUrl, coverUpdatedAt ?? Date.now())}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        ) : null}
        {error && !addOpen && !deleteOpen && !coverOpen ? (
          <p className="mt-2 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {hasDbYear ? (
            <button
              type="button"
              onClick={openCover}
              className="rounded-lg border border-[#00923f]/40 bg-white px-4 py-2 text-sm font-semibold text-[#00923f] hover:bg-[#00923f]/5"
            >
              Alterar capa
            </button>
          ) : null}
          {hasDbYear ? (
            <button
              type="button"
              onClick={openAdd}
              className="rounded-lg bg-[#00923f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a33]"
            >
              Adicionar fotos
            </button>
          ) : null}
          {hasDbYear ? (
            <button
              type="button"
              onClick={() => {
                setDeleteStep(1);
                setError("");
                setDeleteOpen(true);
              }}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Eliminar álbum
            </button>
          ) : null}
        </div>

        {!hasDbYear ? (
          <p className="mt-3 text-sm text-gray-600">
            Este ano ainda não tem álbum na base de dados. Crie o álbum na página{" "}
            <span className="font-medium">Galeria</span> (botão &quot;Criar novo
            álbum&quot;) para poder enviar fotos aqui.
          </p>
        ) : null}
      </div>

      {coverOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cover-album-title"
        >
          <button
            type="button"
            onClick={closeCover}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-[#00923f]/5 p-5">
              <h2 id="cover-album-title" className="text-lg font-bold text-gray-900">
                Nova foto de capa
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                A imagem será otimizada no servidor (inclui HEIC do iPhone).
              </p>
            </div>
            <form noValidate onSubmit={submitCover} className="p-5">
              {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
              <input
                ref={coverInputRef}
                type="file"
                accept={GALLERY_FILE_INPUT_ACCEPT}
                onChange={onCoverFileChange}
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
              {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
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

      {deleteOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setDeleteOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-red-50/80 p-5">
              <h2 className="text-lg font-bold text-gray-900">
                {deleteStep === 1
                  ? "Eliminar álbum?"
                  : "Tem a certeza que quer eliminar?"}
              </h2>
              <p className="mt-1 text-sm text-gray-700">
                {deleteStep === 1
                  ? `O álbum ${ano} e todas as fotos serão eliminados.`
                  : "Esta ação não pode ser desfeita."}
              </p>
            </div>
            <div className="p-5">
              {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
              <div className="flex gap-2">
                {deleteStep === 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setDeleteOpen(false)}
                      className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteStep(2)}
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Sim, eliminar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setDeleteOpen(false)}
                      className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                    >
                      Não, cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void confirmDeleteAlbum()}
                      disabled={deleteSaving}
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {deleteSaving ? "A eliminar…" : "Confirmar eliminação"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
