"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { logout } = useAuth();
  return (
    <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
      <span className="font-bold text-xl text-gray-900">Diploma UI</span>
      <div className="flex items-center gap-4">
        <Link href="/profile" className="text-gray-700 hover:underline">Mon profil</Link>
        <button onClick={logout} className="text-red-500 hover:underline bg-transparent border-none cursor-pointer">Déconnexion</button>
      </div>
    </header>
  );
} 