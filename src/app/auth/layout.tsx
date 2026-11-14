import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Entrar ou criar conta",
  description:
    "Inicie sessão ou crie a sua conta no site da Associação Unidos de Avidos.",
  path: "/auth",
  noindex: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
