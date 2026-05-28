"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/products", label: "Продукти" },
  { href: "/services", label: "Сервіси" },
  { href: "/calculator", label: "Калькулятор" },
  { href: "/contact", label: "Контакти" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Sync with html class on mount
  useEffect(() => {
    const html = document.documentElement;
    const current = html.classList.contains("light") ? "light" : "dark";
    setTheme(current);
  }, []);

  function toggleTheme() {
    const html = document.documentElement;
    const next = theme === "dark" ? "light" : "dark";
    html.classList.remove("dark", "light");
    html.classList.add(next);
    setTheme(next);
    localStorage.setItem("theme", next);
  }

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

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors duration-300"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
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

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
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
        </div>
      )}
    </nav>
  );
}
