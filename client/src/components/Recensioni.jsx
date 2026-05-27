import { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Modal, Card, Spinner } from 'react-bootstrap';
import { fetchRecensioni, submitRecensione, rispondiRecensione, fetchPublicProfile } from '../api/API.mjs';
import { getTier } from '../utils/tierUtils';

function Recensioni({ user, isAuth, isAdmin }) {
  const [listaRecensioni, setListaRecensioni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nuovoTitolo, setNuovoTitolo] = useState('');
  const [nuovoVoto, setNuovoVoto] = useState(5);
  const [nuovoCommento, setNuovoCommento] = useState('');
  const [nuovaFoto, setNuovaFoto] = useState(null);
  const [risposte, setRisposte] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  
  const [showPublicModal, setShowPublicModal] = useState(false);
  const [publicProfile, setPublicProfile] = useState(null);
  const [publicProfileLoading, setPublicProfileLoading] = useState(false);

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
      const formData = new FormData();
      formData.append('titolo', nuovoTitolo);
      formData.append('voto', nuovoVoto);
      formData.append('commento', nuovoCommento);
      if (nuovaFoto) {
        formData.append('foto', nuovaFoto);
      }
      await submitRecensione(formData);
      setNuovoTitolo(''); setNuovoCommento(''); setNuovoVoto(5); setNuovaFoto(null);
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

  const handleAvatarClick = async (userId) => {
    if (!isAuth) {
      alert("Devi essere loggato per vedere i profili.");
      return;
    }
    setShowPublicModal(true);
    setPublicProfileLoading(true);
    try {
      const data = await fetchPublicProfile(userId);
      setPublicProfile(data);
    } catch (err) {
      alert("Errore caricamento profilo");
      setShowPublicModal(false);
    } finally {
      setPublicProfileLoading(false);
    }
  };

  const renderStelle = (voto) => "★★★★★☆☆☆☆☆".substring(5 - voto, 10 - voto);

  // --- CALCOLO STATISTICHE ---
  const totaleRecensioni = listaRecensioni.length;
  const mediaVoti = totaleRecensioni > 0 
    ? (listaRecensioni.reduce((acc, rec) => acc + rec.voto, 0) / totaleRecensioni).toFixed(1) 
    : 0;

  const calcolaPercentuale = (voto) => {
    if (totaleRecensioni === 0) return 0;
    const count = listaRecensioni.filter(rec => rec.voto === voto).length;
    return Math.round((count / totaleRecensioni) * 100);
  };

  return (
    <div className="container py-4 flex-grow-1 animate-fade-in">
      <div className="text-center mb-5">
        <h2 className="fw-bolder" style={{ fontSize: '2.5rem', color: '#f1f5f9' }}>Feedback degli Ospiti 💬</h2>
        <p className="text-muted">Cosa dicono di noi?</p>
      </div>

      {/* --- SEZIONE RIASSUNTO STATISTICHE STILE AMAZON --- */}
      <div className="modern-card mb-5 mx-auto" style={{ maxWidth: '800px', backgroundColor: '#0f172a' }}>
        <Row className="align-items-center">
          {/* Colonna Sinistra: Media Voti */}
          <Col md={4} className="text-center border-md-end border-dark mb-4 mb-md-0">
            <h1 className="fw-bolder mb-0" style={{ fontSize: '4rem', color: '#f1f5f9' }}>{mediaVoti}</h1>
            <div className="text-warning fs-4 mb-2">{renderStelle(Math.round(mediaVoti))}</div>
            <p className="text-muted small mb-0">{totaleRecensioni} recensioni globali</p>
          </Col>
          
          {/* Colonna Destra: Barre di Progresso */}
          <Col md={8} className="px-md-4">
            {[5, 4, 3, 2, 1].map(stella => {
              const percentuale = calcolaPercentuale(stella);
              return (
                <div key={stella} className="d-flex align-items-center mb-2">
                  <span className="text-info fw-bold me-2" style={{ width: '40px' }}>{stella} ★</span>
                  <div className="flex-grow-1 mx-2" style={{ height: '12px', backgroundColor: '#1e293b', borderRadius: '10px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${percentuale}%`, 
                        height: '100%', 
                        backgroundColor: '#fbbf24', // Giallo ambra per le stelle
                        borderRadius: '10px',
                        transition: 'width 1s ease-in-out'
                      }} 
                    />
                  </div>
                  <span className="text-muted small text-end" style={{ width: '40px' }}>{percentuale}%</span>
                </div>
              );
            })}
          </Col>
        </Row>
      </div>

      <div className="row g-4">
        {/* Form Recensione (Visibile solo ai loggati) */}
        <div className="col-md-4">
          <div className="modern-card position-sticky" style={{ top: '100px', maxWidth: '100%' }}>
            {!isAuth ? (
              <div className="text-center py-3">
                <span className="fs-1">🔒</span>
                <h5 className="fw-bold mt-2 text-white">Accesso richiesto</h5>
                <p className="small text-muted">Devi essere loggato per scrivere sulla bacheca.</p>
              </div>
            ) : (
              <Form onSubmit={handleInvio}>
                <h5 className="fw-bold mb-3 text-white">Lascia un voto ⭐</h5>
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

                {/* --- SEZIONE FOTO --- */}
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold text-muted text-uppercase">
                    Allega una foto (opzionale)
                  </Form.Label>
                  <Form.Control 
                    type="file" 
                    accept="image/*" 
                    className="modern-input" 
                    onChange={e => setNuovaFoto(e.target.files[0])}
                  />
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
                    <img 
                      src={rec.autore_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                      alt="Avatar" 
                      className="rounded-circle border border-2 shadow-sm" 
                      style={{ width: '45px', height: '45px', objectFit: 'cover', borderColor: getTier(rec.autore_stays_count || 0).color, cursor: isAuth ? 'pointer' : 'default' }} 
                      onClick={() => handleAvatarClick(rec.user_id)}
                    />
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <h6 className="mb-0 fw-bold text-white">{rec.autore_nome}</h6>
                        <span className="badge text-dark shadow-sm" style={{ backgroundColor: getTier(rec.autore_stays_count || 0).color, fontSize: '0.65rem' }}>
                          {getTier(rec.autore_stays_count || 0).icon} {getTier(rec.autore_stays_count || 0).name}
                        </span>
                      </div>
                      <small className="text-muted text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>{rec.autore_occupazione || "Ospite"}</small>
                    </div>
                  </div>
                  <span className="text-warning fs-5">{renderStelle(rec.voto)}</span>
                </div>
                
                <h5 className="fw-bolder text-white">{rec.titolo}</h5>
                <p className="text-muted mb-3">{rec.commento}</p>

                {rec.foto_url && (
                  <div className="mb-3">
                    <img 
                      src={`http://localhost:3001${rec.foto_url}`} 
                      alt="Foto recensione" 
                      className="rounded shadow-sm border border-secondary"
                      style={{ width: '100px', height: '100px', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.2s' }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      onClick={() => { setModalImage(`http://localhost:3001${rec.foto_url}`); setShowModal(true); }}
                    />
                  </div>
                )}

                {rec.risposta_admin && (
                  <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#1e1b4b', borderLeft: '4px solid #818cf8' }}>
                    <span className="small fw-bold text-uppercase d-block mb-1" style={{ color: '#a5b4fc' }}>👑 I Padroni di Casa</span>
                    <span className="small fst-italic text-light">"{rec.risposta_admin}"</span>
                  </div>
                )}

                {isAdmin && !rec.risposta_admin && (
                  <div className="mt-3 pt-3 border-top d-flex gap-2" style={{ borderColor: '#334155' }}>
                    <Form.Control size="sm" className="modern-input flex-grow-1" placeholder="Rispondi come Admin..." value={risposte[rec.id] || ''} onChange={e => setRisposte({...risposte, [rec.id]: e.target.value})} />
                    <Button size="sm" className="btn-indigo px-3" onClick={() => handleRispostaAdmin(rec.id)}>Invia</Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Body className="p-0 bg-transparent border-0 d-flex justify-content-center">
          {modalImage && <img src={modalImage} alt="Ingrandimento" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '15px' }} />}
        </Modal.Body>
      </Modal>

      {/* --- MODALE PROFILO PUBBLICO --- */}
      <Modal show={showPublicModal} onHide={() => { setShowPublicModal(false); setPublicProfile(null); }} centered size="xl" contentClassName="bg-transparent border-0">
        <Modal.Body className="p-0">
          {publicProfileLoading || !publicProfile ? (
            <div className="text-center p-5 rounded-4 shadow-lg" style={{ backgroundColor: '#1e293b' }}>
              <Spinner animation="border" variant="light" />
              <p className="text-light mt-3">Caricamento profilo...</p>
            </div>
          ) : (
            <div className="container p-0">
              <Row className="g-4">
                <Col lg={4}>
                  <Card className="modern-card text-center border-0 p-4 h-100 shadow-lg position-relative" style={{ backgroundColor: '#1e293b' }}>
                    <Button variant="outline-light" size="sm" className="position-absolute top-0 end-0 m-3 rounded-circle" onClick={() => setShowPublicModal(false)}>✕</Button>
                    <div className="mb-4">
                      <img 
                        src={publicProfile.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80"} 
                        alt="Profile"
                        className="rounded-circle border border-4 shadow-sm"
                        style={{ width: '150px', height: '150px', objectFit: 'cover', borderColor: getTier(publicProfile.stays_count || 0).color }}
                      />
                    </div>
                    <h3 className="fw-bolder text-white mb-3">{publicProfile.name} {publicProfile.surname}</h3>
                    
                    <div className="p-3 rounded mb-4" style={{ backgroundColor: '#0f172a' }}>
                      <span className="d-block text-muted small fw-bold mb-1 text-uppercase">Grado Attuale</span>
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <span style={{ fontSize: '2rem' }}>{getTier(publicProfile.stays_count || 0).icon}</span>
                        <span className="fw-bolder fs-4" style={{ color: getTier(publicProfile.stays_count || 0).color }}>{getTier(publicProfile.stays_count || 0).name}</span>
                      </div>
                    </div>
                    
                    <div className="d-flex justify-content-around text-center mt-auto">
                      <div>
                        <h5 className="text-white fw-bold mb-0">{publicProfile.stays_count || 0}</h5>
                        <span className="text-muted small">Soggiorni</span>
                      </div>
                    </div>
                  </Card>
                </Col>

                <Col lg={8}>
                  <Card className="modern-card border-0 p-4 shadow-lg h-100" style={{ backgroundColor: '#1e293b' }}>
                    <h4 className="fw-bold text-white mb-4 border-bottom pb-2" style={{ borderColor: '#334155 !important' }}>Dettagli Ospite</h4>
                    <Row className="g-3">
                      <Col md={6}>
                        <div className="p-3 rounded h-100" style={{ backgroundColor: '#0f172a' }}>
                          <small className="text-muted fw-bold d-block mb-1">Occupazione</small>
                          <span className="text-light">{publicProfile.occupazione || 'Non specificato'}</span>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="p-3 rounded h-100" style={{ backgroundColor: '#0f172a' }}>
                          <small className="text-muted fw-bold d-block mb-1">Come ci ha conosciuto</small>
                          <span className="text-light">{publicProfile.come_conosciuto || 'Non specificato'}</span>
                        </div>
                      </Col>
                      <Col md={12}>
                        <div className="p-3 rounded" style={{ backgroundColor: '#0f172a' }}>
                          <small className="text-muted fw-bold d-block mb-1">Descrizione Simpatica</small>
                          <span className="text-light fst-italic">"{publicProfile.descrizione_simpatica || 'Nessuna descrizione'}"</span>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
      </Modal>

    </div>
  );
}

export default Recensioni;