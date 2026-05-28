import Link from "next/link";
import Image from "next/image";

const LINKS = [
  { href: "/products", label: "Продукти" },
  { href: "/services", label: "Сервіси" },
  { href: "/calculator", label: "Калькулятор" },
  { href: "/about", label: "Про нас" },
  { href: "/contact", label: "Контакти" },
];

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/20 mt-section-gap">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 flex flex-col md:flex-row justify-between items-start gap-8">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Trade M" width={40} height={40} className="rounded-full" />
          <span className="font-headline-md text-headline-md font-bold text-primary tracking-tighter">
            Trade M
          </span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors duration-200"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Contacts */}
        <div className="space-y-1 text-right">
          <p className="font-technical-data text-technical-data text-on-surface-variant">
            097-422-50-60 Денис
          </p>
          <a
            href="https://t.me/DenisHandsome"
            target="_blank"
            rel="noopener noreferrer"
            className="font-label-caps text-label-caps text-primary uppercase tracking-widest hover:text-secondary transition-colors"
          >
            @DenisHandsome
          </a>
        </div>
      </div>

      <div className="border-t border-outline-variant/20 px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
        <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
          © 2025 Trade M · Industrial Excellence
        </p>
      </div>
    </footer>
  );
}
