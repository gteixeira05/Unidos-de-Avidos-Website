import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Fale Connosco",
  description:
    "Contactos da Associação Unidos de Avidos: telefone, email, WhatsApp, morada e formulário de contacto.",
  path: "/fale-connosco",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
