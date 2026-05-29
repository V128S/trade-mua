"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import SlideNav from "@/components/ui/nav-header";

const NAV_LINKS = [
  { href: "/", label: "Головна" },
  { href: "/products", label: "Продукти" },
  { href: "/services", label: "Сервіси" },
  { href: "/calculator", label: "Калькулятор" },
  { href: "/contact", label: "Контакти" },
];

// Subscribe to <html> class changes so the icon stays in sync with the theme.
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
function getTheme(): "dark" | "light" {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

function UserNavButton() {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (user === undefined) return null

  if (user) {
    return (
      <Link
        href="/dashboard"
        className="hidden sm:flex items-center gap-1.5 border border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded font-label-caps text-label-caps uppercase tracking-widest text-[11px] text-primary transition-colors duration-200"
      >
        <span className="material-symbols-outlined text-[16px]">person</span>
        Кабінет
      </Link>
    )
  }

  return (
    <Link
      href="/login"
      className="hidden sm:flex items-center gap-1.5 border border-outline-variant/50 hover:border-primary/60 hover:text-primary px-3 py-1.5 rounded font-label-caps text-label-caps uppercase tracking-widest text-[11px] text-on-surface-variant transition-colors duration-200"
    >
      <span className="material-symbols-outlined text-[16px]">person</span>
      Логін
    </Link>
  )
}

function UserNavButtonMobile() {
  const router = useRouter()
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (user === undefined) return null

  if (user) {
    return (
      <div className="space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 py-3 font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors duration-200"
        >
          <span className="material-symbols-outlined text-[18px]">person</span>
          Кабінет
        </Link>
        <button
          type="button"
          onClick={async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            window.location.href = '/'
          }}
          className="flex items-center gap-2 py-3 font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant hover:text-red-400 transition-colors duration-200 w-full text-left"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Вийти
        </button>
      </div>
    )
  }

  return (
    <Link
      href="/login"
      className="flex items-center gap-2 py-3 font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors duration-200"
    >
      <span className="material-symbols-outlined text-[18px]">person</span>
      Логін
    </Link>
  )
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  // Read the live theme from the DOM (set before paint by the inline script in layout).
  // Server snapshot is "dark" — the default <html class="dark">.
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as const);

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    const next = html.classList.contains("light") ? "dark" : "light";
    html.classList.remove("dark", "light");
    html.classList.add(next);
    localStorage.setItem("theme", next);
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30">
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-3 max-w-container-max mx-auto">

        {/* Logo + Brand */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/logo.png"
            alt="Trade M"
            width={44}
            height={44}
            className="rounded-full"
            priority
          />
          <span className="font-headline-md text-headline-md font-bold text-primary tracking-tighter hidden sm:block">
            Trade M
          </span>
        </Link>

        {/* Desktop nav — sliding pill */}
        <div className="hidden md:block">
          <SlideNav items={NAV_LINKS} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 text-on-surface-variant hover:text-primary transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-[22px]">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>

          {/* Cart */}
          <Link
            href="/cart"
            aria-label="Cart"
            className="p-2 text-on-surface-variant hover:text-primary transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
          </Link>

          <UserNavButton />

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="md:hidden p-2 text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">
              {menuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-card border-t border-card px-margin-mobile py-4 space-y-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3 font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors duration-200"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-outline-variant/20">
            <UserNavButtonMobile />
          </div>
        </div>
      )}
    </nav>
  );
}
