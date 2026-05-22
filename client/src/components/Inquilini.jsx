import { useState } from 'react';
import { Row, Col } from 'react-bootstrap';

function Inquilini() {
  const [mostraInfo1, setMostraInfo1] = useState(false);
  const [mostraInfo2, setMostraInfo2] = useState(false);

  return (
    <div className="container py-5 animate-fade-in flex-grow-1">
      <div className="text-center mb-5">
        <h2 className="fw-bolder" style={{ fontSize: '2.5rem', color: '#f1f5f9' }}>I Padroni di Casa 👑</h2>
        <p className="text-muted">Clicca sulle nostre schede per scoprire i dettagli compromettenti.</p>
      </div>
      
      <Row className="justify-content-center g-4">
        {/* INQUILINO 1 - SIMONE */}
        <Col md={5}>
          <div className="modern-card p-0 overflow-hidden" style={{ cursor: 'pointer', borderColor: mostraInfo1 ? '#818cf8' : '#1e293b' }} onClick={() => setMostraInfo1(!mostraInfo1)}>
            <div className="position-relative" style={{ height: '350px', backgroundColor: '#4f46e5' }}>
              <img 
                src="/simone.jpg" 
                alt="Simone" 
                className="w-100 h-100 object-fit-cover transition-all" 
                style={{ opacity: mostraInfo1 ? 1 : 0.8, filter: mostraInfo1 ? 'grayscale(0%)' : 'grayscale(50%)' }}
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80";
                  e.target.style.opacity = 0.5;
                }}
              />
              <div className="position-absolute bottom-0 start-0 p-4 text-white w-100" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                <span className="badge bg-primary mb-2 shadow">Dev & Pizzaiolo</span>
                <h3 className="fw-bold mb-0" style={{ letterSpacing: '-1px' }}>Simone</h3>
              </div>
            </div>
            
            <div className="p-4" style={{ backgroundColor: mostraInfo1 ? '#1e293b' : '#0f172a', transition: 'background-color 0.3s' }}>
              {!mostraInfo1 ? (
                <p className="text-center fw-bold mb-0" style={{ color: '#818cf8' }}>👉 Clicca per i dettagli scottanti</p>
              ) : (
                <>
                  <p className="text-light lead fw-semibold">Studia se non c'è samuele in casa, rischia di morire una volta l'anno</p>
                  <p className="text-muted small">Venera il colore arancione, il limone potrebbe essere la sua unica fonte di energia e coltiva il sogno di prendere un bassotto come moglie .</p>
                  
                  <div className="border-top pt-3 mt-3 small fw-bold text-muted d-flex justify-content-between" style={{ borderColor: '#334155' }}>
                    <span style={{ color: '#a5b4fc' }}>🎯 Superpotere: Stendere le pizze migliori del mondo</span>
                    <span className="text-danger">⚠️ Difetto: Non ha ancora ucciso Zucca</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </Col>

        {/* INQUILINO 2 - SAMUELE */}
        <Col md={5}>
          <div className="modern-card p-0 overflow-hidden" style={{ cursor: 'pointer', borderColor: mostraInfo2 ? '#22d3ee' : '#1e293b' }} onClick={() => setMostraInfo2(!mostraInfo2)}>
            <div className="position-relative" style={{ height: '350px', backgroundColor: '#0ea5e9' }}>
              <img 
                src="/samuele_morto.jpg" 
                alt="Samuele" 
                className="w-100 h-100 object-fit-cover transition-all" 
                style={{ opacity: mostraInfo2 ? 1 : 0.8, filter: mostraInfo2 ? 'grayscale(0%)' : 'grayscale(50%)' }}
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80";
                  e.target.style.opacity = 0.5;
                }}
              />
              <div className="position-absolute bottom-0 start-0 p-4 text-white w-100" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                <span className="badge bg-info mb-2 shadow text-dark">Maestro & Chill Guy</span>
                <h3 className="fw-bold mb-0" style={{ letterSpacing: '-1px' }}>Samuele</h3>
              </div>
            </div>
            
            <div className="p-4" style={{ backgroundColor: mostraInfo2 ? '#1e293b' : '#0f172a', transition: 'background-color 0.3s' }}>
              {!mostraInfo2 ? (
                <p className="text-center fw-bold mb-0" style={{ color: '#22d3ee' }}>👉 Clicca per la verità vera</p>
              ) : (
                <>
                  <p className="text-light lead fw-semibold">Di giorno plasma le menti del futuro, di notte punkabbestia .</p>
                  <p className="text-muted small"> Svolge 3 lavori ma è impossibile vederlo stressato, messi-dipendente, non lo vedrete prima delle 16 nel week end.</p>
                  
                  <div className="border-top pt-3 mt-3 small fw-bold text-muted d-flex justify-content-between" style={{ borderColor: '#334155' }}>
                    <span style={{ color: '#67e8f9' }}>🎯 Superpotere: Avere la testa più fresca del pianeta</span>
                    <span className="text-danger">⚠️ Difetto: Non ha ancora ucciso Zucca</span>
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