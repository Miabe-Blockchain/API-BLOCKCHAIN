"use client";
import { DiplomaAddForm } from '../../components/Diplomas';
import { useAuth } from '../../AuthContext';

export default function AddDiplomaPage() {
  const { user } = useAuth();
  return (
    <div className="container">
      <h3 className="mb-4">Ajouter un diplôme</h3>
      <DiplomaAddForm userRole={user?.role} />
    </div>
  );
} 