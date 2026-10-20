import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carica variabili d'ambiente da .env
dotenv.config({ path: path.join(__dirname, '.env') });

/**
 * Crea e restituisce il transporter di Nodemailer.
 * Supporta configurazione diretta Gmail oppure parametri SMTP generici.
 */
function getTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    return null;
  }

  // Se è specificato un host SMTP personalizzato (es. Aruba, Outlook, Brevo)
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
  }

  // Default: configurazione automatica per Gmail (richiede App Password di Google)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
}

/**
 * Formatta una data YYYY-MM-DD in formato leggibile italiano (es: "15 Giugno 2026")
 */
function formatDateIt(dateStr) {
  if (!dateStr) return 'Da concordare';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    return new Date(dateStr).toLocaleDateString('it-IT');
  } catch {
    return dateStr;
  }
}

/**
 * Invia l'email di conferma prenotazione all'ospite e facoltativamente agli admin.
 */
export async function sendBookingConfirmation(user, booking) {
  const userEmail = user?.email;
  const userName = user?.name || 'Ospite';

  if (!userEmail) {
    console.warn('[MAILER] ⚠️ Nessuna email trovata per l\'utente:', user);
    return false;
  }

  const transporter = getTransporter();
  const fromAddress = process.env.EMAIL_FROM || `"Casa Chill 🏠" <${process.env.EMAIL_USER || 'casachill@casamia.local'}>`;
  const adminNotify = process.env.ADMIN_NOTIFY_EMAIL || process.env.EMAIL_USER;

  const arrivoFormattato = formatDateIt(booking.arrivo);
  const partenzaFormattata = formatDateIt(booking.partenza);
  const orarioArrivo = booking.orario_arrivo ? booking.orario_arrivo : 'Non specificato';
  const orarioPartenza = booking.orario_partenza ? booking.orario_partenza : 'Non specificato';
  const stanza = booking.stanza || 'Da definire';
  const numeroOspiti = booking.numero_ospiti || 1;
  const nomiOspiti = booking.nomi_ospiti || userName;
  const note = booking.note && booking.note.trim() ? booking.note : 'Nessuna nota particolare';

  // Testo semplice per client email senza supporto HTML
  const textContent = `
Ciao ${userName}! 🎉

La tua prenotazione a Casa Chill è stata confermata con successo!

RIASSUNTO PRENOTAZIONE:
------------------------------------------
• Arrivo: ${arrivoFormattato} (Orario indicativo: ${orarioArrivo})
• Partenza: ${partenzaFormattata} (Orario indicativo: ${orarioPartenza})
• Stanza / Posto letto: ${stanza}
• Numero Ospiti: ${numeroOspiti}
• Ospiti e sistemazione: ${nomiOspiti}
• Note: ${note}
------------------------------------------

Vi aspettiamo a braccia aperte! Mettiti comodo, porta la tua miglior presa bene e magari qualcosa da bere o mangiare in compagnia. 🍻🍕
Se dovessero esserci variazioni o imprevisti, avvisaci direttamente sul sito o in chat!

A prestissimo,
Il team di Casa Chill 🏠
  `.trim();

  // Template HTML graficamente curato
  const htmlContent = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prenotazione Confermata - Casa Chill</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .wrapper {
      width: 100%;
      background-color: #0f172a;
      padding: 30px 10px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #1e293b;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #334155;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      padding: 35px 25px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 8px 0 0 0;
      font-size: 15px;
      opacity: 0.95;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      background-color: rgba(255, 255, 255, 0.2);
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .content {
      padding: 30px 25px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #f8fafc;
      margin-bottom: 12px;
    }
    .summary-card {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .summary-title {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #818cf8;
      font-weight: 700;
      margin-bottom: 15px;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 8px;
    }
    .row {
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dashed #1e293b;
      padding-bottom: 10px;
    }
    .row:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .label {
      color: #94a3b8;
      font-size: 14px;
      font-weight: 500;
    }
    .val {
      color: #f1f5f9;
      font-size: 14px;
      font-weight: 600;
      text-align: right;
    }
    .highlight-pill {
      background-color: #312e81;
      color: #c7d2fe;
      padding: 3px 8px;
      border-radius: 6px;
      display: inline-block;
      font-size: 13px;
    }
    .friendly-box {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
      border-left: 4px solid #818cf8;
      padding: 18px;
      border-radius: 0 12px 12px 0;
      margin: 25px 0 15px 0;
      color: #cbd5e1;
      font-size: 15px;
      line-height: 1.5;
    }
    .friendly-box strong {
      color: #ffffff;
      display: block;
      margin-bottom: 6px;
      font-size: 16px;
    }
    .footer {
      background: #0b1120;
      padding: 20px;
      text-align: center;
      color: #64748b;
      font-size: 12px;
      border-top: 1px solid #1e293b;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <!-- HEADER -->
      <div class="header">
        <div class="badge">Conferma Prenotazione</div>
        <h1>Casa Chill 🏠✨</h1>
        <p>Il tuo soggiorno è ufficialmente registrato!</p>
      </div>

      <!-- CORPO -->
      <div class="content">
        <div class="greeting">Ciao ${userName}! 👋</div>
        <p style="color: #94a3b8; font-size: 15px; line-height: 1.5; margin: 0 0 20px 0;">
          Abbiamo registrato la tua prenotazione. Ecco il riepilogo dettagliato del tuo soggiorno:
        </p>

        <!-- RIASSUNTO STILE ADMIN PANEL -->
        <div class="summary-card">
          <div class="summary-title">📋 Dettaglio Prenotazione</div>
          
          <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #1e293b;">
              <td class="label" style="padding: 8px 0; color: #94a3b8; font-size: 14px;">📅 Check-in (Arrivo):</td>
              <td class="val" style="padding: 8px 0; text-align: right; color: #f1f5f9; font-weight: 600; font-size: 14px;">
                ${arrivoFormattato} <br>
                <span style="color: #38bdf8; font-size: 12px; font-weight: normal;">(Orario: ${orarioArrivo})</span>
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #1e293b;">
              <td class="label" style="padding: 8px 0; color: #94a3b8; font-size: 14px;">📅 Check-out (Partenza):</td>
              <td class="val" style="padding: 8px 0; text-align: right; color: #f1f5f9; font-weight: 600; font-size: 14px;">
                ${partenzaFormattata} <br>
                <span style="color: #38bdf8; font-size: 12px; font-weight: normal;">(Orario: ${orarioPartenza})</span>
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #1e293b;">
              <td class="label" style="padding: 8px 0; color: #94a3b8; font-size: 14px;">🛏️ Stanza / Sistemazione:</td>
              <td class="val" style="padding: 8px 0; text-align: right; color: #f1f5f9; font-weight: 600; font-size: 14px;">
                <span style="background-color: #312e81; color: #c7d2fe; padding: 2px 8px; border-radius: 4px;">${stanza}</span>
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #1e293b;">
              <td class="label" style="padding: 8px 0; color: #94a3b8; font-size: 14px;">👥 Numero Ospiti:</td>
              <td class="val" style="padding: 8px 0; text-align: right; color: #f1f5f9; font-weight: 600; font-size: 14px;">
                ${numeroOspiti}
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #1e293b;">
              <td class="label" style="padding: 8px 0; color: #94a3b8; font-size: 14px;">🧑‍🤝‍🧑 Ospiti e Posti Assegnati:</td>
              <td class="val" style="padding: 8px 0; text-align: right; color: #fbbf24; font-weight: 600; font-size: 13px;">
                ${nomiOspiti}
              </td>
            </tr>
            <tr>
              <td class="label" style="padding: 8px 0; color: #94a3b8; font-size: 14px;">📝 Note:</td>
              <td class="val" style="padding: 8px 0; text-align: right; color: #cbd5e1; font-style: italic; font-size: 13px;">
                ${note}
              </td>
            </tr>
          </table>
        </div>

        <!-- FRASE CARINA -->
        <div class="friendly-box">
          <strong>Ti aspettiamo a braccia aperte! 🥂🎉</strong>
          Mettiti comodo, porta la tua miglior presa bene e magari qualcosa di buono da bere o stuzzicare in compagnia. 🍻🍕
          <br><br>
          <em>Se ci sono imprevisti o cambi di programma, scrivici pure sul sito o nella chat di gruppo!</em>
        </div>

      </div>

      <!-- FOOTER -->
      <div class="footer">
        Casa Chill • Notifica automatica generata dal sistema prenotazioni.<br>
        Ci vediamo presto a casa! 🏠
      </div>

    </div>
  </div>
</body>
</html>
  `.trim();

  // Se transporter non è configurato, stampiamo a log un'anteprima carina
  if (!transporter) {
    console.log('\n================== 📬 ANTEPRIMA EMAIL PRENOTAZIONE (Simulazione) ==================');
    console.log(`Destinatario: ${userEmail} (${userName})`);
    console.log(`Oggetto: Conferma Prenotazione - Casa Chill 🏠✨`);
    console.log('-----------------------------------------------------------------------------------');
    console.log(textContent);
    console.log('-----------------------------------------------------------------------------------');
    console.log('⚠️ [NOTA] L\'email reale non è stata spedita perché EMAIL_USER / EMAIL_PASS non sono ancora configurati nel file .env.');
    console.log('===================================================================================\n');
    return true;
  }

  const mailOptions = {
    from: fromAddress,
    to: userEmail,
    subject: `Prenotazione Confermata a Casa Chill! 🏠✨ (${arrivoFormattato})`,
    text: textContent,
    html: htmlContent
  };

  // Se impostato, invia anche una copia (BCC) all'admin della casa
  if (adminNotify && adminNotify !== userEmail) {
    mailOptions.bcc = adminNotify;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAILER] ✅ Email di conferma inviata con successo a ${userEmail} (MessageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`[MAILER] ❌ Errore durante l'invio dell'email a ${userEmail}:`, error.message);
    return false;
  }
}
