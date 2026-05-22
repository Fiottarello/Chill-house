import crypto from 'crypto';

export class User {
    constructor({ id = null, name, surname, email, password_hash, salt, occupazione = '', da_quanto_ci_conosci = '', descrizione_simpatica = '', avatar_url = '', role = 'ospite' }) {
        this.id = id;
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.password = password_hash;
        this.salt = salt;
        this.occupazione = occupazione;
        this.da_quanto_ci_conosci = da_quanto_ci_conosci;
        this.descrizione_simpatica = descrizione_simpatica;
        this.avatar_url = avatar_url;
        this.role = role; 
    }

    static async create(name, surname, email, plainPassword, occupazione, da_quanto_ci_conosci, descrizione_simpatica, avatar_url, role = 'ospite') {
        const salt = crypto.randomBytes(16).toString('hex');
        const password_hash = await new Promise((resolve, reject) => {
            crypto.scrypt(plainPassword, salt, 64, (err, derivedKey) => {
                if (err) reject(err);
                else resolve(derivedKey.toString('hex'));
            });
        });

        return new User({ name, surname, email, password_hash, salt, occupazione, da_quanto_ci_conosci, descrizione_simpatica, avatar_url, role });
    }
}

export class Prenotazione {
    constructor({ id = null, user_id, arrivo, partenza, numero_ospiti, nomi_ospiti = '', orario_arrivo = '', orario_partenza = '', stanza, note = '', status = 'confermata' }) {
        this.id = id;
        this.user_id = user_id;
        this.arrivo = arrivo;
        this.partenza = partenza;
        this.numero_ospiti = numero_ospiti;
        this.nomi_ospiti = nomi_ospiti;
        this.orario_arrivo = orario_arrivo;
        this.orario_partenza = orario_partenza;
        this.stanza = stanza;
        this.note = note;
        this.status = status;
    }
}

export class Recensione {
    constructor({ id = null, user_id, titolo, voto, commento, foto_url = '', risposta_admin = '' }) {
        this.id = id;
        this.user_id = user_id;
        this.titolo = titolo;
        this.voto = voto;
        this.commento = commento;
        this.foto_url = foto_url;
        this.risposta_admin = risposta_admin;
    }
}