import { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Spinner, Tabs, Tab, Button, Form } from 'react-bootstrap';
import { getTier } from '../utils/tierUtils';
import { fetchPrenotazioni, updateProfile } from '../api/API.mjs';

function Profile({ user, setUser }) {
  const [prenotazioni, setPrenotazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    occupazione: user?.occupazione || '',
    da_quanto_ci_conosci: user?.da_quanto_ci_conosci || '',
    descrizione_simpatica: user?.descrizione_simpatica || ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        occupazione: user.occupazione || '',
        da_quanto_ci_conosci: user.da_quanto_ci_conosci || '',
        descrizione_simpatica: user.descrizione_simpatica || ''
      });
    }
    fetchPrenotazioni()
      .then(data => {
        const myRes = data.filter(p => p.user_id === user.id);
        // Ordiniamo dalla più recente
        myRes.sort((a, b) => new Date(b.arrivo) - new Date(a.arrivo));
        setPrenotazioni(myRes);
      })
      .catch(err => console.error("Errore nel fetch delle prenotazioni:", err))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateProfile(formData);
      if (res.success && setUser) {
        setUser(res.user);
        setEditMode(false);
      } else {
        alert("Errore durante l'aggiornamento del profilo");
      }
    } catch (err) {
      console.error(err);
      alert("Errore di rete");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const currentTier = getTier(user.stays_count || 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prenotazioniAttive = prenotazioni.filter(p => new Date(p.arrivo) >= today || new Date(p.partenza) >= today);
  const prenotazioniPassate = prenotazioni.filter(p => new Date(p.arrivo) < today && new Date(p.partenza) < today);

  const renderTable = (lista, emptyMsg) => {
    if (lista.length === 0) {
      return (
        <div className="text-center py-4 text-muted fst-italic">
          {emptyMsg}
        </div>
      );
    }
    return (
      <div className="table-responsive">
        <table className="table table-dark table-hover mb-0 align-middle">
          <thead>
            <tr>
              <th>Data Arrivo</th>
              <th>Data Partenza</th>
              <th>Stanza</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(p => (
              <tr key={p.id}>
                <td>{new Date(p.arrivo).toLocaleDateString()}</td>
                <td>{new Date(p.partenza).toLocaleDateString()}</td>
                <td>{p.stanza}</td>
                <td>
                  <Badge bg={
                    p.status === 'approvata' ? 'success' :
                    p.status === 'rifiutata' ? 'danger' : 'warning'
                  }>
                    {p.status.toUpperCase()}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container py-5 animate-fade-in flex-grow-1">
      <h2 className="fw-bolder mb-5 text-center" style={{ fontSize: '2.5rem', color: '#f1f5f9' }}>Il tuo Profilo Personale</h2>
      
      <Row className="g-4">
        {/* Colonna Sinistra: Avatar & Rank */}
        <Col lg={4}>
          <Card className="modern-card text-center border-0 p-4 h-100 shadow-lg" style={{ backgroundColor: '#1e293b' }}>
            <div className="mb-4">
              <img 
                src={user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80"} 
                alt="Profile"
                className="rounded-circle border border-4 shadow-sm"
                style={{ width: '150px', height: '150px', objectFit: 'cover', borderColor: currentTier.color }}
              />
            </div>
            <h3 className="fw-bolder text-white mb-1">{user.name} {user.surname}</h3>
            <p className="text-muted mb-4">{user.email}</p>
            
            <div className="p-3 rounded mb-4" style={{ backgroundColor: '#0f172a' }}>
              <span className="d-block text-muted small fw-bold mb-1 text-uppercase">Il tuo Grado Attuale</span>
              <div className="d-flex align-items-center justify-content-center gap-2">
                <span style={{ fontSize: '2rem' }}>{currentTier.icon}</span>
                <span className="fw-bolder fs-4" style={{ color: currentTier.color }}>{currentTier.name}</span>
              </div>
            </div>
            
            <div className="d-flex justify-content-around text-center mt-auto">
              <div>
                <h5 className="text-white fw-bold mb-0">{user.stays_count || 0}</h5>
                <span className="text-muted small">Soggiorni</span>
              </div>
              <div>
                <h5 className="text-white fw-bold mb-0">{prenotazioni.length}</h5>
                <span className="text-muted small">Prenotazioni</span>
              </div>
            </div>
          </Card>
        </Col>

        {/* Colonna Destra: Dettagli & Prenotazioni */}
        <Col lg={8}>
          <Card className="modern-card border-0 mb-4 p-4 shadow-lg" style={{ backgroundColor: '#1e293b' }}>
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2" style={{ borderColor: '#334155 !important' }}>
              <h4 className="fw-bold text-white mb-0">Dettagli Registrazione</h4>
              {!editMode ? (
                <Button variant="outline-light" size="sm" onClick={() => setEditMode(true)}>Modifica Profilo</Button>
              ) : (
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" size="sm" onClick={() => setEditMode(false)} disabled={saving}>Annulla</Button>
                  <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>{saving ? '...' : 'Salva'}</Button>
                </div>
              )}
            </div>
            
            {!editMode ? (
              <Row className="g-3">
                <Col md={6}>
                  <div className="p-3 rounded h-100" style={{ backgroundColor: '#0f172a' }}>
                    <small className="text-muted fw-bold d-block mb-1">Occupazione</small>
                    <span className="text-light">{user.occupazione || 'Non specificato'}</span>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="p-3 rounded h-100" style={{ backgroundColor: '#0f172a' }}>
                    <small className="text-muted fw-bold d-block mb-1">Da quanto tempo ci conosci</small>
                    <span className="text-light">{user.da_quanto_ci_conosci || 'Non specificato'}</span>
                  </div>
                </Col>
                <Col md={12}>
                  <div className="p-3 rounded" style={{ backgroundColor: '#0f172a' }}>
                    <small className="text-muted fw-bold d-block mb-1">Descrizione Simpatica</small>
                    <span className="text-light fst-italic">"{user.descrizione_simpatica || 'Nessuna descrizione'}"</span>
                  </div>
                </Col>
              </Row>
            ) : (
              <Form>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-muted fw-bold small">Occupazione</Form.Label>
                      <Form.Control className="modern-input text-light" style={{ backgroundColor: '#0f172a' }} value={formData.occupazione} onChange={e => setFormData({...formData, occupazione: e.target.value})} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-muted fw-bold small">Da quanto tempo ci conosci</Form.Label>
                      <Form.Control className="modern-input text-light" style={{ backgroundColor: '#0f172a' }} value={formData.da_quanto_ci_conosci} onChange={e => setFormData({...formData, da_quanto_ci_conosci: e.target.value})} />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="text-muted fw-bold small">Descrizione Simpatica</Form.Label>
                      <Form.Control as="textarea" rows={3} className="modern-input text-light" style={{ backgroundColor: '#0f172a' }} value={formData.descrizione_simpatica} onChange={e => setFormData({...formData, descrizione_simpatica: e.target.value})} />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            )}
          </Card>

          <Card className="modern-card border-0 p-4 shadow-lg" style={{ backgroundColor: '#1e293b' }}>
            <h4 className="fw-bold text-white mb-4 border-bottom pb-2" style={{ borderColor: '#334155 !important' }}>Le Tue Prenotazioni</h4>
            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : prenotazioni.length === 0 ? (
              <div className="text-center py-4 text-muted fst-italic">
                Non hai ancora effettuato nessuna prenotazione.
              </div>
            ) : (
              <Tabs defaultActiveKey="attive" className="mb-3 custom-tabs">
                <Tab eventKey="attive" title={`In Attivo (${prenotazioniAttive.length})`}>
                  {renderTable(prenotazioniAttive, "Non hai prenotazioni in corso o future.")}
                </Tab>
                <Tab eventKey="passate" title={`Storico Passato (${prenotazioniPassate.length})`}>
                  {renderTable(prenotazioniPassate, "Non ci sono prenotazioni passate nel tuo storico.")}
                </Tab>
              </Tabs>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Profile;
