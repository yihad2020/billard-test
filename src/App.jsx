import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { get } from './api';
import Shell from './components/Shell';
import SplashScreen from './components/SplashScreen';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tables from './pages/Tables';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Cash from './pages/Cash';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Control from './pages/Control';

const MIN_SPLASH_MS = 1000;

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const splashDelay = new Promise((resolve) => setTimeout(resolve, MIN_SPLASH_MS));
      const token = localStorage.getItem('billar_token');

      if (token) {
        try {
          const response = await get('/me');
          if (!cancelled) setUser(response.user);
        } catch {
          localStorage.removeItem('billar_token');
        }
      }

      await splashDelay;
      if (!cancelled) setLoading(false);
    }

    boot();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <SplashScreen />;

  const isAdmin = user?.role === 'admin';

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />} />
      <Route element={user ? <Shell user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />}>
        <Route index element={<Dashboard user={user} />} />
        <Route path="mesas" element={<Tables user={user} />} />
        <Route path="venta" element={<POS />} />
        <Route path="inventario" element={isAdmin ? <Inventory user={user} /> : <Navigate to="/" />} />
        <Route path="caja" element={<Cash user={user} />} />
        <Route path="control" element={isAdmin ? <Control /> : <Navigate to="/" />} />
        <Route path="reportes" element={isAdmin ? <Reports /> : <Navigate to="/" />} />
        <Route path="usuarios" element={isAdmin ? <Users /> : <Navigate to="/" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
