import { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';

let deferredPrompt = null;
const listeners = new Set();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    listeners.forEach(listener => listener(true));
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach(listener => listener(false));
  });
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export default function InstallAppButton({ compact = false }) {
  const [available, setAvailable] = useState(Boolean(deferredPrompt));
  const [installed, setInstalled] = useState(isStandalone());
  const [hint, setHint] = useState('');

  useEffect(() => {
    const listener = value => setAvailable(value);
    listeners.add(listener);
    setAvailable(Boolean(deferredPrompt));
    setInstalled(isStandalone());
    return () => listeners.delete(listener);
  }, []);

  async function install() {
    if (installed) {
      setHint('La aplicación ya está abierta como app instalada.');
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice.catch(() => null);
      if (choice?.outcome === 'accepted') setHint('Instalación aceptada.');
      deferredPrompt = null;
      setAvailable(false);
      return;
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setHint(
      ios
        ? 'En iPhone: Compartir → Añadir a pantalla de inicio.'
        : 'En Chrome: menú ⋮ → Instalar app o Agregar a pantalla de inicio.'
    );
  }

  return (
    <div className={`install-app-wrap ${compact ? 'compact' : ''}`}>
      <button className={compact ? 'secondary-button' : 'primary-button'} type="button" onClick={install}>
        {installed ? <Smartphone size={16}/> : <Download size={16}/>}
        {installed ? 'App instalada' : available ? 'Instalar en este celular' : 'Usar como app en el celular'}
      </button>
      {hint && <small className="install-hint">{hint}</small>}
    </div>
  );
}
