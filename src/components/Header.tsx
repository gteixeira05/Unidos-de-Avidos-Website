"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, User, X } from "lucide-react";
import { AUTH_SESSION_CHANGED_EVENT } from "@/lib/auth-session-events";
import { NOTIFICATIONS_MUTATED_EVENT } from "@/lib/notification-events";

// Polling leve (só quando a tab está visível). O “tempo real” vem sobretudo de
// revalidar ao focar/voltar online + eventos internos quando as notificações mudam.
const UNREAD_POLL_MS = 60_000;

const SCROLL_RANGE_START = 80;
const SCROLL_RANGE_END = 600;
const OTHER_PAGES_HIDE_END = 320;
const SMOOTH_LERP = 0.12;
const SNAP_NEAR_TOP = 60; // abaixo disto: snap para o cabeçalho aparecer
const SNAP_JUMP_PX = 500; // salto instantâneo > isto: snap (ex. botão ir ao topo)

const navItems = [
  { href: "/", label: "Início" },
  {
    href: "/sobre",
    label: "Sobre Nós",
    subItems: [
      { href: "/sobre/historia", label: "História" },
      { href: "/sobre/orgaos-sociais", label: "Órgãos Sociais" },
    ],
  },
  { href: "/sobre/marchas", label: "Marchas Antoninas" },
  {
    href: "/galeria",
    label: "Galeria",
  },
  { href: "/agenda", label: "Agenda" },
  { href: "/aluguer-roupas", label: "Aluguer de Roupas" },
  { href: "/socio", label: "Sócio" },
  { href: "/fale-connosco", label: "Fale Connosco" },
];

function UnreadBadge({ count, ringClass }: { count: number; ringClass: string }) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span
      className={`pointer-events-none absolute -right-0.5 -top-0.5 z-[100] flex h-[22px] min-w-[22px] items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[11px] font-bold leading-none text-white shadow-lg ring-2 ${ringClass}`}
      aria-hidden
    >
      {label}
    </span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [scrollY, setScrollY] = useState(0);
  const [smoothedScrollOther, setSmoothedScrollOther] = useState(0);
  const smoothRef = useRef(0);
  const prevScrollRef = useRef(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuClosing, setMobileMenuClosing] = useState(false);
  const [mobileMenuEntering, setMobileMenuEntering] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [profileHref, setProfileHref] = useState("/auth");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  const isHomePage = pathname === "/";
  const scrollProgress = isHomePage
    ? Math.min(1, Math.max(0, (scrollY - SCROLL_RANGE_START) / (SCROLL_RANGE_END - SCROLL_RANGE_START)))
    : 1;
  // Homepage: 0-25% transparente sai, 25-60% gap, 60-100% sólido entra
  const TRANSPARENT_END = 0.25;
  const SOLID_START = 0.6;
  const transparentProgress = scrollProgress < TRANSPARENT_END ? scrollProgress / TRANSPARENT_END : 1;
  const transparentOpacity = scrollProgress < TRANSPARENT_END ? 1 - transparentProgress : 0;
  const transparentTranslateY = transparentProgress * -100;
  const solidProgress = scrollProgress > SOLID_START ? (scrollProgress - SOLID_START) / (1 - SOLID_START) : 0;
  const solidOpacity = scrollProgress > SOLID_START ? solidProgress : 0;
  const isSolid = scrollProgress >= 1 || !isHomePage;
  const desktopOnWhite = !isHomePage;
  const desktopOnTransparent = isHomePage && !isSolid;

  // Outras páginas: valor interpolado (lerp) para transição fluida em ambas direções
  const otherPagesProgress = !isHomePage
    ? Math.min(1, Math.max(0, smoothedScrollOther / OTHER_PAGES_HIDE_END))
    : 0;
  const otherPagesOpacity = 1 - otherPagesProgress;
  const otherPagesTranslateY = otherPagesProgress * -100;

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const raw = window.scrollY;
          setScrollY(raw);
          const prev = prevScrollRef.current;
          prevScrollRef.current = raw;
          const jump = Math.abs(raw - prev);
          const nearTop = raw < SNAP_NEAR_TOP;
          if (nearTop || jump > SNAP_JUMP_PX) {
            smoothRef.current = raw;
          } else {
            smoothRef.current += (raw - smoothRef.current) * SMOOTH_LERP;
          }
          setSmoothedScrollOther(smoothRef.current);
          ticking = false;
        });
        ticking = true;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isHomePage) {
      const raw = typeof window !== "undefined" ? window.scrollY : 0;
      prevScrollRef.current = raw;
      smoothRef.current = raw;
      requestAnimationFrame(() => setSmoothedScrollOther(raw));
    }
  }, [isHomePage]);

  const refreshSessionFromServer = useCallback(async () => {
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
      const d = await r.json();
      setProfileHref(d?.user ? "/perfil" : "/auth");
      setIsAdmin(d?.user?.role === "ADMIN" || d?.user?.role === "SUPER_ADMIN");
    } catch {
      setProfileHref("/auth");
      setIsAdmin(false);
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications/unread-count", {
        cache: "no-store",
        credentials: "include",
      });
      const d = await r.json();
      setUnreadCount(Number(d?.count) || 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refreshSessionFromServer();
      if (!cancelled) await refreshUnreadCount();
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, refreshSessionFromServer, refreshUnreadCount]);

  useEffect(() => {
    const onSessionEvent = () => {
      void refreshSessionFromServer();
      void refreshUnreadCount();
    };
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionEvent);
    return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionEvent);
  }, [refreshSessionFromServer, refreshUnreadCount]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void refreshSessionFromServer();
      void refreshUnreadCount();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshSessionFromServer, refreshUnreadCount]);

  useEffect(() => {
    const onMutated = () => void refreshUnreadCount();
    window.addEventListener(NOTIFICATIONS_MUTATED_EVENT, onMutated);
    return () => window.removeEventListener(NOTIFICATIONS_MUTATED_EVENT, onMutated);
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (profileHref !== "/perfil") return;
    // Polling apenas quando o utilizador está na página de perfil.
    // Noutras páginas, mantemos “atualizado” via focus/online/visibility + eventos internos.
    if (pathname !== "/perfil") return;
    let intervalId: number | null = null;

    const clear = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const ensureStarted = () => {
      if (document.visibilityState !== "visible") return;
      if (intervalId !== null) return;
      intervalId = window.setInterval(() => void refreshUnreadCount(), UNREAD_POLL_MS);
    };

    const revalidateNow = () => void refreshUnreadCount();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        revalidateNow();
        ensureStarted();
      } else {
        clear();
      }
    };
    const onFocus = () => {
      revalidateNow();
      ensureStarted();
    };
    const onOnline = () => revalidateNow();

    // Arranque inicial (se já estiver visível).
    revalidateNow();
    ensureStarted();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    return () => {
      clear();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [profileHref, pathname, refreshUnreadCount]);

  const openMobileMenu = () => {
    setMobileMenuClosing(false);
    setMobileMenuOpen(true);
    setMobileMenuEntering(false);
    // Permitir que o componente monte fora do ecrã e depois anime para dentro
    setTimeout(() => {
      setMobileMenuEntering(true);
    }, 10);
  };

  const closeMobileMenu = () => {
    setMobileMenuClosing(true);
    setTimeout(() => {
      setMobileMenuOpen(false);
      setMobileMenuClosing(false);
      setMobileMenuEntering(false);
      setOpenSubmenu(null);
    }, 250);
  };

  const mobileBarContent = (
    <>
      <div className="flex min-w-[44px] flex-1 justify-start">
        <button
          className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
          onClick={openMobileMenu}
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
      </div>
      <Link href="/" className="flex shrink-0 items-center justify-center">
        <Image
          src="/logo-unidos-avidos-contorno.png"
          alt="Unidos de Avidos - Associação"
          width={200}
          height={80}
          className="h-[4.5rem] w-auto"
          priority
        />
      </Link>
      <div className="relative flex min-w-[48px] flex-1 justify-end overflow-visible pr-1">
        <Link
          href={profileHref}
          className="relative z-[2] overflow-visible rounded-full text-white transition-colors hover:bg-white/10"
          aria-label={
            unreadCount > 0 ? `Perfil, ${unreadCount} notificações por ler` : "Perfil"
          }
        >
          <span className="relative inline-flex size-11 items-center justify-center overflow-visible">
            <User size={22} className="shrink-0" aria-hidden />
            <UnreadBadge count={unreadCount} ringClass="ring-white/60" />
          </span>
        </Link>
      </div>
    </>
  );

  const mobileBarContentWhite = (
    <>
      <div className="flex min-w-[44px] flex-1 justify-start">
        <button
          className="rounded-full p-2 text-[#00923f] transition-colors hover:bg-[#00923f]/10"
          onClick={openMobileMenu}
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
      </div>
      <Link href="/" className="flex shrink-0 items-center justify-center">
        <Image
          src="/logo-unidos-avidos-contorno.png"
          alt="Unidos de Avidos - Associação"
          width={200}
          height={80}
          className="h-[4.5rem] w-auto"
          priority
        />
      </Link>
      <div className="relative flex min-w-[48px] flex-1 justify-end overflow-visible pr-1">
        <Link
          href={profileHref}
          className="relative z-[2] overflow-visible rounded-full text-[#00923f] transition-colors hover:bg-[#00923f]/10"
          aria-label={
            unreadCount > 0 ? `Perfil, ${unreadCount} notificações por ler` : "Perfil"
          }
        >
          <span className="relative inline-flex size-11 items-center justify-center overflow-visible">
            <User size={22} className="shrink-0" aria-hidden />
            <UnreadBadge count={unreadCount} ringClass="ring-[#00923f]/25" />
          </span>
        </Link>
      </div>
    </>
  );

  return (
    <header className="fixed left-0 right-0 top-0 z-50 min-h-[88px] w-full overflow-visible">
      {/* Na homepage: duas camadas que fazem crossfade com o scroll */}
      {isHomePage ? (
        <>
          {/* Camada transparente - desliza para cima e desaparece com os 3 elementos */}
          <div
            className={`absolute inset-0 overflow-visible md:hidden will-change-[transform,opacity] ${
              transparentOpacity > 0 ? "pointer-events-auto" : "pointer-events-none"
            }`}
            style={{
              opacity: transparentOpacity,
              transform: `translate3d(0, ${transparentTranslateY}%, 0)`,
              transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <nav className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between overflow-visible md:hidden">
                {mobileBarContent}
              </div>
            </nav>
          </div>
          {/* Camada sólida - aparece após o intervalo (mais scroll) */}
          <div
            className={`absolute inset-0 overflow-visible md:hidden will-change-[transform,opacity] ${
              solidOpacity > 0 ? "pointer-events-auto" : "pointer-events-none"
            }`}
            style={{
              opacity: solidOpacity,
              transform: solidProgress < 1 ? `translate3d(0, -${(1 - solidProgress) * 25}%, 0)` : "translate3d(0, 0, 0)",
              transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <nav className="mx-auto max-w-7xl border-b border-[#007a33]/30 bg-[#00923f] px-4 py-5 shadow-lg sm:px-6 lg:px-8">
              <div className="flex items-center justify-between overflow-visible md:hidden">
                {mobileBarContent}
              </div>
            </nav>
          </div>
        </>
      ) : (
        <div
          className={`absolute inset-0 overflow-visible md:hidden will-change-[transform,opacity] ${
            otherPagesOpacity > 0 ? "pointer-events-auto" : "pointer-events-none"
          }`}
          style={{
            opacity: otherPagesOpacity,
            transform: `translate3d(0, ${otherPagesTranslateY}%, 0)`,
            transition: "opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <nav className="mx-auto max-w-7xl bg-white px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between overflow-visible md:hidden">
              {mobileBarContentWhite}
            </div>
          </nav>
        </div>
      )}

      {/* Barra desktop (corrigida): fundo full-width, conteúdo centrado */}
      <div
        className={`hidden md:block ${
          isHomePage
            ? isSolid
              ? "border-b border-[#007a33]/30 bg-[#00923f] shadow-lg"
              : ""
            : "bg-white will-change-[transform,opacity]"
        } ${!isHomePage && otherPagesOpacity === 0 ? "pointer-events-none" : ""}`}
        style={
          desktopOnTransparent
            ? { background: "transparent" }
            : !isHomePage
              ? { opacity: otherPagesOpacity, transform: `translate3d(0, ${otherPagesTranslateY}%, 0)`, transition: "opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)" }
              : undefined
        }
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-unidos-avidos-contorno.png"
              alt="Unidos de Avidos - Associação"
              width={180}
              height={72}
              className="h-14 w-auto"
              priority
            />
          </Link>

          <div
            className={`flex items-center gap-6 ${
              desktopOnWhite ? "text-gray-700" : "text-white"
            }`}
          >
            {isAdmin ? (
              <Link
                href="/admin"
                className={`font-medium transition-colors ${
                  desktopOnWhite
                    ? "text-gray-700 hover:text-[#00923f]"
                    : "text-white/90 hover:text-white"
                }`}
              >
                Admin
              </Link>
            ) : null}
            {navItems.map((item) =>
              item.subItems ? (
                <div
                  key={item.href}
                  className="relative group"
                  onMouseEnter={() => setOpenSubmenu(item.label)}
                  onMouseLeave={() => setOpenSubmenu(null)}
                >
                  <Link
                    href={item.href}
                    className={`font-medium transition-colors ${
                      desktopOnWhite
                        ? "text-gray-700 hover:text-[#00923f]"
                        : "text-white/90 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                  {openSubmenu === item.label && (
                    <div className="absolute left-0 top-full pt-2">
                      <div className="rounded-lg border border-[#007a33] bg-white py-2 shadow-lg">
                        {item.subItems.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#00923f]/10 hover:text-[#00923f]"
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-medium transition-colors ${
                    desktopOnWhite
                      ? "text-gray-700 hover:text-[#00923f]"
                      : "text-white/90 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          <Link
            href={profileHref}
            className={`relative z-[1] inline-flex items-center gap-2 overflow-visible rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              desktopOnWhite
                ? "border border-[#00923f]/30 text-[#00923f] hover:bg-[#00923f]/10"
                : "border border-white/50 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            }`}
            aria-label={
              unreadCount > 0 ? `Perfil, ${unreadCount} notificações por ler` : "Perfil"
            }
          >
            <span className="relative inline-flex items-center justify-center">
              <User size={18} />
              <UnreadBadge
                count={unreadCount}
                ringClass={desktopOnWhite ? "ring-black/15" : "ring-white/50"}
              />
            </span>
            <span>Perfil</span>
          </Link>
        </nav>
      </div>

      {/* Menu lateral mobile */}
      {(mobileMenuOpen || mobileMenuClosing) && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className={`relative flex h-full w-full max-w-full flex-col bg-[#00923f] text-white shadow-xl transition-transform duration-300 ease-in-out ${
              mobileMenuClosing || !mobileMenuEntering
                ? "-translate-x-full"
                : "translate-x-0"
            }`}
          >
            <div className="flex items-center justify-between px-4 py-4">
              <Link href="/" onClick={closeMobileMenu} className="flex items-center">
                <Image
                  src="/logo-unidos-avidos-contorno.png"
                  alt="Unidos de Avidos - Associação"
                  width={280}
                  height={112}
                  className="h-24 w-auto"
                />
              </Link>
              <button
                onClick={closeMobileMenu}
                className="rounded-full p-1.5 text-white hover:bg-white/10"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <nav
              className={`flex-1 overflow-y-auto py-4 transition-all duration-200 ${
                mobileMenuClosing ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
              }`}
            >
              {isAdmin ? (
                <Link
                  href="/admin"
                  onClick={closeMobileMenu}
                  className="block border-b border-white/10 px-5 py-3 text-base font-semibold tracking-wide hover:bg-white/10"
                >
                  ADMIN
                </Link>
              ) : null}
              {navItems.map((item) =>
                item.subItems ? (
                  <div key={item.href} className="border-b border-white/10">
                    <button
                      onClick={() =>
                        setOpenSubmenu(
                          openSubmenu === item.label ? null : item.label
                        )
                      }
                      className="flex w-full items-center justify-between px-5 py-3 text-left text-base font-semibold tracking-wide"
                    >
                      {item.label.toUpperCase()}
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          openSubmenu === item.label ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {openSubmenu === item.label && (
                      <div className="space-y-1 bg-[#007a33] pb-2 pl-5">
                        {item.subItems.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={closeMobileMenu}
                            className="block px-4 py-2 text-sm text-white/90 hover:bg-white/10"
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className="block border-b border-white/10 px-5 py-3 text-base font-semibold tracking-wide hover:bg-white/10"
                  >
                    {item.label.toUpperCase()}
                  </Link>
                )
              )}
            </nav>
          </div>
          <button
            className={`h-full flex-1 bg-black/40 transition-opacity duration-300 ${
              mobileMenuClosing ? "opacity-0" : "opacity-100"
            }`}
            aria-label="Fechar menu"
            onClick={closeMobileMenu}
          />
        </div>
      )}
    </header>
  );
}
