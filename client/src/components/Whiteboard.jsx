import { useRef, useEffect, useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import { io } from 'socket.io-client';
import { API_BASE } from '../api/API.mjs';

const SERVER_URL = API_BASE.replace('/api', '');

function Whiteboard({ user }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [socket, setSocket] = useState(null);
  const [color, setColor] = useState('#f8fafc'); // Default white
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    const newSocket = io(SERVER_URL, { withCredentials: true });
    setSocket(newSocket);

    const canvas = canvasRef.current;
    // Set fixed high resolution internally
    canvas.width = 1400; 
    canvas.height = 1000;

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.strokeStyle = color;
    context.lineWidth = 6;
    contextRef.current = context;

    newSocket.on('draw_line', ({ x0, y0, x1, y1, strokeColor, eraser }) => {
      const ctx = contextRef.current;
      const prevColor = ctx.strokeStyle;
      const prevOp = ctx.globalCompositeOperation;
      const prevWidth = ctx.lineWidth;

      if (eraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 40; // Più grande per la gomma
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 6;
      }

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.closePath();

      // Restore
      ctx.strokeStyle = prevColor;
      ctx.globalCompositeOperation = prevOp;
      ctx.lineWidth = prevWidth;
    });

    newSocket.on('clear_board', () => {
      const ctx = contextRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Update color when changed
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
    }
  }, [color]);

  let currentPos = { x: 0, y: 0 };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = e.clientX;
    let clientY = e.clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault(); // Previene scroll su mobile
    const { x, y } = getCoordinates(e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
    currentPos = { x, y };
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
    
    if (socket) {
      socket.emit('draw_line', {
        x0: currentPos.x,
        y0: currentPos.y,
        x1: x,
        y1: y,
        strokeColor: color,
        eraser: isEraser
      });
    }
    currentPos = { x, y };
  };

  const stopDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
    if (socket) {
      socket.emit('clear_board');
    }
  };

  const toggleEraser = () => {
    setIsEraser(!isEraser);
    if (!isEraser) {
      // Attiviamo gomma
      contextRef.current.globalCompositeOperation = 'destination-out';
      contextRef.current.lineWidth = 40;
    } else {
      // Disattiviamo gomma
      contextRef.current.globalCompositeOperation = 'source-over';
      contextRef.current.lineWidth = 6;
    }
  };

  const sendToChat = () => {
    if (!socket || !user) return;
    
    // Per avere uno sfondo nero nell'immagine salvata (anziché trasparente)
    // creiamo un canvas temporaneo
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tCtx = tempCanvas.getContext('2d');
    
    // Riempiamo di colore scuro
    tCtx.fillStyle = '#020617';
    tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Disegniamo il contenuto della lavagna sopra
    tCtx.drawImage(canvas, 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.8);
    
    socket.emit('send_message', {
      user_id: user.id,
      testo: '🎨 Ho appena disegnato un capolavoro sulla lavagna!',
      immagine_b64: dataUrl
    });

    alert("Disegno inviato nella Chat con successo! 🎉");
  };

  return (
    <Card className="modern-card border-0 w-100 p-0 overflow-hidden d-flex flex-column shadow-lg" style={{ backgroundColor: '#0f172a', borderColor: '#334155', maxWidth: 'none', borderRadius: '1.5rem', height: '500px' }}>
      <div className="bg-dark text-white p-3 border-bottom border-secondary d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <span className="fs-4">🎨</span>
          <h5 className="mb-0 fw-bold">Lavagna Condivisa</h5>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <Button 
            variant={isEraser ? "light" : "outline-light"} 
            size="sm" 
            onClick={toggleEraser}
            title="Gomma"
            style={{ padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center' }}
          >
            {isEraser ? '🧽 Gomma Attiva' : '🧽'}
          </Button>
          {!isEraser && (
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)} 
              style={{ width: '30px', height: '30px', padding: '0', border: 'none', cursor: 'pointer', background: 'transparent' }} 
              title="Scegli Colore"
            />
          )}
          <Button variant="outline-danger" size="sm" onClick={clearBoard} title="Pulisci la lavagna per tutti">🗑️</Button>
          <Button variant="primary" size="sm" onClick={sendToChat} title="Invia questo disegno nella Live Chat" style={{ backgroundColor: '#4f46e5', borderColor: '#4f46e5', fontWeight: 'bold' }}>
            Invia in Chat 🚀
          </Button>
        </div>
      </div>
      
      <div className="flex-grow-1 position-relative w-100" style={{ cursor: 'crosshair', backgroundColor: '#020617' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </div>
    </Card>
  );
}

export default Whiteboard;
