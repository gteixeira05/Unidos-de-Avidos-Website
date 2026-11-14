import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "O meu perfil",
  description:
    "Gerir a sua conta, reservas e avaliações.",
  path: "/perfil",
  noindex: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
