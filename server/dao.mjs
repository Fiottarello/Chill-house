import sqlite3 from 'sqlite3';

function openDb() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database('./data/casaNostra.sqlite', (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

function closeDb(db) {
  db.close((err) => { if (err) console.error("Errore chiusura database:", err.message); });
}

// ==================== USERS ====================
export const getUserByEmail = (email) =>
  openDb().then(db => new Promise((resolve, reject) => {
    db.get('SELECT * FROM user WHERE email = ?', [email], (err, row) => {
      closeDb(db);
      if (err) return reject(err);
      resolve(row || null);
    });
  }));

export const getUserById = (id) =>
  openDb().then(db => new Promise((resolve, reject) => {
    db.get('SELECT * FROM user WHERE id = ?', [id], (err, row) => {
      closeDb(db);
      if (err) return reject(err);
      resolve(row || null);
    });
  }));

export const addUser = (u) =>
  openDb().then(db => new Promise((resolve, reject) => {
    // Niente più phoneNumber qui!
    const sql = `INSERT INTO user(name, surname, email, password, salt, occupazione, da_quanto_ci_conosci, descrizione_simpatica, avatar_url, role, stays_count) 
                 VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [u.name, u.surname, u.email, u.password, u.salt, u.occupazione, u.da_quanto_ci_conosci, u.descrizione_simpatica, u.avatar_url, u.role, u.stays_count || 0], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.lastID);
    });
  }));

export const getAllUsers = () =>
  openDb().then(db => new Promise((resolve, reject) => {
    db.all('SELECT id, name, surname, email, occupazione, da_quanto_ci_conosci, descrizione_simpatica, avatar_url, role, stays_count FROM user', (err, rows) => {
      closeDb(db);
      if (err) return reject(err);
      resolve(rows);
    });
  }));

export const updateUser = (id, data) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = `UPDATE user SET name=?, surname=?, email=?, occupazione=?, da_quanto_ci_conosci=?, descrizione_simpatica=?, role=?, stays_count=? WHERE id=?`;
    db.run(sql, [data.name, data.surname, data.email, data.occupazione, data.da_quanto_ci_conosci, data.descrizione_simpatica, data.role, data.stays_count, id], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.changes);
    });
  }));

export const deleteUser = (id) =>
  openDb().then(db => new Promise((resolve, reject) => {
    db.run('DELETE FROM user WHERE id = ?', [id], function(err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.changes);
    });
  }));

export const setTutorialSeen = (id) =>
  openDb().then(db => new Promise((resolve, reject) => {
    db.run('UPDATE user SET has_seen_tutorial = 1 WHERE id = ?', [id], function(err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.changes);
    });
  }));

// ==================== PRENOTAZIONI ====================
export const getAllPrenotazioni = () =>
  openDb().then(db => new Promise((resolve, reject) => {
    db.all('SELECT * FROM prenotazioni', (err, rows) => {
      closeDb(db);
      if (err) return reject(err);
      resolve(rows);
    });
  }));

export const getPrenotazioniByUserId = (userId) =>
  openDb().then(db => new Promise((resolve, reject) => {
    db.all('SELECT * FROM prenotazioni WHERE user_id = ? ORDER BY arrivo DESC', [userId], (err, rows) => {
      closeDb(db);
      if (err) return reject(err);
      resolve(rows);
    });
  }));

export const addPrenotazione = (p) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'INSERT INTO prenotazioni(user_id, arrivo, partenza, numero_ospiti, nomi_ospiti, orario_arrivo, orario_partenza, stanza, note, status) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.run(sql, [p.user_id, p.arrivo, p.partenza, p.numero_ospiti, p.nomi_ospiti, p.orario_arrivo, p.orario_partenza, p.stanza, p.note, p.status], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.lastID);
    });
  }));

export const updatePrenotazione = (id, p) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = `UPDATE prenotazioni SET arrivo=?, partenza=?, numero_ospiti=?, nomi_ospiti=?, orario_arrivo=?, orario_partenza=?, stanza=?, note=?, status=? WHERE id=?`;
    db.run(sql, [p.arrivo, p.partenza, p.numero_ospiti, p.nomi_ospiti, p.orario_arrivo, p.orario_partenza, p.stanza, p.note, p.status, id], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.changes);
    });
  }));

export const deletePrenotazione = (id) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'DELETE FROM prenotazioni WHERE id=?';
    db.run(sql, [id], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.changes);
    });
  }));

// ==================== RECENSIONI ====================
export const getAllRecensioni = () =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = `
      SELECT r.*, u.name as autore_nome, u.avatar_url as autore_avatar, u.occupazione as autore_occupazione, u.stays_count as autore_stays_count
      FROM recensioni r
      JOIN user u ON r.user_id = u.id
      ORDER BY r.id DESC
    `;
    db.all(sql, (err, rows) => {
      closeDb(db);
      if (err) return reject(err);
      resolve(rows);
    });
  }));

export const addRecensione = (r) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'INSERT INTO recensioni(user_id, titolo, voto, commento, foto_url) VALUES(?, ?, ?, ?, ?)';
    db.run(sql, [r.user_id, r.titolo, r.voto, r.commento, r.foto_url], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.lastID);
    });
  }));

export const updateRispostaAdmin = (id, risposta) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'UPDATE recensioni SET risposta_admin = ? WHERE id = ?';
    db.run(sql, [risposta, id], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.changes);
    });
  }));

export const deleteRecensione = (id) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'DELETE FROM recensioni WHERE id = ?';
    db.run(sql, [id], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.changes);
    });
  }));

// ==================== SCHEDINE & GUFI ====================
export const getAllSchedine = () =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = `
      SELECT s.*, u.name as autore_nome, u.avatar_url as autore_avatar, 
             (SELECT COUNT(*) FROM gufi WHERE schedina_id = s.id) as gufi_count
      FROM schedine s
      JOIN user u ON s.user_id = u.id
      ORDER BY s.id DESC
    `;
    db.all(sql, (err, rows) => {
      closeDb(db);
      if (err) return reject(err);
      resolve(rows);
    });
  }));

export const addSchedina = (s) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'INSERT INTO schedine(user_id, titolo, foto_url, importo) VALUES(?, ?, ?, ?)';
    db.run(sql, [s.user_id, s.titolo, s.foto_url, s.importo], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.lastID);
    });
  }));

export const getSchedinaById = (id) =>
  openDb().then(db => new Promise((resolve, reject) => {
    db.get('SELECT * FROM schedine WHERE id = ?', [id], (err, row) => {
      closeDb(db);
      if (err) return reject(err);
      resolve(row);
    });
  }));

export const updateSchedinaStatus = (id, status) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'UPDATE schedine SET status = ? WHERE id = ?';
    db.run(sql, [status, id], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.changes);
    });
  }));

export const deleteSchedina = (id) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'DELETE FROM schedine WHERE id = ?';
    db.run(sql, [id], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.changes);
    });
  }));

export const toggleGufo = (userId, schedinaId) =>
  openDb().then(db => new Promise((resolve, reject) => {
    db.get('SELECT * FROM gufi WHERE user_id = ? AND schedina_id = ?', [userId, schedinaId], (err, row) => {
      if (err) { closeDb(db); return reject(err); }
      if (row) {
        db.run('DELETE FROM gufi WHERE user_id = ? AND schedina_id = ?', [userId, schedinaId], function(err) {
          closeDb(db);
          if (err) return reject(err);
          resolve({ action: 'removed' });
        });
      } else {
        db.run('INSERT INTO gufi(user_id, schedina_id) VALUES(?, ?)', [userId, schedinaId], function(err) {
          closeDb(db);
          if (err) return reject(err);
          resolve({ action: 'added' });
        });
      }
    });
  }));

export const getBenefattori = () =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = `
      SELECT u.id, u.name, u.avatar_url, SUM(s.importo) as totale_perso
      FROM schedine s
      JOIN user u ON s.user_id = u.id
      WHERE s.status = 'persa'
      GROUP BY u.id
      ORDER BY totale_perso DESC
    `;
    db.all(sql, (err, rows) => {
      closeDb(db);
      if (err) return reject(err);
      resolve(rows);
    });
  }));

// ==================== SONDAGGI ====================
export const getAllSondaggi = () =>
  openDb().then(db => new Promise((resolve, reject) => {
    db.all('SELECT * FROM sondaggi ORDER BY id DESC', (err, sondaggi) => {
      if (err) { closeDb(db); return reject(err); }
      
      db.all('SELECT * FROM sondaggi_voti', (err2, voti) => {
        closeDb(db);
        if (err2) return reject(err2);
        
        // Attacca i voti ai sondaggi
        const sondaggiConVoti = sondaggi.map(s => {
          const votiSondaggio = voti.filter(v => v.sondaggio_id === s.id);
          return { ...s, voti: votiSondaggio };
        });
        resolve(sondaggiConVoti);
      });
    });
  }));

export const addSondaggio = (domanda, opzioni_json) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'INSERT INTO sondaggi(domanda, opzioni_json) VALUES(?, ?)';
    db.run(sql, [domanda, opzioni_json], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.lastID);
    });
  }));

export const votaSondaggio = (sondaggioId, userId, opzioneIndex) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'INSERT OR REPLACE INTO sondaggi_voti (sondaggio_id, user_id, opzione_index) VALUES (?, ?, ?)';
    db.run(sql, [sondaggioId, userId, opzioneIndex], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.changes);
    });
  }));

export const closeSondaggio = (id) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'UPDATE sondaggi SET is_active = 0 WHERE id = ?';
    db.run(sql, [id], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.changes);
    });
  }));

export const deleteSondaggio = (id) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'DELETE FROM sondaggi WHERE id = ?';
    db.run(sql, [id], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.changes);
    });
  }));

// ==================== CHAT MESSAGES ====================
export const getChatMessages = () =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = `
      SELECT c.*, u.name as autore_nome, u.avatar_url as autore_avatar 
      FROM chat_messages c 
      JOIN user u ON c.user_id = u.id 
      ORDER BY c.timestamp ASC 
      LIMIT 100
    `;
    db.all(sql, (err, rows) => {
      closeDb(db);
      if (err) return reject(err);
      resolve(rows);
    });
  }));

export const addChatMessage = (user_id, testo, immagine_b64) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'INSERT INTO chat_messages(user_id, testo, immagine_b64) VALUES(?, ?, ?)';
    db.run(sql, [user_id, testo, immagine_b64], function (err) {
      closeDb(db);
      if (err) return reject(err);
      // Ritorna il messaggio appena creato formattato
      resolve(this.lastID);
    });
  }));

export const cleanOldMessages = () =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = "DELETE FROM chat_messages WHERE timestamp < datetime('now', '-2 days')";
    db.run(sql, function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.changes);
    });
  }));

export const deleteChatMessage = (id) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'DELETE FROM chat_messages WHERE id = ?';
    db.run(sql, [id], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.changes);
    });
  }));

// ==================== MALEDIZIONE POLLO ====================
export const initCurseColumns = () =>
  openDb().then(db => new Promise((resolve) => {
    db.run("ALTER TABLE user ADD COLUMN original_avatar_url TEXT", () => {
      db.run("ALTER TABLE user ADD COLUMN cursed_until INTEGER", () => {
        closeDb(db);
        resolve();
      });
    });
  }));

export const applyCurse = (userId, curseAvatarUrl, durationMs) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const expiredAt = Date.now() + durationMs;
    const sql = `UPDATE user 
                 SET original_avatar_url = COALESCE(original_avatar_url, avatar_url),
                     avatar_url = ?, 
                     cursed_until = ? 
                 WHERE id = ?`;
    db.run(sql, [curseAvatarUrl, expiredAt, userId], function(err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.changes);
    });
  }));

export const removeExpiredCurses = () =>
  openDb().then(db => new Promise((resolve, reject) => {
    const now = Date.now();
    const sql = `UPDATE user 
                 SET avatar_url = COALESCE(original_avatar_url, avatar_url),
                     original_avatar_url = NULL, 
                     cursed_until = NULL 
                 WHERE cursed_until IS NOT NULL AND cursed_until <= ?`;
    db.run(sql, [now], function(err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.changes);
    });
  }));