import { useEffect, useState } from 'react';
import { get, put } from '../api';
import TableMap from '../components/TableMap';
import TableSessionModal from '../components/TableSessionModal';
import Modal from '../components/Modal';
import { Move, SlidersHorizontal } from 'lucide-react';

export default function Tables({user}){
  const [tables,setTables]=useState([]); const [selected,setSelected]=useState(null); const [edit,setEdit]=useState(false); const [ratesOpen,setRatesOpen]=useState(false); const [error,setError]=useState(''); const [,tick]=useState(0);
  async function load(){try{const r=await get('/tables');setTables(r.tables);if(selected){const fresh=r.tables.find(t=>t.id===selected.id);if(fresh)setSelected(fresh);}}catch(e){setError(e.message);}}
  useEffect(()=>{load();const poll=setInterval(load,8000);const timer=setInterval(()=>tick(v=>v+1),1000);return()=>{clearInterval(poll);clearInterval(timer);};},[]);
  async function move(id,pos){try{await put(`/tables/${id}/position`,pos);await load();}catch(e){setError(e.message);}}
  return <div className="page-stack">
    <section className="page-intro"><div><p>Vista basada en la distribución real del local. Cada mesa de billar tiene su isla de consumo para continuar la cuenta cuando se corta el tiempo.</p></div>{user.role==='admin'&&<div className="inline-actions"><button className="secondary-button" onClick={()=>setRatesOpen(true)}><SlidersHorizontal size={16}/>Mesas y tarifas</button><button className={`secondary-button ${edit?'active':''}`} onClick={()=>setEdit(v=>!v)}><Move size={16}/>{edit?'Terminar edición':'Acomodar salón'}</button></div>}</section>
    {error&&<div className="inline-alert danger">{error}</div>}
    <TableMap tables={tables} editMode={edit} onMove={move} onSelect={setSelected}/>
    <TableSessionModal table={selected} onClose={()=>setSelected(null)} onChanged={load}/>
    <RatesModal open={ratesOpen} onClose={()=>setRatesOpen(false)} onSaved={load}/>
  </div>;
}

function RatesModal({open,onClose,onSaved}){
  const [rows,setRows]=useState([]);const [message,setMessage]=useState('');
  useEffect(()=>{if(open)get('/settings/tables').then(r=>setRows(r.tables)).catch(e=>setMessage(e.message));},[open]);
  function patch(id,key,value){setRows(r=>r.map(x=>x.id===id?{...x,[key]:value}:x));}
  async function save(row){try{await put(`/settings/tables/${row.id}`,{name:row.name,table_type:row.table_type,billing_mode:row.billing_mode,hourly_rate:Number(row.hourly_rate),active:Boolean(Number(row.active))});setMessage(`${row.name} actualizada.`);await onSaved?.();}catch(e){setMessage(e.message);}}
  return <Modal open={open} title="Mesas y tarifas" subtitle="Billar: Bs. 30/hora. La tarifa de cacho queda editable hasta confirmar el monto." onClose={onClose} wide>
    {message&&<div className="inline-alert">{message}</div>}
    <div className="settings-table-list">{rows.map(row=><div className="settings-table-row" key={row.id}><div><label>Nombre<input className="input" value={row.name} onChange={e=>patch(row.id,'name',e.target.value)}/></label></div><div><label>Tipo<select className="input" value={row.table_type} onChange={e=>patch(row.id,'table_type',e.target.value)}><option value="billiard">Billar</option><option value="cacho">Cacho</option><option value="poker">Poker</option><option value="island">Isla</option></select></label></div><div><label>Cobro<select className="input" value={row.billing_mode} disabled={row.table_type==='island'} onChange={e=>patch(row.id,'billing_mode',e.target.value)}><option value="hourly">Por hora</option><option value="manual">Manual</option></select></label></div><div><label>Bs. / hora<input className="input" type="number" value={row.hourly_rate} disabled={row.billing_mode!=='hourly' || row.table_type==='island'} onChange={e=>patch(row.id,'hourly_rate',e.target.value)}/></label></div><button className="text-button" onClick={()=>save(row)}>Guardar</button></div>)}</div>
  </Modal>
}
