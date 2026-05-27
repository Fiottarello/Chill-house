import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { applyCurse } from '../api/API.mjs';

const IMAGES = [
  '/slot1.png',
  '/slot2.png',
  '/slot3.png',
  '/slot4.png'
];

function SlotMachine({ isAuth, setUser }) {
  const navigate = useNavigate();
  
  // Per ogni rullo salviamo l'immagine corrente visualizzata
  const [currentImages, setCurrentImages] = useState([
    Math.floor(Math.random() * 4),
    Math.floor(Math.random() * 4),
    Math.floor(Math.random() * 4)
  ]);

  // Le "strisce" di immagini per l'animazione di ogni rullo
  const [strips, setStrips] = useState([[], [], []]);
  
  const [spinning, setSpinning] = useState(false);
  const [victory, setVictory] = useState(false);
  const [cursed, setCursed] = useState(false);

  // Reference per poter manipolare i div e triggerare i reflow
  const stripRefs = [useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    if (!isAuth) {
      navigate('/');
    }
  }, [isAuth, navigate]);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setVictory(false);
    setCursed(false);

    // 1. Decidiamo il risultato finale con le nuove probabilità
    const finalResult = [0, 0, 0];
    const isWin = Math.random() < 0.20; // 20% di probabilità di vittoria assoluta

    if (isWin) {
      // È una vittoria! Scegliamo quale simbolo vince (tutti equiprobabili).
      const winningSymbol = Math.floor(Math.random() * IMAGES.length);

      finalResult[0] = winningSymbol;
      finalResult[1] = winningSymbol;
      finalResult[2] = winningSymbol;
    } else {
      // È una sconfitta. Generiamo simboli casuali.
      for (let i = 0; i < 3; i++) {
        finalResult[i] = Math.floor(Math.random() * IMAGES.length);
      }
      // Se per puro caso (1 probabilità su 64) sono usciti tre uguali durante una sconfitta,
      // alteriamo l'ultimo rullo per forzare la sconfitta.
      if (finalResult[0] === finalResult[1] && finalResult[1] === finalResult[2]) {
        finalResult[2] = (finalResult[2] + 1) % IMAGES.length;
      }
    }

    // 2. Costruiamo le nuove strisce per i rulli
    // Ogni rullo avrà: [Immagine Attuale] + [20-30 Immagini Casuali] + [Immagine Finale]
    const newStrips = [[], [], []];
    const spinsCount = [25, 35, 45]; // Il terzo rullo gira più a lungo (più immagini)

    for (let i = 0; i < 3; i++) {
      newStrips[i].push(currentImages[i]); // L'immagine che si sta guardando ora
      
      // Immagini veloci in mezzo
      for (let j = 0; j < spinsCount[i]; j++) {
        newStrips[i].push(Math.floor(Math.random() * IMAGES.length));
      }
      
      newStrips[i].push(finalResult[i]); // Immagine finale
    }

    // Impostiamo le strisce nello stato
    setStrips(newStrips);

    // 3. Facciamo partire l'animazione
    // Usiamo un timeout breve per dar tempo a React di renderizzare i div
    setTimeout(() => {
      for (let i = 0; i < 3; i++) {
        const el = stripRefs[i].current;
        if (el) {
          // Rimuoviamo temporaneamente le transizioni per resettare al top (translateY(0))
          el.style.transition = 'none';
          el.style.transform = 'translateY(0)';
          
          // Trigger Reflow per forzare il browser a registrare la posizione 0
          void el.offsetHeight; 

          // Riapplichiamo la transizione con tempi diversi per ogni rullo (1.5s, 2s, 2.5s)
          const time = 1.5 + (i * 0.5);
          // Usiamo una curva cubica che parte veloce e frena dolcemente
          el.style.transition = `transform ${time}s cubic-bezier(0.1, 0.7, 0.1, 1)`;
          
          // Muoviamo la striscia fino in fondo (ogni blocco è alto 150px)
          const targetY = -((newStrips[i].length - 1) * 150);
          el.style.transform = `translateY(${targetY}px)`;
        }
      }

      // Alla fine del giro più lungo (quello di 2.5s), concludiamo il giro
      setTimeout(() => {
        setSpinning(false);
        setCurrentImages(finalResult);
        
        // Puliamo le strisce per evitare div enormi
        setStrips([[], [], []]);

        // Controlliamo la vittoria o la maledizione
        if (finalResult[0] === finalResult[1] && finalResult[1] === finalResult[2]) {
          setTimeout(() => {
            if (finalResult[0] === 0) {
              // 0 corrisponde a slot1.png, ovvero Zucca!
              setCursed(true);
              if (setUser) setUser(prev => ({ ...prev, avatar_url: '/pollo2.png' }));
              applyCurse().catch(e => console.error("Errore Maledizione:", e));
            } else {
              setVictory(true);
            }
          }, 300);
        }
      }, 2600); // 2.5s + 100ms di margine
    }, 50);
  };

  if (!isAuth) return null;

  const getVictoryMessage = () => {
    if (currentImages[0] === 2) return "SEI STATO SBORRATO, hai ottenuto la benedizione di Sborrax";
    if (currentImages[0] === 1) return "Bravo il coglione, non hai vinto niente";
    if (currentImages[0] === 3) return "SUCA";
    return "Bravissimo, sei il più forte!";
  };

  return (
    <div className="slot-page d-flex flex-column flex-grow-1 align-items-center justify-content-center py-5">
      
      {/* Tasto Torna Indietro */}
      <div className="position-absolute top-0 start-0 m-4">
        <Button variant="outline-light" className="fw-bold" onClick={() => navigate('/tipster')} disabled={spinning}>
          ← Torna all'Angolo Tipster
        </Button>
      </div>

      <div className="text-center mb-4">
        <h1 className="fw-bolder slot-title">🎰 CHILL HOUSE CASINO 🎰</h1>
        <p className="text-warning fw-bold fs-5">Tenta la fortuna!</p>
      </div>

      {/* STRUTTURA SLOT MACHINE */}
      <div className="slot-machine-body p-4 rounded-4 shadow-lg position-relative">
        <div className="neon-lights"></div>

        <div className="reels-container d-flex gap-3 bg-dark p-3 rounded-3 border border-3 border-dark">
          {currentImages.map((imgIndex, i) => (
            <div key={i} className="reel bg-white rounded-3 overflow-hidden position-relative shadow-inner">
              
              {/* Se non sta girando, mostriamo solo un'immagine singola */}
              {strips[i].length === 0 ? (
                <div className="reel-item">
                  <img src={IMAGES[imgIndex]} alt={`Slot ${i}`} className="reel-img" />
                </div>
              ) : (
                /* Se sta girando, mostriamo la lunghissima colonna di immagini */
                <div className="reel-strip" ref={stripRefs[i]}>
                  {strips[i].map((stripImg, idx) => (
                    <div key={idx} className="reel-item">
                      <img src={IMAGES[stripImg]} alt="Strip item" className={`reel-img ${spinning && idx > 0 && idx < strips[i].length - 1 ? 'blur-effect' : ''}`} />
                    </div>
                  ))}
                </div>
              )}

            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 text-center">
        <button 
          className={`slot-btn spin-button fw-bolder fs-3 text-uppercase ${spinning ? 'disabled' : ''}`}
          onClick={spin}
          disabled={spinning}
        >
          {spinning ? 'GIRANDO...' : 'Gira (Gratis)'}
        </button>
      </div>

      {/* MESSAGGIO VITTORIA */}
      {victory && (
        <div className="victory-overlay d-flex align-items-center justify-content-center">
          <div className="victory-message text-center p-5 rounded-4 shadow-lg animate-pop">
            
            {currentImages[0] === 2 ? (
              // Layout Speciale Sborrax (slot3.png)
              <div className="d-flex align-items-center justify-content-center gap-4">
                <img src="/slot3.png" alt="Sborrax" style={{ width: '150px', height: '150px', borderRadius: '20px' }} className="shadow" />
                <div className="text-start">
                  <h1 className="fw-bolder display-3 text-warning mb-2">SEI STATO SBORRATO</h1>
                  <h2 className="fw-bold text-white fs-3">hai ricevuto la benedizione di Sborrax</h2>
                </div>
              </div>
            ) : (
              // Layout Standard per gli altri simboli
              <h1 className="fw-bolder display-3 text-warning mb-3 px-3">{getVictoryMessage()}</h1>
            )}

            <Button variant="outline-light" size="lg" className="mt-5" onClick={() => setVictory(false)}>
              Gioca Ancora
            </Button>
          </div>
        </div>
      )}

      {/* MESSAGGIO MALEDIZIONE */}
      {cursed && (
        <div className="victory-overlay d-flex align-items-center justify-content-center" style={{ background: 'rgba(50, 0, 0, 0.9)' }}>
          <div className="victory-message text-center p-5 rounded-4 shadow-lg animate-pop" style={{ border: '3px solid #dc3545', background: '#1a0000' }}>
            <h1 className="fw-bolder display-2 text-danger mb-3">🐔 MALEDIZIONE 🐔</h1>
            <h2 className="fw-bold text-white">Zucca ti ha maledetto, sei diventato un pollo!</h2>
            <p className="text-white-50 mt-3">Per le prossime 2 ore avrai la faccia da pollo in tutte le chat e recensioni.</p>
            <Button variant="danger" size="lg" className="mt-4 fw-bold" onClick={() => setCursed(false)}>
              Accetta il tuo destino
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SlotMachine;
