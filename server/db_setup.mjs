import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { User } from './models.mjs';

import fs from 'fs';

const dataDir = './data';
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const databaseName = './data/casaNostra.sqlite';

async function setupDatabase() {
    const db = await open({
        filename: databaseName,
        driver: sqlite3.Database
    });

    console.log("✅ Database connesso");

    // Non eliminiamo le tabelle per mantenere la persistenza
    console.log("⚠️ Verifica e creazione tabelle in corso (nessun dato verrà cancellato)...");


    // 1. TABELLA UTENTI (Con campi extra per profilo)
    await db.run(`CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        surname TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        salt TEXT NOT NULL,
        occupazione TEXT,
        da_quanto_ci_conosci TEXT,
        descrizione_simpatica TEXT,
        avatar_url TEXT,
        role TEXT NOT NULL DEFAULT 'ospite',
        stays_count INTEGER DEFAULT 0
    )`);

    // Prova ad aggiungere la colonna stays_count nel caso in cui la tabella esista già (aggiornamento schema safe)
    try {
        await db.run(`ALTER TABLE user ADD COLUMN stays_count INTEGER DEFAULT 0`);
        console.log("✅ Colonna stays_count aggiunta alla tabella user.");
    } catch (e) {
        // La colonna esiste già, nessun problema
    }

    // Prova ad aggiungere la colonna has_seen_tutorial (aggiornamento schema safe)
    try {
        await db.run(`ALTER TABLE user ADD COLUMN has_seen_tutorial INTEGER DEFAULT 0`);
        console.log("✅ Colonna has_seen_tutorial aggiunta alla tabella user.");
    } catch (e) {
        // La colonna esiste già, nessun problema
    }

    // 2. TABELLA PRENOTAZIONI (Con campi espansi come nel progetto precedente)
    await db.run(`CREATE TABLE IF NOT EXISTS prenotazioni (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        arrivo TEXT NOT NULL,
        partenza TEXT NOT NULL,
        numero_ospiti INTEGER NOT NULL,
        nomi_ospiti TEXT,
        orario_arrivo TEXT,
        orario_partenza TEXT,
        stanza TEXT NOT NULL,
        note TEXT,
        status TEXT NOT NULL DEFAULT 'confermata',
        FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE
    )`);

    // 3. TABELLA RECENSIONI (Con supporto foto)
    await db.run(`CREATE TABLE IF NOT EXISTS recensioni (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        titolo TEXT NOT NULL,
        voto INTEGER NOT NULL,
        commento TEXT NOT NULL,
        foto_url TEXT,
        risposta_admin TEXT,
        FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE
    )`);

    // 4. TABELLA SCHEDINE (Tipster)
    await db.run(`CREATE TABLE IF NOT EXISTS schedine (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        titolo TEXT NOT NULL,
        foto_url TEXT NOT NULL,
        importo REAL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'in corso',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE
    )`);

    // 5. TABELLA GUFI (Like negativi sulle schedine)
    await db.run(`CREATE TABLE IF NOT EXISTS gufi (
        user_id INTEGER NOT NULL,
        schedina_id INTEGER NOT NULL,
        PRIMARY KEY (user_id, schedina_id),
        FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE,
        FOREIGN KEY(schedina_id) REFERENCES schedine(id) ON DELETE CASCADE
    )`);

    // 6. TABELLA SONDAGGI (Live Polls)
    await db.run(`CREATE TABLE IF NOT EXISTS sondaggi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domanda TEXT NOT NULL,
        opzioni_json TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 7. TABELLA VOTI SONDAGGI
    await db.run(`CREATE TABLE IF NOT EXISTS sondaggi_voti (
        sondaggio_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        opzione_index INTEGER NOT NULL,
        PRIMARY KEY (sondaggio_id, user_id),
        FOREIGN KEY(sondaggio_id) REFERENCES sondaggi(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE
    )`);

    // 8. TABELLA MESSAGGI CHAT
    await db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        testo TEXT,
        immagine_b64 TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE
    )`);

    // Inserimento Admin di base
    const adminUser = await User.create(
        "Simone", "Vergine", "admin@admin.com", "admin123", 
        "Dev", "Da sempre", "Fondatore super simpatico", "", "admin"
    );
    
    try {
        const sqlInsertUser = await db.prepare(`INSERT INTO user 
            (name, surname, email, password, salt, occupazione, da_quanto_ci_conosci, descrizione_simpatica, avatar_url, role) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        await sqlInsertUser.run(
            adminUser.name, adminUser.surname, adminUser.email, adminUser.password, adminUser.salt, 
            adminUser.occupazione, adminUser.da_quanto_ci_conosci, adminUser.descrizione_simpatica, adminUser.avatar_url, adminUser.role
        );
        await sqlInsertUser.finalize();
        console.log("✅ Admin inserito (admin@admin.com - admin123)");
    } catch (err) {
        console.log("⚠️ Admin già presente.");
    }

    console.log("✅ Setup completato!");
}

setupDatabase().catch(err => console.error("❌ Errore setup:", err));