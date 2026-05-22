import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { User } from './models.mjs';

const databaseName = 'casaNostra.sqlite';

async function setupDatabase() {
    const db = await open({
        filename: databaseName,
        driver: sqlite3.Database
    });

    console.log("✅ Database connesso");

    // ELIMINIAMO LE VECCHIE TABELLE PER FORZARE L'AGGIORNAMENTO DELLO SCHEMA
    console.log("⚠️ Eliminazione vecchie tabelle in corso per aggiornare lo schema...");
    await db.run(`DROP TABLE IF EXISTS recensioni`);
    await db.run(`DROP TABLE IF EXISTS prenotazioni`);
    await db.run(`DROP TABLE IF EXISTS user`);

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
        role TEXT NOT NULL DEFAULT 'ospite'
    )`);

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

    // Inserimento Admin di base
    const adminUser = await User.create(
        "Simone", "Vergine", "admin@admin.com", "admin123", 
        "", "Dev", "Da sempre", "Fondatore super simpatico", "", "admin"
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