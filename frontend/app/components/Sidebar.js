"use client";

import { FaHome, FaCertificate, FaChevronDown, FaChevronUp, FaCheckCircle, FaUserShield, FaCog, FaUserCircle, FaSignOutAlt, FaBell } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';

// Simuler le nombre de notifications non lues (à remplacer par un vrai fetch plus tard)
const fakeUnreadNotifications = 3;

export default function Sidebar({ activeTab, onTabChange, isAdmin, isVerifier, user = { first_name: 'N', last_name: 'U', email: 'user@mail.com' }, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [diplomaOpen, setDiplomaOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const initials = (user.first_name?.[0] || '') + (user.last_name?.[0] || '');

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="d-flex flex-column bg-white shadow-sm p-3 justify-content-between"
      style={{ minHeight: '100vh', width: 220, position: 'fixed', top: 0, left: 0, zIndex: 100 }}
    >
      <div>
        {/* Accueil */}
        <Link href="/" className="d-flex align-items-center gap-2 mb-3 px-2 py-2 rounded text-dark" style={{ textDecoration: 'none', fontWeight: 500, fontSize: 17 }}>
          <FaHome style={{ fontSize: 20 }} /> Accueil
        </Link>
        {/* Notifications */}
        <Link href="/notifications" className="d-flex align-items-center gap-2 mb-3 px-2 py-2 rounded text-dark position-relative" style={{ textDecoration: 'none', fontWeight: 500, fontSize: 17 }}>
          <FaBell style={{ fontSize: 20 }} /> Notifications
          {fakeUnreadNotifications > 0 && (
            <span style={{ position: 'absolute', right: 12, top: 8, background: '#f43f5e', color: 'white', borderRadius: '50%', fontSize: 12, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{fakeUnreadNotifications}</span>
          )}
        </Link>
        {/* Diplômes avec sous-menu */}
        <div>
          <div
            className={`d-flex align-items-center gap-2 mb-2 px-2 py-2 rounded text-dark ${diplomaOpen ? 'bg-light' : ''}`}
            style={{ fontWeight: 500, fontSize: 17, cursor: 'pointer', transition: 'background 0.2s' }}
            onClick={() => setDiplomaOpen(!diplomaOpen)}
          >
            <FaCertificate style={{ fontSize: 20 }} /> Diplômes
            {diplomaOpen ? <FaChevronUp style={{ marginLeft: 'auto' }} /> : <FaChevronDown style={{ marginLeft: 'auto' }} />}
          </div>
          {diplomaOpen && (
            <div style={{ marginLeft: 24 }}>
              <Link href="/diplomas/list" className="d-block mb-2 text-dark" style={{ textDecoration: 'none', fontSize: 16 }}>
                Liste des diplômes
              </Link>
              <Link href="/diplomas/add" className="d-block mb-2 text-dark" style={{ textDecoration: 'none', fontSize: 16 }}>
                Ajouter un diplôme
              </Link>
              <Link href="/diplomas/stats" className="d-block mb-2 text-dark" style={{ textDecoration: 'none', fontSize: 16 }}>
                Statistiques
              </Link>
            </div>
          )}
        </div>
        {/* Vérification avec sous-menu */}
        <div>
          <div
            className={`d-flex align-items-center gap-2 mb-2 px-2 py-2 rounded text-dark ${verificationOpen ? 'bg-light' : ''}`}
            style={{ fontWeight: 500, fontSize: 17, cursor: 'pointer', transition: 'background 0.2s' }}
            onClick={() => setVerificationOpen(!verificationOpen)}
          >
            <FaCheckCircle style={{ fontSize: 20 }} /> Vérification
            {verificationOpen ? <FaChevronUp style={{ marginLeft: 'auto' }} /> : <FaChevronDown style={{ marginLeft: 'auto' }} />}
          </div>
          {verificationOpen && (
            <div style={{ marginLeft: 24 }}>
              <Link href="/verification/check" className="d-block mb-2 text-dark" style={{ textDecoration: 'none', fontSize: 16 }}>
                Vérifier un diplôme
              </Link>
              <Link href="/verification/history" className="d-block mb-2 text-dark" style={{ textDecoration: 'none', fontSize: 16 }}>
                Historique des vérifications
              </Link>
            </div>
          )}
        </div>
        {/* Administration avec sous-menu */}
        {isAdmin && (
          <div>
            <div
              className={`d-flex align-items-center gap-2 mb-2 px-2 py-2 rounded text-dark ${adminOpen ? 'bg-light' : ''}`}
              style={{ fontWeight: 500, fontSize: 17, cursor: 'pointer', transition: 'background 0.2s' }}
              onClick={() => setAdminOpen(!adminOpen)}
            >
              <FaUserShield style={{ fontSize: 20 }} /> Administration
              {adminOpen ? <FaChevronUp style={{ marginLeft: 'auto' }} /> : <FaChevronDown style={{ marginLeft: 'auto' }} />}
            </div>
            {adminOpen && (
              <div style={{ marginLeft: 24 }}>
                <Link href="/admin/users" className="d-block mb-2 text-dark" style={{ textDecoration: 'none', fontSize: 16 }}>
                  Utilisateurs
                </Link>
                <Link href="/admin/roles" className="d-block mb-2 text-dark" style={{ textDecoration: 'none', fontSize: 16 }}>
                  Rôles
                </Link>
                <Link href="/admin/logs" className="d-block mb-2 text-dark" style={{ textDecoration: 'none', fontSize: 16 }}>
                  Logs & Analytics
                </Link>
              </div>
            )}
          </div>
        )}
        {/* Paramètres avec sous-menu */}
        <div>
          <div
            className={`d-flex align-items-center gap-2 mb-2 px-2 py-2 rounded text-dark ${settingsOpen ? 'bg-light' : ''}`}
            style={{ fontWeight: 500, fontSize: 17, cursor: 'pointer', transition: 'background 0.2s' }}
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <FaCog style={{ fontSize: 20 }} /> Paramètres
            {settingsOpen ? <FaChevronUp style={{ marginLeft: 'auto' }} /> : <FaChevronDown style={{ marginLeft: 'auto' }} />}
          </div>
          {settingsOpen && (
            <div style={{ marginLeft: 24 }}>
              <Link href="/settings/profile" className="d-block mb-2 text-dark" style={{ textDecoration: 'none', fontSize: 16 }}>
                Profil
              </Link>
              <Link href="/settings/security" className="d-block mb-2 text-dark" style={{ textDecoration: 'none', fontSize: 16 }}>
                Sécurité
              </Link>
            </div>
          )}
        </div>
      </div>
      {/* Avatar utilisateur en bas */}
      <div style={{ position: 'relative', marginTop: 32 }}>
        <div
          className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle shadow"
          style={{ width: 48, height: 48, fontSize: 22, cursor: 'pointer', margin: '0 auto' }}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {initials}
        </div>
        {/* Menu contextuel */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white shadow rounded p-2"
            style={{ position: 'absolute', left: '50%', bottom: 60, transform: 'translateX(-50%)', minWidth: 160, zIndex: 200 }}
          >
            <div className="d-flex align-items-center gap-2 mb-2 text-dark" style={{ cursor: 'pointer' }}>
              <FaUserCircle />
              <span>Profil</span>
            </div>
            <div className="d-flex align-items-center gap-2 text-danger" style={{ cursor: 'pointer' }} onClick={onLogout}>
              <FaSignOutAlt />
              <span>Déconnexion</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.aside>
  );
} 