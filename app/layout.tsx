import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IB chem Ni Learning Platform",
  description: "IB Chemistry learning platform with student stories, a searchable Question Hub, free assessment, and course access."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publicLinks = [
    ["About & Stories", "/about"],
    ["Question Hub", "/questions"],
    ["Assessment & Contact", "/contact"]
  ];

  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <header className="sticky top-0 z-50 border-b border-blue/10 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
            <a href="/" className="text-lg font-semibold text-ink">IB chem Ni</a>
            <nav className="hidden items-center gap-6 text-sm font-semibold text-muted lg:flex">
              {publicLinks.map(([label, href]) => (
                <a key={href} href={href} className="transition hover:text-ink">{label}</a>
              ))}
              <a href="/login" className="rounded-full bg-blue px-4 py-2 text-white">Login</a>
            </nav>
            <details className="mobile-menu relative lg:hidden">
              <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-blue/20 bg-white text-ink" aria-label="Open navigation">
                <span className="menu-icon" aria-hidden="true"><i /><i /><i /></span>
              </summary>
              <nav className="absolute right-0 top-14 w-64 rounded-2xl border border-blue/15 bg-white p-3 text-sm font-semibold text-muted shadow-soft">
                {publicLinks.map(([label, href]) => (
                  <a key={href} href={href} className="block rounded-xl px-4 py-3 hover:bg-soft hover:text-ink">{label}</a>
                ))}
                <a href="/login" className="mt-2 block rounded-xl bg-blue px-4 py-3 text-center text-white">Student Login</a>
              </nav>
            </details>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
