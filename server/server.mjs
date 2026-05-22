import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import crypto from 'crypto';
import * as dao from './dao.mjs';

const app = express();

// Indispensabile per i server cloud in produzione (Vercel/Render/Railway) dietro a proxy HTTPS
app.set('trust proxy', 1);

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configurazione CORS dinamica: accetta localhost in sviluppo e il link di Vercel in produzione
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({ 
  origin: function(origin, callback){
    if(!origin || allowedOrigins.includes(origin)){
      callback(null, true);
    } else {
      callback(new Error('Non consentito dal CORS'));
    }
  }, 
  credentials: true 
})); 

// Configurazione Sessione "Cloud Ready"
const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
  secret: process.env.SESSION_SECRET || 'segreto_casanostra_super_sicuro',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: isProduction, // Deve essere true in produzione (su HTTPS)
    sameSite: isProduction ? 'none' : 'lax', // 'none' serve per far viaggiare il cookie tra frontend e backend separati
    maxAge: 1000 * 60 * 60 * 24 * 7 // Il login dura una settimana
  } 
}));

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

passport.serializeUser((user, done) => { done(null, { id: user.id, role: user.role }); });
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
      return res.json({ success: true, user: { id: user.id, name: user.name, surname: user.surname, email: user.email, role: user.role, avatar_url: user.avatar_url, descrizione_simpatica: user.descrizione_simpatica } });
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

app.post('/api/register', async (req, res) => {
  try {
    const { name, surname, email, password, occupazione, da_quanto_ci_conosci, descrizione_simpatica, avatar_url } = req.body;
    if (await dao.getUserByEmail(email)) return res.json({ success: false, errorMsg: 'Email già in uso' });

    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await hashPassword(password, salt);

    const newUserId = await dao.addUser({
      name, surname, email, password: hashedPassword, salt,
      occupazione: occupazione || '', 
      da_quanto_ci_conosci: da_quanto_ci_conosci || '', 
      descrizione_simpatica: descrizione_simpatica || '',
      avatar_url: avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      role: 'ospite'
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

app.post('/api/recensioni', isAuthenticated, async (req, res) => {
  try {
    const { titolo, voto, commento } = req.body;
    await dao.addRecensione({ user_id: req.user.id, titolo, voto, commento });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.put('/api/recensioni/:id/rispondi', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await dao.updateRispostaAdmin(req.params.id, req.body.risposta_admin);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// Usa la porta fornita dal cloud, altrimenti usa la 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Backend in ascolto sulla porta ${PORT}`));