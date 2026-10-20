import React, { useRef, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

function Casa() {
  const stanze = [
    { nome: "Camera Samuele", immagine: "/camera_samuele.jpeg", audio: "/messi.mp3" },
    { nome: "Camera Simone", immagine: "/camera_simone.jpeg", audio: "/gojo.mp3" },
    { nome: "Salotto 1", immagine: "/salotto1.jpeg" },
    { nome: "Salotto 2", immagine: "/salotto2.jpeg" },
    { nome: "Veranda", immagine: "/veranda.jpeg" },
    { nome: "Cucina", immagine: "/cucina.jpeg" },
    { nome: "Balconcino", immagine: "/balconcino.jpeg" },
    { nome: "Bagno 1", immagine: "/bagno1.jpeg", audio: "/scorreggia.mp3" },
    { nome: "Bagno 2", immagine: "/bagno_2.jpeg" }
  ];

  const currentAudioRef = useRef(null);
  const currentAudioPathRef = useRef(null);

  useEffect(() => {
    // Cleanup quando il componente viene smontato
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  const handleDoubleClick = (audioPath) => {
    if (!audioPath) return;

    if (currentAudioRef.current) {
      // Se c'è già un audio in riproduzione
      if (currentAudioPathRef.current === audioPath) {
        // Se è lo stesso, lo fermiamo
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
        currentAudioPathRef.current = null;
      }
      // Se è un altro, ignoriamo (come richiesto)
      return;
    }

    // Se non c'è nessun audio in riproduzione, avviamo il nuovo
    const audio = new Audio(audioPath);
    currentAudioRef.current = audio;
    currentAudioPathRef.current = audioPath;

    audio.play().catch(err => {
      console.error("Errore riproduzione audio:", err);
      currentAudioRef.current = null;
      currentAudioPathRef.current = null;
    });

    // Quando finisce da solo, resettiamo
    audio.onended = () => {
      currentAudioRef.current = null;
      currentAudioPathRef.current = null;
    };
  };

  return (
    <div className="flex-grow-1 w-100" style={{ backgroundColor: '#020617', padding: '3rem 0' }}>
      <Container className="animate-fade-in">
        <div className="text-center mb-5">
          <h1 className="fw-bolder" style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
            color: '#818cf8',
            fontFamily: '"Playfair Display", serif',
            textShadow: '0 4px 10px rgba(0,0,0,0.6)'
          }}>
            La Nostra Casa
          </h1>
          <p className="text-muted fs-4 mb-2">Esplora ogni angolo della Chill House</p>
          <p className="text-info fst-italic small">💡 Pro tip: fai doppio click su alcune foto per una sorpresa audio!</p>
        </div>

        <Row className="justify-content-center">
          {stanze.map((stanza, idx) => (
            <Col xs={12} md={6} lg={5} key={idx} className="mb-4 d-flex align-items-stretch">
              <Card className="modern-card w-100 border-0 overflow-hidden shadow-lg" style={{ backgroundColor: '#0f172a' }}>
                <Card.Img 
                  variant="top" 
                  src={stanza.immagine} 
                  alt={stanza.nome} 
                  style={{ width: '100%', height: '40vh', objectFit: 'cover', minHeight: '300px', cursor: stanza.audio ? 'pointer' : 'default' }}
                  onDoubleClick={() => handleDoubleClick(stanza.audio)}
                />
                <Card.Body className="text-center py-4 d-flex flex-column justify-content-end">
                  <Card.Title className="fw-bolder mb-0" style={{ fontSize: '1.8rem', color: '#f8fafc', letterSpacing: '1px' }}>
                    {stanza.nome}
                  </Card.Title>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
}

export default Casa;
