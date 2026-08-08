import { X } from 'lucide-react';
export default function Modal({ open, title, subtitle, onClose, children, wide=false }) {
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={(e)=>e.target===e.currentTarget&&onClose()}>
    <section className={`modal ${wide?'modal-wide':''}`}>
      <header className="modal-header"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose}><X size={20}/></button></header>
      <div className="modal-body">{children}</div>
    </section>
  </div>;
}
