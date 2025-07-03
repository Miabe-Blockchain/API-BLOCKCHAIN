"use client";
import { DiplomaList } from '../../components/Diplomas';
import { useAuth } from '../../AuthContext';

export default function DiplomasListPage() {
  const { user } = useAuth();
  
  return (
    <div className="container">
      <h3 className="mb-4">Liste des diplômes</h3>
      <DiplomaList userRole={user?.role} />
    </div>
  );
} 