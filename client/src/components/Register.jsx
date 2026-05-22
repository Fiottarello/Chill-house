import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';
import { registerHandler } from '../api/API.mjs';

function Register({ setUser, setIsAuth, setIsAdmin }) {
  const [form, setForm] = useState({ 
    name: '', surname: '', email: '', password: '', 
    occupazione: '', da_quanto_ci_conosci: '', descrizione_simpatica: '', avatar_url: '' 
  });
  const navigate = useNavigate();

  // Funzione magica per leggere l'immagine dal PC e trasformarla in Base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, avatar_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await registerHandler(form);
      setIsAuth(true); setUser(user); setIsAdmin(user.role === 'admin');
      navigate("/");
    } catch (err) { alert("Errore durante la registrazione: " + err); }
  };

  return (
    <div className="container py-5 d-flex justify-content-center">
      <Card className="modern-card p-4" style={{ maxWidth: '600px' }}>
        <h2 className="text-center mb-4" style={{ color: '#4f46e5', fontWeight: 900 }}>Unisciti alla Casa! 🏠</h2>
        
        <Form onSubmit={handleSubmit}>
          
          {/* UPLOAD FOTO PROFILO */}
          <div className="text-center mb-4">
            <p className="small fw-bold text-muted text-uppercase mb-2">La tua foto profilo</p>
            <div className="d-flex flex-column align-items-center gap-2">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="Anteprima" className="rounded-circle border border-primary border-3" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
              ) : (
                <div className="rounded-circle border border-2 d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', backgroundColor: '#f8fafc' }}>
                  <span className="fs-3">📷</span>
                </div>
              )}
              <Form.Control type="file" accept="image/*" size="sm" className="mt-2 w-75" onChange={handleImageUpload} />
            </div>
          </div>

          <Row>
            <Col><Form.Group className="mb-3"><Form.Control className="modern-input" placeholder="Nome" required onChange={e => setForm({...form, name: e.target.value})} /></Form.Group></Col>
            <Col><Form.Group className="mb-3"><Form.Control className="modern-input" placeholder="Cognome" required onChange={e => setForm({...form, surname: e.target.value})} /></Form.Group></Col>
          </Row>

          <Form.Group className="mb-3"><Form.Control className="modern-input" type="email" placeholder="Email" required onChange={e => setForm({...form, email: e.target.value})} /></Form.Group>
          <Form.Group className="mb-3"><Form.Control className="modern-input" type="password" placeholder="Password" required onChange={e => setForm({...form, password: e.target.value})} /></Form.Group>
          
          <hr className="my-4 text-muted" />

          <Form.Group className="mb-3"><Form.Control className="modern-input" placeholder="Tua occupazione (es. Studente, Ninja...)" onChange={e => setForm({...form, occupazione: e.target.value})} /></Form.Group>
          <Form.Group className="mb-3"><Form.Control className="modern-input" placeholder="Da quanto ci conosci?" onChange={e => setForm({...form, da_quanto_ci_conosci: e.target.value})} /></Form.Group>
          <Form.Group className="mb-4"><Form.Control className="modern-input" as="textarea" rows={3} placeholder="Descrizione simpatica su di te..." onChange={e => setForm({...form, descrizione_simpatica: e.target.value})} /></Form.Group>
          
          <Button type="submit" className="w-100 btn-indigo fs-5">Registrati 🚀</Button>
          <Button variant="link" className="w-100 mt-2 text-muted fw-bold" onClick={() => navigate("/login")}>Hai già le chiavi? Accedi</Button>
        </Form>
      </Card>
    </div>
  );
}
export default Register;