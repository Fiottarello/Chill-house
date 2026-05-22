// La magia di Vite: se siamo online userà l'URL del cloud, se siamo in locale userà localhost
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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