import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, Armchair, ShoppingBasket, Boxes, WalletCards, BarChart3, UsersRound, LogOut, Menu, X, ShieldCheck } from 'lucide-react';
import { post } from '../api';
import BrandLogo from './BrandLogo';

const mainLinks = [
  ['/', 'Resumen', LayoutDashboard],
  ['/mesas', 'Salón', Armchair],
  ['/venta', 'Venta rápida', ShoppingBasket],
  ['/caja', 'Caja', WalletCards],
];
const adminLinks = [
  ['/control', 'Control', ShieldCheck],
  ['/inventario', 'Inventario', Boxes],
  ['/reportes', 'Reportes', BarChart3],
  ['/usuarios', 'Usuarios', UsersRound],
];

export default function Shell({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const title = [...mainLinks, ...adminLinks].find(([path]) => path === location.pathname)?.[1] || 'Billar Control';

  async function logout() {
    try { await post('/logout'); } catch {}
    localStorage.removeItem('billar_token');
    onLogout();
  }

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand"><BrandLogo className="sidebar-logo" /><div><strong>Billar Control</strong><span>Gestión interna</span></div></div>
        <button className="mobile-close" onClick={() => setOpen(false)}><X size={19}/></button>
        <nav>
          <span className="nav-caption">OPERACIÓN</span>
          {mainLinks.map(([path,label,Icon]) => <NavLink key={path} to={path} end={path === '/'} onClick={() => setOpen(false)}><Icon size={18}/><span>{label}</span></NavLink>)}
          {user.role === 'admin' && <>
            <span className="nav-caption nav-caption-gap">ADMINISTRACIÓN</span>
            {adminLinks.map(([path,label,Icon]) => <NavLink key={path} to={path} onClick={() => setOpen(false)}><Icon size={18}/><span>{label}</span></NavLink>)}
          </>}
        </nav>
        <div className="sidebar-user">
          <div className="avatar">{user.name?.slice(0,1).toUpperCase()}</div>
          <div className="sidebar-user-copy"><strong>{user.name}</strong><span>{user.role_label}</span></div>
          <button className="icon-button" title="Cerrar sesión" onClick={logout}><LogOut size={18}/></button>
        </div>
      </aside>
      {open && <button className="sidebar-backdrop" onClick={() => setOpen(false)} aria-label="Cerrar menú"/>}
      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setOpen(true)}><Menu size={21}/></button>
          <div><span className="eyebrow">BILLAR CENTRAL</span><h1>{title}</h1></div>
          <div className="topbar-date">{new Intl.DateTimeFormat('es-BO', { weekday:'short', day:'2-digit', month:'short' }).format(new Date())}</div>
        </header>
        <div className="page"><Outlet/></div>
      </main>
    </div>
  );
}
