"use client";

import AdminRoupaInlineEditor from "@/components/admin/AdminRoupaInlineEditor";
import AdminRoupaFotosManager from "@/components/admin/AdminRoupaFotosManager";
import { useResolvedAdmin } from "@/hooks/useResolvedAdmin";

type RoupaEditorPayload = {
  id: string;
  ano: number;
  tema: string | null;
  descricao: string | null;
  conjuntoInclui: string | null;
  regrasLavagem: string | null;
  precoAluguer: number;
  quantidadeHomem: number;
  quantidadeMulher: number;
};

export default function RoupaDetailAdminSection({
  roupaId,
  initialCoverUrl,
  editorRoupa,
  serverIsAdmin,
}: {
  roupaId: string;
  initialCoverUrl: string | null;
  editorRoupa: RoupaEditorPayload;
  serverIsAdmin: boolean;
}) {
  const isAdmin = useResolvedAdmin(serverIsAdmin);

  if (!isAdmin) return null;

  return (
    <>
      <AdminRoupaFotosManager roupaId={roupaId} initialCoverUrl={initialCoverUrl} />
      <AdminRoupaInlineEditor
        roupa={{ ...editorRoupa, tema: editorRoupa.tema ?? "" }}
      />
    </>
  );
}
