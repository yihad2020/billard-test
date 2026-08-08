const splashUrl = `${import.meta.env.BASE_URL}assets/branding/billar-splash.png`;

export default function SplashScreen() {
  return (
    <div className="splash-screen" role="status" aria-live="polite">
      <img
        className="splash-background"
        src={splashUrl}
        alt=""
        aria-hidden="true"
      />
      <span className="sr-only">Cargando sistema…</span>
    </div>
  );
}
