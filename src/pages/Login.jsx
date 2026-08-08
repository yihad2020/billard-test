import { useState } from 'react';
import { post } from '../api';
import { resetDemoData } from '../demoApi';
import BrandLogo from '../components/BrandLogo';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await post('/login', { username, password });
      localStorage.setItem('billar_token', response.token);
      onLogin(response.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-ambient ambient-one" />
      <div className="login-ambient ambient-two" />

      <section className="login-card">
        <div className="login-logo-wrap">
          <BrandLogo className="login-logo" />
        </div>

        <div className="login-brand-copy">
          <strong>Billar Control</strong>
          <span>Gestión interna</span>
        </div>

        <div className="login-copy">
          <span className="eyebrow">ACCESO INTERNO</span>
          <h1>Todo el negocio,<br />desde una sola pantalla.</h1>
          <p>Mesas, consumos, caja e inventario en tiempo real.</p>
        </div>

        <form onSubmit={submit} className="login-form">
          <label>
            Usuario
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label>
            Contraseña
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error && <div className="inline-alert danger">{error}</div>}
          <button className="primary-button full" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <div className="demo-note demo-note-stack">
          <div><span>Administrador</span><code>admin / admin123</code></div>
          <div><span>Cajero</span><code>caja / caja123</code></div>
          <button type="button" className="demo-reset" onClick={() => { resetDemoData(); setUsername('admin'); setPassword('admin123'); setError('Demo restablecida.'); }}>Restablecer demo</button>
        </div>
      </section>
    </div>
  );
}
