// Contactos da associação (tipo, valores por omissão e links). Sem acesso à BD: pode ser usado no browser.

export type Contactos = {
  /** Linhas da morada (rodapé e página de contacto). */
  morada: string[];
  /** Morada usada no mapa do Google. */
  moradaMapa: string;
  nif: string;
  email: string;
  /** Telefones como se mostram, ex.: "914 884 537". */
  telefones: string[];
  /** Número do WhatsApp só com algarismos e indicativo, ex.: "351914838942". */
  whatsapp: string;
  facebook: string;
  instagram: string;
};

export const CONTACTOS_PADRAO: Contactos = {
  morada: ["N204-5, 4770-778", "Avidos, Vila Nova de Famalicão"],
  moradaMapa: "Av. Comendador José Costa Oliveira 14, Avidos, Vila Nova de Famalicão",
  nif: "508195551",
  email: "unidosdeavidos@gmail.com",
  telefones: ["914 884 537", "914 838 942"],
  whatsapp: "351914838942",
  facebook: "https://www.facebook.com/profile.php?id=61556449640291",
  instagram: "https://www.instagram.com/unidosdeavidos/",
};

/** "914 884 537" → "+351914884537" */
export function telHref(telefone: string): string {
  const d = telefone.replace(/\D/g, "");
  return `tel:+${d.length === 9 ? `351${d}` : d}`;
}

export function whatsappUrl(numero: string, texto?: string): string {
  return `https://wa.me/${numero.replace(/\D/g, "")}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}
