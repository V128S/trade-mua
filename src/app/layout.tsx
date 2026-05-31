// Root layout is intentionally minimal — the real <html>/<body> shell lives in
// app/[locale]/layout.tsx so the lang attribute and i18n provider are per-locale.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
