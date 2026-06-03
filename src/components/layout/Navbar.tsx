"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/types/database.types";
import SlideNav from "@/components/ui/nav-header";
import { useCart } from "@/lib/cart/useCart";
import LocaleSwitcher from "@/components/layout/LocaleSwitcher";

type NavHref = "/" | "/products" | "/services" | "/calculator" | "/blog" | "/contact";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
function getTheme(): "dark" | "light" {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

// Tracks the signed-in user together with their profile role, so the navbar can
// surface the admin/manager panel link only to staff. `user === undefined` means
// auth is still loading.
function useAuthRole() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const load = async (u: User | null) => {
      if (!active) return;
      setUser(u);
      if (!u) { setRole(null); return; }
      const { data } = await supabase.from("profiles").select("role").eq("id", u.id).single();
      if (active) setRole((data?.role as UserRole | undefined) ?? null);
    };

    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      load(session?.user ?? null);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const isStaff = role === "admin" || role === "director";
  return { user, role, isStaff };
}

// ── Desktop dropdown button ──────────────────────────────────────────────────
function UserMenuButton() {
  const [open, setOpen]   = useState(false);
  const { user, role, isStaff } = useAuthRole();
  const ref               = useRef<HTMLDivElement>(null);
  const theme             = useSyncExternalStore(subscribe, getTheme, () => "dark" as const);
  const t                 = useTranslations("nav");
  const locale            = useLocale();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    const next = html.classList.contains("light") ? "dark" : "light";
    html.classList.remove("dark", "light");
    html.classList.add(next);
    localStorage.setItem("theme", next);
  }, []);

  // Invisible placeholder while auth loads to prevent layout shift
  if (user === undefined) {
    return (
      <div className="hidden sm:flex w-8 h-8 rounded-full border border-outline-variant/20 items-center justify-center">
        <span className="material-symbols-outlined text-[17px] text-on-surface-variant/20">person</span>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("accountMenuAria")}
        className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-200 ${
          open
            ? "border-primary text-primary bg-primary/10"
            : "border-outline-variant/50 text-on-surface-variant hover:border-primary/60 hover:text-primary"
        }`}
      >
        <span className="material-symbols-outlined text-[17px]">
          {user ? "account_circle" : "person"}
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="dropdown-in absolute right-0 top-[calc(100%+10px)] w-56 bg-card border border-card-border rounded-lg shadow-2xl z-50 overflow-hidden">

          {/* Auth info */}
          {user && (
            <>
              <div className="px-4 py-3">
                <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mb-0.5">{t("account")}</p>
                <p className="font-technical-data text-[11px] text-on-surface truncate">{user.email}</p>
              </div>
              <div className="border-t border-card-border" />
            </>
          )}

          {/* Settings */}
          <div className="p-1.5 space-y-0.5">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-2.5 py-2.5 rounded hover:bg-surface-container-high transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[15px] text-on-surface-variant group-hover:text-primary transition-colors">
                  {theme === "dark" ? "light_mode" : "dark_mode"}
                </span>
                <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">
                  {theme === "dark" ? t("themeLight") : t("themeDark")}
                </span>
              </div>
              {/* Toggle pill */}
              <div
                className={`w-7 h-3.5 rounded-full flex items-center px-0.5 transition-all duration-300 ${
                  theme === "light" ? "bg-primary" : "bg-outline-variant/30"
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                    theme === "light" ? "translate-x-3.5" : "translate-x-0"
                  }`}
                />
              </div>
            </button>

            {/* Language */}
            <div className="w-full flex items-center justify-between px-2.5 py-2.5 rounded">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[15px] text-on-surface-variant">translate</span>
                <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">{t("language")}</span>
              </div>
              <LocaleSwitcher />
            </div>
          </div>

          <div className="border-t border-card-border" />

          {/* Auth actions */}
          <div className="p-1.5">
            {user ? (
              <>
                {isStaff && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2.5 rounded bg-primary/5 hover:bg-primary/10 transition-colors group"
                  >
                    <span className="material-symbols-outlined text-[15px] text-primary">
                      {role === "admin" ? "admin_panel_settings" : "support_agent"}
                    </span>
                    <span className="font-label-caps text-[9px] text-primary uppercase tracking-widest">
                      {role === "admin" ? t("adminPanel") : t("directorPanel")}
                    </span>
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-2.5 rounded hover:bg-surface-container-high transition-colors group"
                >
                  <span className="material-symbols-outlined text-[15px] text-on-surface-variant group-hover:text-primary transition-colors">space_dashboard</span>
                  <span className="font-label-caps text-[9px] text-on-surface-variant group-hover:text-primary uppercase tracking-widest transition-colors">{t("dashboard")}</span>
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    const sb = createClient();
                    await sb.auth.signOut();
                    setOpen(false);
                    window.location.href = locale === "uk" ? "/" : `/${locale}`;
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2.5 rounded hover:bg-surface-container-high transition-colors group"
                >
                  <span className="material-symbols-outlined text-[15px] text-on-surface-variant group-hover:text-red-400 transition-colors">logout</span>
                  <span className="font-label-caps text-[9px] text-on-surface-variant group-hover:text-red-400 uppercase tracking-widest transition-colors">{t("logout")}</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-2.5 py-2.5 rounded hover:bg-surface-container-high transition-colors group"
              >
                <span className="material-symbols-outlined text-[15px] text-on-surface-variant group-hover:text-primary transition-colors">login</span>
                <span className="font-label-caps text-[9px] text-on-surface-variant group-hover:text-primary uppercase tracking-widest transition-colors">{t("login")}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Navbar ──────────────────────────────────────────────────────────────
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as const);
  const { count, hydrated } = useCart();
  const { role, isStaff } = useAuthRole();
  const t = useTranslations("nav");

  const NAV_LINKS: { href: NavHref; label: string }[] = [
    { href: "/",           label: t("home")       },
    { href: "/products",   label: t("products")   },
    { href: "/services",   label: t("services")   },
    { href: "/calculator", label: t("calculator") },
    { href: "/blog",       label: t("blog")       },
    { href: "/contact",    label: t("contact")    },
  ];

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    const next = html.classList.contains("light") ? "dark" : "light";
    html.classList.remove("dark", "light");
    html.classList.add(next);
    localStorage.setItem("theme", next);
  }, []);

  return (
    <nav className="glass-nav fixed top-9 w-full z-50">
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-3 max-w-container-max mx-auto">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image src="/logo.png" alt="Trade M" width={44} height={44} className="rounded-full" priority />
          <span className="font-headline-md text-headline-md font-bold tracking-tighter">
            <span className="text-on-surface">Trade</span><span className="text-primary">M</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:block">
          <SlideNav items={NAV_LINKS} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {/* Cart */}
          <Link href="/cart" aria-label={t("cartAria")} className="relative w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors duration-200">
            <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
            {hydrated && count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-on-primary text-[10px] font-technical-data flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>

          {/* User menu (desktop) */}
          <UserMenuButton />

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t("menuAria")}
            aria-expanded={menuOpen}
            className="md:hidden w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">{menuOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-card border-t border-card-border px-margin-mobile py-4 space-y-1">
          {NAV_LINKS.map((l) => {
            const isActive = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`block py-3 font-label-caps text-label-caps uppercase tracking-widest transition-colors duration-200 flex items-center gap-2 ${
                  isActive ? "text-primary" : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {isActive && <span className="w-1 h-1 rounded-full bg-primary shrink-0" />}
                {l.label}
              </Link>
            );
          })}

          {/* Settings in mobile menu */}
          <div className="pt-3 border-t border-outline-variant/20 space-y-0.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-between py-3 group"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary transition-colors">
                  {theme === "dark" ? "light_mode" : "dark_mode"}
                </span>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                  {theme === "dark" ? t("themeLight") : t("themeDark")}
                </span>
              </div>
              <div className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-all duration-300 ${theme === "light" ? "bg-primary" : "bg-outline-variant/30"}`}>
                <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${theme === "light" ? "translate-x-4" : "translate-x-0"}`} />
              </div>
            </button>

            <div className="w-full flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">translate</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">{t("language")}</span>
              </div>
              <LocaleSwitcher />
            </div>

            {isStaff && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 py-3 font-label-caps text-label-caps uppercase tracking-widest text-primary transition-colors duration-200"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {role === "admin" ? "admin_panel_settings" : "support_agent"}
                </span>
                {role === "admin" ? t("adminPanel") : t("directorPanel")}
              </Link>
            )}

            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 py-3 font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors duration-200"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              {t("login")}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
