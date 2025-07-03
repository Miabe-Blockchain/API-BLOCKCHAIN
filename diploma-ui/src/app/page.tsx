import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-900 mb-6 text-center">
        Bienvenue sur <span className="text-blue-600">Diploma UI</span>
      </h1>
      <p className="text-lg text-gray-700 mb-8 text-center max-w-xl">
        Plateforme moderne de gestion, vérification et émission de diplômes certifiés sur la blockchain.
      </p>
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Link href="/login" className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition">Connexion</Link>
        <Link href="/register" className="px-6 py-3 bg-white border border-blue-600 text-blue-600 rounded shadow hover:bg-blue-50 transition">Inscription</Link>
        <Link href="/verify" className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded shadow hover:bg-indigo-200 transition">Vérifier un diplôme</Link>
      </div>
      <span className="text-sm text-gray-400">© {new Date().getFullYear()} Diploma UI</span>
    </main>
  );
}
