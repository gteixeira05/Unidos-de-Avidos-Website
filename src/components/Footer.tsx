import Link from "next/link";
import { getContactos, telHref, whatsappUrl } from "@/lib/conteudos";
import {
  Facebook,
  Instagram,
  IdCard,
  Linkedin,
  MapPin,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";

const DESENVOLVEDOR_LINKEDIN =
  "https://www.linkedin.com/in/gon%C3%A7alo-teixeira-ab2763205/";

export default async function Footer() {
  const c = await getContactos();
  return (
    <footer className="border-t border-gray-200 bg-white text-gray-700">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Contactos */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Contacte-nos
            </h3>
            <p className="flex items-start gap-3 text-sm text-gray-700">
              <MapPin size={18} className="mt-0.5 text-[#00923f]" />
              <span>
                {c.morada.map((linha, i) => (
                  <span key={i} className="block">
                    {linha}
                  </span>
                ))}
              </span>
            </p>
            <p className="flex items-center gap-3 text-sm text-gray-700">
              <IdCard size={18} className="text-[#00923f]" />
              <span className="font-medium text-gray-900">NIF:</span> {c.nif}
            </p>
            <p className="flex items-center gap-3 text-sm text-gray-700">
              <Mail size={18} className="text-[#00923f]" />
              <a href={`mailto:${c.email}`} className="hover:text-[#00923f]">
                {c.email}
              </a>
            </p>
            {c.telefones.map((t) => (
              <p key={t} className="flex items-center gap-3 text-sm text-gray-700">
                <Phone size={18} className="text-[#00923f]" />
                <a href={telHref(t)} className="hover:text-[#00923f]">
                  +351 {t}
                </a>
              </p>
            ))}
          </div>

          {/* Páginas */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Páginas
            </h3>
            <nav className="flex flex-col space-y-1 text-sm text-gray-700">
              <Link href="/" className="hover:text-[#00923f]">
                Início
              </Link>
              <Link href="/sobre" className="hover:text-[#00923f]">
                Sobre Nós
              </Link>
              <Link href="/sobre/marchas" className="hover:text-[#00923f]">
                Marchas Antoninas
              </Link>
              <Link href="/galeria" className="hover:text-[#00923f]">
                Galeria
              </Link>
              <Link href="/agenda" className="hover:text-[#00923f]">
                Agenda
              </Link>
              <Link href="/aluguer-roupas" className="hover:text-[#00923f]">
                Aluguer de Roupas
              </Link>
              <Link href="/moldura" className="hover:text-[#00923f]">
                Moldura para fotos
              </Link>
              <Link href="/socio" className="hover:text-[#00923f]">
                Sócio
              </Link>
              <Link href="/fale-connosco" className="hover:text-[#00923f]">
                Fale Connosco
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Legal
            </h3>
            <nav className="flex flex-col space-y-1 text-sm text-gray-700">
              <Link href="/privacidade" className="hover:text-[#00923f]">
                Política de privacidade
              </Link>
              <Link href="/politica-cookies" className="hover:text-[#00923f]">
                Política de cookies
              </Link>
              <Link href="/termos" className="hover:text-[#00923f]">
                Termos e Condições
              </Link>
            </nav>
          </div>

          {/* Redes sociais */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Siga-nos
            </h3>
            <div className="flex items-center gap-4">
              {c.facebook && (
                <Link
                  href={c.facebook}
                  aria-label="Facebook"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-[#00923f] hover:text-[#00923f]"
                >
                  <Facebook size={18} />
                </Link>
              )}
              {c.instagram && (
                <Link
                  href={c.instagram}
                  aria-label="Instagram"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-[#00923f] hover:text-[#00923f]"
                >
                  <Instagram size={18} />
                </Link>
              )}
              <Link
                href={whatsappUrl(c.whatsapp)}
                aria-label="WhatsApp"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-[#00923f] hover:text-[#00923f]"
              >
                <MessageCircle size={18} />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} Unidos de Avidos. Todos os
            direitos reservados.
          </p>
          <p className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-gray-500">
            <span>Desenvolvimento web:</span>
            <a
              href={DESENVOLVEDOR_LINKEDIN}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-gray-600 underline-offset-2 hover:text-[#00923f] hover:underline"
            >
              <Linkedin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Gonçalo Teixeira
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

