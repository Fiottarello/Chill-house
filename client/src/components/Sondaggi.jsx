import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Badge, Modal } from 'react-bootstrap';
import { fetchSondaggi, createSondaggio, votaSondaggio } from '../api/API.mjs';
import { useNavigate } from 'react-router-dom';

function Sondaggi({ user, isAuth }) {
  const navigate = useNavigate();
  const [sondaggi, setSondaggi] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newDomanda, setNewDomanda] = useState('');
  const [newOpzioni, setNewOpzioni] = useState(['', '']);
  const [creating, setCreating] = useState(false);

  const [showVotersModal, setShowVotersModal] = useState(false);
  const [currentVotersOption, setCurrentVotersOption] = useState({ domanda: '', opzione: '', voters: [] });

  useEffect(() => {
    if (!isAuth) {
      navigate('/');
      return;
    }
    loadData();
  }, [isAuth, navigate]);

  const loadData = () => {
    setLoading(true);
    fetchSondaggi()
      .then(data => {
        // Ordina mettendo prima quelli attivi
        data.sort((a, b) => b.is_active - a.is_active || new Date(b.created_at) - new Date(a.created_at));
        setSondaggi(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleAddOpzione = () => setNewOpzioni([...newOpzioni, '']);
  const handleOpzioneChange = (index, value) => {
    const updated = [...newOpzioni];
    updated[index] = value;
    setNewOpzioni(updated);
  };
  const handleRemoveOpzione = (index) => {
    if (newOpzioni.length > 2) {
      const updated = newOpzioni.filter((_, i) => i !== index);
      setNewOpzioni(updated);
    }
  };

  const handleCreateSondaggio = async (e) => {
    e.preventDefault();
    const validOpzioni = newOpzioni.filter(o => o.trim() !== '');
    if (validOpzioni.length < 2) {
      alert("Inserisci almeno 2 opzioni valide!");
      return;
    }
    setCreating(true);
    try {
      await createSondaggio(newDomanda, validOpzioni);
      setNewDomanda('');
      setNewOpzioni(['', '']);
      loadData();
    } catch (err) {
      alert("Errore creazione sondaggio");
    } finally {
      setCreating(false);
    }
  };

  const handleVoto = async (id, opzioneIndex) => {
    try {
      await votaSondaggio(id, opzioneIndex);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleShowVoters = (e, domanda, opzione, voters) => {
    e.stopPropagation();
    setCurrentVotersOption({ domanda, opzione, voters });
    setShowVotersModal(true);
  };

  if (!isAuth) return null;

  return (
    <div className="d-flex flex-column flex-grow-1" style={{ backgroundColor: '#020617', minHeight: '100vh', padding: '2rem 0' }}>
      <Container className="animate-fade-in">
        
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="fw-bolder" style={{ 
            fontSize: '4rem', 
            color: '#38bdf8',
            textShadow: '0 0 20px rgba(56, 189, 248, 0.5)'
          }}>📊 SONDAGGI</h1>
          <p className="text-muted fs-4">Decidi le sorti della casa, proponi e vota!</p>
        </div>

        <Row className="justify-content-center">
          <Col lg={8}>
            {/* Form Creazione */}
            <Card className="modern-card p-4 shadow-lg mb-5 border-info" style={{ backgroundColor: '#1e293b', borderWidth: '2px' }}>
              <h4 className="text-white fw-bold mb-3">Crea un nuovo sondaggio</h4>
              <Form onSubmit={handleCreateSondaggio}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-info fw-bold">Domanda</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Es. Cosa mangiamo stasera?" 
                    value={newDomanda} 
                    onChange={e => setNewDomanda(e.target.value)} 
                    required 
                    className="modern-input"
                    style={{ backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155' }}
                  />
                </Form.Group>
                
                <Form.Label className="text-info fw-bold">Opzioni (Minimo 2)</Form.Label>
                {newOpzioni.map((op, idx) => (
                  <div key={idx} className="d-flex mb-2 gap-2">
                    <Form.Control 
                      type="text" 
                      placeholder={`Opzione ${idx + 1}`} 
                      value={op} 
                      onChange={e => handleOpzioneChange(idx, e.target.value)} 
                      className="modern-input"
                      style={{ backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155' }}
                    />
                    {newOpzioni.length > 2 && (
                      <Button variant="outline-danger" onClick={() => handleRemoveOpzione(idx)}>✖</Button>
                    )}
                  </div>
                ))}
                
                <div className="d-flex justify-content-between mt-3">
                  <Button variant="outline-info" onClick={handleAddOpzione} size="sm">+ Aggiungi Opzione</Button>
                  <Button type="submit" variant="info" className="fw-bold" disabled={creating}>
                    {creating ? 'Creazione...' : 'Pubblica Sondaggio'}
                  </Button>
                </div>
              </Form>
            </Card>

            {/* Lista Sondaggi */}
            <h3 className="fw-bold text-white mb-4">Sondaggi Recenti</h3>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="info" />
              </div>
            ) : sondaggi.length === 0 ? (
              <div className="text-center text-muted fst-italic py-4">Nessun sondaggio disponibile. Creane uno!</div>
            ) : (
              sondaggi.map(s => {
                const opzioni = JSON.parse(s.opzioni_json);
                const totaleVoti = s.voti.length;
                const isActive = s.is_active === 1;

                return (
                  <Card key={s.id} className="modern-card p-4 mb-4 shadow" style={{ backgroundColor: '#0f172a', borderColor: isActive ? '#38bdf8' : '#334155' }}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <h4 className="fw-bolder text-white mb-0">{s.domanda}</h4>
                      {!isActive && <Badge bg="danger">CHIUSO</Badge>}
                    </div>
                    <div className="text-muted small mb-3">
                      Proposto da: <span className="fw-bold text-info">{s.autore_nome || 'Casa Chill'}</span>
                    </div>

                    <div className="mb-3">
                      {opzioni.map((opt, idx) => {
                        const votiCorrenti = s.voti.filter(v => v.opzione_index === idx);
                        const percentuale = totaleVoti === 0 ? 0 : Math.round((votiCorrenti.length / totaleVoti) * 100);
                        const userHaVotatoQuesto = user && s.voti.some(v => v.user_id === user.id && v.opzione_index === idx);

                        return (
                          <div 
                            key={idx} 
                            className="mb-3 position-relative" 
                            style={{ cursor: isActive && isAuth ? 'pointer' : 'default', transition: 'all 0.2s' }} 
                            onClick={() => { if(isActive && isAuth) handleVoto(s.id, idx); }}
                          >
                            <div className="d-flex justify-content-between text-light mb-1">
                              <span className={userHaVotatoQuesto ? 'fw-bold text-info' : ''}>{opt} {userHaVotatoQuesto && '✅'}</span>
                              <span 
                                className="fw-bold" 
                                style={{ cursor: 'pointer', backgroundColor: '#1e293b', padding: '2px 8px', borderRadius: '10px' }}
                                onClick={(e) => handleShowVoters(e, s.domanda, opt, votiCorrenti)}
                              >
                                {percentuale}% ({votiCorrenti.length}) 👀
                              </span>
                            </div>
                            <div className="w-100 rounded overflow-hidden shadow-sm border border-secondary" style={{ height: '16px', backgroundColor: '#1e293b' }}>
                              <div 
                                className="h-100" 
                                style={{ 
                                  width: `${percentuale}%`, 
                                  backgroundColor: userHaVotatoQuesto ? '#38bdf8' : (isActive ? '#64748b' : '#475569'),
                                  transition: 'width 0.5s ease-out'
                                }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="text-end text-muted small mt-2 border-top pt-2" style={{ borderColor: '#334155' }}>
                      Totale voti: {totaleVoti} • {new Date(s.created_at).toLocaleString()}
                    </div>
                  </Card>
                )
              })
            )}
          </Col>
        </Row>
      </Container>

      {/* Modal Chi Ha Votato */}
      <Modal show={showVotersModal} onHide={() => setShowVotersModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0 text-white" style={{ backgroundColor: '#0f172a' }}>
          <div>
            <Modal.Title className="fw-bold fs-5 text-info">{currentVotersOption.domanda}</Modal.Title>
            <p className="text-muted small mb-0">Hanno votato: <span className="text-white fw-bold">{currentVotersOption.opzione}</span></p>
          </div>
        </Modal.Header>
        <Modal.Body className="text-white" style={{ backgroundColor: '#0f172a' }}>
          {currentVotersOption.voters.length === 0 ? (
            <p className="text-muted text-center fst-italic py-3">Nessun voto per questa opzione.</p>
          ) : (
            <ul className="list-unstyled mb-0">
              {currentVotersOption.voters.map((v, i) => (
                <li key={i} className="mb-2 py-2 px-3 rounded" style={{ backgroundColor: '#1e293b' }}>
                  👤 {v.user_name}
                </li>
              ))}
            </ul>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Sondaggi;
