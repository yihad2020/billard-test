import { useEffect, useMemo, useState } from 'react';
import { get, post } from '../api';
import { Minus, Plus, Trash2 } from 'lucide-react';

const money=v=>`Bs. ${Number(v||0).toFixed(2)}`;
export default function POS(){
  const [products,setProducts]=useState([]);const [categories,setCategories]=useState([]);const [category,setCategory]=useState('all');const [search,setSearch]=useState('');const [cart,setCart]=useState([]);const [method,setMethod]=useState('cash');const [message,setMessage]=useState('');const [loading,setLoading]=useState(false);
  async function load(){const [p,c]=await Promise.all([get('/products'),get('/categories')]);setProducts(p.products);setCategories(c.categories);}
  useEffect(()=>{load().catch(e=>setMessage(e.message));},[]);
  const filtered=useMemo(()=>products.filter(p=>(category==='all'||String(p.category_id)===String(category))&&p.name.toLowerCase().includes(search.toLowerCase())),[products,category,search]);
  const total=cart.reduce((a,i)=>a+i.quantity*Number(i.sale_price),0);
  function add(p){if(Number(p.stock)<=0)return;setCart(c=>{const found=c.find(i=>i.id===p.id);if(found){if(found.quantity>=Number(p.stock))return c;return c.map(i=>i.id===p.id?{...i,quantity:i.quantity+1}:i);}return [...c,{...p,quantity:1}];});}
  function change(id,delta){setCart(c=>c.map(i=>i.id===id?{...i,quantity:Math.max(1,Math.min(Number(i.stock),i.quantity+delta))}:i));}
  async function sell(){if(!cart.length)return;setLoading(true);setMessage('');try{const r=await post('/sales/pos',{payment_method:method,items:cart.map(i=>({product_id:i.id,quantity:i.quantity}))});setMessage(`${r.sale_number} registrada · ${money(r.total)}`);setCart([]);await load();}catch(e){setMessage(e.message);}finally{setLoading(false);}}
  return <div className="pos-layout">
    <section className="product-catalog panel flat">
      <div className="catalog-head"><input className="input" placeholder="Buscar producto…" value={search} onChange={e=>setSearch(e.target.value)}/><div className="category-tabs"><button className={category==='all'?'active':''} onClick={()=>setCategory('all')}>Todos</button>{categories.map(c=><button key={c.id} className={String(category)===String(c.id)?'active':''} onClick={()=>setCategory(c.id)}>{c.name}</button>)}</div></div>
      <div className="product-grid">
        {filtered.map(p=><button key={p.id} className="product-tile" onClick={()=>add(p)} disabled={Number(p.stock)<=0}><div className="product-tile-top"><span className="product-category">{p.category_name}</span><Plus size={15}/></div><strong>{p.name}</strong><div className="product-meta"><span>{money(p.sale_price)}</span><small className={p.stock_status!=='ok'?'stock-alert':''}>{Number(p.stock)} disp.</small></div></button>)}
      </div>
    </section>
    <aside className="cart-panel">
      <div className="cart-head"><div><span className="eyebrow">VENTA DIRECTA</span><h3>Cuenta actual</h3></div><span>{cart.reduce((a,i)=>a+i.quantity,0)} items</span></div>
      <div className="cart-items">{!cart.length?<div className="cart-empty"><strong>La cuenta está vacía</strong><span>Selecciona productos para comenzar.</span></div>:cart.map(i=><div className="cart-item" key={i.id}><div><strong>{i.name}</strong><span>{money(i.sale_price)} c/u</span></div><div className="qty-control"><button onClick={()=>change(i.id,-1)}><Minus size={14}/></button><span>{i.quantity}</span><button onClick={()=>change(i.id,1)}><Plus size={14}/></button></div><strong>{money(i.quantity*Number(i.sale_price))}</strong><button className="delete-soft" onClick={()=>setCart(c=>c.filter(x=>x.id!==i.id))}><Trash2 size={15}/></button></div>)}</div>
      <div className="cart-footer"><div className="grand-total"><span>Total</span><strong>{money(total)}</strong></div><span className="field-label">Método de pago</span><div className="payment-switch"><button className={method==='cash'?'active':''} onClick={()=>setMethod('cash')}>Efectivo</button><button className={method==='qr'?'active':''} onClick={()=>setMethod('qr')}>QR</button><button className={method==='card'?'active':''} onClick={()=>setMethod('card')}>Tarjeta</button></div>{message&&<div className="inline-alert">{message}</div>}<button className="primary-button full" disabled={!cart.length||loading} onClick={sell}>{loading?'Registrando…':'Cobrar venta'}</button></div>
    </aside>
  </div>;
}
