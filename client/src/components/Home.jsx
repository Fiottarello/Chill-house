import { useNavigate } from 'react-router-dom';
import { Button, Row, Col } from 'react-bootstrap';
import LiveChat from './LiveChat';
import Whiteboard from './Whiteboard';

function Home({ user, isAuth }) {
  const navigate = useNavigate();

  // Array delle immagini
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

  return (
    // Sfondo Dark con leggerissimo bagliore radiale al centro
    <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 w-100 py-5 animate-fade-in" style={{ background: 'radial-gradient(circle at top center, #1e1b4b 0%, #020617 60%)', overflowX: 'hidden' }}>
      
      {/* HEADER PREMIUM */}
      <div className="text-center px-4 mb-4" style={{ maxWidth: '1000px' }}>
        <h1 style={{ 
          fontSize: 'clamp(2.5rem, 6vw, 5rem)', 
          fontFamily: '"Playfair Display", serif',
          fontWeight: 900, 
          background: 'linear-gradient(to right, #f8fafc, #cbd5e1, #94a3b8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px', 
          lineHeight: '1.1',
          textShadow: '0px 10px 30px rgba(255,255,255,0.1)'
        }}>
          Benvenuti nella nostra dimora
        </h1>
        <p className="mt-3 mb-0" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)', color: '#818cf8', fontWeight: 400, fontStyle: 'italic', letterSpacing: '1px' }}>
          La Chill House più spierta di Torino. Vi amiamo.
        </p>
      </div>

      {/* GALLERIA CONTINUA (Nastro in Loop - Marquee con Fade ai bordi) */}
      <div className="w-100 my-4 position-relative overflow-hidden" style={{ 
        padding: '20px 0',
        maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
      }}>
        <style>{`
          .marquee-container {
            display: flex;
            width: max-content;
            animation: scroll-marquee 35s linear infinite;
          }
          
          /* Se l'utente passa col mouse, l'animazione va in pausa per guardare meglio la foto */
          .marquee-container:hover {
            animation-play-state: paused;
          }

          @keyframes scroll-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          
          .foto-seamless { 
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.4s ease, box-shadow 0.4s ease; 
            filter: brightness(0.75); 
            cursor: pointer;
            margin-right: 15px; /* Spazio tra le foto */
          }
          
          .foto-seamless:hover { 
            transform: scale(1.03) translateY(-10px); 
            filter: brightness(1.1);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8); 
            z-index: 10; 
            border-radius: 1rem; 
          }
        `}</style>
        
        <div className="marquee-container">
          {/* Raddoppiamo l'array delle foto per creare l'illusione di un ciclo infinito perfetto */}
          {[...fotoGalleria, ...fotoGalleria].map((src, index) => (
            <div key={index} className="foto-seamless position-relative" style={{ 
              flex: '0 0 auto', 
              width: 'clamp(230px, 25vw, 350px)', 
              height: 'clamp(350px, 55vh, 500px)', 
            }}>
              <img 
                src={src} 
                alt={`Chill House Frame ${index + 1}`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} 
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

      {/* SEZIONE LIVE CHAT E LAVAGNA (a metà pagina) */}
      {isAuth && (
        <div id="tour-chat-board" className="w-100 px-4 mt-5 d-flex justify-content-center">
          <div style={{ maxWidth: '1400px', width: '100%' }}>
            <Row className="g-5">
              <Col lg={6}>
                <Whiteboard user={user} />
              </Col>
              <Col lg={6}>
                <LiveChat user={user} />
              </Col>
            </Row>
          </div>
        </div>
      )}

    </div>
  );
}

export default Home;