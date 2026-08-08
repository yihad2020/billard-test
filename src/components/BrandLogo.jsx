const logoUrl = `${import.meta.env.BASE_URL}assets/branding/billar-logo.png`;

export default function BrandLogo({ className = '', alt = 'Billiard' }) {
  return (
    <img
      className={`brand-logo ${className}`.trim()}
      src={logoUrl}
      alt={alt}
      draggable="false"
    />
  );
}
