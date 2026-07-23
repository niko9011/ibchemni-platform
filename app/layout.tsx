import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IB chem Ni Learning Platform",
  description: "Student login and manual chapter access for IB Chemistry courses."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <header className="border-b border-blue/10 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
            <a href="/" className="text-lg font-semibold text-ink">IB chem Ni</a>
            <nav className="flex items-center gap-4 text-sm font-semibold text-muted">
              <a href="/dashboard">Dashboard</a>
              <a href="/admin">Teacher Admin</a>
              <a href="/login" className="rounded-full bg-blue px-4 py-2 text-white">Login</a>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
