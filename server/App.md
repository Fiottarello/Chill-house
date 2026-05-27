App.jsx:
```
import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css'; // Assicurati di avere questo file con gli stili moderni

// Importa tutti i componenti
import MyNavbar from "./components/MyNavbar";
import Home from "./Home";
import Inquilini from "./Inquilini";
import Prenota from "./Prenota";
import Recensioni from "./Recensioni";
import Login from "./Login";
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

  // Stati del form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [occupazione, setOccupazione] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        const user = await loginHandler(email, password);
        setIsAuth(true);
        setUser(user);
        setIsAdmin(user.role === 'admin');
        navigate("/");
      } else {
        const userData = { name, surname, email, password, phoneNumber, occupazione };
        const user = await registerHandler(userData);
        setIsAuth(true);
        setUser(user);
        setIsAdmin(user.role === 'admin');
        navigate("/");
      }
    } catch (err) {
      setErrorMsg(err.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center flex-grow-1 py-5">
      <div className="modern-card animate-fade-in mx-3">
        <div className="text-center mb-4">
          <h2 style={{ color: '#4f46e5', fontWeight: 900 }}>CASA NOSTRA 🏠</h2>
          <h4 className="fw-bold mt-2">{isLogin ? 'Bentornato a casa!' : 'Unisciti alla ciurma'}</h4>
          <p className="text-muted small">
            {isLogin ? 'Inserisci le tue credenziali.' : 'Compila i dati per registrarti.'}
          </p>
        </div>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase">Email</Form.Label>
            <Form.Control type="email" className="modern-input" required value={email} onChange={e => setEmail(e.target.value)} />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase">Password</Form.Label>
            <Form.Control type="password" className="modern-input" required value={password} onChange={e => setPassword(e.target.value)} />
          </Form.Group>

          {!isLogin && (
            <div className="border-top pt-3 mt-3">
              <div className="d-flex gap-2 mb-3">
                <Form.Group className="w-50">
                  <Form.Label className="small fw-bold text-muted text-uppercase">Nome</Form.Label>
                  <Form.Control type="text" className="modern-input" required value={name} onChange={e => setName(e.target.value)} />
                </Form.Group>
                <Form.Group className="w-50">
                  <Form.Label className="small fw-bold text-muted text-uppercase">Cognome</Form.Label>
                  <Form.Control type="text" className="modern-input" required value={surname} onChange={e => setSurname(e.target.value)} />
                </Form.Group>
              </div>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted text-uppercase">Telefono</Form.Label>
                <Form.Control type="text" className="modern-input" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted text-uppercase">Occupazione</Form.Label>
                <Form.Control type="text" className="modern-input" placeholder="Es: Studio ingegneria..." value={occupazione} onChange={e => setOccupazione(e.target.value)} />
              </Form.Group>
            </div>
          )}

          {errorMsg && <div className="alert alert-danger small py-2 text-center">{errorMsg}</div>}

          <Button type="submit" className="w-100 btn-indigo mt-2" disabled={loading}>
            {loading ? 'Caricamento...' : (isLogin ? 'Accedi 🚀' : 'Crea Profilo ✨')}
          </Button>
        </Form>

        <div className="text-center mt-4">
          <Button variant="link" className="text-muted fw-bold text-decoration-none small" onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}>
            {isLogin ? "Non hai le chiavi? Registrati qui." : "Hai già un profilo? Accedi."}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Login;
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

export const addUser = (user) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'INSERT INTO user(name, surname, email, password, salt, phoneNumber, occupazione, legame, avatar_url, role) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.run(sql, [user.name, user.surname, user.email, user.password, user.salt, user.phoneNumber, user.occupazione, user.legame, user.avatar_url, user.role], function (err) {
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
    const sql = 'INSERT INTO prenotazioni(user_id, arrivo, partenza, numero_ospiti, stanza, note, status) VALUES(?, ?, ?, ?, ?, ?, ?)';
    db.run(sql, [p.user_id, p.arrivo, p.partenza, p.numero_ospiti, p.stanza, p.note, p.status], function (err) {
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

    await db.run(`CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        surname TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        salt TEXT NOT NULL,
        phoneNumber TEXT,
        occupazione TEXT,
        legame TEXT,
        avatar_url TEXT,
        role TEXT NOT NULL DEFAULT 'ospite'
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS prenotazioni (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        arrivo TEXT NOT NULL,
        partenza TEXT NOT NULL,
        numero_ospiti INTEGER NOT NULL,
        stanza TEXT NOT NULL,
        note TEXT,
        status TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS recensioni (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        titolo TEXT NOT NULL,
        voto INTEGER NOT NULL,
        commento TEXT NOT NULL,
        risposta_admin TEXT,
        FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE
    )`);

    // Inserimento Admin di base
    const adminUser = await User.create("Simone", "Vergine", "admin@admin.com", "admin123", "3330000000", "Dev", "Founder", "", "admin");
    
    try {
        const sqlInsertUser = await db.prepare("INSERT INTO user (name, surname, email, password, salt, phoneNumber, occupazione, legame, avatar_url, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        await sqlInsertUser.run(adminUser.name, adminUser.surname, adminUser.email, adminUser.password, adminUser.salt, adminUser.phoneNumber, adminUser.occupazione, adminUser.legame, adminUser.avatar_url, adminUser.role);
        await sqlInsertUser.finalize();
        console.log("✅ Admin inserito con successo (Email: admin@admin.com - Pass: admin123)");
    } catch (err) {
        console.log("⚠️ Admin già presente nel database.");
    }

    console.log("✅ Setup completato!");
}

setupDatabase().catch(err => console.error("❌ Errore setup:", err));
```

models.mjs:
```
import crypto from 'crypto';

export class User {
    constructor({ id = null, name, surname, email, password_hash, salt, phoneNumber, occupazione = '', legame = '', avatar_url = '', role = 'ospite' }) {
        this.id = id;
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.password = password_hash;
        this.salt = salt;
        this.phoneNumber = phoneNumber;
        this.occupazione = occupazione;
        this.legame = legame;
        this.avatar_url = avatar_url;
        this.role = role; 
    }

    static async create(name, surname, email, plainPassword, phoneNumber, occupazione, legame, avatar_url, role = 'ospite') {
        const salt = crypto.randomBytes(16).toString('hex');
        const password_hash = await new Promise((resolve, reject) => {
            crypto.scrypt(plainPassword, salt, 64, (err, derivedKey) => {
                if (err) reject(err);
                else resolve(derivedKey.toString('hex'));
            });
        });

        return new User({ name, surname, email, password_hash, salt, phoneNumber, occupazione, legame, avatar_url, role });
    }
}

export class Prenotazione {
    constructor({ id = null, user_id, arrivo, partenza, numero_ospiti, stanza, note = '', status = 'confermata' }) {
        this.id = id;
        this.user_id = user_id;
        this.arrivo = arrivo;
        this.partenza = partenza;
        this.numero_ospiti = numero_ospiti;
        this.stanza = stanza;
        this.note = note;
        this.status = status;
    }
}

export class Recensione {
    constructor({ id = null, user_id, titolo, voto, commento, risposta_admin = '' }) {
        this.id = id;
        this.user_id = user_id;
        this.titolo = titolo;
        this.voto = voto;
        this.commento = commento;
        this.risposta_admin = risposta_admin;
    }
}
```

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
      return res.json({ success: true, user: { id: user.id, name: user.name, surname: user.surname, email: user.email, role: user.role, avatar_url: user.avatar_url } });
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
    const { name, surname, email, password, phoneNumber, occupazione, legame, avatar_url } = req.body;
    if (await dao.getUserByEmail(email)) return res.json({ success: false, errorMsg: 'Email già in uso' });

    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await hashPassword(password, salt);

    const newUserId = await dao.addUser({
      name, surname, email, password: hashedPassword, salt, phoneNumber, 
      occupazione: occupazione || 'Amico', legame: legame || 'Nessuno', 
      avatar_url: avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      role: 'ospite'
    });

    const newUser = await dao.getUserById(newUserId);
    req.login(newUser, (err) => {
      if (err) return res.json({ success: false, errorMsg: 'Errore login' });
      return res.json({ success: true, user: newUser });
    });
  } catch (err) { res.json({ success: false, errorMsg: 'Errore interno' }); }
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
    const { arrivo, partenza, numero_ospiti, stanza, note } = req.body;
    await dao.addPrenotazione({ user_id: req.user.id, arrivo, partenza, numero_ospiti, stanza, note, status: 'confermata' });
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

