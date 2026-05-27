import { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Badge, Modal, Dropdown } from 'react-bootstrap';
import { fetchSchedine, submitSchedina, updateSchedinaStatus, gufoSchedina, fetchBenefattori, fetchSondaggi, votaSondaggio } from '../api/API.mjs';
import { useNavigate } from 'react-router-dom';

function Tipster({ user, isAuth, isAdmin }) {
  const navigate = useNavigate();
  const [schedine, setSchedine] = useState([]);
  const [benefattori, setBenefattori] = useState([]);
  const [sondaggi, setSondaggi] = useState([]);
  
  // Form Nuova Schedina
  const [titolo, setTitolo] = useState('');
  const [importo, setImporto] = useState('');
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modal Foto
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  // Animazione Piume
  const [feathers, setFeathers] = useState([]);

  const loadData = async () => {
    try {
      const [sData, bData, pollData] = await Promise.all([
        fetchSchedine(),
        fetchBenefattori(),
        fetchSondaggi()
      ]);
      setSchedine(sData);
      setBenefattori(bData);
      setSondaggi(pollData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh per i sondaggi ogni 5 secondi
    const intervalId = setInterval(() => {
      fetchSondaggi().then(data => setSondaggi(data)).catch(() => {});
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleInvio = async (e) => {
    e.preventDefault();
    if (!foto) {
      alert("Devi caricare lo screenshot della schedina!");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('titolo', titolo);
      formData.append('importo', importo);
      formData.append('foto', foto);
      await submitSchedina(formData);
      setTitolo(''); setImporto(''); setFoto(null);
      loadData();
    } catch (err) {
      alert("Errore caricamento");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (id, status) => {
    await updateSchedinaStatus(id, status);
    loadData();
  };

  const handleGufo = async (id) => {
    try {
      const res = await gufoSchedina(id);
      if (res.action === 'added') {
        triggerFeathers();
      }
      // Ricarica solo schedine per aggiornare conteggio velocemente
      const sData = await fetchSchedine();
      setSchedine(sData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVoto = async (sondaggioId, opzioneIndex) => {
    await votaSondaggio(sondaggioId, opzioneIndex);
    const data = await fetchSondaggi();
    setSondaggi(data);
  };

  const triggerFeathers = () => {
    const newFeathers = Array.from({ length: 30 }).map((_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 100 + 'vw',
      animationDuration: Math.random() * 2 + 2 + 's', // 2-4s
      delay: Math.random() * 0.5 + 's',
      fontSize: Math.random() * 2 + 1 + 'rem'
    }));
    setFeathers(prev => [...prev, ...newFeathers]);
    // Rimuovi dopo 5s per pulire il DOM
    setTimeout(() => {
      setFeathers(prev => prev.filter(f => !newFeathers.find(nf => nf.id === f.id)));
    }, 5000);
  };

  const canEditSchedina = (schedina) => isAdmin || (user && user.id === schedina.user_id);

  return (
    <div className="container py-4 flex-grow-1 animate-fade-in position-relative overflow-hidden">
      
      {/* Piume renderizzate qui per stare sopra tutto */}
      {feathers.map(f => (
        <div key={f.id} className="feather" style={{ left: f.left, animationDuration: f.animationDuration, animationDelay: f.delay, fontSize: f.fontSize }}>🪶</div>
      ))}

      <div className="text-center mb-5">
        <h2 className="fw-bolder" style={{ fontSize: '2.5rem', color: '#f1f5f9' }}>L'Angolo del Tipster 💸</h2>
        <p className="text-muted">Posta le tue schedine, gufa quelle degli amici e vota i sondaggi live!</p>
      </div>

      <Row className="g-4">
        {/* COLONNA SINISTRA: BACHECA SCHEDINE */}
        <Col md={8}>
          
          {/* Form Inserimento */}
          {isAuth && (
            <div className="modern-card mb-4 w-100" style={{ maxWidth: '100%' }}>
              <h5 className="fw-bold mb-3 text-white">Posta una Schedina 🍀</h5>
              <Form onSubmit={handleInvio}>
                <Row className="g-2 mb-3">
                  <Col md={8}>
                    <Form.Control className="modern-input" placeholder="Titolo (es. Quota Pazza Serie A)" required value={titolo} onChange={e => setTitolo(e.target.value)} />
                  </Col>
                  <Col md={4}>
                    <Form.Control type="number" step="0.01" className="modern-input" placeholder="Importo €" required value={importo} onChange={e => setImporto(e.target.value)} />
                  </Col>
                </Row>
                <Row className="g-2 align-items-center">
                  <Col md={9}>
                    <Form.Control type="file" accept="image/*" className="modern-input" onChange={e => setFoto(e.target.files[0])} />
                  </Col>
                  <Col md={3}>
                    <Button type="submit" className="w-100 btn-indigo" disabled={loading}>
                      {loading ? '...' : 'Invia'}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </div>
          )}

          {/* Lista Schedine */}
          <h4 className="fw-bold text-white mb-3 mt-4">Bacheca Scommesse</h4>
          {schedine.length === 0 ? (
            <p className="text-muted fst-italic">Nessuna schedina postata di recente. Sii il primo!</p>
          ) : (
            schedine.map(s => (
              <div key={s.id} className="modern-card mb-4 w-100 position-relative" style={{ maxWidth: '100%', borderColor: s.status === 'vinta' ? '#22c55e' : s.status === 'persa' ? '#ef4444' : '#1e293b' }}>
                
                {/* Banner di stato */}
                {s.status === 'vinta' && <Badge bg="success" className="position-absolute top-0 end-0 m-3 fs-6">✅ VINTA!</Badge>}
                {s.status === 'persa' && <Badge bg="danger" className="position-absolute top-0 end-0 m-3 fs-6">❌ STRAPPATA</Badge>}
                {s.status === 'in corso' && <Badge bg="warning" text="dark" className="position-absolute top-0 end-0 m-3 fs-6">⏳ IN CORSO</Badge>}

                <div className="d-flex align-items-center gap-3 mb-3">
                  <img src={s.autore_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} alt="Avatar" className="rounded-circle border border-secondary" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                  <div>
                    <h6 className="mb-0 fw-bold text-white">{s.autore_nome}</h6>
                    <small className="text-muted">{new Date(s.created_at).toLocaleString()}</small>
                  </div>
                </div>
                
                <h5 className="fw-bolder text-white">{s.titolo}</h5>
                <p className="text-muted fw-bold">Importo: €{s.importo}</p>

                <div className="mb-3">
                  <img 
                    src={`http://localhost:3001${s.foto_url}`} 
                    alt="Foto schedina" 
                    className="rounded shadow-sm border border-secondary"
                    style={{ width: '150px', height: '150px', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    onClick={() => { setModalImage(`http://localhost:3001${s.foto_url}`); setShowModal(true); }}
                  />
                </div>

                <div className="d-flex gap-2 align-items-center border-top pt-3" style={{ borderColor: '#334155' }}>
                  {isAuth ? (
                    <Button variant={s.status === 'in corso' ? 'outline-warning' : 'outline-secondary'} onClick={() => handleGufo(s.id)} disabled={s.status !== 'in corso'} className="fw-bold d-flex align-items-center gap-2">
                      <span style={{ fontSize: '1.2rem' }}>🦉</span> Gufa! ({s.gufi_count})
                    </Button>
                  ) : (
                    <span className="text-warning fw-bold">🦉 {s.gufi_count} Gufate</span>
                  )}

                  {canEditSchedina(s) && (
                    <Dropdown className="ms-auto">
                      <Dropdown.Toggle variant="outline-light" size="sm">Cambia Esito</Dropdown.Toggle>
                      <Dropdown.Menu variant="dark">
                        <Dropdown.Item onClick={() => handleChangeStatus(s.id, 'in corso')}>⏳ In Corso</Dropdown.Item>
                        <Dropdown.Item onClick={() => handleChangeStatus(s.id, 'vinta')}>✅ Vinta</Dropdown.Item>
                        <Dropdown.Item onClick={() => handleChangeStatus(s.id, 'persa')}>❌ Persa</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  )}
                </div>
              </div>
            ))
          )}
        </Col>

        {/* COLONNA DESTRA: SONDAGGI E BENEFATTORE */}
        <Col md={4}>
          
          {/* SONDAGGI LIVE */}
          <div className="mb-4">
            <h4 className="fw-bold text-white mb-3">Live Polls 📊</h4>
            {sondaggi.filter(s => s.is_active === 1).length === 0 ? (
              <p className="text-muted fst-italic">Nessun sondaggio attivo al momento.</p>
            ) : (
              sondaggi.filter(s => s.is_active === 1).map(s => {
                const opzioni = JSON.parse(s.opzioni_json);
                const totaleVoti = s.voti.length;
                
                return (
                  <div key={s.id} className="modern-card w-100 p-3 mb-3 border border-info" style={{ backgroundColor: '#082f49' }}>
                    <h6 className="fw-bolder text-white text-center mb-3">{s.domanda}</h6>
                    {opzioni.map((opt, idx) => {
                      const votiOpzione = s.voti.filter(v => v.opzione_index === idx).length;
                      const percentuale = totaleVoti === 0 ? 0 : Math.round((votiOpzione / totaleVoti) * 100);
                      const userHaVotatoQuesto = user && s.voti.some(v => v.user_id === user.id && v.opzione_index === idx);

                      return (
                        <div key={idx} className="mb-2 position-relative" style={{ cursor: isAuth ? 'pointer' : 'default' }} onClick={() => isAuth && handleVoto(s.id, idx)}>
                          {/* Sfondo barra */}
                          <div className="w-100 rounded overflow-hidden" style={{ height: '36px', backgroundColor: '#0f172a' }}>
                            {/* Progresso barra */}
                            <div className="poll-bar h-100 d-flex align-items-center" style={{ width: `${percentuale}%`, backgroundColor: userHaVotatoQuesto ? '#38bdf8' : '#1e293b' }} />
                          </div>
                          {/* Testo sopra la barra */}
                          <div className="position-absolute w-100 h-100 top-0 d-flex justify-content-between align-items-center px-3" style={{ pointerEvents: 'none' }}>
                            <span className="fw-bold text-white shadow-sm">{opt}</span>
                            <span className="fw-bold text-info">{percentuale}%</span>
                          </div>
                        </div>
                      )
                    })}
                    <div className="text-center text-muted small mt-2">{totaleVoti} voti totali</div>
                  </div>
                )
              })
            )}
          </div>

          {/* LEADERBOARD BENEFATTORE */}
          <div>
            <h4 className="fw-bold text-warning mb-3 d-flex align-items-center gap-2">
              🏆 Il Benefattore
            </h4>
            <div className="modern-card w-100 p-0 overflow-hidden border border-warning" style={{ boxShadow: '0 0 20px rgba(234, 179, 8, 0.2)' }}>
              <div className="bg-warning text-dark text-center py-2 fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>
                Classifica Snai
              </div>
              <div className="p-3">
                {benefattori.length === 0 ? (
                  <p className="text-muted text-center my-3 fst-italic">Ancora nessuno ha stracciato schedine!</p>
                ) : (
                  benefattori.map((b, idx) => (
                    <div key={b.id} className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary pb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bolder fs-5 text-muted" style={{ width: '25px' }}>{idx + 1}°</span>
                        <img src={b.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} alt="Avatar" className="rounded-circle" style={{ width: '35px', height: '35px', objectFit: 'cover' }} />
                        <span className={idx === 0 ? "fw-bolder text-warning" : "text-white fw-bold"}>{b.name}</span>
                        {idx === 0 && <span>👑</span>}
                      </div>
                      <span className="fw-bolder text-danger">-€{b.totale_perso.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </Col>
      </Row>

      {/* TASTO SALA GIOCHI (SLOT MACHINE) - SOLO PER LOGGATI */}
      {isAuth && (
        <div className="text-center mt-5 pt-3 border-top border-secondary">
          <h4 className="fw-bolder text-warning mb-3">Senti fortunato?</h4>
          <Button 
            size="lg" 
            style={{ 
              background: 'linear-gradient(to bottom, #fbbf24, #d97706)',
              border: '4px solid #78350f',
              color: '#451a03',
              padding: '15px 40px',
              borderRadius: '50px',
              boxShadow: '0 10px 0 #78350f, 0 15px 20px rgba(0,0,0,0.5)',
              transition: 'all 0.1s'
            }}
            className="fw-bolder fs-3 text-uppercase" 
            onClick={() => navigate('/slot')}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(10px)'; e.currentTarget.style.boxShadow = '0 0 0 #78350f, 0 5px 10px rgba(0,0,0,0.5)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 0 #78350f, 0 15px 20px rgba(0,0,0,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 0 #78350f, 0 15px 20px rgba(0,0,0,0.5)'; }}
          >
            🎰 Entra nella Sala Giochi
          </Button>
        </div>
      )}

      {/* MODAL FOTO FULLSCREEN */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
        <Modal.Body className="p-0 text-center bg-dark rounded overflow-hidden position-relative">
          <Button variant="dark" className="position-absolute top-0 end-0 m-3 rounded-circle opacity-75" onClick={() => setShowModal(false)}>✕</Button>
          <img src={modalImage} alt="Foto ingrandita" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }} />
        </Modal.Body>
      </Modal>

    </div>
  );
}

export default Tipster;
