"use client";

import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Tab, Tabs } from 'react-bootstrap';
import Diplomas from './Diplomas';
import AdminPanel from './AdminPanel';
import VerifierPanel from './VerifierPanel';
import Settings from './Settings';

const API_URL = 'http://localhost:5000/api';

function Dashboard({ token }) {
    const [user, setUser] = useState(null);
    const [key, setKey] = useState('diplomas');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch(`${API_URL}/auth/verify-token`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                }
            } catch (error) {
                console.error('Erreur récupération utilisateur:', error);
            }
        };

        fetchUser();
    }, [token]);

    if (!user) {
        return <div>Chargement...</div>;
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

                {/* L'onglet Vérification n'est visible que pour les vérificateurs */}
                {user.role === 'verificateur' && (
                    <Tab eventKey="verification" title="Vérification des Diplômes">
                        <VerifierPanel token={token} />
                    </Tab>
                )}

                {/* Onglet Paramètres pour tous */}
                <Tab eventKey="settings" title="Paramètres">
                    <Settings token={token} user={user} isAdmin={user.role === 'admin'} />
                </Tab>
            </Tabs>
        </div>
    );
}

export default Dashboard; 