import { redirect } from "next/navigation";

// A disponibilidade gere-se agora no editor completo da roupa.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/admin/roupas/${(await params).id}`);
}
