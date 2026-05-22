import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Navbar, Button, Nav } from "react-bootstrap";

function MyNavbar({ handleLogoutWrapper, isAuth, user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    // Modifica: Sfondo scuro e bordo scuro
    <Navbar expand="lg" style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 1000 }}>
      <Container fluid className="px-4">
        
        <Navbar.Brand 
          // Modifica: Indigo più chiaro (818cf8) per contrasto contro scuro
          style={{ cursor: 'pointer', fontWeight: 900, color: '#818cf8', letterSpacing: '1px', fontSize: '1.5rem' }}
          onClick={() => navigate("/")}
        >
          CHILL HOUSE 🏠
        </Navbar.Brand>
        
        {/* Modifica: Pulsante hamburger chiaro */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-secondary" />
        
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav className="align-items-center gap-2 font-weight-bold">
            {/* Modifica: Colori dei testi adattati (bianco/grigio chiaro) */}
            <Nav.Link onClick={() => navigate("/")} style={{ color: isActive('/') ? '#818cf8' : '#f1f5f9', fontWeight: 600 }}>Home</Nav.Link>
            <Nav.Link onClick={() => navigate("/inquilini")} style={{ color: isActive('/inquilini') ? '#818cf8' : '#f1f5f9', fontWeight: 600 }}>Inquilini</Nav.Link>
            <Nav.Link onClick={() => navigate("/prenota")} style={{ color: isActive('/prenota') ? '#818cf8' : '#f1f5f9', fontWeight: 600 }}>Prenota</Nav.Link>
            <Nav.Link onClick={() => navigate("/recensioni")} style={{ color: isActive('/recensioni') ? '#818cf8' : '#f1f5f9', fontWeight: 600 }}>Recensioni</Nav.Link>
            
            <div className="ms-lg-3 ps-lg-3 border-start border-2 border-dark d-flex align-items-center gap-3 mt-3 mt-lg-0">
              {isAuth && user ? (
                <>
                  <div className="d-flex align-items-center gap-2">
                    <img 
                      src={user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                      alt="Avatar Utente" 
                      className="rounded-circle border border-primary border-2" 
                      style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
                    />
                    <span className="fw-bold" style={{ color: '#f1f5f9' }}>Ciao, {user.name}</span>
                  </div>
                  <Button variant="danger" className="rounded-pill px-4 fw-bold shadow-sm" onClick={handleLogoutWrapper}>
                    Esci
                  </Button>
                </>
              ) : (
                <Button variant="primary" className="rounded-pill px-4 fw-bold shadow-sm" style={{ backgroundColor: '#4f46e5', border: 'none' }} onClick={() => navigate("/login")}>
                  Accedi
                </Button>
              )}
            </div>
          </Nav>
        </Navbar.Collapse>

      </Container>
    </Navbar>
  );
}

export default MyNavbar;