import sqlite3 from 'sqlite3';

function openDb() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database('./casaNostra.sqlite', (err) => {
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
    const sql = `INSERT INTO user(name, surname, email, password, salt, occupazione, da_quanto_ci_conosci, descrizione_simpatica, avatar_url, role) 
                 VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [u.name, u.surname, u.email, u.password, u.salt, u.occupazione, u.da_quanto_ci_conosci, u.descrizione_simpatica, u.avatar_url, u.role], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.lastID);
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

export const addPrenotazione = (p) =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = 'INSERT INTO prenotazioni(user_id, arrivo, partenza, numero_ospiti, nomi_ospiti, orario_arrivo, orario_partenza, stanza, note, status) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.run(sql, [p.user_id, p.arrivo, p.partenza, p.numero_ospiti, p.nomi_ospiti, p.orario_arrivo, p.orario_partenza, p.stanza, p.note, p.status], function (err) {
      closeDb(db);
      if (err) return reject(err);
      resolve(this.lastID);
    });
  }));

// ==================== RECENSIONI ====================
export const getAllRecensioni = () =>
  openDb().then(db => new Promise((resolve, reject) => {
    const sql = `
      SELECT r.*, u.name as autore_nome, u.avatar_url as autore_avatar, u.occupazione as autore_occupazione
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
    const sql = 'INSERT INTO recensioni(user_id, titolo, voto, commento) VALUES(?, ?, ?, ?)';
    db.run(sql, [r.user_id, r.titolo, r.voto, r.commento], function (err) {
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