import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { getSessionFromCookieValue } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Administração",
  description: "Área de administração.",
  path: "/admin",
  noindex: true,
});

// O middleware já bloqueia quem não é admin; esta verificação é uma segunda proteção
// (as páginas do admin leem a BD no servidor).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromCookieValue((await cookies()).get(SESSION_COOKIE_NAME)?.value);
  if (!session) redirect("/auth?next=/admin");
  if (session.role !== "ADMIN") redirect("/perfil");
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:flex lg:gap-8 lg:px-8">
      <AdminNav isSuperAdmin={Boolean(session?.isSuperAdmin)} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
