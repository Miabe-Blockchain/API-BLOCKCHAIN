import Link from 'next/link';

export default function DiplomasPage() {
  return (
    <div className="container">
      <h2 className="mb-4">Section Diplômes</h2>
      <p>Bienvenue dans la section Diplômes. Utilisez le menu pour accéder à la liste ou ajouter un diplôme.</p>
      <ul>
        <li><Link href="/diplomas/list">Liste des diplômes</Link></li>
      </ul>
    </div>
  );
} 