import { useEffect, useState } from 'react';
import { get } from '../api';

const money=v=>`Bs. ${Number(v||0).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
export default function Dashboard({user}){
  const [data,setData]=useState(null); const [error,setError]=useState('');
  useEffect(()=>{get('/dashboard').then(setData).catch(e=>setError(e.message));},[]);
  if(error)return <div className="inline-alert danger">{error}</div>;
  if(!data)return <div className="skeleton-block"/>;
  const s=data.summary;
  return <div className="page-stack">
    <section className="hero-strip"><div><span className="eyebrow">HOY</span><h2>Buenas, {user.name.split(' ')[0]}.</h2><p>{user.role==='admin'?'Así está funcionando el billar en este momento.':'Este es el resumen de tu turno y tus ventas.'}</p></div><div className="live-chip"><i/>Sistema activo</div></section>
    <section className="stats-grid">
      <article className="stat-card primary"><span>Ventas del día</span><strong>{money(s.sales_total)}</strong><small>{s.sales_count} operaciones</small></article>
      <article className="stat-card"><span>Mesas</span><strong>{s.occupied_tables} / {s.active_tables}</strong><small>ocupadas ahora</small></article>
      <article className="stat-card"><span>Juego</span><strong>{money(s.game_total)}</strong><small>facturado hoy</small></article>
      <article className="stat-card"><span>Consumos</span><strong>{money(s.products_total)}</strong><small>productos vendidos</small></article>
      <article className="stat-card"><span>Egresos</span><strong>{money(s.expenses)}</strong><small>movimientos de caja</small></article>
      <article className={`stat-card ${s.low_stock>0?'warning':''}`}><span>Inventario</span><strong>{s.low_stock}</strong><small>productos con stock bajo</small></article>
    </section>
    <section className="panel">
      <div className="panel-head"><div><span className="eyebrow">MOVIMIENTO</span><h3>Últimas ventas</h3></div><span className="muted">Actualizado al ingresar</span></div>
      <div className="data-list">
        {data.recent_sales.length===0?<div className="empty-line">Todavía no hay ventas registradas.</div>:data.recent_sales.map(v=><div className="data-row" key={v.sale_number}><div className="sale-id"><strong>{v.sale_number}</strong><span>{v.table_name||'Venta directa'} · {v.cashier_name}</span></div><div className="data-row-middle"><span className="badge">{v.payment_method==='cash'?'Efectivo':v.payment_method?.toUpperCase()}</span><small>{new Date(v.created_at.replace(' ','T')).toLocaleTimeString('es-BO',{hour:'2-digit',minute:'2-digit'})}</small></div><strong>{money(v.total)}</strong></div>)}
      </div>
    </section>
  </div>;
}
