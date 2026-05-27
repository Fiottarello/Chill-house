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
import Rewards from "./components/Rewards";
import AdminPanel from "./components/AdminPanel";
import Tipster from "./components/Tipster";
import Zucca from "./components/Zucca";
import WelcomeTour from "./components/WelcomeTour";
import SlotMachine from "./components/SlotMachine";
import Profile from "./components/Profile";
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
    <>
      <WelcomeTour user={user} setUser={setUser} />
      <div className="d-flex flex-column min-vh-100 bg-dark text-white">
        <MyNavbar handleLogoutWrapper={handleLogoutWrapper} isAuth={isAuth} user={user} />
      
      <main className="w-100 flex-grow-1">
        <Routes>
          <Route path="/" element={<Home user={user} isAuth={isAuth} />} />
          <Route path="/inquilini" element={<Inquilini />} />
          <Route path="/prenota" element={<Prenota user={user} isAuth={isAuth} />} />
          <Route path="/recensioni" element={<Recensioni user={user} isAuth={isAuth} isAdmin={isAdmin} />} />
          <Route path="/rewards" element={<Rewards user={user} isAuth={isAuth} />} />
          <Route path="/tipster" element={<Tipster user={user} isAuth={isAuth} isAdmin={isAdmin} />} />
          <Route path="/admin" element={<AdminPanel isAdmin={isAdmin} />} />
          <Route path="/slot" element={<SlotMachine isAuth={isAuth} setUser={setUser} />} />
          <Route path="/zucca" element={<Zucca />} />
          <Route path="/profile" element={isAuth ? <Profile user={user} /> : <Navigate to="/login" />} />
          <Route path="/login" element={isAuth ? <Navigate to="/" /> : <Login setIsAuth={setIsAuth} setUser={setUser} setIsAdmin={setIsAdmin} />} />
          <Route path="/register" element={isAuth ? <Navigate to="/" /> : <Register setIsAuth={setIsAuth} setUser={setUser} setIsAdmin={setIsAdmin} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      </div>
    </>
  );
}

export default App;