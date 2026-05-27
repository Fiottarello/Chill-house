server.mjs:
```
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import crypto from 'crypto';
import * as dao from './dao.mjs';

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); 
app.use(session({
  secret: 'segreto_casanostra_super_sicuro',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } 
}));
app.use(passport.initialize());
app.use(passport.session());

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ success: false, message: 'Non autenticato' });
}

function isAdmin(req, res, next) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Non autorizzato' });
}

function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex'));
    });
  });
}

passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, async (email, password, done) => {
  try {
    const user = await dao.getUserByEmail(email);
    if (!user) return done(null, false, { message: 'Utente non trovato' });

    const hashedPassword = await hashPassword(password, user.salt);
    if (hashedPassword !== user.password) return done(null, false, { message: 'Password errata' });
    return done(null, user);
  } catch (err) { return done(err); }
}));

passport.serializeUser((user, done) => { done(null, { id: user.id, role: user.role }); });
passport.deserializeUser(async (obj, done) => {
  try {
    const user = await dao.getUserById(obj.id);
    done(null, user || false);
  } catch (err) { done(err); }
});

// --- AUTH ---
app.post('/api/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return res.json({ success: false, errorMsg: 'Errore interno' });
    if (!user) return res.json({ success: false, errorMsg: info?.message });

    req.login(user, (err) => {
      if (err) return res.json({ success: false, errorMsg: 'Login fallito' });
      return res.json({ success: true, user: { id: user.id, name: user.name, surname: user.surname, email: user.email, role: user.role, avatar_url: user.avatar_url, descrizione_simpatica: user.descrizione_simpatica } });
    });
  })(req, res, next);
});

app.post('/api/logout', (req, res) => {
  req.logout(err => {
    if (err) return res.json({ success: false, message: 'Logout fallito' });
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      return res.json({ success: true });
    });
  });
});

app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) return res.json({ isAuth: true, user: req.user });
  return res.json({ isAuth: false });
});

app.post('/api/register', async (req, res) => {
  try {
    // Non chiediamo più phoneNumber
    const { name, surname, email, password, occupazione, da_quanto_ci_conosci, descrizione_simpatica, avatar_url } = req.body;
    if (await dao.getUserByEmail(email)) return res.json({ success: false, errorMsg: 'Email già in uso' });

    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await hashPassword(password, salt);

    const newUserId = await dao.addUser({
      name, surname, email, password: hashedPassword, salt,
      occupazione: occupazione || '', 
      da_quanto_ci_conosci: da_quanto_ci_conosci || '', 
      descrizione_simpatica: descrizione_simpatica || '',
      avatar_url: avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', // Immagine di default se non carica nulla
      role: 'ospite'
    });

    const newUser = await dao.getUserById(newUserId);
    req.login(newUser, (err) => {
      if (err) return res.json({ success: false, errorMsg: 'Errore login' });
      return res.json({ success: true, user: newUser });
    });
  } catch (err) { console.error(err); res.json({ success: false, errorMsg: 'Errore interno' }); }
});

// --- API ---
app.get('/api/prenotazioni', async (req, res) => {
  try {
    const data = await dao.getAllPrenotazioni();
    res.json({ success: true, prenotazioni: data });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/prenotazioni', isAuthenticated, async (req, res) => {
  try {
    const { arrivo, partenza, numero_ospiti, nomi_ospiti, orario_arrivo, orario_partenza, stanza, note } = req.body;
    await dao.addPrenotazione({ user_id: req.user.id, arrivo, partenza, numero_ospiti, nomi_ospiti, orario_arrivo, orario_partenza, stanza, note, status: 'confermata' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});
app.get('/api/recensioni', async (req, res) => {
  try {
    const data = await dao.getAllRecensioni();
    res.json({ success: true, recensioni: data });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/recensioni', isAuthenticated, async (req, res) => {
  try {
    const { titolo, voto, commento } = req.body;
    await dao.addRecensione({ user_id: req.user.id, titolo, voto, commento });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.put('/api/recensioni/:id/rispondi', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await dao.updateRispostaAdmin(req.params.id, req.body.risposta_admin);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.listen(3001, () => console.log('🚀 Backend in ascolto su http://localhost:3001'));
```

API.mjs:
```
const API_BASE = 'http://localhost:3001/api';

// ========== AUTH ==========
export const loginHandler = (email, password) =>
  fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  })
    .then(async res => {
      let data;
      try { data = await res.json(); } catch { throw 'Risposta del server non valida'; }
      if (data.success) return data.user;
      else throw data.errorMsg || 'Login fallito';
    });

export const registerHandler = (userData) =>
  fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(userData)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) return data.user;
      else throw data.errorMsg || "Registrazione fallita";
    });

export const checkAuth = () =>
  fetch(`${API_BASE}/user`, { method: 'GET', credentials: 'include' })
    .then(res => res.ok ? res.json() : { isAuth: false, user: null })
    .then(data => ({ isAuth: !!data.isAuth, user: data.user || null }));

export const handleLogout = () =>
  fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' })
    .then(() => { return; });

// ========== PRENOTAZIONI ==========
export const fetchPrenotazioni = () =>
  fetch(`${API_BASE}/prenotazioni`, { method: 'GET', credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data.success) return data.prenotazioni;
      else throw "Errore caricamento prenotazioni";
    });

export const submitPrenotazione = (prenotazioneData) =>
  fetch(`${API_BASE}/prenotazioni`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(prenotazioneData)
  }).then(res => res.json());

// ========== RECENSIONI ==========
export const fetchRecensioni = () =>
  fetch(`${API_BASE}/recensioni`, { method: 'GET', credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data.success) return data.recensioni;
      else throw "Errore caricamento recensioni";
    });

export const submitRecensione = (recensioneData) =>
  fetch(`${API_BASE}/recensioni`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(recensioneData)
  }).then(res => res.json());

export const rispondiRecensione = (id, risposta_admin) =>
  fetch(`${API_BASE}/recensioni/${id}/rispondi`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ risposta_admin })
  }).then(res => res.json());
```

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
import { loginHandler } from '../api/API.mjs';

function Login({ setIsAuth, setUser, setIsAdmin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await loginHandler(email, password);
      setIsAuth(true); setUser(user); setIsAdmin(user.role === 'admin');
      navigate("/");
    } catch (err) { setErrorMsg(err.toString()); }
    finally { setLoading(false); }
  };

  return (
    <div className="modern-card mx-auto mt-5">
      <Form onSubmit={handleSubmit}>
        <h3 className="text-center mb-4">Login</h3>
        <Form.Group className="mb-2"><Form.Control type="email" placeholder="Email" onChange={e=>setEmail(e.target.value)} /></Form.Group>
        <Form.Group className="mb-3"><Form.Control type="password" placeholder="Password" onChange={e=>setPassword(e.target.value)} /></Form.Group>
        {errorMsg && <div className="text-danger small mb-2">{errorMsg}</div>}
        <Button className="w-100 btn-indigo" type="submit" disabled={loading}>{loading ? '...' : 'Accedi'}</Button>
        <Button variant="link" className="w-100 mt-2" onClick={() => navigate("/register")}>Non hai un account? Registrati</Button>
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
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { fetchPrenotazioni, submitPrenotazione } from '../api/API.mjs';

function Prenota({ isAuth }) {
  const [dateSelezionate, setDateSelezionate] = useState([new Date(), new Date(Date.now() + 86400000)]);
  const [form, setForm] = useState({ numero_ospiti: 1, nomi_ospiti: '', orario_arrivo: '14:00', orario_partenza: '10:00', stanza: 'Camera Ospiti', note: '' });
  
  const [prenotazioniEsistenti, setPrenotazioniEsistenti] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPrenotazioni().then(data => setPrenotazioniEsistenti(data || [])).catch(err => console.error(err));
  }, []);

  const normalizzaData = (data) => {
    const d = new Date(data);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const isGiornoOccupato = (dataDaControllare) => {
    const dataControllo = normalizzaData(dataDaControllare);
    return prenotazioniEsistenti.some(p => {
      const arrivo = normalizzaData(p.arrivo);
      const partenza = normalizzaData(p.partenza);
      return dataControllo >= arrivo && dataControllo < partenza;
    });
  };

  const gestisciPrenotazione = async (e) => {
    e.preventDefault();
    if (!isAuth) { alert("Devi essere loggato!"); return; }

    setLoading(true);
    const offset = dateSelezionate[0].getTimezoneOffset() * 60000;
    const arrivoFormatted = new Date(dateSelezionate[0] - offset).toISOString().split('T')[0];
    const partenzaFormatted = dateSelezionate[1] ? new Date(dateSelezionate[1] - offset).toISOString().split('T')[0] : arrivoFormatted;

    try {
      await submitPrenotazione({ ...form, arrivo: arrivoFormatted, partenza: partenzaFormatted });
      alert("🎉 Prenotazione confermata!");
      fetchPrenotazioni().then(data => setPrenotazioniEsistenti(data || []));
    } catch (error) { alert("Errore: " + error); }
    finally { setLoading(false); }
  };

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h2 className="fw-bolder" style={{ fontSize: '2.5rem', color: '#1e293b' }}>Blocca le tue date 📅</h2>
        <p className="text-muted">I giorni evidenziati sono già occupati.</p>
      </div>

      <Row className="g-5 justify-content-center">
        {/* LATO CALENDARIO */}
        <Col md={6} className="d-flex justify-content-center">
          <div className="modern-card p-4 d-flex justify-content-center w-100">
            <Calendar 
              onChange={setDateSelezionate} value={dateSelezionate} selectRange={true}
              locale="it-IT" minDate={new Date()} className="border-0 w-100"
              tileDisabled={({ date }) => isGiornoOccupato(date)}
            />
          </div>
        </Col>

        {/* LATO FORM */}
        <Col md={6}>
          <div className="modern-card h-100">
            <Form onSubmit={gestisciPrenotazione}>
              <h5 className="fw-bold mb-4" style={{ color: '#4f46e5' }}>Dettagli Soggiorno</h5>
              
              <Row>
                <Col><Form.Group className="mb-3"><Form.Label className="small fw-bold text-muted text-uppercase">N. Ospiti</Form.Label><Form.Control type="number" min="1" className="modern-input" value={form.numero_ospiti} onChange={e => setForm({...form, numero_ospiti: e.target.value})} /></Form.Group></Col>
                <Col><Form.Group className="mb-3"><Form.Label className="small fw-bold text-muted text-uppercase">Stanza</Form.Label><Form.Select className="modern-input" onChange={e => setForm({...form, stanza: e.target.value})}><option>Camera Ospiti</option><option>Divano Salotto</option></Form.Select></Form.Group></Col>
              </Row>

              <Form.Group className="mb-3"><Form.Label className="small fw-bold text-muted text-uppercase">Nomi Ospiti</Form.Label><Form.Control className="modern-input" placeholder="Es. Mario, Luigi..." required onChange={e => setForm({...form, nomi_ospiti: e.target.value})} /></Form.Group>

              <Row>
                <Col><Form.Group className="mb-3"><Form.Label className="small fw-bold text-muted text-uppercase">Orario Arrivo</Form.Label><Form.Control type="time" className="modern-input" value={form.orario_arrivo} required onChange={e => setForm({...form, orario_arrivo: e.target.value})} /></Form.Group></Col>
                <Col><Form.Group className="mb-3"><Form.Label className="small fw-bold text-muted text-uppercase">Orario Partenza</Form.Label><Form.Control type="time" className="modern-input" value={form.orario_partenza} required onChange={e => setForm({...form, orario_partenza: e.target.value})} /></Form.Group></Col>
              </Row>

              <Form.Group className="mb-4"><Form.Label className="small fw-bold text-muted text-uppercase">Note Extra</Form.Label><Form.Control as="textarea" className="modern-input" rows={2} onChange={e => setForm({...form, note: e.target.value})} /></Form.Group>

              <Button type="submit" className="w-100 btn-indigo" disabled={!isAuth || loading}>
                {isAuth ? (loading ? 'Salvataggio...' : 'Invia Richiesta 🚀') : 'Devi Accedere per Prenotare'}
              </Button>
            </Form>
          </div>
        </Col>
      </Row>
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
import { Form, Button, Card, Row, Col } from 'react-bootstrap';
import { registerHandler } from '../api/API.mjs';

function Register({ setUser, setIsAuth, setIsAdmin }) {
  const [form, setForm] = useState({ 
    name: '', surname: '', email: '', password: '', 
    occupazione: '', da_quanto_ci_conosci: '', descrizione_simpatica: '', avatar_url: '' 
  });
  const navigate = useNavigate();

  // Funzione magica per leggere l'immagine dal PC e trasformarla in Base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, avatar_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await registerHandler(form);
      setIsAuth(true); setUser(user); setIsAdmin(user.role === 'admin');
      navigate("/");
    } catch (err) { alert("Errore durante la registrazione: " + err); }
  };

  return (
    <div className="container py-5 d-flex justify-content-center">
      <Card className="modern-card p-4" style={{ maxWidth: '600px' }}>
        <h2 className="text-center mb-4" style={{ color: '#4f46e5', fontWeight: 900 }}>Unisciti alla Casa! 🏠</h2>
        
        <Form onSubmit={handleSubmit}>
          
          {/* UPLOAD FOTO PROFILO */}
          <div className="text-center mb-4">
            <p className="small fw-bold text-muted text-uppercase mb-2">La tua foto profilo</p>
            <div className="d-flex flex-column align-items-center gap-2">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="Anteprima" className="rounded-circle border border-primary border-3" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
              ) : (
                <div className="rounded-circle border border-2 d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', backgroundColor: '#f8fafc' }}>
                  <span className="fs-3">📷</span>
                </div>
              )}
              <Form.Control type="file" accept="image/*" size="sm" className="mt-2 w-75" onChange={handleImageUpload} />
            </div>
          </div>

          <Row>
            <Col><Form.Group className="mb-3"><Form.Control className="modern-input" placeholder="Nome" required onChange={e => setForm({...form, name: e.target.value})} /></Form.Group></Col>
            <Col><Form.Group className="mb-3"><Form.Control className="modern-input" placeholder="Cognome" required onChange={e => setForm({...form, surname: e.target.value})} /></Form.Group></Col>
          </Row>

          <Form.Group className="mb-3"><Form.Control className="modern-input" type="email" placeholder="Email" required onChange={e => setForm({...form, email: e.target.value})} /></Form.Group>
          <Form.Group className="mb-3"><Form.Control className="modern-input" type="password" placeholder="Password" required onChange={e => setForm({...form, password: e.target.value})} /></Form.Group>
          
          <hr className="my-4 text-muted" />

          <Form.Group className="mb-3"><Form.Control className="modern-input" placeholder="Tua occupazione (es. Studente, Ninja...)" onChange={e => setForm({...form, occupazione: e.target.value})} /></Form.Group>
          <Form.Group className="mb-3"><Form.Control className="modern-input" placeholder="Da quanto ci conosci?" onChange={e => setForm({...form, da_quanto_ci_conosci: e.target.value})} /></Form.Group>
          <Form.Group className="mb-4"><Form.Control className="modern-input" as="textarea" rows={3} placeholder="Descrizione simpatica su di te..." onChange={e => setForm({...form, descrizione_simpatica: e.target.value})} /></Form.Group>
          
          <Button type="submit" className="w-100 btn-indigo fs-5">Registrati 🚀</Button>
          <Button variant="link" className="w-100 mt-2 text-muted fw-bold" onClick={() => navigate("/login")}>Hai già le chiavi? Accedi</Button>
        </Form>
      </Card>
    </div>
  );
}
export default Register;
```

App.css:
```
.counter {
  font-size: 16px;
  padding: 5px 10px;
  border-radius: 5px;
  color: var(--accent);
  background: var(--accent-bg);
  border: 2px solid transparent;
  transition: border-color 0.3s;
  margin-bottom: 24px;

  &:hover {
    border-color: var(--accent-border);
  }
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.hero {
  position: relative;

  .base,
  .framework,
  .vite {
    inset-inline: 0;
    margin: 0 auto;
  }

  .base {
    width: 170px;
    position: relative;
    z-index: 0;
  }

  .framework,
  .vite {
    position: absolute;
  }

  .framework {
    z-index: 1;
    top: 34px;
    height: 28px;
    transform: perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg)
      scale(1.4);
  }

  .vite {
    z-index: 0;
    top: 107px;
    height: 26px;
    width: auto;
    transform: perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg)
      scale(0.8);
  }
}

#center {
  display: flex;
  flex-direction: column;
  gap: 25px;
  place-content: center;
  place-items: center;
  flex-grow: 1;

  @media (max-width: 1024px) {
    padding: 32px 20px 24px;
    gap: 18px;
  }
}

#next-steps {
  display: flex;
  border-top: 1px solid var(--border);
  text-align: left;

  & > div {
    flex: 1 1 0;
    padding: 32px;
    @media (max-width: 1024px) {
      padding: 24px 20px;
    }
  }

  .icon {
    margin-bottom: 16px;
    width: 22px;
    height: 22px;
  }

  @media (max-width: 1024px) {
    flex-direction: column;
    text-align: center;
  }
}

#docs {
  border-right: 1px solid var(--border);

  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}

#next-steps ul {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 8px;
  margin: 32px 0 0;

  .logo {
    height: 18px;
  }

  a {
    color: var(--text-h);
    font-size: 16px;
    border-radius: 6px;
    background: var(--social-bg);
    display: flex;
    padding: 6px 12px;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    transition: box-shadow 0.3s;

    &:hover {
      box-shadow: var(--shadow);
    }
    .button-icon {
      height: 18px;
      width: 18px;
    }
  }

  @media (max-width: 1024px) {
    margin-top: 20px;
    flex-wrap: wrap;
    justify-content: center;

    li {
      flex: 1 1 calc(50% - 8px);
    }

    a {
      width: 100%;
      justify-content: center;
      box-sizing: border-box;
    }
  }
}

#spacer {
  height: 88px;
  border-top: 1px solid var(--border);
  @media (max-width: 1024px) {
    height: 48px;
  }
}

.ticks {
  position: relative;
  width: 100%;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -4.5px;
    border: 5px solid transparent;
  }

  &::before {
    left: 0;
    border-left-color: var(--border);
  }
  &::after {
    right: 0;
    border-right-color: var(--border);
  }
}

```

App.jsx:
```
import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import MyNavbar from "./components/MyNavbar";
import Home from "./components/Home";
import Inquilini from "./components/Inquilini";
import Prenota from "./components/Prenota";
import Recensioni from "./components/Recensioni";
import Login from "./components/Login";
import Register from "./components/Register"; // <-- Importa il Register
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
          <Route path="/register" element={isAuth ? <Navigate to="/" /> : <Register setIsAuth={setIsAuth} setUser={setUser} setIsAdmin={setIsAdmin} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
```

index.css:
```
body {
  margin: 0;
  background-color: #f8fafc;
  color: #1e293b;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  min-height: 100vh;
}

/* Stili "Moderni" stile Tailwind che applicheremo ai nostri componenti */
.modern-card {
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  padding: 2rem;
  width: 100%;
  max-width: 450px;
}

.modern-input {
  border-radius: 0.75rem !important;
  border: 1px solid #e2e8f0 !important;
  padding: 0.75rem 1rem !important;
  background-color: #f8fafc !important;
}

.modern-input:focus {
  border-color: #4f46e5 !important;
  box-shadow: 0 0 0 0.2rem rgba(79, 70, 229, 0.15) !important;
}

.btn-indigo {
  background-color: #4f46e5 !important;
  color: white !important;
  border-radius: 0.75rem !important;
  border: none !important;
  font-weight: 700 !important;
  padding: 0.75rem !important;
  transition: all 0.2s !important;
}

.btn-indigo:hover {
  background-color: #4338ca !important;
  transform: translateY(-2px);
}
```

main.jsx:
```
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

dao.mjs:
```
import sqlite3 from 'sqlite3';

function openDb() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database('./casaNostra.sqlite', (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

function closeDb(db) {
  db.close((err) => { if (err) console.error("Errore chiusura database:", err.message); });
}

// ==================== USERS ====================
export const getUserByEmail = (email) =>
  openDb().then(db => new Promise((resolve, reject) => {
    db.get('SELECT * FROM user WHERE email = ?', [email], (err, row) => {
      closeDb(db);
      if (err) return reject(err);
      resolve(row || null);
    });
  }));

export const getUserById = (id) =>
  openDb().then(db => new Promise((resolve, reject) => {
    db.get('SELECT * FROM user WHERE id = ?', [id], (err, row) => {
      closeDb(db);
      if (err) return reject(err);
      resolve(row || null);
    });
  }));

export const addUser = (u) =>
  openDb().then(db => new Promise((resolve, reject) => {
    // Niente più phoneNumber qui!
    const sql = `INSERT INTO user(name, surname, email, password, salt, occupazione, da_quanto_ci_conosci, descrizione_simpatica, avatar_url, role) 
                 VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [u.name, u.surname, u.email, u.password, u.salt, u.occupazione, u.da_quanto_ci_conosci, u.descrizione_simpatica, u.avatar_url, u.role], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.lastID);
    });
  }));

// ==================== PRENOTAZIONI ====================
export const getAllPrenotazioni = () =>
  openDb().then(db => new Promise((resolve, reject) => {
    db.all('SELECT * FROM prenotazioni', (err, rows) => {
      closeDb(db);
      if (err) return reject(err);
      resolve(rows);
    });
  }));

export const addPrenotazione = (p) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'INSERT INTO prenotazioni(user_id, arrivo, partenza, numero_ospiti, nomi_ospiti, orario_arrivo, orario_partenza, stanza, note, status) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.run(sql, [p.user_id, p.arrivo, p.partenza, p.numero_ospiti, p.nomi_ospiti, p.orario_arrivo, p.orario_partenza, p.stanza, p.note, p.status], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.lastID);
    });
  }));

// ==================== RECENSIONI ====================
export const getAllRecensioni = () =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = `
      SELECT r.*, u.name as autore_nome, u.avatar_url as autore_avatar, u.occupazione as autore_occupazione
      FROM recensioni r
      JOIN user u ON r.user_id = u.id
      ORDER BY r.id DESC
    `;
    db.all(sql, (err, rows) => {
      closeDb(db);
      if (err) return reject(err);
      resolve(rows);
    });
  }));

export const addRecensione = (r) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'INSERT INTO recensioni(user_id, titolo, voto, commento) VALUES(?, ?, ?, ?)';
    db.run(sql, [r.user_id, r.titolo, r.voto, r.commento], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.lastID);
    });
  }));

export const updateRispostaAdmin = (id, risposta) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'UPDATE recensioni SET risposta_admin = ? WHERE id = ?';
    db.run(sql, [risposta, id], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.changes);
    });
  }));
```

db_setup.mjs:
```
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { User } from './models.mjs';

const databaseName = 'casaNostra.sqlite';

async function setupDatabase() {
    const db = await open({
        filename: databaseName,
        driver: sqlite3.Database
    });

    console.log("✅ Database connesso");

    // 1. TABELLA UTENTI (Con campi extra per profilo)
    await db.run(`CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        surname TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        salt TEXT NOT NULL,
        occupazione TEXT,
        da_quanto_ci_conosci TEXT,
        descrizione_simpatica TEXT,
        avatar_url TEXT,
        role TEXT NOT NULL DEFAULT 'ospite'
    )`);

    // 2. TABELLA PRENOTAZIONI (Con campi espansi come nel progetto precedente)
    await db.run(`CREATE TABLE IF NOT EXISTS prenotazioni (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        arrivo TEXT NOT NULL,
        partenza TEXT NOT NULL,
        numero_ospiti INTEGER NOT NULL,
        nomi_ospiti TEXT,
        orario_arrivo TEXT,
        orario_partenza TEXT,
        stanza TEXT NOT NULL,
        note TEXT,
        status TEXT NOT NULL DEFAULT 'confermata',
        FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE
    )`);

    // 3. TABELLA RECENSIONI (Con supporto foto)
    await db.run(`CREATE TABLE IF NOT EXISTS recensioni (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        titolo TEXT NOT NULL,
        voto INTEGER NOT NULL,
        commento TEXT NOT NULL,
        foto_url TEXT,
        risposta_admin TEXT,
        FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE
    )`);

    // Inserimento Admin di base
    const adminUser = await User.create(
        "Simone", "Vergine", "admin@admin.com", "admin123", 
        "", "Dev", "Da sempre", "Fondatore super simpatico", "", "admin"
    );
    
    try {
        const sqlInsertUser = await db.prepare(`INSERT INTO user 
            (name, surname, email, password, salt, occupazione, da_quanto_ci_conosci, descrizione_simpatica, avatar_url, role) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        await sqlInsertUser.run(
            adminUser.name, adminUser.surname, adminUser.email, adminUser.password, adminUser.salt, 
            adminUser.occupazione, adminUser.da_quanto_ci_conosci, adminUser.descrizione_simpatica, adminUser.avatar_url, adminUser.role
        );
        await sqlInsertUser.finalize();
        console.log("✅ Admin inserito (admin@admin.com - admin123)");
    } catch (err) {
        console.log("⚠️ Admin già presente.");
    }

    console.log("✅ Setup completato!");
}

setupDatabase().catch(err => console.error("❌ Errore setup:", err));
```

models.mjs:
```
import crypto from 'crypto';

export class User {
    constructor({ id = null, name, surname, email, password_hash, salt, occupazione = '', da_quanto_ci_conosci = '', descrizione_simpatica = '', avatar_url = '', role = 'ospite' }) {
        this.id = id;
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.password = password_hash;
        this.salt = salt;
        this.occupazione = occupazione;
        this.da_quanto_ci_conosci = da_quanto_ci_conosci;
        this.descrizione_simpatica = descrizione_simpatica;
        this.avatar_url = avatar_url;
        this.role = role; 
    }

    static async create(name, surname, email, plainPassword, occupazione, da_quanto_ci_conosci, descrizione_simpatica, avatar_url, role = 'ospite') {
        const salt = crypto.randomBytes(16).toString('hex');
        const password_hash = await new Promise((resolve, reject) => {
            crypto.scrypt(plainPassword, salt, 64, (err, derivedKey) => {
                if (err) reject(err);
                else resolve(derivedKey.toString('hex'));
            });
        });

        return new User({ name, surname, email, password_hash, salt, occupazione, da_quanto_ci_conosci, descrizione_simpatica, avatar_url, role });
    }
}

export class Prenotazione {
    constructor({ id = null, user_id, arrivo, partenza, numero_ospiti, nomi_ospiti = '', orario_arrivo = '', orario_partenza = '', stanza, note = '', status = 'confermata' }) {
        this.id = id;
        this.user_id = user_id;
        this.arrivo = arrivo;
        this.partenza = partenza;
        this.numero_ospiti = numero_ospiti;
        this.nomi_ospiti = nomi_ospiti;
        this.orario_arrivo = orario_arrivo;
        this.orario_partenza = orario_partenza;
        this.stanza = stanza;
        this.note = note;
        this.status = status;
    }
}

export class Recensione {
    constructor({ id = null, user_id, titolo, voto, commento, foto_url = '', risposta_admin = '' }) {
        this.id = id;
        this.user_id = user_id;
        this.titolo = titolo;
        this.voto = voto;
        this.commento = commento;
        this.foto_url = foto_url;
        this.risposta_admin = risposta_admin;
    }
}
```

