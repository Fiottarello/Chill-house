import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import crypto from 'crypto';
import * as dao from './dao.mjs';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);

// Indispensabile per i proxy (es. Nginx su Oracle Cloud o altri servizi cloud)
app.set('trust proxy', 1);

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configurazione cartella Uploads e file statici
const uploadDir = 'public/uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Configurazione Multer per i file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})
const upload = multer({ storage: storage })

// ==========================================
// CONFIGURAZIONE CORS DINAMICA (Come richiesto)
// ==========================================
// Accetta connessioni locali di default
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

// Se nel docker-compose c'è la variabile FRONTEND_URL, la aggiunge a quelle autorizzate
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({ 
  origin: function(origin, callback){
    // Permetti se non c'è origin (es. chiamate server-to-server) o se è nella lista degli autorizzati
    if(!origin || allowedOrigins.includes(origin)){
      callback(null, true);
    } else {
      callback(new Error('Bloccato dalle policy CORS'));
    }
  }, 
  credentials: true 
})); 

// Configurazione Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// Condivisione Sessione con Socket.io (opzionale, ma utile per check auth)
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'segreto_casanostra_super_sicuro',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 
  } 
});

app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

// ==========================================

app.use(passport.initialize());
app.use(passport.session());

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ success: false, message: 'Non autenticato' });
}

function isAdmin(req, res, next) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Non autorizzato' });
}

function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex'));
    });
  });
}

passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, async (email, password, done) => {
  try {
    const user = await dao.getUserByEmail(email);
    if (!user) return done(null, false, { message: 'Utente non trovato' });

    const hashedPassword = await hashPassword(password, user.salt);
    if (hashedPassword !== user.password) return done(null, false, { message: 'Password errata' });
    return done(null, user);
  } catch (err) { return done(err); }
}));

passport.serializeUser((user, done) => { done(null, { id: user.id, role: user.role, stays_count: user.stays_count, has_seen_tutorial: user.has_seen_tutorial }); });
passport.deserializeUser(async (obj, done) => {
  try {
    const user = await dao.getUserById(obj.id);
    done(null, user || false);
  } catch (err) { done(err); }
});

// --- AUTH ---
app.post('/api/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return res.json({ success: false, errorMsg: 'Errore interno' });
    if (!user) return res.json({ success: false, errorMsg: info?.message });

    req.login(user, (err) => {
      if (err) return res.json({ success: false, errorMsg: 'Login fallito' });
      return res.json({ success: true, user: { id: user.id, name: user.name, surname: user.surname, email: user.email, role: user.role, avatar_url: user.avatar_url, descrizione_simpatica: user.descrizione_simpatica, stays_count: user.stays_count, has_seen_tutorial: user.has_seen_tutorial } });
    });
  })(req, res, next);
});

app.post('/api/logout', (req, res) => {
  req.logout(err => {
    if (err) return res.json({ success: false, message: 'Logout fallito' });
    req.session.destroy(() => {
      res.clearCookie('connect.sid', { path: '/' });
      return res.json({ success: true });
    });
  });
});

app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) return res.json({ isAuth: true, user: req.user });
  return res.json({ isAuth: false });
});

app.get('/api/user/prenotazioni', isAuthenticated, async (req, res) => {
  try {
    const data = await dao.getPrenotazioniByUserId(req.user.id);
    console.log(`Richiesta prenotazioni per utente ${req.user.id}. Trovate:`, data.length);
    res.json({ success: true, prenotazioni: data });
  } catch (err) { 
    console.error('Errore getPrenotazioniByUserId:', err);
    res.status(500).json({ success: false }); 
  }
});

app.get('/api/public/user/:id', isAuthenticated, async (req, res) => {
  try {
    const user = await dao.getUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false });
    res.json({ 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        avatar_url: user.avatar_url,
        occupazione: user.occupazione,
        come_conosciuto: user.come_conosciuto,
        descrizione_simpatica: user.descrizione_simpatica,
        stays_count: user.stays_count
      }
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.put('/api/user/tutorial', isAuthenticated, async (req, res) => {
  try {
    await dao.setTutorialSeen(req.user.id);
    req.user.has_seen_tutorial = 1; // Aggiorna la sessione corrente in memoria
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/register', async (req, res) => {
  try {
    const { name, surname, email, password, occupazione, da_quanto_ci_conosci, descrizione_simpatica, avatar_url, stays_count } = req.body;
    if (await dao.getUserByEmail(email)) return res.json({ success: false, errorMsg: 'Email già in uso' });

    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await hashPassword(password, salt);

    const newUserId = await dao.addUser({
      name, surname, email, password: hashedPassword, salt,
      occupazione: occupazione || '', 
      da_quanto_ci_conosci: da_quanto_ci_conosci || '', 
      descrizione_simpatica: descrizione_simpatica || '',
      avatar_url: avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      role: 'ospite',
      stays_count: parseInt(stays_count) || 0
    });

    const newUser = await dao.getUserById(newUserId);
    req.login(newUser, (err) => {
      if (err) return res.json({ success: false, errorMsg: 'Errore login' });
      return res.json({ success: true, user: newUser });
    });
  } catch (err) { console.error(err); res.json({ success: false, errorMsg: 'Errore interno' }); }
});

// --- API ---
app.get('/api/prenotazioni', async (req, res) => {
  try {
    const data = await dao.getAllPrenotazioni();
    res.json({ success: true, prenotazioni: data });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/prenotazioni', isAuthenticated, async (req, res) => {
  try {
    const { arrivo, partenza, numero_ospiti, nomi_ospiti, orario_arrivo, orario_partenza, stanza, note } = req.body;
    await dao.addPrenotazione({ user_id: req.user.id, arrivo, partenza, numero_ospiti, nomi_ospiti, orario_arrivo, orario_partenza, stanza, note, status: 'confermata' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.get('/api/recensioni', async (req, res) => {
  try {
    const data = await dao.getAllRecensioni();
    res.json({ success: true, recensioni: data });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/recensioni', isAuthenticated, upload.single('foto'), async (req, res) => {
  try {
    const { titolo, voto, commento } = req.body;
    const foto_url = req.file ? '/uploads/' + req.file.filename : null;
    await dao.addRecensione({ user_id: req.user.id, titolo, voto, commento, foto_url });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
});

app.put('/api/recensioni/:id/rispondi', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await dao.updateRispostaAdmin(req.params.id, req.body.risposta_admin);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// --- ADMIN API ---
app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const users = await dao.getAllUsers();
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.put('/api/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await dao.updateUser(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.delete('/api/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await dao.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.put('/api/admin/prenotazioni/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await dao.updatePrenotazione(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.delete('/api/admin/prenotazioni/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await dao.deletePrenotazione(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.get('/api/admin/chat', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const messages = await dao.getChatMessages();
    res.json({ success: true, messages });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.delete('/api/admin/chat/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await dao.deleteChatMessage(req.params.id);
    const messages = await dao.getChatMessages();
    io.emit('load_messages', messages); // Aggiorna la chat a tutti i client
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.delete('/api/admin/recensioni/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await dao.deleteRecensione(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.delete('/api/admin/schedine/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await dao.deleteSchedina(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.delete('/api/admin/sondaggi/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await dao.deleteSondaggio(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// ==================== TIPSTER & SCHEDINE ====================---
app.get('/api/schedine', isAuthenticated, async (req, res) => {
  try {
    const data = await dao.getAllSchedine();
    res.json({ success: true, schedine: data });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/schedine', isAuthenticated, upload.single('foto'), async (req, res) => {
  try {
    const { titolo, importo } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'Foto obbligatoria' });
    const foto_url = '/uploads/' + req.file.filename;
    await dao.addSchedina({ user_id: req.user.id, titolo, foto_url, importo: parseFloat(importo) || 0 });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
});

app.put('/api/schedine/:id/status', isAuthenticated, async (req, res) => {
  try {
    const schedina = await dao.getSchedinaById(req.params.id);
    if (!schedina) return res.status(404).json({ success: false });
    // Solo admin o il proprietario possono cambiare status
    if (req.user.role !== 'admin' && req.user.id !== schedina.user_id) {
      return res.status(403).json({ success: false });
    }
    await dao.updateSchedinaStatus(req.params.id, req.body.status);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/schedine/:id/gufo', isAuthenticated, async (req, res) => {
  try {
    const result = await dao.toggleGufo(req.user.id, req.params.id);
    res.json({ success: true, action: result.action });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
});

app.get('/api/benefattori', isAuthenticated, async (req, res) => {
  try {
    const data = await dao.getBenefattori();
    res.json({ success: true, benefattori: data });
  } catch (err) { res.status(500).json({ success: false }); }
});

// --- SONDAGGI API ---
app.get('/api/sondaggi', isAuthenticated, async (req, res) => {
  try {
    const data = await dao.getAllSondaggi();
    res.json({ success: true, sondaggi: data });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/sondaggi', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { domanda, opzioni } = req.body;
    await dao.addSondaggio(domanda, JSON.stringify(opzioni));
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
});

app.post('/api/sondaggi/:id/vota', isAuthenticated, async (req, res) => {
  try {
    const { opzioneIndex } = req.body;
    await dao.votaSondaggio(req.params.id, req.user.id, opzioneIndex);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
});

app.put('/api/sondaggi/:id/close', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await dao.closeSondaggio(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// --- API MALEDIZIONE POLLO ---
app.post('/api/slot/curse', isAuthenticated, async (req, res) => {
  try {
    const DURATION = 2 * 60 * 60 * 1000; // 2 ore
    await dao.applyCurse(req.user.id, '/pollo2.png', DURATION);
    res.json({ success: true, message: 'Sei stato maledetto da Zucca!' });
  } catch (err) { 
    console.error("Errore maledizione:", err); 
    res.status(500).json({ success: false }); 
  }
});

// --- WEBSOCKETS (CHAT) ---
io.on('connection', async (socket) => {
  console.log(`🔌 Nuovo client connesso: ${socket.id}`);

  // Invia gli ultimi messaggi al client appena si connette
  try {
    const messaggi = await dao.getChatMessages();
    socket.emit('load_messages', messaggi);
  } catch (err) {
    console.error("Errore caricamento messaggi chat", err);
  }

  socket.on('send_message', async (data) => {
    // data: { user_id, testo, immagine_b64 }
    // Attenzione: un vero sistema controllerebbe l'auth dalla sessione, per semplicità ci fidiamo del user_id passato se limitato.
    try {
      const newId = await dao.addChatMessage(data.user_id, data.testo, data.immagine_b64);
      // Recuperiamo i dati dell'utente per trasmetterli
      const user = await dao.getUserById(data.user_id);
      
      const messageToBroadcast = {
        id: newId,
        user_id: user.id,
        autore_nome: user.name,
        autore_avatar: user.avatar_url,
        testo: data.testo,
        immagine_b64: data.immagine_b64,
        timestamp: new Date().toISOString()
      };

      // Invia a tutti i client (incluso chi lo ha mandato)
      io.emit('receive_message', messageToBroadcast);
    } catch (err) {
      console.error("Errore salvataggio messaggio chat", err);
    }
  });

  // Soundboard globale
  socket.on('play_audio_command', (data) => {
    io.emit('play_audio_broadcast', data);
  });

  socket.on('play_video_command', (data) => {
    io.emit('play_video_broadcast', data);
  });

  // Whiteboard
  socket.on('draw_line', (data) => {
    // Trasmette a tutti gli altri
    socket.broadcast.emit('draw_line', data);
  });

  socket.on('clear_board', () => {
    io.emit('clear_board');
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Client disconnesso: ${socket.id}`);
  });
});

// Auto-pulizia vecchi messaggi ogni ora
setInterval(async () => {
  try {
    const deleted = await dao.cleanOldMessages();
    if (deleted > 0) console.log(`🧹 Pulizia chat: eliminati ${deleted} vecchi messaggi.`);
  } catch (err) {
    console.error("Errore pulizia chat", err);
  }
}, 3600000); // 1 ora

// Auto-rimozione maledizioni pollo ogni minuto
setInterval(async () => {
  try {
    await dao.removeExpiredCurses();
  } catch (err) {
    console.error("Errore rimozione maledizioni", err);
  }
}, 60000);

// Init colonne DB maledizione
dao.initCurseColumns().catch(e => console.log("Init maledizione OK (o colonne già presenti)."));

// Usa la porta fornita dal cloud, altrimenti usa la 3001
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`🚀 Backend (Express + Socket.io) in ascolto sulla porta ${PORT}`));