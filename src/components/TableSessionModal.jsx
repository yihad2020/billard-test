import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import { del, get, post, put } from '../api';
import { Minus, Plus, Trash2 } from 'lucide-react';

function elapsed(openedAt) {
  if (!openedAt) return '00:00:00';
  const start = new Date(openedAt.replace(' ', 'T')).getTime();
  const s = Math.max(0, Math.floor((Date.now()-start)/1000));
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
  return [h,m,sec].map(v=>String(v).padStart(2,'0')).join(':');
}

export default function TableSessionModal({ table, onClose, onChanged }) {
  const [session,setSession]=useState(null);
  const [products,setProducts]=useState([]);
  const [search,setSearch]=useState('');
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState('');
  const [,tick]=useState(0);

  const open = Boolean(table);
  useEffect(()=>{
    if(!open) return;
    get('/products').then(r=>setProducts(r.products));
    if(table.session_id) loadSession(table.session_id);
    else setSession(null);
  },[open,table?.id,table?.session_id]);
  useEffect(()=>{ if(!session || session.status!=='open') return; const id=setInterval(()=>tick(v=>v+1),1000); return()=>clearInterval(id); },[session?.id,session?.status]);

  async function loadSession(id){ try{const r=await get(`/table-sessions/${id}`);setSession(r.session);}catch(e){setMessage(e.message);} }
  async function start(){setLoading(true);setMessage('');try{const r=await post(`/tables/${table.id}/open`,{});setSession(r.session);await onChanged?.();}catch(e){setMessage(e.message);}finally{setLoading(false);}}
  async function add(product){setLoading(true);setMessage('');try{const r=await post(`/table-sessions/${session.id}/items`,{product_id:product.id,quantity:1});setSession(r.session);await onChanged?.();}catch(e){setMessage(e.message);}finally{setLoading(false);}}
  async function remove(item){if(!confirm(`Quitar ${item.product_name} y devolverlo al inventario?`))return;setLoading(true);try{const r=await del(`/table-sessions/${session.id}/items/${item.id}`,{reason:'Cargado por error'});setSession(r.session);await onChanged?.();}catch(e){setMessage(e.message);}finally{setLoading(false);}}
  async function saveManual(amount){try{const r=await put(`/table-sessions/${session.id}/manual-charge`,{amount});setSession(r.session);await onChanged?.();}catch(e){setMessage(e.message);}}
  async function closeSale(method){if(!confirm(`Cobrar y liberar ${table.name}?`))return;setLoading(true);try{const r=await post(`/table-sessions/${session.id}/close`,{payment_method:method});setMessage(`${r.sale_number} · Total Bs. ${Number(r.total).toFixed(2)}`);await onChanged?.();setTimeout(onClose,700);}catch(e){setMessage(e.message);}finally{setLoading(false);}}

  const filtered=useMemo(()=>products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())).slice(0,18),[products,search]);
  const productTotal = session ? session.items.reduce((a,i)=>a+Number(i.line_total),0) : 0;
  let gameCharge = session ? Number(session.game_charge||0) : 0;
  if(session?.billing_mode==='hourly'){
    const secs=Math.max(0,(Date.now()-new Date(session.opened_at.replace(' ','T')).getTime())/1000);
    gameCharge=(Number(session.hourly_rate_snapshot)/3600)*secs;
  }
  const total=productTotal+gameCharge;

  return <Modal open={open} onClose={onClose} wide title={table?.name} subtitle={table?.table_type==='billiard'?'Mesa de billar':table?.table_type==='cacho'?'Mesa de cacho':'Mesa de poker'}>
    {!session ? <div className="empty-session">
      <div className={`mini-table-preview ${table?.table_type}`}><span>{table?.name}</span></div>
      <h3>La mesa está libre</h3><p>Al abrirla se inicia el control de tiempo y podrás cargar consumos.</p>
      {message&&<div className="inline-alert">{message}</div>}
      <button className="primary-button" disabled={loading} onClick={start}>Abrir mesa</button>
    </div> : <div className="session-layout">
      <section className="session-ticket">
        <div className="session-head"><div><span>Tiempo abierto</span><strong>{elapsed(session.opened_at)}</strong></div><div className="session-state"><i/>En curso</div></div>
        {session.billing_mode==='hourly' ? <div className="charge-line"><span>Juego · Bs. {Number(session.hourly_rate_snapshot).toFixed(2)}/hora</span><strong>Bs. {gameCharge.toFixed(2)}</strong></div> : <ManualCharge value={Number(session.manual_game_charge||0)} onSave={saveManual}/>}        
        <div className="ticket-items">
          {session.items.length===0?<div className="ticket-empty">Todavía no se cargaron consumos.</div>:session.items.map(i=><div className="ticket-row" key={i.id}><div><strong>{i.product_name}</strong><span>{Number(i.quantity)} × Bs. {Number(i.unit_price).toFixed(2)}</span></div><div className="ticket-row-end"><strong>Bs. {Number(i.line_total).toFixed(2)}</strong><button onClick={()=>remove(i)} title="Quitar consumo"><Trash2 size={15}/></button></div></div>)}
        </div>
        <div className="ticket-summary"><div><span>Consumos</span><strong>Bs. {productTotal.toFixed(2)}</strong></div><div><span>Juego</span><strong>Bs. {gameCharge.toFixed(2)}</strong></div><div className="ticket-grand"><span>Total actual</span><strong>Bs. {total.toFixed(2)}</strong></div></div>
        {message&&<div className="inline-alert">{message}</div>}
        <div className="payment-actions"><span>Cobrar con</span><div><button onClick={()=>closeSale('cash')} disabled={loading}>Efectivo</button><button onClick={()=>closeSale('qr')} disabled={loading}>QR</button><button onClick={()=>closeSale('card')} disabled={loading}>Tarjeta</button></div></div>
      </section>
      <section className="product-picker">
        <div className="section-title"><div><h3>Agregar consumo</h3><p>Se descuenta del inventario al instante.</p></div></div>
        <input className="input" placeholder="Buscar cerveza, gaseosa, snack…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <div className="product-grid compact">
          {filtered.map(p=><button key={p.id} className="product-tile" disabled={Number(p.stock)<=0||loading} onClick={()=>add(p)}><div className="product-tile-top"><span className="product-category">{p.category_name||'Producto'}</span><Plus size={15}/></div><strong>{p.name}</strong><div className="product-meta"><span>Bs. {Number(p.sale_price).toFixed(2)}</span><small>{Number(p.stock)} disp.</small></div></button>)}
        </div>
      </section>
    </div>}
  </Modal>;
}

function ManualCharge({value,onSave}){
  const [amount,setAmount]=useState(value);
  useEffect(()=>setAmount(value),[value]);
  return <div className="manual-charge"><div><span>Cobro del juego</span><small>Importe manual para esta mesa</small></div><div className="manual-charge-control"><button onClick={()=>setAmount(v=>Math.max(0,Number(v)-5))}><Minus size={15}/></button><input value={amount} type="number" min="0" step="1" onChange={e=>setAmount(e.target.value)}/><button onClick={()=>setAmount(v=>Number(v)+5)}><Plus size={15}/></button><button className="text-button" onClick={()=>onSave(Number(amount))}>Guardar</button></div></div>
}
