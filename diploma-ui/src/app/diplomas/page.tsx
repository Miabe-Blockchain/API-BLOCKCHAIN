"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import DataTable from "@/components/DataTable";
import Input from "@/components/Input";
import Notification from "../../components/Notification";
import Select from "../../components/Select";
import { get, post, del, createDiploma, getDiploma, deleteDiploma, registerDiplomaOnBlockchain, getDiplomaPDF } from "../../services/api";
import { getDiplomas } from "@/services/api";
import Badge from "@/components/Badge";

interface Diploma {
  id: string;
  hash: string;
  diploma_name: string;
  diploma_type: string;
  issuer_institution: string;
  emission_date: string;
  mention: string;
  diploma_number: string;
  student_firstname: string;
  student_lastname: string;
  student_birthdate: string;
  status: string;
  blockchain_tx_hash?: string;
  blockchain_registered_at?: string;
  qr_code_url?: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface Filters {
  search?: string;
  status?: string;
  diploma_type?: string;
  institution?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: string;
}

const defaultFilters: Filters = {
  search: "",
  status: undefined,
  diploma_type: undefined,
  institution: undefined,
  date_from: undefined,
  date_to: undefined,
  sort_by: "created_at",
  sort_order: "desc",
};

export default function DiplomasPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [diplomas, setDiplomas] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filters, setFilters] = useState({ diploma_type: "", institution: "", status: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<Diploma | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [availableFilters, setAvailableFilters] = useState<any>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createForm, setCreateForm] = useState({
    studentFirstName: "",
    studentLastName: "",
    diplomaTitle: "",
    issueDate: "",
    diplomaType: "Licence",
    mention: "Passable",
    diplomaNumber: "",
    studentBirthdate: "",
    studentPhone: ""
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailDiploma, setDetailDiploma] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    const fetchDiplomas = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: any = { page, search };
        if (filters.diploma_type) params.diploma_type = filters.diploma_type;
        if (filters.institution) params.institution = filters.institution;
        if (filters.status) params.status = filters.status;
        const data = await getDiplomas(params);
        setDiplomas(data.diplomas || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setAvailableFilters(data.filters.available);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDiplomas();
  }, [token, page, search, filters]);

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCreateForm({ ...createForm, [e.target.name]: e.target.value });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");
    try {
      await createDiploma(createForm);
      setShowCreate(false);
      setCreateForm({
        studentFirstName: "",
        studentLastName: "",
        diplomaTitle: "",
        issueDate: "",
        diplomaType: "Licence",
        mention: "Passable",
        diplomaNumber: "",
        studentBirthdate: "",
        studentPhone: ""
      });
      setPage(1); // retour à la première page
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const openDetail = async (diploma: any) => {
    setDetailLoading(true);
    setDetailError("");
    try {
      const data = await getDiploma(diploma.id);
      setDetailDiploma(data);
      setShowDetail(true);
    } catch (e: any) {
      setDetailError(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Confirmer la suppression de ce diplôme ?")) return;
    setDetailLoading(true);
    setDetailError("");
    try {
      await deleteDiploma(id);
      setShowDetail(false);
      setDetailDiploma(null);
      setPage(1);
    } catch (e: any) {
      setDetailError(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRegisterBlockchain = async (id: string) => {
    setDetailLoading(true);
    setDetailError("");
    try {
      await registerDiplomaOnBlockchain(id);
      // Recharger le détail
      const data = await getDiploma(id);
      setDetailDiploma(data);
      setPage(1);
    } catch (e: any) {
      setDetailError(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownloadPDF = async (id: string) => {
    setDetailLoading(true);
    setDetailError("");
    try {
      const blob = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/diplomas/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.blob());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `diplome-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setDetailError(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  if (!token) return <div className="p-8 text-center">Veuillez vous connecter.</div>;

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Mes diplômes</h1>
        <Button onClick={() => setShowCreate(true)}>Nouveau diplôme</Button>
      </div>
      <div className="flex gap-4 mb-4">
        <Input placeholder="Recherche..." value={search} onChange={e => setSearch(e.target.value)} />
        <Select
          value={filters.diploma_type || ""}
          onChange={(e) => setFilters((prev) => ({ ...prev, diploma_type: e.target.value }))}
          options={availableFilters.diploma_types?.map((type: string) => ({ value: type, label: type })) || []}
        />
        <Select
          value={filters.institution || ""}
          onChange={(e) => setFilters((prev) => ({ ...prev, institution: e.target.value }))}
          options={[
            { value: "", label: "Institution" },
            ...(availableFilters.institutions?.map((inst: string) => ({ value: inst, label: inst })) || [])
          ]}
        />
        <Select
          value={filters.status || ""}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          options={[
            { value: "", label: "Statut" },
            { value: "blockchain_registered", label: "Enregistré blockchain" },
            { value: "pending", label: "En attente" },
          ]}
        />
        <Button onClick={() => setPage(1)}>Rechercher</Button>
      </div>
      {loading ? (
        <div>Chargement...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Nom du diplôme</th>
                <th className="p-2 border">Étudiant</th>
                <th className="p-2 border">Type</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Statut</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {diplomas.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-4">Aucun diplôme trouvé.</td></tr>
              ) : diplomas.map((d: any) => (
                <tr key={d.id}>
                  <td className="border p-2">{d.diploma_name}</td>
                  <td className="border p-2">{d.student_firstname} {d.student_lastname}</td>
                  <td className="border p-2">{d.diploma_type}</td>
                  <td className="border p-2">{d.emission_date?.slice(0, 10)}</td>
                  <td className="border p-2">{d.blockchain_registered_at ? <Badge type="success">Enregistré</Badge> : <Badge type="info">Brouillon</Badge>}</td>
                  <td className="border p-2 flex gap-2">
                    <Button onClick={() => openDetail(d)}>Voir</Button>
                    <Button variant="danger" onClick={() => handleDelete(d.id)}>Supprimer</Button>
                    <Button variant="secondary" onClick={() => handleDownloadPDF(d.id)}>PDF</Button>
                    {!d.blockchain_registered_at && <Button variant="secondary" onClick={() => handleRegisterBlockchain(d.id)}>Enregistrer sur blockchain</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex gap-2 justify-center mt-4">
        <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Précédent</Button>
        <span>Page {page} / {totalPages}</span>
        <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Suivant</Button>
      </div>
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-8 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-xl" onClick={() => setShowCreate(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Créer un diplôme</h2>
            <form className="flex flex-col gap-2" onSubmit={handleCreateSubmit}>
              <Input label="Prénom étudiant" name="studentFirstName" required value={createForm.studentFirstName} onChange={handleCreateChange} />
              <Input label="Nom étudiant" name="studentLastName" required value={createForm.studentLastName} onChange={handleCreateChange} />
              <Input label="Intitulé du diplôme" name="diplomaTitle" required value={createForm.diplomaTitle} onChange={handleCreateChange} />
              <Input label="Date d'émission" name="issueDate" type="date" required value={createForm.issueDate} onChange={handleCreateChange} />
              <select name="diplomaType" value={createForm.diplomaType} onChange={handleCreateChange} className="border rounded p-2">
                <option value="Licence">Licence</option>
                <option value="Master">Master</option>
                <option value="Doctorat">Doctorat</option>
                <option value="BTS">BTS</option>
                <option value="DUT">DUT</option>
                <option value="Certificat">Certificat</option>
                <option value="Diplôme d'ingénieur">Diplôme d'ingénieur</option>
                <option value="CAP">CAP</option>
                <option value="Baccalauréat">Baccalauréat</option>
                <option value="Autre">Autre</option>
              </select>
              <select name="mention" value={createForm.mention} onChange={handleCreateChange} className="border rounded p-2">
                <option value="Passable">Passable</option>
                <option value="Assez bien">Assez bien</option>
                <option value="Bien">Bien</option>
                <option value="Très bien">Très bien</option>
                <option value="Excellent">Excellent</option>
                <option value="Sans mention">Sans mention</option>
              </select>
              <Input label="Numéro du diplôme" name="diplomaNumber" required value={createForm.diplomaNumber} onChange={handleCreateChange} />
              <Input label="Date de naissance étudiant" name="studentBirthdate" type="date" required value={createForm.studentBirthdate} onChange={handleCreateChange} />
              <Input label="Téléphone étudiant" name="studentPhone" required value={createForm.studentPhone} onChange={handleCreateChange} />
              <Button type="submit" disabled={createLoading}>{createLoading ? "Création..." : "Créer"}</Button>
              {createError && <div className="text-red-600 text-center mt-2">{createError}</div>}
            </form>
          </div>
        </div>
      )}
      {showDetail && detailDiploma && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-8 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-xl" onClick={() => { setShowDetail(false); setDetailDiploma(null); }}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Détail du diplôme</h2>
            {detailLoading ? <div>Chargement...</div> : detailError ? <div className="text-red-600">{detailError}</div> : (
              (() => {
                const diploma = detailDiploma?.diploma || detailDiploma || {};
                return (
                  <div className="flex flex-col gap-2">
                    <div><b>Nom :</b> {diploma.diploma_name}</div>
                    <div><b>Étudiant :</b> {diploma.student_firstname} {diploma.student_lastname}</div>
                    <div><b>Type :</b> {diploma.diploma_type}</div>
                    <div><b>Mention :</b> {diploma.mention}</div>
                    <div><b>Date d'émission :</b> {diploma.emission_date?.slice(0, 10)}</div>
                    <div><b>Numéro :</b> {diploma.diploma_number}</div>
                    <div><b>Date de naissance :</b> {diploma.student_birthdate?.slice(0, 10)}</div>
                    <div><b>Téléphone :</b> {diploma.student_phone}</div>
                    <div><b>Institution :</b> {diploma.issuer_institution}</div>
                    <div><b>Statut blockchain :</b> {diploma.blockchain_registered_at ? <Badge type="success">Enregistré</Badge> : <Badge type="info">Non enregistré</Badge>}</div>
                    {diploma.qr_code_url && <img src={diploma.qr_code_url} alt="QR Code" className="w-32 h-32 mx-auto" />}
                    <div className="flex gap-2 mt-4">
                      <Button variant="secondary" onClick={() => handleDownloadPDF(diploma.id)}>Télécharger PDF</Button>
                      {!diploma.blockchain_registered_at && <Button variant="secondary" onClick={() => handleRegisterBlockchain(diploma.id)}>Enregistrer sur blockchain</Button>}
                      <Button variant="danger" onClick={() => handleDelete(diploma.id)}>Supprimer</Button>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </main>
  );
} 