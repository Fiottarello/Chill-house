import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import MyNavbar from "./components/MyNavbar";
import Home from "./components/Home";
import Inquilini from "./components/Inquilini";
import Prenota from "./components/Prenota";
import Recensioni from "./components/Recensioni";
import Login from "./components/Login";
import Register from "./components/Register";
import { checkAuth, handleLogout } from "./api/API.mjs";

function App() {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth()
      .then(({ isAuth, user }) => {
        setIsAuth(isAuth);
        setUser(user);
        setIsAdmin(user?.role === "admin");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogoutWrapper = useCallback(async () => {
    await handleLogout();
    setIsAuth(false);
    setUser(null);
    setIsAdmin(false);
    navigate("/", { replace: true });
  }, [navigate]);

  if (loading) return <div className="text-center mt-5 text-white">Caricamento...</div>;

  return (
    // Modifica: Sfondo quasi nero invece di grigio chiaro
    <div style={{ backgroundColor: '#020617', minHeight: '100vh' }}>
      <MyNavbar handleLogoutWrapper={handleLogoutWrapper} isAuth={isAuth} user={user} />
      
      <main className="w-100 flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inquilini" element={<Inquilini />} />
          <Route path="/prenota" element={<Prenota user={user} isAuth={isAuth} />} />
          <Route path="/recensioni" element={<Recensioni user={user} isAuth={isAuth} isAdmin={isAdmin} />} />
          <Route path="/login" element={isAuth ? <Navigate to="/" /> : <Login setIsAuth={setIsAuth} setUser={setUser} setIsAdmin={setIsAdmin} />} />
          <Route path="/register" element={isAuth ? <Navigate to="/" /> : <Register setIsAuth={setIsAuth} setUser={setUser} setIsAdmin={setIsAdmin} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;