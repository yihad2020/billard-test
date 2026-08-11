import { useEffect, useState } from 'react';
import { BellRing, CheckCircle2, Smartphone, Wifi } from 'lucide-react';
import { post } from '../api';
import { currentNotificationPermission, requestAdminNotificationPermission } from './NotificationCenter';

function labelFor(permission) {
  if (permission === 'granted') return 'Permitidas';
  if (permission === 'denied') return 'Bloqueadas';
  if (permission === 'unsupported') return 'No compatible';
  if (permission === 'install_required') return 'Instala la app';
  return 'Pendientes';
}

export default function NotificationSettingsCard() {
  const [permission, setPermission] = useState(currentNotificationPermission());
  const [message, setMessage] = useState('');

  useEffect(() => { setPermission(currentNotificationPermission()); }, []);

  async function enable() {
    const result = await requestAdminNotificationPermission();
    setPermission(result.permission);
    if (result.permission === 'granted') setMessage('Alertas del navegador activadas en este dispositivo.');
    else if (result.permission === 'install_required') setMessage('En iPhone/iPad primero agrega Billar Control a la pantalla de inicio y ábrelo desde su ícono. Después podrás activar las notificaciones.');
    else if (result.permission === 'denied') setMessage('El navegador bloqueó las notificaciones. Debes habilitarlas desde la configuración del sitio.');
    else setMessage('Este navegador no soporta notificaciones web.');
  }

  async function test() {
    try {
      await post('/notifications/test');
      setMessage('Se generó una alerta de prueba. Revisa la campana superior.');
    } catch (e) {
      setMessage(e.message);
    }
  }

  return (
    <article className="panel flat notification-settings-card">
      <div className="panel-head"><div><span className="eyebrow">ALERTAS</span><h3>Notificaciones del administrador</h3></div><BellRing size={19}/></div>
      <div className="notification-status-row">
        <div className="notification-status-icon"><Smartphone size={18}/></div>
        <div><strong>Este dispositivo</strong><span>Permiso del navegador: {labelFor(permission)}</span></div>
        <span className={`notification-permission-pill ${permission}`}>{labelFor(permission)}</span>
      </div>
      <div className="notification-feature-list">
        <div><CheckCircle2 size={15}/><span>Inicio y cierre de mesas</span></div>
        <div><CheckCircle2 size={15}/><span>Ventas cobradas y ventas directas</span></div>
        <div><CheckCircle2 size={15}/><span>Correcciones, traspasos y movimientos de caja</span></div>
        <div><CheckCircle2 size={15}/><span>Alertas de stock bajo</span></div>
      </div>
      <div className="notification-card-actions">
        {permission !== 'granted' && <button className="primary-button small" onClick={enable}>Activar alertas</button>}
        <button className="secondary-button small" onClick={test}>Probar alerta</button>
      </div>
      {message && <div className="notification-inline-message">{message}</div>}
      <div className="notification-production-note"><Wifi size={15}/><span><strong>Para producción:</strong> el push entre celulares requiere el backend central + Web Push. Así el dueño recibirá la alerta aunque el cajero venda desde otro dispositivo y aunque la app no esté abierta.</span></div>
    </article>
  );
}
