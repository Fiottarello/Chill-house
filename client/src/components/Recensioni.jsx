import { useState, useEffect } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
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

                {/* --- SEZIONE FOTO (DISATTIVATA TEMPORANEAMENTE) --- */}
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold text-muted text-uppercase">
                    Allega una foto <span className="badge bg-secondary ms-1" style={{ fontSize: '0.6rem' }}>Prossimamente</span>
                  </Form.Label>
                  <Form.Control 
                    type="file" 
                    accept="image/*" 
                    className="modern-input" 
                    disabled 
                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                    title="Funzionalità in arrivo col prossimo aggiornamento!"
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
                    <img src={rec.autore_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} alt="Avatar" className="rounded-circle border" style={{ width: '45px', height: '45px', objectFit: 'cover' }} />
                    <div>
                      <h6 className="mb-0 fw-bold text-white">{rec.autore_nome}</h6>
                      <small className="text-muted text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>{rec.autore_occupazione || "Ospite"}</small>
                    </div>
                  </div>
                  <span className="text-warning fs-5">{renderStelle(rec.voto)}</span>
                </div>
                
                <h5 className="fw-bolder text-white">{rec.titolo}</h5>
                <p className="text-muted mb-0">{rec.commento}</p>

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
    </div>
  );
}

export default Recensioni;