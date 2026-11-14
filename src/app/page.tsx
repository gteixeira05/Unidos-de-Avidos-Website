import HomeContent from "./HomeContent";
import JsonLd from "@/components/JsonLd";
import { proximosEventos } from "@/lib/agenda";
import { getContactos, getEventos } from "@/lib/conteudos";
import { getSiteUrl } from "@/lib/site-url";

// Recalcula de hora a hora para os eventos passados saírem sozinhos.
export const revalidate = 3600;

export default async function Home() {
  const [eventos, c] = await Promise.all([getEventos(), getContactos()]);
  const site = getSiteUrl();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Associação Unidos de Avidos",
          url: site,
          logo: `${site}/icon.png`,
          email: c.email,
          telephone: c.telefones[0] ? `+351 ${c.telefones[0]}` : undefined,
          address: { "@type": "PostalAddress", streetAddress: c.morada.join(", "), addressCountry: "PT" },
          sameAs: [c.facebook, c.instagram].filter(Boolean),
        }}
      />
      <HomeContent eventosFuturos={proximosEventos(eventos)} />
    </>
  );
}
