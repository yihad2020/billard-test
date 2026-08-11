import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, CircleAlert, Package, ReceiptText, TimerReset, ArrowRightLeft, WalletCards } from 'lucide-react';
import { get, post } from '../api';
import { useNavigate } from 'react-router-dom';

const ICONS = {
  sale: ReceiptText,
  table_started: TimerReset,
  table_transfer: ArrowRightLeft,
  stock: Package,
  cash: WalletCards,
  security: CircleAlert,
  test: Bell,
};

function formatWhen(value) {
  const date = new Date(String(value || '').replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'Ahora';
  if (diff < 3600000) return `Hace ${Math.max(1, Math.floor(diff / 60000))} min`;
  if (diff < 86400000) return `Hace ${Math.max(1, Math.floor(diff / 3600000))} h`;
  return date.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
}

async function showSystemNotification(item) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const options = {
    body: item.message,
    icon: `${import.meta.env.BASE_URL}assets/branding/billar-app-icon-192.png`,
    badge: `${import.meta.env.BASE_URL}assets/branding/billar-app-icon-192.png`,
    tag: `billar-notification-${item.id}`,
    renotify: false,
    data: { url: item.url || '/control' },
  };
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(item.title, options);
      return;
    }
    new Notification(item.title, options);
  } catch {}
}

export async function requestAdminNotificationPermission() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isIOS && !isStandalone) return { supported: true, permission: 'install_required' };
  if (!('Notification' in window)) return { supported: false, permission: 'unsupported' };
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    await showSystemNotification({ id: `permission-${Date.now()}`, title: 'Alertas activadas', message: 'Billar Control puede mostrar avisos en este dispositivo.', url: '/control' });
  }
  return { supported: true, permission };
}

export function currentNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const initialized = useRef(false);
  const knownIds = useRef(new Set());
  const navigate = useNavigate();

  async function load({ allowSystem = true } = {}) {
    try {
      const response = await get('/notifications');
      const next = response.notifications || [];
      if (!initialized.current) {
        knownIds.current = new Set(next.map(item => item.id));
        initialized.current = true;
      } else if (allowSystem) {
        const fresh = next.filter(item => !knownIds.current.has(item.id));
        fresh.forEach(item => showSystemNotification(item));
        next.forEach(item => knownIds.current.add(item.id));
      }
      setItems(next);
      setUnread(response.unread || 0);
    } catch {}
  }

  useEffect(() => {
    load({ allowSystem: false });
    const interval = setInterval(() => load(), 3500);
    const onStorage = event => {
      if (String(event.key || '').startsWith('billar_control_vercel_demo_')) load();
    };
    const onStateChange = () => load();
    window.addEventListener('storage', onStorage);
    window.addEventListener('billar-demo-state-changed', onStateChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('billar-demo-state-changed', onStateChange);
    };
  }, []);

  async function openItem(item) {
    if (!item.read) {
      try { await post(`/notifications/${item.id}/read`); } catch {}
      await load({ allowSystem: false });
    }
    setOpen(false);
    if (item.url) navigate(item.url);
  }

  async function markAll() {
    try {
      await post('/notifications/read-all');
      await load({ allowSystem: false });
    } catch {}
  }

  return (
    <div className="notification-center">
      <button className={`notification-trigger ${open ? 'active' : ''}`} onClick={() => setOpen(value => !value)} aria-label="Notificaciones del administrador" title="Notificaciones">
        <Bell size={19}/>
        {unread > 0 && <span className="notification-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <>
          <button className="notification-backdrop" onClick={() => setOpen(false)} aria-label="Cerrar notificaciones"/>
          <section className="notification-popover">
            <div className="notification-popover-head">
              <div><span className="eyebrow">ADMINISTRADOR</span><h3>Notificaciones</h3></div>
              {unread > 0 && <button className="text-button notification-read-all" onClick={markAll}><CheckCheck size={15}/>Marcar leídas</button>}
            </div>
            <div className="notification-list">
              {items.slice(0, 10).map(item => {
                const Icon = ICONS[item.type] || Bell;
                return (
                  <button key={item.id} className={`notification-item ${item.read ? '' : 'unread'} type-${item.type}`} onClick={() => openItem(item)}>
                    <span className="notification-item-icon"><Icon size={16}/></span>
                    <span className="notification-item-copy"><strong>{item.title}</strong><span>{item.message}</span><small>{formatWhen(item.created_at)}</small></span>
                    {!item.read && <i/>}
                  </button>
                );
              })}
              {!items.length && <div className="notification-empty">No hay alertas todavía.</div>}
            </div>
            <div className="notification-popover-foot">Las alertas del demo se guardan en este navegador.</div>
          </section>
        </>
      )}
    </div>
  );
}
