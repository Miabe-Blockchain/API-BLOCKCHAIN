import { FaGraduationCap, FaCheckCircle, FaHome, FaCertificate } from 'react-icons/fa';
import { Navbar, Container, Button, Nav, NavDropdown } from 'react-bootstrap';
import Link from 'next/link';

export default function Header({ isLoggedIn, onLogin, onLogout, user }) {
  return (
    <Navbar bg="white" expand="lg" className="shadow-sm mb-3" style={{ minHeight: 64 }}>
      <Container fluid>
        <Navbar.Brand href="/" className="d-flex align-items-center gap-2">
          <FaGraduationCap size={28} color="#6366f1" />
          <span className="fw-bold" style={{ fontSize: 22 }}>DiplomaChain</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="/" className="d-flex align-items-center gap-1">
              <FaHome size={16} /> Accueil
            </Nav.Link>
            <Nav.Link href="/verify" className="d-flex align-items-center gap-1">
              <FaCheckCircle size={16} /> Vérifier un diplôme
            </Nav.Link>
            {isLoggedIn && (
              <>
                <Nav.Link href="/diplomas/list" className="d-flex align-items-center gap-1">
                  <FaCertificate size={16} /> Mes diplômes
                </Nav.Link>
                <Nav.Link href="/verification/check" className="d-flex align-items-center gap-1">
                  <FaCheckCircle size={16} /> Vérification avancée
                </Nav.Link>
              </>
            )}
          </Nav>
          
          <div className="d-flex gap-2 align-items-center">
            {isLoggedIn ? (
              <>
                <span className="text-muted me-2">
                  Bonjour, {user?.first_name || 'Utilisateur'}
                </span>
                <NavDropdown title="Mon compte" id="basic-nav-dropdown">
                  <NavDropdown.Item href="/settings/profile">Profil</NavDropdown.Item>
                  <NavDropdown.Item href="/dashboard">Tableau de bord</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={onLogout}>Déconnexion</NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <Button variant="primary" onClick={onLogin}>
                Connexion
              </Button>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
} 