import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Tab, Tabs } from 'react-bootstrap';
import Diplomas from './Diplomas';
import AdminPanel from './AdminPanel';

function Dashboard({ token }) {
    const [user, setUser] = useState(null);
    const [key, setKey] = useState('diplomas');

    useEffect(() => {
        if (token) {
            try {
                // Le décodage du token se fait côté client pour des raisons d'affichage,
                // mais la validation du rôle pour les actions se fait toujours côté serveur.
                const decodedToken = jwtDecode(token);
                setUser(decodedToken);
            } catch (error) {
                console.error("Failed to decode token:", error);
                setUser(null);
            }
        }
    }, [token]);

    if (!user) {
        return <p>Chargement des informations...</p>;
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Tableau de bord</h2>
                <div className="text-end">
                    <p className="mb-0">Bonjour, <strong>{user.firstName || user.email}</strong>!</p>
                    <small className="text-muted">Rôle : {user.role}</small>
                </div>
            </div>

            <Tabs
                id="dashboard-tabs"
                activeKey={key}
                onSelect={(k) => setKey(k)}
                className="mb-3"
            >
                <Tab eventKey="diplomas" title="Gestion des Diplômes">
                    <Diplomas token={token} userRole={user.role} />
                </Tab>

                {/* L'onglet Administration n'est visible que pour les admins */}
                {user.role === 'admin' && (
                    <Tab eventKey="admin" title="Administration">
                        <AdminPanel token={token} />
                    </Tab>
                )}
            </Tabs>
        </div>
    );
}

export default Dashboard; 