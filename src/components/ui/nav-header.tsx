"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, usePathname } from "@/i18n/navigation";

interface NavItem { href: string; label: string; }
interface SlideNavProps { items: NavItem[]; }

export default function SlideNav({ items }: SlideNavProps) {
  const pathname = usePathname();
  const [position, setPosition] = useState({ left: 0, width: 0, opacity: 0 });
  const activeRef = useRef<HTMLLIElement | null>(null);

  const returnToActive = () => {
    if (!activeRef.current) {
      setPosition((pv) => ({ ...pv, opacity: 0 }));
      return;
    }
    const { width } = activeRef.current.getBoundingClientRect();
    setPosition({ width, opacity: 1, left: activeRef.current.offsetLeft });
  };

  // Move cursor to active tab whenever path changes
  useEffect(() => {
    returnToActive();
  }, [pathname]);

  return (
    <ul
      className="relative flex w-fit rounded-full border border-outline-variant/40 bg-surface-container-low p-1"
      onMouseLeave={returnToActive}
    >
      {items.map((item) => (
        <NavTab
          key={item.href}
          href={item.href}
          pathname={pathname}
          setPosition={setPosition}
          activeRef={activeRef}
        >
          {item.label}
        </NavTab>
      ))}
      <SlideCursor position={position} />
    </ul>
  );
}

function NavTab({
  children,
  href,
  pathname,
  setPosition,
  activeRef,
}: {
  children: React.ReactNode;
  href: string;
  pathname: string;
  setPosition: React.Dispatch<React.SetStateAction<{ left: number; width: number; opacity: number }>>;
  activeRef: React.MutableRefObject<HTMLLIElement | null>;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    if (isActive && ref.current) activeRef.current = ref.current;
  }, [isActive, activeRef]);

  return (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref.current) return;
        const { width } = ref.current.getBoundingClientRect();
        setPosition({ width, opacity: 1, left: ref.current.offsetLeft });
      }}
      className="relative z-10 block"
    >
      <Link
        href={href}
        className={`block px-4 py-2 font-label-caps text-label-caps uppercase tracking-widest whitespace-nowrap transition-colors duration-200 ${
          isActive ? "text-primary" : "text-on-surface-variant hover:text-primary"
        }`}
      >
        {children}
      </Link>
    </li>
  );
}

function SlideCursor({
  position,
}: {
  position: { left: number; width: number; opacity: number };
}) {
  return (
    <motion.li
      aria-hidden
      animate={position}
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
      className="absolute z-0 top-1 bottom-1 rounded-full bg-primary/10 border border-primary/40 pointer-events-none"
    />
  );
}
