import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import { loginHandler } from '../api/API.mjs';

function Login({ setIsAuth, setUser, setIsAdmin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await loginHandler(email, password);
      setIsAuth(true); setUser(user); setIsAdmin(user.role === 'admin');
      navigate("/");
    } catch (err) { setErrorMsg(err.toString()); }
    finally { setLoading(false); }
  };

  return (
    <div className="modern-card mx-auto mt-5">
      <Form onSubmit={handleSubmit}>
        <h3 className="text-center mb-4">Login</h3>
        <Form.Group className="mb-2"><Form.Control type="email" placeholder="Email" onChange={e=>setEmail(e.target.value)} /></Form.Group>
        <Form.Group className="mb-3"><Form.Control type="password" placeholder="Password" onChange={e=>setPassword(e.target.value)} /></Form.Group>
        {errorMsg && <div className="text-danger small mb-2">{errorMsg}</div>}
        <Button className="w-100 btn-indigo" type="submit" disabled={loading}>{loading ? '...' : 'Accedi'}</Button>
        <Button variant="link" className="w-100 mt-2" onClick={() => navigate("/register")}>Non hai un account? Registrati</Button>
      </Form>
    </div>
  );
}
export default Login;