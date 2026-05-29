"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface NavItem {
  href: string;
  label: string;
}

interface SlideNavProps {
  items: NavItem[];
}

export default function SlideNav({ items }: SlideNavProps) {
  const [position, setPosition] = useState({ left: 0, width: 0, opacity: 0 });

  return (
    <ul
      className="relative flex w-fit rounded-full border border-outline-variant/40 bg-surface-container-low p-1"
      onMouseLeave={() => setPosition((pv) => ({ ...pv, opacity: 0 }))}
    >
      {items.map((item) => (
        <NavTab key={item.href} href={item.href} setPosition={setPosition}>
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
  setPosition,
}: {
  children: React.ReactNode;
  href: string;
  setPosition: React.Dispatch<React.SetStateAction<{ left: number; width: number; opacity: number }>>;
}) {
  const ref = useRef<HTMLLIElement>(null);

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
        className="block px-4 py-2 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest whitespace-nowrap transition-colors duration-200 hover:text-primary"
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
