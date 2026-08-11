import { useEffect, useMemo, useState } from 'react';
import { get } from '../api';
import InstallAppButton from '../components/InstallAppButton';
import { Clock3, Package, ShieldCheck, Smartphone, WalletCards } from 'lucide-react';

const money = value => `Bs. ${Number(value || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function elapsed(openedAt, now) {
  if (!openedAt) return '00:00:00';
  const start = new Date(String(openedAt).replace(' ', 'T')).getTime();
  const seconds = Math.max(0, Math.floor((now - start) / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(value => String(value).padStart(2, '0')).join(':');
}

const actionLabels = {
  open_table: 'Abrió una mesa',
  close_table: 'Cobró y cerró una mesa',
  add_table_item: 'Agregó un consumo',
  remove_table_item: 'Quitó un consumo',
  transfer_table_session: 'Traspasó una sesión',
  move_table_to_island: 'Pasó una cuenta a isla',
  adjust_stock: 'Ajustó inventario',
  pos_sale: 'Registró venta directa',
  cash_movement: 'Registró movimiento de caja',
  close_cash: 'Cerró caja',
  create_product: 'Creó un producto',
  update_product: 'Modificó un producto',
};

function activityDetail(log) {
  const d = log.details_json || {};
  if (log.action === 'remove_table_item') return `${d.product || 'Producto'} · ${d.quantity || 1} · Motivo: ${d.reason || 'Sin motivo'}`;
  if (log.action === 'transfer_table_session') return `${d.from || 'Mesa'} → ${d.to || 'Mesa'}`;
  if (log.action === 'move_table_to_island') return `${d.from || 'Mesa'} → ${d.to || 'Isla'}`;
  if (log.action === 'open_table') return d.table || '';
  if (log.action === 'close_table') return `${d.sale_number || ''}${d.total != null ? ` · ${money(d.total)}` : ''}`;
  if (log.action === 'pos_sale') return `${d.sale_number || ''}${d.total != null ? ` · ${money(d.total)}` : ''}`;
  if (d.product) return d.product;
  return '';
}

function typeLabel(type) {
  if (type === 'billiard') return 'Billar';
  if (type === 'cacho') return 'Cacho';
  if (type === 'poker') return 'Poker';
  return 'Isla';
}

export default function Control() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  async function load() {
    try {
      setData(await get('/control/live'));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    const poll = setInterval(load, 4000);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const onStorage = event => {
      if (String(event.key || '').startsWith('billar_control_vercel_demo_')) load();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      clearInterval(poll);
      clearInterval(timer);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const sessions = useMemo(() => data?.sessions || [], [data]);

  if (error) return <div className="inline-alert danger">{error}</div>;
  if (!data) return <div className="skeleton-block"/>;

  const s = data.summary;

  return (
    <div className="page-stack owner-control-page">
      <section className="owner-control-hero">
        <div>
          <span className="eyebrow">CONTROL DEL PROPIETARIO</span>
          <h2>El salón, desde tu celular.</h2>
          <p>Revisa qué mesas están ocupadas, qué están consumiendo, quién abrió la cuenta y los movimientos sensibles del sistema.</p>
        </div>
        <div className="owner-control-actions">
          <div className="live-chip"><i/>Actualización automática</div>
          <InstallAppButton compact />
        </div>
      </section>

      <section className="control-stats-grid">
        <article className="stat-card primary"><span>Mesas en juego</span><strong>{s.occupied_game_tables} / {s.active_game_tables}</strong><small>ocupadas ahora</small></article>
        <article className="stat-card"><span>Islas abiertas</span><strong>{s.open_islands}</strong><small>cuentas sin tiempo</small></article>
        <article className="stat-card"><span>Consumos abiertos</span><strong>{money(s.active_products_total)}</strong><small>productos en cuentas activas</small></article>
        <article className="stat-card"><span>Total abierto</span><strong>{money(s.active_running_total)}</strong><small>juego + productos</small></article>
        <article className="stat-card"><span>Cajas abiertas</span><strong>{s.open_cash_registers}</strong><small>turnos operando</small></article>
        <article className={`stat-card ${s.low_stock ? 'warning' : ''}`}><span>Stock bajo</span><strong>{s.low_stock}</strong><small>productos para revisar</small></article>
      </section>

      <section className="panel control-live-panel">
        <div className="panel-head">
          <div><span className="eyebrow">EN VIVO</span><h3>Mesas e islas con cuenta abierta</h3></div>
          <span className="muted">{sessions.length} cuentas activas</span>
        </div>
        {sessions.length === 0 ? (
          <div className="empty-line">No hay mesas ni islas abiertas en este momento.</div>
        ) : (
          <div className="live-session-grid">
            {sessions.map(session => (
              <article className={`live-session-card type-${session.table_type}`} key={session.id}>
                <div className="live-session-top">
                  <div>
                    <span className="live-session-type">{typeLabel(session.table_type)}</span>
                    <h4>{session.table_name}</h4>
                  </div>
                  <span className="control-status-chip">{session.table_type === 'island' ? 'Cuenta abierta' : 'En juego'}</span>
                </div>

                <div className="live-session-meta">
                  <span><Clock3 size={14}/>{session.table_type === 'island' ? 'Sin tiempo' : elapsed(session.opened_at, now)}</span>
                  <span><ShieldCheck size={14}/>{session.opened_by_name}</span>
                </div>

                <div className="live-products-block">
                  <div className="live-products-title"><Package size={14}/><span>Productos cargados</span><strong>{session.item_count}</strong></div>
                  {session.items.length === 0 ? <small>Sin consumos todavía.</small> : (
                    <div className="live-product-list">
                      {session.items.slice(0, 6).map(item => <span key={item.id}>{Number(item.quantity)}× {item.product_name}</span>)}
                      {session.items.length > 6 && <span>+{session.items.length - 6} más</span>}
                    </div>
                  )}
                </div>

                <div className="live-session-totals">
                  <div><span>Consumos</span><strong>{money(session.products_total)}</strong></div>
                  <div><span>{session.table_type === 'island' ? 'Juego cerrado' : 'Juego'}</span><strong>{money(session.game_charge)}</strong></div>
                  <div className="live-session-grand"><span>Total actual</span><strong>{money(session.total)}</strong></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="control-bottom-grid">
        <article className="panel flat control-security-panel">
          <div className="panel-head"><div><span className="eyebrow">SEGURIDAD</span><h3>Controles operativos</h3></div><ShieldCheck size={19}/></div>
          <div className="security-check-list">
            <div><i/><span><strong>Usuarios separados</strong> Cada cajero trabaja con su propia cuenta y caja.</span></div>
            <div><i/><span><strong>Inventario restringido</strong> Solo administradores pueden ajustar existencias y precios.</span></div>
            <div><i/><span><strong>Correcciones auditadas</strong> Quitar un consumo exige indicar un motivo y queda registrado.</span></div>
            <div><i/><span><strong>Historial de operaciones</strong> Traspasos, cierres, ventas y cambios sensibles dejan trazabilidad.</span></div>
          </div>
        </article>

        <article className="panel flat control-cash-panel">
          <div className="panel-head"><div><span className="eyebrow">CAJAS</span><h3>Turnos abiertos</h3></div><WalletCards size={19}/></div>
          <div className="control-list">
            {data.cash_sessions.length === 0 ? <div className="empty-line">No hay cajas abiertas.</div> : data.cash_sessions.map(cash => (
              <div className="control-list-row" key={cash.id}>
                <div><strong>{cash.user_name}</strong><span>Abierta {new Date(cash.opened_at.replace(' ', 'T')).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</span></div>
                <div className="control-list-value"><span>Esperado</span><strong>{money(cash.live_expected_amount)}</strong></div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel flat control-activity-panel">
        <div className="panel-head"><div><span className="eyebrow">TRAZABILIDAD</span><h3>Actividad reciente</h3></div><span className="muted">Acciones que conviene supervisar</span></div>
        <div className="control-activity-list">
          {data.recent_activity.length === 0 ? <div className="empty-line">No hay actividad registrada.</div> : data.recent_activity.map(log => (
            <div className={`control-activity-row ${log.action === 'remove_table_item' ? 'sensitive' : ''}`} key={log.id}>
              <div className="activity-time">{new Date(log.created_at.replace(' ', 'T')).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</div>
              <div><strong>{actionLabels[log.action] || log.action}</strong><span>{activityDetail(log)}</span></div>
              <small>{log.user_name}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="mobile-owner-note">
        <Smartphone size={18}/>
        <div><strong>Diseñado para supervisar desde el teléfono</strong><span>En producción, esta vista consultará el backend central para que propietario y cajeros vean la misma información desde dispositivos distintos.</span></div>
      </section>
    </div>
  );
}
