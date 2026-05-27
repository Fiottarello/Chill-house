// La magia di Vite: se siamo online userà l'URL del cloud, se siamo in locale userà localhost
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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

export const completeTutorial = () =>
  fetch(`${API_BASE}/user/tutorial`, { method: 'PUT', credentials: 'include' })
    .then(res => res.json());

// ========== PRENOTAZIONI ==========
export const fetchPrenotazioni = () =>
  fetch(`${API_BASE}/prenotazioni`, { method: 'GET', credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data.success) return data.prenotazioni;
      else throw "Errore caricamento prenotazioni";
    });

export const fetchMyPrenotazioni = () =>
  fetch(`${API_BASE}/user/prenotazioni`, { method: 'GET', credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data.success) return data.prenotazioni;
      else throw "Errore caricamento tue prenotazioni";
    });

export const fetchPublicProfile = (id) =>
  fetch(`${API_BASE}/public/user/${id}`, { method: 'GET', credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data.success) return data.user;
      else throw "Profilo non trovato";
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

export const submitRecensione = (formData) =>
  fetch(`${API_BASE}/recensioni`, {
    method: 'POST',
    credentials: 'include',
    body: formData
  }).then(res => res.json());

export const rispondiRecensione = (id, risposta_admin) =>
  fetch(`${API_BASE}/recensioni/${id}/rispondi`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ risposta_admin })
  }).then(res => res.json());

// ========== ADMIN ==========
export const fetchAllUsers = () =>
  fetch(`${API_BASE}/admin/users`, { method: 'GET', credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data.success) return data.users;
      else throw 'Errore fetching users';
    });

export const updateUserAdmin = (id, userParams) =>
  fetch(`${API_BASE}/admin/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(userParams)
  }).then(res => res.json());

export const deleteUser = (id) =>
  fetch(`${API_BASE}/admin/users/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  }).then(res => res.json());

export const updatePrenotazioneAdmin = (id, prenotazioneData) =>
  fetch(`${API_BASE}/admin/prenotazioni/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(prenotazioneData)
  }).then(res => res.json());

export const deletePrenotazioneAdmin = (id) =>
  fetch(`${API_BASE}/admin/prenotazioni/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  }).then(res => res.json());

export const fetchChatMessagesAdmin = () =>
  fetch(`${API_BASE}/admin/chat`, { method: 'GET', credentials: 'include' })
    .then(res => res.json())
    .then(data => data.success ? data.messages : []);

export const deleteChatMessageAdmin = (id) =>
  fetch(`${API_BASE}/admin/chat/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  }).then(res => res.json());

export const deleteRecensioneAdmin = (id) =>
  fetch(`${API_BASE}/admin/recensioni/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  }).then(res => res.json());

export const deleteSchedinaAdmin = (id) =>
  fetch(`${API_BASE}/admin/schedine/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  }).then(res => res.json());

export const deleteSondaggioAdmin = (id) =>
  fetch(`${API_BASE}/admin/sondaggi/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  }).then(res => res.json());

// ========== TIPSTER & SCHEDINE ==========
export const fetchSchedine = () =>
  fetch(`${API_BASE}/schedine`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => data.success ? data.schedine : []);

export const submitSchedina = (formData) =>
  fetch(`${API_BASE}/schedine`, {
    method: 'POST',
    credentials: 'include',
    body: formData
  }).then(res => res.json());

export const updateSchedinaStatus = (id, status) =>
  fetch(`${API_BASE}/schedine/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status })
  }).then(res => res.json());

export const gufoSchedina = (id) =>
  fetch(`${API_BASE}/schedine/${id}/gufo`, {
    method: 'POST',
    credentials: 'include'
  }).then(res => res.json());

export const fetchBenefattori = () =>
  fetch(`${API_BASE}/benefattori`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => data.success ? data.benefattori : []);

// ========== SONDAGGI ==========
export const fetchSondaggi = () =>
  fetch(`${API_BASE}/sondaggi`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => data.success ? data.sondaggi : []);

export const createSondaggio = (domanda, opzioni) =>
  fetch(`${API_BASE}/sondaggi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ domanda, opzioni })
  }).then(res => res.json());

export const votaSondaggio = (id, opzioneIndex) =>
  fetch(`${API_BASE}/sondaggi/${id}/vota`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ opzioneIndex })
  }).then(res => res.json());

export const closeSondaggio = (id) =>
  fetch(`${API_BASE}/sondaggi/${id}/close`, {
    method: 'PUT',
    credentials: 'include'
  }).then(res => res.json());

// ==================== SLOT MACHINE ====================
export const applyCurse = () =>
  fetch(`${API_BASE}/slot/curse`, {
    method: 'POST',
    credentials: 'include'
  }).then(res => res.json());