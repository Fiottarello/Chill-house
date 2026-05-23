import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { useRef, useEffect, useCallback, useState } from 'react';

function Home() {
  const navigate = useNavigate();
  // Riferimento al container delle foto per manipolare lo scroll
  const galleriaRef = useRef(null);
  // Stato per gestire il timer dell'auto-scorrimento
  const timerRef = useRef(null);
  // Stato per tracciare se l'utente sta interagendo (per fermare l'auto-scroll)
  const [utenteInteragisce, setUtenteInteragisce] = useState(false);

  // Array delle immagini (per ora placeholder).
  const fotoGalleria = [
     "/albero.jpg",
    "david.jpg",
    "eschelito.jpg",
    "frigo.jpg",
    "golden1.jpg",
    "pollo.jpg",
    "samuele_morto.jpg", 
    "tortellini.jpg"
];

  // --- LOGICA AUTO-SCROLL ---
  
  // Funzione che esegue lo scorrimento di una foto
  const eseguiAutoScroll = useCallback(() => {
    if (!galleriaRef.current || utenteInteragisce) return;

    const container = galleriaRef.current;
    // Larghezza di una singola foto (assumiamo siano uguali, prendiamo la prima)
    const elementFoto = container.querySelector('.foto-seamless');
    if (!elementFoto) return;
    
    const larghezzaFoto = elementFoto.offsetWidth;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;

    // Calcoliamo la prossima posizione
    let prossimaPosizione = container.scrollLeft + larghezzaFoto;

    // Se siamo arrivati alla fine, torniamo all'inizio
    if (Math.ceil(container.scrollLeft) >= Math.floor(maxScrollLeft)) {
      prossimaPosizione = 0;
    }

    // Eseguiamo lo scroll fluido nativo
    container.scrollTo({
      left: prossimaPosizione,
      behavior: 'smooth'
    });
  }, [utenteInteragisce]);

  // Gestione del timer con useEffect
  useEffect(() => {
    // Facciamo partire lo scroll automatico ogni 3 secondi
    timerRef.current = setInterval(eseguiAutoScroll, 3000);

    // Pulizia del timer alla chiusura della pagina
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [eseguiAutoScroll]);

  // Funzione per mettere in pausa l'auto-scroll quando l'utente tocca/scorre
  const mettiInPausaAutoScroll = () => {
    setUtenteInteragisce(true);
    // Cancelliamo il timer attuale
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Facciamo ripartire il timer dopo 5 secondi di inattività dell'utente
    setTimeout(() => {
      setUtenteInteragisce(false);
    }, 5000);
  };

  return (
    // Modifica: Sfondo Dark (Slate 950)
    <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 w-100 py-5 animate-fade-in" style={{ backgroundColor: '#020617', overflowX: 'hidden' }}>
      
      {/* HEADER MINIMAL */}
      <div className="text-center px-4 mb-4" style={{ maxWidth: '1000px' }}>
        {/* Modifica: Testo chiaro (f1f5f9) */}
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-1.0px', lineHeight: '1.1' }}>
          Benvenuti nella nostra dimora
        </h1>
        {/* Modifica: Indigo brillante (818cf8) */}
        <p className="mt-3 mb-0" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)', color: '#818cf8', fontWeight: 600, fontStyle: 'italic' }}>
          la Chill House più spierta di Torino. Vi amiamo.
        </p>
      </div>

      {/* GALLERIA CONTINUA (Filmstrip Senza Spazi + AutoScroll) */}
      <div className="w-100 my-4 position-relative">
        <div 
          ref={galleriaRef} // Colleghiamo il riferimento
          className="d-flex" 
          // Intercettiamo interazioni utente per mettere in pausa l'auto-scroll
          onTouchStart={mettiInPausaAutoScroll}
          onMouseDown={mettiInPausaAutoScroll}
          style={{ 
            overflowX: 'auto', 
            // scrollSnapType: 'x mandatory', /* Lo disattiviamo temporarily per evitare conflitti con smooth scroll JS */
            WebkitOverflowScrolling: 'touch',
            cursor: 'grab'
        }}>
          <style>{`
            /* Nascondiamo la barra di scorrimento */
            .d-flex::-webkit-scrollbar { display: none; }
            .d-flex { -ms-overflow-style: none; scrollbar-width: none; }
            
            /* Stile della striscia di foto */
            .foto-seamless { 
              transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.4s ease, box-shadow 0.4s ease; 
              filter: brightness(0.75); /* Più scurette di base contro lo sfondo nero */
              cursor: pointer;
            }
            
            /* Effetto Hover: la foto si illumina e "esce" */
            .foto-seamless:hover { 
              transform: scale(1.03) translateY(-10px); /* Sale leggermente invece di allargarsi solo */
              filter: brightness(1.1);
              box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8); 
              z-index: 10; 
              border-radius: 1rem; 
            }
          `}</style>
          
          {fotoGalleria.map((src, index) => (
            <div key={index} className="foto-seamless position-relative" style={{ 
              flex: '0 0 auto', 
              // Leggermente più piccole per l'auto-scorrimento fluido
              width: 'clamp(230px, 25vw, 350px)', 
              height: 'clamp(350px, 55vh, 500px)', 
              scrollSnapAlign: 'center'
            }}>
              <img 
                src={src} 
                alt={`Chill House Frame ${index + 1}`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
          ))}
          
        </div>
      </div>

      {/* CALL TO ACTION BOTTONI */}
      <div className="d-flex gap-3 flex-wrap justify-content-center px-3 z-3 mt-4">
        {/* Modifica: Bottone principale Indigo Vibrante */}
        <Button className="px-5 py-3 fs-5 shadow-lg d-flex align-items-center gap-2" style={{ 
            backgroundColor: '#4f46e5', 
            border: 'none', 
            borderRadius: '1rem', 
            fontWeight: 800,
            letterSpacing: '0.5px',
            transition: 'all 0.3s'
          }} 
          onClick={() => navigate('/prenota')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#6366f1';
            e.currentTarget.style.transform = 'translateY(-3px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4f46e5';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span>📅</span> Prenota
        </Button>
        
        {/* Modifica: Bottone outline adattato al Dark Mode (fondo scuro) */}
        <Button variant="outline-primary" className="px-5 py-3 fs-5 fw-bold" style={{ 
            borderRadius: '1rem', 
            borderWidth: '2px',
            borderColor: '#334155', // Grigio scuro
            color: '#f1f5f9', // Testo chiaro
            backgroundColor: 'transparent',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
            transition: 'all 0.3s'
          }} 
          onClick={() => navigate('/recensioni')}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#818cf8'; // Indigo chiaro
            e.currentTarget.style.color = '#818cf8';
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.backgroundColor = 'rgba(129, 140, 248, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#334155';
            e.currentTarget.style.color = '#f1f5f9';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span>💬</span> Bacheca
        </Button>
      </div>

    </div>
  );
}

export default Home;