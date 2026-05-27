Home.jsx:
```
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-center py-5 animate-fade-in">
      <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 900, color: '#1e293b', letterSpacing: '-1px' }}>
        Benvenuti nel nostro <br/>
        <span style={{ color: '#4f46e5' }}>Quartier Generale</span>
      </h1>
      <p className="text-muted mt-3 mb-5" style={{ fontSize: 'clamp(1rem, 1.5vw, 1.2rem)', maxWidth: '600px' }}>
        Un posto accogliente per gli amici, feste improvvisate e sessioni intense di studio e programmazione. Esplora il sito e blocca le tue date!
      </p>
      
      <div className="d-flex gap-3 flex-wrap justify-content-center">
        <Button className="btn-indigo px-4 py-2 fs-5" onClick={() => navigate('/prenota')}>
          📅 Prenota un soggiorno
        </Button>
        <Button variant="outline-secondary" className="px-4 py-2 fs-5 fw-bold" style={{ borderRadius: '0.75rem' }} onClick={() => navigate('/recensioni')}>
          💬 Leggi la Bacheca
        </Button>
      </div>
    </div>
  );
}

export default Home;
```

Inquilini.jsx:
```
import { useState } from 'react';
import { Row, Col } from 'react-bootstrap';

function Inquilini() {
  const [mostraInfo1, setMostraInfo1] = useState(false);
  const [mostraInfo2, setMostraInfo2] = useState(false);

  return (
    <div className="container py-5 animate-fade-in flex-grow-1">
      <div className="text-center mb-5">
        <h2 className="fw-bolder" style={{ fontSize: '2.5rem', color: '#1e293b' }}>I Padroni di Casa 👑</h2>
        <p className="text-muted">Clicca sulle nostre schede per scoprire i dettagli compromettenti.</p>
      </div>
      
      <Row className="justify-content-center g-4">
        {/* INQUILINO 1 */}
        <Col md={5}>
          <div className="modern-card p-0 overflow-hidden" style={{ cursor: 'pointer' }} onClick={() => setMostraInfo1(!mostraInfo1)}>
            <div className="position-relative" style={{ height: '300px', backgroundColor: '#4f46e5' }}>
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80" alt="Inquilino 1" className="w-100 h-100 object-fit-cover opacity-75" />
              <div className="position-absolute bottom-0 start-0 p-4 text-white">
                <span className="badge bg-primary mb-2">Dev & Founder</span>
                <h3 className="fw-bold mb-0">Simone Vergine</h3>
              </div>
            </div>
            <div className="p-4" style={{ backgroundColor: mostraInfo1 ? '#f8fafc' : 'white' }}>
              {!mostraInfo1 ? (
                <p className="text-center fw-bold text-primary mb-0">👉 Clicca per scoprire i dettagli</p>
              ) : (
                <>
                  <p className="text-muted">Studente di ingegneria, programmatore di giorno e sognatore di notte. Gestisce l'infrastruttura tecnologica della casa.</p>
                  <div className="border-top pt-2 mt-2 small fw-bold text-muted d-flex justify-content-between">
                    <span>🎯 Superpotere: Scrivere codice</span>
                    <span>⚠️ Difetto: Caffè-dipendente</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </Col>

        {/* INQUILINO 2 */}
        <Col md={5}>
          <div className="modern-card p-0 overflow-hidden" style={{ cursor: 'pointer' }} onClick={() => setMostraInfo2(!mostraInfo2)}>
            <div className="position-relative" style={{ height: '300px', backgroundColor: '#0ea5e9' }}>
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80" alt="Inquilino 2" className="w-100 h-100 object-fit-cover opacity-75" />
              <div className="position-absolute bottom-0 start-0 p-4 text-white">
                <span className="badge bg-info mb-2">Co-Host & Chief</span>
                <h3 className="fw-bold mb-0">Antonio / Gilberto</h3>
              </div>
            </div>
            <div className="p-4" style={{ backgroundColor: mostraInfo2 ? '#f0f9ff' : 'white' }}>
              {!mostraInfo2 ? (
                <p className="text-center fw-bold text-info mb-0">👉 Clicca per scoprire i dettagli</p>
              ) : (
                <>
                  <p className="text-muted">Il vero pilastro logistico ed estetico dell'appartamento. Si assicura che gli ospiti trovino sempre bibite fresche in frigo.</p>
                  <div className="border-top pt-2 mt-2 small fw-bold text-muted d-flex justify-content-between">
                    <span>🎯 Superpotere: Playlist perfette</span>
                    <span>⚠️ Difetto: Fortnite notturno</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default Inquilini;
```

Login.jsx:
```
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import { loginHandler, registerHandler } from '../api/API.mjs';

function Login({ setIsAuth, setUser, setIsAdmin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      if (isLogin) {
        const user = await loginHandler(email, password);
        setIsAuth(true); setUser(user); setIsAdmin(user.role === 'admin');
        navigate("/");
      } else {
        const user = await registerHandler({ name, surname, email, password, phoneNumber });
        setIsAuth(true); setUser(user); setIsAdmin(user.role === 'admin');
        navigate("/");
      }
    } catch (err) { setErrorMsg(err.toString()); }
    finally { setLoading(false); }
  };

  return (
    <div className="modern-card mx-auto mt-5">
      <Form onSubmit={handleSubmit}>
        <h3 className="text-center mb-4">{isLogin ? 'Login' : 'Registrati'}</h3>
        {!isLogin && (
          <>
            <Form.Group className="mb-2"><Form.Control placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} /></Form.Group>
            <Form.Group className="mb-2"><Form.Control placeholder="Cognome" value={surname} onChange={e=>setSurname(e.target.value)} /></Form.Group>
            <Form.Group className="mb-2"><Form.Control placeholder="Telefono" value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} /></Form.Group>
          </>
        )}
        <Form.Group className="mb-2"><Form.Control type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} /></Form.Group>
        <Form.Group className="mb-3"><Form.Control type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} /></Form.Group>
        {errorMsg && <div className="text-danger small mb-2">{errorMsg}</div>}
        <Button className="w-100 btn-indigo" type="submit" disabled={loading}>{loading ? '...' : 'Invia'}</Button>
        <Button variant="link" className="w-100 mt-2" onClick={() => setIsLogin(!isLogin)}>{isLogin ? "Registrati" : "Hai già un account?"}</Button>
      </Form>
    </div>
  );
}
export default Login;
```

MyNavbar.jsx:
```
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Navbar, Button, Nav } from "react-bootstrap";

function MyNavbar({ handleLogoutWrapper, isAuth }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <Navbar expand="lg" style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 1000 }}>
      <Container fluid className="px-4">
        
        <Navbar.Brand 
          style={{ cursor: 'pointer', fontWeight: 900, color: '#4f46e5', letterSpacing: '1px', fontSize: '1.5rem' }}
          onClick={() => navigate("/")}
        >
          CASA NOSTRA 🏠
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav className="align-items-center gap-2 font-weight-bold">
            <Nav.Link onClick={() => navigate("/")} style={{ color: isActive('/') ? '#4f46e5' : '#64748b', fontWeight: 600 }}>Home</Nav.Link>
            <Nav.Link onClick={() => navigate("/inquilini")} style={{ color: isActive('/inquilini') ? '#4f46e5' : '#64748b', fontWeight: 600 }}>Inquilini</Nav.Link>
            <Nav.Link onClick={() => navigate("/prenota")} style={{ color: isActive('/prenota') ? '#4f46e5' : '#64748b', fontWeight: 600 }}>Prenota</Nav.Link>
            <Nav.Link onClick={() => navigate("/recensioni")} style={{ color: isActive('/recensioni') ? '#4f46e5' : '#64748b', fontWeight: 600 }}>Recensioni</Nav.Link>
            
            <div className="ms-lg-3 ps-lg-3 border-start border-2 border-light">
              {isAuth ? (
                <Button variant="danger" className="rounded-pill px-4 fw-bold shadow-sm" onClick={handleLogoutWrapper}>
                  Esci
                </Button>
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
```

Prenota.jsx:
```
import { useState } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { submitPrenotazione } from '../api/API.mjs';

function Prenota({ isAuth }) {
  const [form, setForm] = useState({ arrivo: '', partenza: '', numero_ospiti: 1, stanza: 'Camera Ospiti', note: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitPrenotazione(form);
      alert("Prenotazione inviata!");
    } catch (err) { alert("Errore prenotazione"); }
  };

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">Blocca le tue date 📅</h2>
      <Card className="modern-card mx-auto">
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col><Form.Group className="mb-3"><Form.Label>Arrivo</Form.Label><Form.Control type="date" onChange={e => setForm({...form, arrivo: e.target.value})} /></Form.Group></Col>
            <Col><Form.Group className="mb-3"><Form.Label>Partenza</Form.Label><Form.Control type="date" onChange={e => setForm({...form, partenza: e.target.value})} /></Form.Group></Col>
          </Row>
          <Form.Group className="mb-3"><Form.Label>Numero ospiti</Form.Label><Form.Control type="number" min="1" onChange={e => setForm({...form, numero_ospiti: e.target.value})} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Stanza preferita</Form.Label><Form.Select onChange={e => setForm({...form, stanza: e.target.value})}><option>Camera Ospiti</option><option>Divano</option></Form.Select></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Note extra</Form.Label><Form.Control as="textarea" onChange={e => setForm({...form, note: e.target.value})} /></Form.Group>
          <Button type="submit" className="w-100 btn-indigo">Conferma Prenotazione</Button>
        </Form>
      </Card>
    </div>
  );
}
export default Prenota;
```

Recensioni.jsx:
```
import { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { fetchRecensioni, submitRecensione, rispondiRecensione } from '../api/API.mjs';

function Recensioni({ user, isAuth, isAdmin }) {
  const [listaRecensioni, setListaRecensioni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nuovoTitolo, setNuovoTitolo] = useState('');
  const [nuovoVoto, setNuovoVoto] = useState(5);
  const [nuovoCommento, setNuovoCommento] = useState('');
  const [risposte, setRisposte] = useState({});

  const caricaRecensioni = async () => {
    try {
      const data = await fetchRecensioni();
      setListaRecensioni(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    caricaRecensioni();
  }, [isAuth]);

  const handleInvio = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitRecensione({ titolo: nuovoTitolo, voto: nuovoVoto, commento: nuovoCommento });
      setNuovoTitolo(''); setNuovoCommento(''); setNuovoVoto(5);
      caricaRecensioni();
    } catch (err) {
      alert(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRispostaAdmin = async (id) => {
    if (!risposte[id]) return;
    try {
      await rispondiRecensione(id, risposte[id]);
      setRisposte({ ...risposte, [id]: '' });
      caricaRecensioni();
    } catch (err) {
      alert("Errore invio risposta");
    }
  };

  const renderStelle = (voto) => "★★★★★☆☆☆☆☆".substring(5 - voto, 10 - voto);

  return (
    <div className="container py-4 flex-grow-1">
      <div className="text-center mb-5">
        <h2 className="fw-bolder" style={{ fontSize: '2.5rem', color: '#1e293b' }}>Feedback degli Ospiti 💬</h2>
        <p className="text-muted">Le valutazioni reali lasciate dai nostri amici lette dal database SQLite.</p>
      </div>

      <div className="row g-4">
        {/* Form Recensione (Visibile solo ai loggati) */}
        <div className="col-md-4">
          <div className="modern-card position-sticky" style={{ top: '100px', maxWidth: '100%' }}>
            {!isAuth ? (
              <div className="text-center py-3">
                <span className="fs-1">🔒</span>
                <h5 className="fw-bold mt-2">Accesso richiesto</h5>
                <p className="small text-muted">Devi essere loggato per scrivere sulla bacheca.</p>
              </div>
            ) : (
              <Form onSubmit={handleInvio}>
                <h5 className="fw-bold mb-3">Lascia un voto ⭐</h5>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted text-uppercase">Titolo</Form.Label>
                  <Form.Control className="modern-input" required value={nuovoTitolo} onChange={e => setNuovoTitolo(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted text-uppercase">Voto (1-5)</Form.Label>
                  <Form.Select className="modern-input fw-bold text-warning" value={nuovoVoto} onChange={e => setNuovoVoto(Number(e.target.value))}>
                    {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} ★</option>)}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted text-uppercase">Commento</Form.Label>
                  <Form.Control as="textarea" rows={3} className="modern-input" style={{ resize: 'none' }} required value={nuovoCommento} onChange={e => setNuovoCommento(e.target.value)} />
                </Form.Group>
                <Button type="submit" className="w-100 btn-indigo" disabled={loading}>
                  {loading ? '...' : 'Pubblica 🚀'}
                </Button>
              </Form>
            )}
          </div>
        </div>

        {/* Lista Recensioni */}
        <div className="col-md-8">
          {listaRecensioni.length === 0 ? (
            <p className="text-muted text-center mt-5 fst-italic">Nessuna recensione trovata nel DB.</p>
          ) : (
            listaRecensioni.map(rec => (
              <div key={rec.id} className="modern-card mb-4" style={{ maxWidth: '100%' }}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <img src={rec.autore_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} alt="Avatar" className="rounded-circle border" style={{ width: '45px', height: '45px', objectFit: 'cover' }} />
                    <div>
                      <h6 className="mb-0 fw-bold">{rec.autore_nome}</h6>
                      <small className="text-muted text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>{rec.autore_occupazione || "Ospite"}</small>
                    </div>
                  </div>
                  <span className="text-warning fs-5">{renderStelle(rec.voto)}</span>
                </div>
                
                <h5 className="fw-bolder">{rec.titolo}</h5>
                <p className="text-muted mb-0">{rec.commento}</p>

                {rec.risposta_admin && (
                  <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#e0e7ff', borderLeft: '4px solid #4f46e5' }}>
                    <span className="small fw-bold text-uppercase d-block mb-1" style={{ color: '#4338ca' }}>👑 I Padroni di Casa</span>
                    <span className="small fst-italic text-dark">"{rec.risposta_admin}"</span>
                  </div>
                )}

                {isAdmin && !rec.risposta_admin && (
                  <div className="mt-3 pt-3 border-top d-flex gap-2">
                    <Form.Control size="sm" className="modern-input flex-grow-1" placeholder="Rispondi come Admin..." value={risposte[rec.id] || ''} onChange={e => setRisposte({...risposte, [rec.id]: e.target.value})} />
                    <Button size="sm" className="btn-indigo px-3" onClick={() => handleRispostaAdmin(rec.id)}>Invia</Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Recensioni;
```

Register.jsx:
```
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card } from 'react-bootstrap';
import { registerHandler } from '../api/API.mjs';

function Register({ setUser, setIsAuth, setIsAdmin }) {
  const [form, setForm] = useState({ name: '', surname: '', email: '', password: '', occupazione: '', da_quanto_ci_conosci: '', descrizione_simpatica: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await registerHandler(form);
      setIsAuth(true); setUser(user); setIsAdmin(user.role === 'admin');
      navigate("/");
    } catch (err) { alert(err); }
  };

  return (
    <div className="container py-5 d-flex justify-content-center">
      <Card className="modern-card p-4">
        <h2 className="text-center mb-4">Unisciti alla Casa! 🏠</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-2"><Form.Control placeholder="Nome" onChange={e => setForm({...form, name: e.target.value})} /></Form.Group>
          <Form.Group className="mb-2"><Form.Control placeholder="Cognome" onChange={e => setForm({...form, surname: e.target.value})} /></Form.Group>
          <Form.Group className="mb-2"><Form.Control type="email" placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} /></Form.Group>
          <Form.Group className="mb-2"><Form.Control type="password" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})} /></Form.Group>
          <Form.Group className="mb-2"><Form.Control placeholder="Tua occupazione" onChange={e => setForm({...form, occupazione: e.target.value})} /></Form.Group>
          <Form.Group className="mb-2"><Form.Control placeholder="Da quanto ci conosci?" onChange={e => setForm({...form, da_quanto_ci_conosci: e.target.value})} /></Form.Group>
          <Form.Group className="mb-3"><Form.Control as="textarea" placeholder="Descrizione simpatica su di te..." onChange={e => setForm({...form, descrizione_simpatica: e.target.value})} /></Form.Group>
          <Button type="submit" className="w-100 btn-indigo">Registrati</Button>
        </Form>
      </Card>
    </div>
  );
}
export default Register;
```

App.jsx:
```
import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css'; // Assicurati di avere questo file con gli stili moderni

// Importa tutti i componenti
import MyNavbar from "./components/MyNavbar";
import Home from "./components/Home";
import Inquilini from "./components/Inquilini";
import Prenota from "./components/Prenota";
import Recensioni from "./components/Recensioni";
import Login from "./components/Login";
import { checkAuth, handleLogout } from "./api/API.mjs";

function App() {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth()
      .then(({ isAuth, user }) => {
        setIsAuth(isAuth);
        setUser(user);
        setIsAdmin(user?.role === "admin");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogoutWrapper = useCallback(async () => {
    await handleLogout();
    setIsAuth(false);
    setUser(null);
    setIsAdmin(false);
    navigate("/", { replace: true });
  }, [navigate]);

  if (loading) return <div className="text-center mt-5">Caricamento in corso...</div>;

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <MyNavbar handleLogoutWrapper={handleLogoutWrapper} isAuth={isAuth} />
      
      <main className="w-100 flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inquilini" element={<Inquilini />} />
          <Route path="/prenota" element={<Prenota user={user} isAuth={isAuth} />} />
          <Route path="/recensioni" element={<Recensioni user={user} isAuth={isAuth} isAdmin={isAdmin} />} />
          <Route path="/login" element={isAuth ? <Navigate to="/" /> : <Login setIsAuth={setIsAuth} setUser={setUser} setIsAdmin={setIsAdmin} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
```

