import { useEffect, useMemo, useState } from 'react';
import { get } from '../api';
import { Search, ShieldCheck, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

const ACTION_LABELS = {
  login: 'Inicio de sesión',
  logout: 'Cierre de sesión',
  open_table: 'Apertura de mesa',
  close_table: 'Cierre y cobro de mesa',
  add_table_item: 'Consumo agregado',
  remove_table_item: 'Consumo retirado',
  adjust_stock: 'Ajuste de inventario',
  pos_sale: 'Venta directa',
  cash_movement: 'Movimiento de caja',
  open_cash: 'Apertura de caja',
  close_cash: 'Cierre de caja',
  create_product: 'Producto creado',
  update_product: 'Producto actualizado',
  move_table: 'Mesa reubicada',
  transfer_table_session: 'Sesión traspasada',
  move_table_to_island: 'Cuenta movida a isla',
  update_manual_charge: 'Cobro manual actualizado',
  create_user: 'Usuario creado',
  update_user: 'Usuario actualizado',
  update_table: 'Mesa actualizada',
};

const SENSITIVE_ACTIONS = new Set([
  'remove_table_item', 'adjust_stock', 'cash_movement', 'close_cash',
  'update_product', 'create_user', 'update_user', 'update_table',
]);

function parseDate(value) {
  if (!value) return null;
  const d = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateTime(value) {
  const date = parseDate(value);
  return date ? date.toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : value;
}

function detailText(log) {
  const d = log.details_json || {};
  if (log.action === 'remove_table_item') return `${d.quantity || 1}× ${d.product || 'Producto'} · Motivo: ${d.reason || 'Sin motivo'}`;
  if (log.action === 'transfer_table_session') return `${d.from || 'Mesa'} → ${d.to || 'Mesa'}`;
  if (log.action === 'move_table_to_island') return `${d.from || 'Mesa'} → ${d.to || 'Isla'}`;
  if (log.action === 'open_table') return d.table || '';
  if (log.action === 'close_table' || log.action === 'pos_sale') return `${d.sale_number || ''}${d.total != null ? ` · Bs. ${Number(d.total).toFixed(2)}` : ''}`;
  if (log.action === 'adjust_stock') return `Cambio ${Number(d.quantity || 0) > 0 ? '+' : ''}${Number(d.quantity || 0)} · ${d.note || 'Ajuste manual'}`;
  if (log.action === 'cash_movement') return `${d.movement_type === 'expense' ? 'Egreso' : 'Ingreso'} · Bs. ${Number(d.amount || 0).toFixed(2)} · ${d.concept || ''}`;
  if (log.action === 'close_cash') return `Esperado Bs. ${Number(d.expected || 0).toFixed(2)} · Diferencia Bs. ${Number(d.difference || 0).toFixed(2)}`;
  if (d.name) return d.name;
  if (d.product) return d.product;
  return '';
}

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('all');
  const [userName, setUserName] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from_at', `${from}T00:00:00`);
      if (to) params.set('to_at', `${to}T23:59:59`);
      const response = await get(`/reports/audit${params.toString() ? `?${params}` : ''}`);
      setLogs(response.logs || []);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [query, action, userName, pageSize, from, to]);

  const actionOptions = useMemo(() => [...new Set(logs.map(item => item.action))].sort(), [logs]);
  const userOptions = useMemo(() => [...new Set(logs.map(item => item.user_name || 'Sistema'))].sort((a, b) => a.localeCompare(b, 'es')), [logs]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return logs.filter(log => {
      if (action !== 'all' && log.action !== action) return false;
      if (userName !== 'all' && (log.user_name || 'Sistema') !== userName) return false;
      if (term) {
        const haystack = `${log.user_name || 'Sistema'} ${ACTION_LABELS[log.action] || log.action} ${log.entity_type || ''} ${log.entity_id || ''} ${detailText(log)}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [logs, query, action, userName]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const sensitiveCount = filtered.filter(log => SENSITIVE_ACTIONS.has(log.action)).length;
  const userCount = new Set(filtered.map(log => log.user_id)).size;

  return (
    <div className="page-stack audit-page">
      <section className="audit-hero panel">
        <div>
          <span className="eyebrow">TRAZABILIDAD</span>
          <h2>Auditoría del sistema</h2>
          <p>Consulta quién hizo cada acción sensible, cuándo ocurrió y sobre qué registro se realizó.</p>
        </div>
        <div className="audit-shield"><ShieldCheck size={24}/><span>Solo administradores</span></div>
      </section>

      <section className="stats-grid audit-stats">
        <article className="stat-card primary"><span>Eventos visibles</span><strong>{filtered.length}</strong><small>según filtros actuales</small></article>
        <article className="stat-card"><span>Acciones sensibles</span><strong>{sensitiveCount}</strong><small>caja, inventario y correcciones</small></article>
        <article className="stat-card"><span>Usuarios involucrados</span><strong>{userCount}</strong><small>con actividad registrada</small></article>
        <article className="stat-card"><span>Último evento</span><strong>{filtered[0] ? formatDateTime(filtered[0].created_at).split(',')[0] : '—'}</strong><small>{filtered[0] ? ACTION_LABELS[filtered[0].action] || filtered[0].action : 'sin actividad'}</small></article>
      </section>

      <section className="panel flat audit-log-panel">
        <div className="panel-head">
          <div><span className="eyebrow">REGISTRO</span><h3>Historial de acciones</h3></div>
          <span className="report-count">{filtered.length} registros</span>
        </div>

        <div className="audit-toolbar">
          <label className="audit-search"><span>Buscar</span><div><Search size={16}/><input className="input" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Usuario, acción, producto, mesa…"/></div></label>
          <label><span>Acción</span><select className="input" value={action} onChange={e => setAction(e.target.value)}><option value="all">Todas</option>{actionOptions.map(value => <option key={value} value={value}>{ACTION_LABELS[value] || value}</option>)}</select></label>
          <label><span>Usuario</span><select className="input" value={userName} onChange={e => setUserName(e.target.value)}><option value="all">Todos</option>{userOptions.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span>Desde</span><input className="input audit-date-input" type="date" value={from} onChange={e => setFrom(e.target.value)}/></label>
          <label><span>Hasta</span><input className="input audit-date-input" type="date" value={to} onChange={e => setTo(e.target.value)}/></label>
          <button className="secondary-button audit-apply" onClick={load}>Aplicar fechas</button>
        </div>

        {error && <div className="inline-alert danger">{error}</div>}
        {loading ? <div className="skeleton-block"/> : (
          <>
            <div className="responsive-table audit-table-wrap">
              <table className="audit-table">
                <thead><tr><th>Fecha / hora</th><th>Usuario</th><th>Acción</th><th>Detalle</th><th>Entidad</th></tr></thead>
                <tbody>
                  {visible.map(log => (
                    <tr key={log.id} className={SENSITIVE_ACTIONS.has(log.action) ? 'audit-sensitive-row' : ''}>
                      <td>{formatDateTime(log.created_at)}</td>
                      <td><strong>{log.user_name || 'Sistema'}</strong></td>
                      <td><span className={`audit-action-pill ${SENSITIVE_ACTIONS.has(log.action) ? 'sensitive' : ''}`}>{SENSITIVE_ACTIONS.has(log.action) && <AlertTriangle size={12}/>} {ACTION_LABELS[log.action] || log.action}</span></td>
                      <td className="audit-detail-cell">{detailText(log) || <span className="muted">Sin detalle adicional</span>}</td>
                      <td><span className="audit-entity">{log.entity_type || '—'}{log.entity_id ? ` #${log.entity_id}` : ''}</span></td>
                    </tr>
                  ))}
                  {!visible.length && <tr><td colSpan="5"><div className="empty-line">No hay actividad que coincida con los filtros.</div></td></tr>}
                </tbody>
              </table>
            </div>

            <div className="report-pagination audit-pagination">
              <div className="report-page-size"><span>Mostrar</span><select className="input" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></div>
              <span>{filtered.length ? `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} de ${filtered.length}` : '0 registros'}</span>
              <div className="report-page-buttons"><button className="icon-button" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><ChevronLeft size={16}/></button><span>Página {safePage} de {pageCount}</span><button className="icon-button" disabled={safePage >= pageCount} onClick={() => setPage(p => Math.min(pageCount, p + 1))}><ChevronRight size={16}/></button></div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
