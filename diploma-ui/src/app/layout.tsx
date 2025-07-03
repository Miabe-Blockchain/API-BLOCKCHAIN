import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Diploma UI",
  description: "Interface moderne de gestion de diplômes blockchain",
};

const navLinks = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/diplomas", label: "Mes diplômes" },
  { href: "/verifications", label: "Vérifications" },
  { href: "/notifications", label: "Notifications" },
  { href: "/blockchain", label: "Blockchain" },
  { href: "/admin", label: "Admin" },
  { href: "/profile", label: "Profil" },
  { href: "/wallet", label: "Portefeuille" },
  { href: "/verify", label: "Vérifier un diplôme" },
];

function Sidebar() {
  return (
    <aside className="bg-gray-900 text-white w-64 min-h-screen p-6 hidden md:block">
      <h2 className="text-2xl font-bold mb-8">Diploma UI</h2>
      <nav className="flex flex-col gap-4">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hover:bg-gray-800 rounded px-3 py-2 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}>
        <AuthProvider>
          <NotificationProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col bg-white text-black">
                <Header />
                <main className="flex-1 p-6">{children}</main>
              </div>
            </div>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
