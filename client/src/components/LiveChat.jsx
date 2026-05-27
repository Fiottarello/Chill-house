import { useState, useEffect, useRef } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { io } from 'socket.io-client';
import { API_BASE } from '../api/API.mjs';

// Deriviamo l'URL di base del server rimuovendo la parte '/api'
const SERVER_URL = API_BASE.replace('/api', '');

function LiveChat({ user }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showVideoOverlay, setShowVideoOverlay] = useState(false);
  
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll in basso quando arrivano nuovi messaggi, limitato al solo contenitore della chat
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Inizializza Socket
    const newSocket = io(SERVER_URL, {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log("Connesso alla Live Chat");
    });

    newSocket.on('load_messages', (storico) => {
      setMessages(storico);
    });

    newSocket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    newSocket.on('play_audio_broadcast', (data) => {
      const commandMap = {
        '/sborrax': 'sborrax.mp3',
        '/primostep': 'primostep.mp3',
        '/zucca': 'zucca.mp3'
      };
      const fileName = commandMap[data.command];
      if (fileName) {
        const audio = new Audio(`/${fileName}`);
        audio.play().catch(e => console.error("Errore riproduzione audio:", e));
      }
    });

    newSocket.on('play_video_broadcast', (data) => {
      if (data.command === '/pasticciotto') {
        setShowVideoOverlay(true);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Funzione per ridimensionare l'immagine e convertirla in Base64 (max 800px)
  const resizeImageAndConvertBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() && !imageFile) return;

    const testoSistemato = inputValue.trim().toLowerCase();
    const comandiAudio = ['/sborrax', '/primostep', '/zucca'];
    
    // Se è un comando audio, suona per tutti e non inviare testo
    if (comandiAudio.includes(testoSistemato) && !imageFile) {
      socket.emit('play_audio_command', { command: testoSistemato });
      setInputValue('');
      return;
    }

    // Se è il comando video pasticciotto
    if (testoSistemato === '/pasticciotto' && !imageFile) {
      socket.emit('play_video_command', { command: testoSistemato });
      setInputValue('');
      return;
    }

    let base64Image = null;
    if (imageFile) {
      try {
        base64Image = await resizeImageAndConvertBase64(imageFile);
      } catch (err) {
        alert("Errore nell'elaborazione dell'immagine");
        return;
      }
    }

    const data = {
      user_id: user.id,
      testo: inputValue,
      immagine_b64: base64Image
    };

    socket.emit('send_message', data);
    setInputValue('');
    setImageFile(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      {showVideoOverlay && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.9)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <video 
            src="/pasticciotto.mp4" 
            autoPlay 
            controls={false}
            onEnded={() => setShowVideoOverlay(false)}
            style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '20px', boxShadow: '0 0 50px rgba(129, 140, 248, 0.5)' }}
          />
        </div>
      )}

      <Card className="modern-card border-0 w-100 p-0 overflow-hidden d-flex flex-column shadow-lg" style={{ height: '500px', backgroundColor: '#0f172a', borderColor: '#334155', maxWidth: 'none', borderRadius: '1.5rem' }}>
      
      {/* Header */}
      <div className="bg-dark text-white p-3 border-bottom border-secondary d-flex align-items-center gap-2">
        <span className="fs-4">💬</span>
        <h5 className="mb-0 fw-bold">Chill Chat (Live)</h5>
        <span className="ms-auto text-success fw-bold small">● Online</span>
      </div>

      {/* Messaggi */}
      <div ref={messagesContainerRef} className="p-3 flex-grow-1 overflow-auto" style={{ backgroundColor: '#020617' }}>
        {messages.length === 0 ? (
          <div className="text-center text-muted mt-5 fst-italic">Nessun messaggio recente. Rompi il ghiaccio!</div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.user_id === user.id;
            return (
              <div key={idx} className={`d-flex mb-3 ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                
                {/* Avatar (solo se non sono io) */}
                {!isMe && (
                  <img 
                    src={msg.autore_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80"} 
                    alt="avatar" 
                    className="rounded-circle me-2 mt-1 border border-secondary"
                    style={{ width: '35px', height: '35px', objectFit: 'cover' }}
                  />
                )}

                {/* Bolla */}
                <div 
                  className={`p-2 rounded-3 shadow-sm ${isMe ? 'bg-primary text-white' : 'bg-dark text-light border border-secondary'}`} 
                  style={{ maxWidth: '75%', borderBottomRightRadius: isMe ? '0' : '0.5rem', borderBottomLeftRadius: !isMe ? '0' : '0.5rem' }}
                >
                  {!isMe && <div className="fw-bold small text-info mb-1">{msg.autore_nome}</div>}
                  
                  {msg.testo && <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.testo}</div>}
                  
                  {msg.immagine_b64 && (
                    <img src={msg.immagine_b64} alt="allegato" className="img-fluid rounded mt-2 border border-secondary" style={{ maxHeight: '200px' }} />
                  )}
                  
                  <div className={`small mt-1 text-end ${isMe ? 'text-light opacity-75' : 'text-muted'}`} style={{ fontSize: '0.7rem' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-dark border-top border-secondary">
        {imageFile && (
          <div className="mb-2 text-info small d-flex justify-content-between align-items-center">
            <span>📎 Immagine allegata ({imageFile.name})</span>
            <span style={{ cursor: 'pointer' }} onClick={() => { setImageFile(null); fileInputRef.current.value = ""; }}>❌ Rimuovi</span>
          </div>
        )}
        <Form onSubmit={handleSend} className="d-flex gap-2">
          <Button variant="outline-secondary" className="rounded-circle d-flex align-items-center justify-content-center p-0" style={{ width: '40px', height: '40px' }} onClick={() => fileInputRef.current.click()}>
            <span className="fs-5">📸</span>
          </Button>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            className="d-none" 
            onChange={(e) => setImageFile(e.target.files[0])} 
          />
          <Form.Control 
            className="modern-input" 
            placeholder="Scrivi un messaggio..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Button type="submit" className="btn-indigo px-3 rounded-pill">Invia</Button>
        </Form>
      </div>

    </Card>
    </>
  );
}

export default LiveChat;
