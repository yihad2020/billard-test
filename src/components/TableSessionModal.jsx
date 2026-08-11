import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import { del, get, post, put } from '../api';
import { ArrowRightLeft, Minus, Plus, Trash2 } from 'lucide-react';

function elapsed(openedAt) {
  if (!openedAt) return '00:00:00';
  const start = new Date(openedAt.replace(' ', 'T')).getTime();
  const s = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

function tableSubtitle(table) {
  if (table?.table_type === 'billiard') return 'Mesa de billar';
  if (table?.table_type === 'cacho') return 'Mesa de cacho';
  if (table?.table_type === 'island') return 'Isla de consumo';
  return 'Mesa de poker';
}

export default function TableSessionModal({ table, onClose, onChanged }) {
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tableOptions, setTableOptions] = useState([]);
  const [targetTableId, setTargetTableId] = useState('');
  const [, tick] = useState(0);

  const open = Boolean(table);
  const isIsland = table?.table_type === 'island';
  const isBilliard = table?.table_type === 'billiard';

  useEffect(() => {
    if (!open) return;
    setMessage('');
    get('/products').then(r => setProducts(r.products));
    get('/tables').then(r => setTableOptions(r.tables || [])).catch(() => setTableOptions([]));
    setTargetTableId('');
    if (table.session_id) loadSession(table.session_id);
    else setSession(null);
  }, [open, table?.id, table?.session_id]);

  useEffect(() => {
    if (!session || session.status !== 'open' || session.table_type === 'island') return;
    const id = setInterval(() => tick(v => v + 1), 1000);
    return () => clearInterval(id);
  }, [session?.id, session?.status, session?.table_type]);

  async function loadSession(id) {
    try {
      const r = await get(`/table-sessions/${id}`);
      setSession(r.session);
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function start() {
    setLoading(true);
    setMessage('');
    try {
      const r = await post(`/tables/${table.id}/open`, {});
      setSession(r.session);
      await onChanged?.();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function add(product) {
    setLoading(true);
    setMessage('');
    try {
      const r = await post(`/table-sessions/${session.id}/items`, { product_id: product.id, quantity: 1 });
      setSession(r.session);
      await onChanged?.();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(item) {
    const reason = prompt(`Motivo para quitar ${item.product_name}. Esta corrección quedará registrada en auditoría:`);
    if (reason === null) return;
    if (!reason.trim()) {
      setMessage('Debes indicar un motivo para corregir un consumo.');
      return;
    }
    if (!confirm(`Quitar ${item.product_name}, devolverlo al inventario y registrar el motivo?`)) return;
    setLoading(true);
    try {
      const r = await del(`/table-sessions/${session.id}/items/${item.id}`, { reason: reason.trim() });
      setSession(r.session);
      await onChanged?.();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveManual(amount) {
    try {
      const r = await put(`/table-sessions/${session.id}/manual-charge`, { amount });
      setSession(r.session);
      await onChanged?.();
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function transferSession() {
    const target = tableOptions.find(item => Number(item.id) === Number(targetTableId));
    if (!target) {
      setMessage('Selecciona una mesa disponible para hacer el traspaso.');
      return;
    }
    if (!confirm(`¿Traspasar la sesión de ${table.name} a ${target.name}? El tiempo seguirá corriendo sin reiniciarse.`)) return;
    setLoading(true);
    setMessage('');
    try {
      const r = await post(`/table-sessions/${session.id}/transfer`, { target_table_id: target.id });
      setMessage(r.message);
      await onChanged?.();
      setTimeout(onClose, 700);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function moveToIsland() {
    if (!confirm(`¿Cortar el tiempo de ${table.name} y continuar la cuenta en su isla?`)) return;
    setLoading(true);
    setMessage('');
    try {
      const r = await post(`/table-sessions/${session.id}/move-to-island`, {});
      setMessage(r.message);
      await onChanged?.();
      setTimeout(onClose, 650);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function closeSale(method) {
    if (!confirm(`Cobrar y liberar ${table.name}?`)) return;
    setLoading(true);
    try {
      const r = await post(`/table-sessions/${session.id}/close`, { payment_method: method });
      setMessage(`${r.sale_number} · Total Bs. ${Number(r.total).toFixed(2)}`);
      await onChanged?.();
      setTimeout(onClose, 700);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(
    () => products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 18),
    [products, search],
  );

  const transferTargets = useMemo(() => {
    if (!session || session.table_type === 'island') return [];
    return tableOptions.filter(item =>
      Number(item.id) !== Number(table?.id) &&
      item.table_type === session.table_type &&
      item.billing_mode === session.billing_mode &&
      item.status === 'free'
    );
  }, [tableOptions, session?.id, session?.table_type, session?.billing_mode, table?.id]);

  const productTotal = session ? session.items.reduce((a, i) => a + Number(i.line_total), 0) : 0;
  let gameCharge = session ? Number(session.game_charge || 0) : 0;
  if (session?.billing_mode === 'hourly') {
    const secs = Math.max(0, (Date.now() - new Date(session.opened_at.replace(' ', 'T')).getTime()) / 1000);
    gameCharge = (Number(session.hourly_rate_snapshot) / 3600) * secs;
  }
  const total = productTotal + gameCharge;
  const sessionIsIsland = session?.table_type === 'island';

  return (
    <Modal open={open} onClose={onClose} wide title={table?.name} subtitle={tableSubtitle(table)}>
      {!session ? (
        <div className="empty-session">
          <div className={`mini-table-preview ${table?.table_type}`}><span>{table?.name}</span></div>
          <h3>{isIsland ? 'La isla está libre' : 'La mesa está libre'}</h3>
          <p>
            {isIsland
              ? 'Abre la isla para llevar una cuenta de bebidas y comida sin cobrar tiempo.'
              : 'Al abrirla se inicia el control de tiempo y podrás cargar consumos.'}
          </p>
          {message && <div className="inline-alert">{message}</div>}
          <button className="primary-button" disabled={loading} onClick={start}>
            {isIsland ? 'Abrir isla' : 'Abrir mesa'}
          </button>
        </div>
      ) : (
        <div className="session-layout">
          <section className="session-ticket">
            <div className="session-head">
              <div>
                <span>{sessionIsIsland ? 'Estado de cuenta' : 'Tiempo abierto'}</span>
                <strong>{sessionIsIsland ? 'Sin tiempo' : elapsed(session.opened_at)}</strong>
              </div>
              <div className="session-state"><i/>{sessionIsIsland ? 'Consumo' : 'En curso'}</div>
            </div>

            {session.billing_mode === 'hourly' ? (
              <div className="charge-line">
                <span>Juego · Bs. {Number(session.hourly_rate_snapshot).toFixed(2)}/hora</span>
                <strong>Bs. {gameCharge.toFixed(2)}</strong>
              </div>
            ) : sessionIsIsland ? (
              <div className="island-charge-block">
                {Number(session.manual_game_charge || 0) > 0 ? (
                  <>
                    <div>
                      <span>Tiempo de billar cerrado</span>
                      <small>{session.source_table_name ? `Cuenta trasladada desde ${session.source_table_name}` : 'Importe congelado al cortar el tiempo'}</small>
                    </div>
                    <strong>Bs. {Number(session.manual_game_charge || 0).toFixed(2)}</strong>
                  </>
                ) : (
                  <div>
                    <span>Consumo en isla</span>
                    <small>Esta cuenta no genera cobro por tiempo.</small>
                  </div>
                )}
              </div>
            ) : (
              <ManualCharge value={Number(session.manual_game_charge || 0)} onSave={saveManual}/>
            )}

            <div className="ticket-items">
              {session.items.length === 0 ? (
                <div className="ticket-empty">Todavía no se cargaron consumos.</div>
              ) : session.items.map(i => (
                <div className="ticket-row" key={i.id}>
                  <div><strong>{i.product_name}</strong><span>{Number(i.quantity)} × Bs. {Number(i.unit_price).toFixed(2)}</span></div>
                  <div className="ticket-row-end"><strong>Bs. {Number(i.line_total).toFixed(2)}</strong><button onClick={() => remove(i)} title="Quitar consumo"><Trash2 size={15}/></button></div>
                </div>
              ))}
            </div>

            <div className="ticket-summary">
              <div><span>Consumos</span><strong>Bs. {productTotal.toFixed(2)}</strong></div>
              {gameCharge > 0 && <div><span>{sessionIsIsland ? 'Billar cerrado' : 'Juego'}</span><strong>Bs. {gameCharge.toFixed(2)}</strong></div>}
              <div className="ticket-grand"><span>Total actual</span><strong>Bs. {total.toFixed(2)}</strong></div>
            </div>

            {message && <div className="inline-alert">{message}</div>}

            {!sessionIsIsland && transferTargets.length > 0 && (
              <div className="table-transfer-action">
                <div className="table-transfer-copy">
                  <span className="transfer-icon"><ArrowRightLeft size={16}/></span>
                  <div>
                    <strong>Traspasar sesión</strong>
                    <span>Muévela a otra mesa libre del mismo tipo sin perder el tiempo ni los consumos.</span>
                  </div>
                </div>
                <div className="table-transfer-control">
                  <select className="input" value={targetTableId} onChange={e => setTargetTableId(e.target.value)}>
                    <option value="">Seleccionar mesa libre</option>
                    {transferTargets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  <button className="secondary-button" disabled={loading || !targetTableId} onClick={transferSession}>Traspasar</button>
                </div>
              </div>
            )}

            {isBilliard && (
              <div className="island-transfer-action">
                <div>
                  <strong>¿Terminaron de jugar pero siguen consumiendo?</strong>
                  <span>Corta el tiempo ahora y pasa toda la cuenta a la isla de esta mesa.</span>
                </div>
                <button className="secondary-button" disabled={loading} onClick={moveToIsland}>Cortar tiempo → Isla</button>
              </div>
            )}

            <div className="payment-actions">
              <span>Cobrar con</span>
              <div>
                <button onClick={() => closeSale('cash')} disabled={loading}>Efectivo</button>
                <button onClick={() => closeSale('qr')} disabled={loading}>QR</button>
                <button onClick={() => closeSale('card')} disabled={loading}>Tarjeta</button>
              </div>
            </div>
          </section>

          <section className="product-picker">
            <div className="section-title"><div><h3>Agregar consumo</h3><p>Se descuenta del inventario al instante.</p></div></div>
            <input className="input" placeholder="Buscar cerveza, gaseosa, snack…" value={search} onChange={e => setSearch(e.target.value)}/>
            <div className="product-grid compact">
              {filtered.map(p => (
                <button key={p.id} className="product-tile" disabled={Number(p.stock) <= 0 || loading} onClick={() => add(p)}>
                  <div className="product-tile-top"><span className="product-category">{p.category_name || 'Producto'}</span><Plus size={15}/></div>
                  <strong>{p.name}</strong>
                  <div className="product-meta"><span>Bs. {Number(p.sale_price).toFixed(2)}</span><small>{Number(p.stock)} disp.</small></div>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}

function ManualCharge({ value, onSave }) {
  const [amount, setAmount] = useState(value);
  useEffect(() => setAmount(value), [value]);
  return (
    <div className="manual-charge">
      <div><span>Cobro del juego</span><small>Importe manual para esta mesa</small></div>
      <div className="manual-charge-control">
        <button onClick={() => setAmount(v => Math.max(0, Number(v) - 5))}><Minus size={15}/></button>
        <input value={amount} type="number" min="0" step="1" onChange={e => setAmount(e.target.value)}/>
        <button onClick={() => setAmount(v => Number(v) + 5)}><Plus size={15}/></button>
        <button className="text-button" onClick={() => onSave(Number(amount))}>Guardar</button>
      </div>
    </div>
  );
}
