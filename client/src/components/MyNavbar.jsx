import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Navbar, Button, Nav } from "react-bootstrap";
import { getTier } from '../utils/tierUtils';
import { useState } from 'react';

function MyNavbar({ handleLogoutWrapper, isAuth, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const isActive = (path) => location.pathname === path;

  const handleLogoClick = () => {
    const now = Date.now();
    // Resetta se è passato più di un secondo dall'ultimo click
    if (now - lastClickTime > 1000) {
      setClickCount(1);
    } else {
      setClickCount(clickCount + 1);
    }
    setLastClickTime(now);

    if (clickCount + 1 >= 5) {
      setClickCount(0);
      navigate("/zucca");
    } else if (clickCount === 0 || now - lastClickTime > 1000) {
      navigate("/");
    }
  };

  return (
    // Modifica: Sfondo scuro e bordo scuro
    <Navbar expand="lg" style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 1000 }}>
      <Container fluid className="px-4">
        
        <Navbar.Brand 
          id="tour-home"
          style={{ cursor: 'pointer', fontWeight: 900, color: '#818cf8', letterSpacing: '1px', fontSize: '1.5rem', userSelect: 'none' }}
          onClick={handleLogoClick}
        >
          CHILL HOUSE 🏠
        </Navbar.Brand>
        
        {/* Modifica: Pulsante hamburger chiaro */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-secondary" />
        
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav className="align-items-center gap-2 font-weight-bold">
            {/* Modifica: Colori dei testi adattati (bianco/grigio chiaro) */}
            <Nav.Link id="tour-home-link" onClick={() => navigate("/")} style={{ color: isActive('/') ? '#818cf8' : '#f1f5f9', fontWeight: 600 }}>Home</Nav.Link>
            <Nav.Link onClick={() => navigate("/inquilini")} style={{ color: isActive('/inquilini') ? '#818cf8' : '#f1f5f9', fontWeight: 600 }}>Inquilini</Nav.Link>
            <Nav.Link id="tour-prenota" onClick={() => navigate("/prenota")} style={{ color: isActive('/prenota') ? '#818cf8' : '#f1f5f9', fontWeight: 600 }}>Prenota</Nav.Link>
            <Nav.Link id="tour-bacheca" onClick={() => navigate("/recensioni")} style={{ color: isActive('/recensioni') ? '#f1f5f9' : '#94a3b8' }} className="fw-semibold">
              Bacheca
            </Nav.Link>

            <Nav.Link id="tour-tipster" onClick={() => navigate("/tipster")} style={{ color: isActive('/tipster') ? '#f1f5f9' : '#94a3b8' }} className="fw-bold d-flex align-items-center gap-1">
              Tipster
            </Nav.Link>

            <Nav.Link id="tour-rewards" onClick={() => navigate("/rewards")} style={{ color: isActive('/rewards') ? '#f1f5f9' : '#94a3b8' }} className="fw-semibold d-flex align-items-center gap-2">Rewards</Nav.Link>
            
            {user && user.role === 'admin' && (
              <Nav.Link onClick={() => navigate("/admin")} style={{ color: isActive('/admin') ? '#fbbf24' : '#eab308', fontWeight: 900 }} className="ms-2 border border-warning rounded px-3 shadow-sm">
                👑 Admin Panel
              </Nav.Link>
            )}

            <div className="ms-lg-3 ps-lg-3 border-start border-2 border-dark d-flex align-items-center gap-3 mt-3 mt-lg-0">
              {isAuth && user ? (
                <>
                  <div 
                    className="d-flex align-items-center gap-2 rounded-pill px-2 py-1 profile-hover" 
                    style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onClick={() => navigate('/profile')}
                    title="Vai al tuo Profilo"
                  >
                    <img 
                      src={user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                      alt="Avatar Utente" 
                      className="rounded-circle border border-2" 
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderColor: getTier(user.stays_count || 0).color }} 
                    />
                    <div className="d-flex flex-column lh-1 text-start">
                      <span className="fw-bold" style={{ color: '#f1f5f9' }}>Ciao, {user.name}</span>
                      <span className="badge mt-1 text-dark" style={{ backgroundColor: getTier(user.stays_count || 0).color, fontSize: '0.65rem' }}>
                        {getTier(user.stays_count || 0).icon} {getTier(user.stays_count || 0).name}
                      </span>
                    </div>
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