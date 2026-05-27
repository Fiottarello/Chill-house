import { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { 
  fetchAllUsers, updateUserAdmin, deleteUser,
  fetchPrenotazioni, updatePrenotazioneAdmin, deletePrenotazioneAdmin, 
  fetchSondaggi, createSondaggio, closeSondaggio, deleteSondaggioAdmin,
  fetchChatMessagesAdmin, deleteChatMessageAdmin,
  fetchRecensioni, deleteRecensioneAdmin,
  fetchSchedine, deleteSchedinaAdmin
} from '../api/API.mjs';
import { getTier } from '../utils/tierUtils';

function AdminPanel({ isAdmin }) {
  const [users, setUsers] = useState([]);
  const [prenotazioni, setPrenotazioni] = useState([]);
  const [sondaggi, setSondaggi] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [recensioni, setRecensioni] = useState([]);
  const [schedine, setSchedine] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form nuovo sondaggio
  const [newDomanda, setNewDomanda] = useState('');
  const [newOpzioni, setNewOpzioni] = useState(['', '']);

  // Stati per Modali
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [showPrenotazioneModal, setShowPrenotazioneModal] = useState(false);
  const [editPrenotazione, setEditPrenotazione] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, p, s, c, r, sch] = await Promise.allSettled([
        fetchAllUsers(),
        fetchPrenotazioni(),
        fetchSondaggi(),
        fetchChatMessagesAdmin(),
        fetchRecensioni(),
        fetchSchedine()
      ]);

      setUsers(u.status === 'fulfilled' ? u.value || [] : []);
      setPrenotazioni(p.status === 'fulfilled' ? p.value || [] : []);
      setSondaggi(s.status === 'fulfilled' ? s.value || [] : []);
      setChatMessages(c.status === 'fulfilled' ? c.value || [] : []);
      setRecensioni(r.status === 'fulfilled' ? r.value || [] : []);
      setSchedine(sch.status === 'fulfilled' ? sch.value || [] : []);
    } catch (err) {
      console.error("Errore generico nel caricamento:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="container py-5 text-center flex-grow-1">
        <h1 className="text-danger fw-bold">ACCESSO NEGATO ⛔</h1>
        <p className="text-white">Non hai i permessi per visualizzare questa pagina.</p>
      </div>
    );
  }

  // --- GESTIONE UTENTI ---
  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      await updateUserAdmin(editUser.id, editUser);
      setShowUserModal(false);
      loadData();
    } catch (err) { alert("Errore salvataggio utente"); }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare definitivamente questo utente e tutti i suoi dati? Questa azione è irreversibile.")) {
      try {
        await deleteUser(id);
        loadData();
      } catch (err) { alert("Errore durante l'eliminazione dell'utente"); }
    }
  };

  // --- GESTIONE PRENOTAZIONI ---
  const handleSavePrenotazione = async (e) => {
    e.preventDefault();
    try {
      await updatePrenotazioneAdmin(editPrenotazione.id, editPrenotazione);
      setShowPrenotazioneModal(false);
      loadData();
    } catch (err) { alert("Errore salvataggio prenotazione"); }
  };

  const handleDeletePrenotazione = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questa prenotazione in modo definitivo?")) {
      try {
        await deletePrenotazioneAdmin(id);
        loadData();
      } catch (err) { alert("Errore eliminazione"); }
    }
  };

  // --- GESTIONE CHAT ---
  const handleDeleteChat = async (id) => {
    if (window.confirm("Eliminare definitivamente questo messaggio?")) {
      try {
        await deleteChatMessageAdmin(id);
        loadData();
      } catch (err) { alert("Errore eliminazione messaggio"); }
    }
  };

  // --- GESTIONE RECENSIONI ---
  const handleDeleteRecensione = async (id) => {
    if (window.confirm("Eliminare definitivamente questa recensione?")) {
      try {
        await deleteRecensioneAdmin(id);
        loadData();
      } catch (err) { alert("Errore eliminazione recensione"); }
    }
  };

  // --- GESTIONE SCHEDINE ---
  const handleDeleteSchedina = async (id) => {
    if (window.confirm("Eliminare definitivamente questa schedina?")) {
      try {
        await deleteSchedinaAdmin(id);
        loadData();
      } catch (err) { alert("Errore eliminazione schedina"); }
    }
  };

  // --- GESTIONE SONDAGGI ---
  const handleAddOpzione = () => setNewOpzioni([...newOpzioni, '']);
  const handleRemoveOpzione = (idx) => {
    if (newOpzioni.length <= 2) return;
    setNewOpzioni(newOpzioni.filter((_, i) => i !== idx));
  };
  const handleChangeOpzione = (idx, val) => {
    const copy = [...newOpzioni];
    copy[idx] = val;
    setNewOpzioni(copy);
  };
  const handleCreateSondaggio = async (e) => {
    e.preventDefault();
    const validOpzioni = newOpzioni.filter(o => o.trim() !== '');
    if (validOpzioni.length < 2) { alert("Inserisci almeno 2 opzioni valide!"); return; }
    try {
      await createSondaggio(newDomanda, validOpzioni);
      setNewDomanda('');
      setNewOpzioni(['', '']);
      loadData();
    } catch (err) { alert("Errore creazione sondaggio"); }
  };
  const handleCloseSondaggio = async (id) => {
    if (window.confirm("Vuoi terminare questo sondaggio?")) {
      try {
        await closeSondaggio(id);
        loadData();
      } catch (err) { alert("Errore chiusura sondaggio"); }
    }
  };
  const handleDeleteSondaggio = async (id) => {
    if (window.confirm("Vuoi ELIMINARE DEFINITIVAMENTE questo sondaggio?")) {
      try {
        await deleteSondaggioAdmin(id);
        loadData();
      } catch (err) { alert("Errore eliminazione sondaggio"); }
    }
  };

  return (
    <div className="container-fluid py-4 px-lg-5 animate-fade-in flex-grow-1 w-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bolder mb-0 text-white">👑 Pannello di Controllo Admin</h2>
          <p className="text-muted mb-0">Gestisci utenti, soggiorni e prenotazioni.</p>
        </div>
        <Button variant="outline-light" onClick={loadData}>🔄 Aggiorna Dati</Button>
      </div>

      {loading ? (
        <div className="text-center text-white mt-5">Caricamento dati...</div>
      ) : (
        <Card className="modern-card p-0 overflow-hidden w-100" style={{ backgroundColor: '#0f172a', maxWidth: 'none' }}>
          <Tabs defaultActiveKey="users" className="mb-3 custom-tabs p-3 pb-0" variant="pills">
            
            {/* TAB UTENTI */}
            <Tab eventKey="users" title="👥 Gestione Utenti">
              <div className="table-responsive p-3">
                <Table variant="dark" hover className="align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Soggiorni</th>
                      <th>Grado</th>
                      <th>Ruolo</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="text-muted">#{u.id}</td>
                        <td className="fw-bold">{u.name} {u.surname}</td>
                        <td>{u.email}</td>
                        <td className="text-center fw-bold text-info fs-5">{u.stays_count || 0}</td>
                        <td>
                          <Badge bg="dark" style={{ border: `1px solid ${getTier(u.stays_count || 0).color}`, color: getTier(u.stays_count || 0).color }}>
                            {getTier(u.stays_count || 0).icon} {getTier(u.stays_count || 0).name}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={u.role === 'admin' ? 'danger' : 'secondary'}>{u.role}</Badge>
                        </td>
                          <td>
                            <Button variant="outline-info" size="sm" onClick={() => { setEditUser(u); setShowUserModal(true); }} className="me-2">
                              Modifica
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteUser(u.id)}>
                              Elimina
                            </Button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Tab>

            {/* TAB PRENOTAZIONI */}
            <Tab eventKey="prenotazioni" title="📅 Gestione Prenotazioni">
              <div className="table-responsive p-3">
                <Table variant="dark" hover className="align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Ospiti (Nomi e Stanze)</th>
                      <th>Arrivo</th>
                      <th>Partenza</th>
                      <th>Status</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prenotazioni.map(p => (
                      <tr key={p.id}>
                        <td className="text-muted">#{p.id}</td>
                        <td>
                          <div className="small fw-bold text-info">N. Ospiti: {p.numero_ospiti}</div>
                          <div className="text-white">{p.nomi_ospiti}</div>
                          <div className="small text-muted">Stanza base: {p.stanza}</div>
                        </td>
                        <td>{new Date(p.arrivo).toLocaleDateString()} <br/><small className="text-muted">{p.orario_arrivo}</small></td>
                        <td>{new Date(p.partenza).toLocaleDateString()} <br/><small className="text-muted">{p.orario_partenza}</small></td>
                        <td>
                          <Badge bg={p.status === 'confermata' ? 'success' : p.status === 'cancellata' ? 'danger' : 'warning'}>
                            {p.status}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button size="sm" className="btn-indigo" onClick={() => { setEditPrenotazione(p); setShowPrenotazioneModal(true); }}>
                              Modifica
                            </Button>
                            <Button size="sm" variant="outline-danger" onClick={() => handleDeletePrenotazione(p.id)}>
                              Elimina
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Tab>

            {/* TAB CHAT */}
            <Tab eventKey="chat" title="💬 Gestione Chat">
              <div className="table-responsive p-3">
                <Table variant="dark" hover className="align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Data/Ora</th>
                      <th>Utente</th>
                      <th>Testo</th>
                      <th>Allegato</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chatMessages.map(c => (
                      <tr key={c.id}>
                        <td className="text-muted">#{c.id}</td>
                        <td className="small">{new Date(c.timestamp).toLocaleString()}</td>
                        <td className="fw-bold">{c.autore_nome}</td>
                        <td>{c.testo || '-'}</td>
                        <td>{c.immagine_b64 ? <Badge bg="info" text="dark">Sì</Badge> : '-'}</td>
                        <td>
                          <Button size="sm" variant="outline-danger" onClick={() => handleDeleteChat(c.id)}>Elimina</Button>
                        </td>
                      </tr>
                    ))}
                    {chatMessages.length === 0 && <tr><td colSpan="6" className="text-center text-muted">Nessun messaggio</td></tr>}
                  </tbody>
                </Table>
              </div>
            </Tab>

            {/* TAB RECENSIONI */}
            <Tab eventKey="recensioni" title="🌟 Gestione Recensioni">
              <div className="table-responsive p-3">
                <Table variant="dark" hover className="align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Titolo / Voto</th>
                      <th>Commento</th>
                      <th>Risposta Admin</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recensioni.map(r => (
                      <tr key={r.id}>
                        <td className="text-muted">#{r.id}</td>
                        <td>
                          <div className="fw-bold">{r.titolo}</div>
                          <div className="text-warning">{'⭐'.repeat(r.voto)}</div>
                        </td>
                        <td className="small text-white">{r.commento}</td>
                        <td className="small text-info">{r.risposta_admin || '-'}</td>
                        <td>
                          <Button size="sm" variant="outline-danger" onClick={() => handleDeleteRecensione(r.id)}>Elimina</Button>
                        </td>
                      </tr>
                    ))}
                    {recensioni.length === 0 && <tr><td colSpan="5" className="text-center text-muted">Nessuna recensione</td></tr>}
                  </tbody>
                </Table>
              </div>
            </Tab>

            {/* TAB TIPSTER & SONDAGGI */}
            <Tab eventKey="sondaggi" title="📊 Tipster & Sondaggi">
              <Row className="p-3 g-4">
                <Col md={5}>
                  <Card className="bg-transparent border-secondary p-3">
                    <h5 className="fw-bold text-white mb-3">Crea Nuovo Sondaggio</h5>
                    <Form onSubmit={handleCreateSondaggio}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-muted">Domanda del Sondaggio</Form.Label>
                        <Form.Control required placeholder="Es. Juve - Milan chi vince?" value={newDomanda} onChange={e => setNewDomanda(e.target.value)} />
                      </Form.Group>
                      <Form.Label className="small text-muted">Opzioni</Form.Label>
                      {newOpzioni.map((opt, idx) => (
                        <div key={idx} className="d-flex gap-2 mb-2">
                          <Form.Control required placeholder={`Opzione ${idx + 1}`} value={opt} onChange={e => handleChangeOpzione(idx, e.target.value)} />
                          {newOpzioni.length > 2 && (
                            <Button variant="outline-danger" onClick={() => handleRemoveOpzione(idx)}>X</Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline-info" size="sm" onClick={handleAddOpzione} className="mb-3">+ Aggiungi Opzione</Button>
                      <Button type="submit" className="btn-indigo w-100">Pubblica Sondaggio</Button>
                    </Form>
                  </Card>
                </Col>
                <Col md={7}>
                  <h5 className="fw-bold text-white mb-3">Sondaggi Esistenti</h5>
                  <div className="table-responsive">
                    <Table variant="dark" hover className="align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                      <thead>
                        <tr>
                          <th>Domanda</th>
                          <th>Opzioni</th>
                          <th>Voti Totali</th>
                          <th>Stato</th>
                          <th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sondaggi.map(s => {
                          const opzioni = JSON.parse(s.opzioni_json);
                          return (
                            <tr key={s.id}>
                              <td className="fw-bold text-white">{s.domanda}</td>
                              <td className="text-muted small">{opzioni.join(', ')}</td>
                              <td><Badge bg="info" text="dark">{s.voti.length} voti</Badge></td>
                              <td>
                                <Badge bg={s.is_active ? 'success' : 'secondary'}>
                                  {s.is_active ? 'Attivo' : 'Terminato'}
                                </Badge>
                              </td>
                              <td>
                                <div className="d-flex gap-2">
                                  {s.is_active === 1 && (
                                    <Button size="sm" variant="outline-warning" onClick={() => handleCloseSondaggio(s.id)}>Termina</Button>
                                  )}
                                  <Button size="sm" variant="outline-danger" onClick={() => handleDeleteSondaggio(s.id)}>Elimina</Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {sondaggi.length === 0 && <tr><td colSpan="5" className="text-center text-muted">Nessun sondaggio creato</td></tr>}
                      </tbody>
                    </Table>
                  </div>
                </Col>
              </Row>

              {/* LISTA SCHEDINE IN BASSO */}
              <Row className="p-3">
                <Col>
                  <h5 className="fw-bold text-white mb-3">Schedine Postate</h5>
                  <div className="table-responsive">
                    <Table variant="dark" hover className="align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Utente</th>
                          <th>Titolo</th>
                          <th>Importo</th>
                          <th>Gufi</th>
                          <th>Stato</th>
                          <th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedine.map(sc => (
                          <tr key={sc.id}>
                            <td className="text-muted">#{sc.id}</td>
                            <td className="fw-bold">{sc.autore_nome}</td>
                            <td>{sc.titolo}</td>
                            <td className="text-warning fw-bold">€{sc.importo}</td>
                            <td><Badge bg="secondary">🦉 {sc.gufi_count}</Badge></td>
                            <td>
                              <Badge bg={sc.status === 'vinta' ? 'success' : sc.status === 'persa' ? 'danger' : 'warning'}>
                                {sc.status}
                              </Badge>
                            </td>
                            <td>
                              <Button size="sm" variant="outline-danger" onClick={() => handleDeleteSchedina(sc.id)}>Elimina</Button>
                            </td>
                          </tr>
                        ))}
                        {schedine.length === 0 && <tr><td colSpan="7" className="text-center text-muted">Nessuna schedina postata</td></tr>}
                      </tbody>
                    </Table>
                  </div>
                </Col>
              </Row>
            </Tab>

          </Tabs>
        </Card>
      )}

      {/* --- MODALE MODIFICA UTENTE --- */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} data-bs-theme="dark" contentClassName="bg-dark text-white">
        <Modal.Header closeButton className="border-secondary">
          <Modal.Title>Modifica Utente: {editUser?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editUser && (
            <Form id="editUserForm" onSubmit={handleSaveUser}>
              <Row className="mb-3">
                <Col><Form.Label className="small text-muted">Nome</Form.Label><Form.Control value={editUser.name} onChange={e => setEditUser({...editUser, name: e.target.value})} /></Col>
                <Col><Form.Label className="small text-muted">Cognome</Form.Label><Form.Control value={editUser.surname} onChange={e => setEditUser({...editUser, surname: e.target.value})} /></Col>
              </Row>
              <Row className="mb-3">
                <Col>
                  <Form.Label className="small text-muted fw-bold text-info">Soggiorni Completati (Modifica per cambiare Grado)</Form.Label>
                  <Form.Control type="number" className="fw-bold fs-5 text-warning" min="0" value={editUser.stays_count || 0} onChange={e => setEditUser({...editUser, stays_count: parseInt(e.target.value) || 0})} />
                </Col>
                <Col>
                  <Form.Label className="small text-muted">Ruolo</Form.Label>
                  <Form.Select value={editUser.role} onChange={e => setEditUser({...editUser, role: e.target.value})}>
                    <option value="ospite">Ospite</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted fw-bold text-info">Di cosa ti occupi? (Sottotitolo nelle Recensioni)</Form.Label>
                <Form.Control type="text" className="modern-input" value={editUser.occupazione || ''} onChange={e => setEditUser({...editUser, occupazione: e.target.value})} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted">Descrizione / Titolo Simpatico</Form.Label>
                <Form.Control as="textarea" rows={2} value={editUser.descrizione_simpatica || ''} onChange={e => setEditUser({...editUser, descrizione_simpatica: e.target.value})} />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="border-secondary">
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>Annulla</Button>
          <Button form="editUserForm" type="submit" className="btn-indigo">Salva Modifiche</Button>
        </Modal.Footer>
      </Modal>

      {/* --- MODALE MODIFICA PRENOTAZIONE --- */}
      <Modal show={showPrenotazioneModal} onHide={() => setShowPrenotazioneModal(false)} size="lg" data-bs-theme="dark" contentClassName="bg-dark text-white">
        <Modal.Header closeButton className="border-secondary">
          <Modal.Title>Modifica Prenotazione #{editPrenotazione?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editPrenotazione && (
            <Form id="editPrenotazioneForm" onSubmit={handleSavePrenotazione}>
              
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Label className="small text-muted">Status</Form.Label>
                  <Form.Select className="fw-bold" value={editPrenotazione.status} onChange={e => setEditPrenotazione({...editPrenotazione, status: e.target.value})}>
                    <option value="confermata">Confermata</option>
                    <option value="completata">Completata</option>
                    <option value="cancellata">Cancellata</option>
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label className="small text-muted">Arrivo (YYYY-MM-DD)</Form.Label>
                  <Form.Control type="date" value={editPrenotazione.arrivo} onChange={e => setEditPrenotazione({...editPrenotazione, arrivo: e.target.value})} />
                </Col>
                <Col md={4}>
                  <Form.Label className="small text-muted">Partenza (YYYY-MM-DD)</Form.Label>
                  <Form.Control type="date" value={editPrenotazione.partenza} onChange={e => setEditPrenotazione({...editPrenotazione, partenza: e.target.value})} />
                </Col>
              </Row>

              <Form.Group className="mb-4">
                <Form.Label className="small text-info fw-bold">Lista Ospiti e Posti Letto Assegnati</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  className="font-monospace text-warning"
                  value={editPrenotazione.nomi_ospiti} 
                  onChange={e => setEditPrenotazione({...editPrenotazione, nomi_ospiti: e.target.value})} 
                  placeholder="Es. Mario: Divano comodissimo, Luigi: Stanza Simone"
                />
                <Form.Text className="text-muted">
                  Puoi modificare liberamente questo testo. È quello che appare come riassunto della prenotazione. Se sposti qualcuno di stanza, scrivilo qui!
                </Form.Text>
              </Form.Group>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Label className="small text-muted">Categoria Stanza Principale</Form.Label>
                  <Form.Select value={editPrenotazione.stanza} onChange={e => setEditPrenotazione({...editPrenotazione, stanza: e.target.value})}>
                    <option value="Multiple">Multiple (Ospiti in stanze diverse)</option>
                    <option value="Stanza Matrimoniale con Samuele">Stanza Matrimoniale con Samuele</option>
                    <option value="Stanza Simone">Stanza Simone</option>
                    <option value="Brandina">Brandina</option>
                    <option value="Divano comodissimo">Divano comodissimo</option>
                    <option value="Tavolo">Tavolo</option>
                  </Form.Select>
                </Col>
                <Col md={6}>
                  <Form.Label className="small text-muted">Numero Ospiti (Totale)</Form.Label>
                  <Form.Control type="number" min="1" value={editPrenotazione.numero_ospiti} onChange={e => setEditPrenotazione({...editPrenotazione, numero_ospiti: parseInt(e.target.value) || 1})} />
                </Col>
              </Row>

            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="border-secondary">
          <Button variant="secondary" onClick={() => setShowPrenotazioneModal(false)}>Annulla</Button>
          <Button form="editPrenotazioneForm" type="submit" className="btn-indigo">Salva Prenotazione</Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}

export default AdminPanel;
