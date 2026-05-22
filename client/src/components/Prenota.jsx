import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { fetchPrenotazioni, submitPrenotazione } from '../api/API.mjs';

function Prenota({ isAuth }) {
  const [dateSelezionate, setDateSelezionate] = useState([new Date(), new Date(Date.now() + 86400000)]);
  const [form, setForm] = useState({ numero_ospiti: 1, nomi_ospiti: '', orario_arrivo: '14:00', orario_partenza: '10:00', stanza: 'Stanza Matrimoniale con Samuele', note: '' });
  
  const [prenotazioniEsistenti, setPrenotazioniEsistenti] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPrenotazioni().then(data => setPrenotazioniEsistenti(data || [])).catch(err => console.error(err));
  }, []);

  const normalizzaData = (data) => {
    const d = new Date(data);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const isGiornoOccupato = (dataDaControllare) => {
    const dataControllo = normalizzaData(dataDaControllare);
    return prenotazioniEsistenti.some(p => {
      const arrivo = normalizzaData(p.arrivo);
      const partenza = normalizzaData(p.partenza);
      return dataControllo >= arrivo && dataControllo < partenza;
    });
  };

  const gestisciPrenotazione = async (e) => {
    e.preventDefault();
    if (!isAuth) { alert("Devi essere loggato!"); return; }

    setLoading(true);
    const offset = dateSelezionate[0].getTimezoneOffset() * 60000;
    const arrivoFormatted = new Date(dateSelezionate[0] - offset).toISOString().split('T')[0];
    const partenzaFormatted = dateSelezionate[1] ? new Date(dateSelezionate[1] - offset).toISOString().split('T')[0] : arrivoFormatted;

    try {
      await submitPrenotazione({ ...form, arrivo: arrivoFormatted, partenza: partenzaFormatted });
      alert("🎉 Prenotazione confermata!");
      fetchPrenotazioni().then(data => setPrenotazioniEsistenti(data || []));
    } catch (error) { alert("Errore: " + error); }
    finally { setLoading(false); }
  };

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        {/* Modifica: Colore impostato su chiaro #f1f5f9 */}
        <h2 className="fw-bolder" style={{ fontSize: '2.5rem', color: '#f1f5f9' }}>Blocca le tue date 📅</h2>
        <p className="text-muted">I giorni evidenziati sono già occupati.</p>
      </div>

      <Row className="g-5 justify-content-center">
        {/* LATO CALENDARIO */}
        <Col md={6} className="d-flex justify-content-center">
          <div className="modern-card p-4 d-flex justify-content-center w-100">
            <Calendar 
              onChange={setDateSelezionate} value={dateSelezionate} selectRange={true}
              locale="it-IT" minDate={new Date()} className="border-0 w-100"
              tileDisabled={({ date }) => isGiornoOccupato(date)}
            />
          </div>
        </Col>

        {/* LATO FORM */}
        <Col md={6}>
          <div className="modern-card h-100">
            <Form onSubmit={gestisciPrenotazione}>
              <h5 className="fw-bold mb-4" style={{ color: '#818cf8' }}>Dettagli Soggiorno</h5>
              
              <Row>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted text-uppercase">N. Ospiti</Form.Label>
                    <Form.Control type="number" min="1" className="modern-input" value={form.numero_ospiti} onChange={e => setForm({...form, numero_ospiti: e.target.value})} />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted text-uppercase">Stanza</Form.Label>
                    <Form.Select className="modern-input" value={form.stanza} onChange={e => setForm({...form, stanza: e.target.value})}>
                      <option value="Stanza Matrimoniale con Samuele">Stanza Matrimoniale con Samuele</option>
                      <option value="Stanza Simone">Stanza Simone</option>
                      <option value="Brandina">Brandina</option>
                      <option value="Divano comodissimo">Divano comodissimo</option>
                      <option value="Tavolo">Tavolo</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted text-uppercase">Nomi Ospiti</Form.Label>
                <Form.Control className="modern-input" placeholder="Es. Mario, Luigi..." required onChange={e => setForm({...form, nomi_ospiti: e.target.value})} />
              </Form.Group>

              <Row>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted text-uppercase">Orario Arrivo</Form.Label>
                    <Form.Control type="time" className="modern-input" value={form.orario_arrivo} required onChange={e => setForm({...form, orario_arrivo: e.target.value})} />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted text-uppercase">Orario Partenza</Form.Label>
                    <Form.Control type="time" className="modern-input" value={form.orario_partenza} required onChange={e => setForm({...form, orario_partenza: e.target.value})} />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-muted text-uppercase">Note Extra</Form.Label>
                <Form.Control as="textarea" className="modern-input" rows={2} onChange={e => setForm({...form, note: e.target.value})} />
              </Form.Group>

              <Button type="submit" className="w-100 btn-indigo" disabled={!isAuth || loading}>
                {isAuth ? (loading ? 'Salvataggio...' : 'Invia Richiesta 🚀') : 'Devi Accedere per Prenotare'}
              </Button>
            </Form>
          </div>
        </Col>
      </Row>
    </div>
  );
}
export default Prenota;