import React from 'react';

/**
 * A designer's own logo and banner, or a plain brand-coloured stand-in.
 * We never borrow a picture (stock photos, campaign images or one of their pieces)
 * for a designer who hasn't uploaded their own.
 */

/** "Tolu Couture House" -> "TC"; "Ade" -> "AD". */
export const designerInitials = (name?: string | null): string => {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0] || 'A').slice(0, 2).toUpperCase();
};

const PLAIN_BANNER = 'linear-gradient(135deg, #0C3B2E 0%, #07261E 100%)';

/** Inline style for a banner area: their banner photo, else the plain green used on studio pages. */
export const designerBannerStyle = (bannerUrl?: string | null): React.CSSProperties =>
  bannerUrl
    ? { backgroundImage: `url("${bannerUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundImage: PLAIN_BANNER };

interface DesignerLogoProps {
  logoUrl?: string | null;
  name?: string | null;
  className?: string;
  size?: number;
}

/** Their logo, else their initials on brand green. Fills the parent when no size is given. */
export const DesignerLogo: React.FC<DesignerLogoProps> = ({ logoUrl, name, className, size }) => {
  const box: React.CSSProperties = size ? { width: size, height: size } : { width: '100%', height: '100%' };
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name ? `${name} logo` : 'Designer logo'}
        className={className}
        style={{ ...box, objectFit: 'cover', borderRadius: '50%', display: 'block' }}
        loading="lazy"
      />
    );
  }
  return (
    <span
      className={className}
      aria-label={name ? `${name} (no logo yet)` : undefined}
      style={{
        ...box,
        borderRadius: '50%',
        background: '#0C3B2E',
        color: '#E6C766',
        fontWeight: 800,
        fontSize: size ? Math.max(12, Math.round(size * 0.36)) : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        letterSpacing: '0.04em',
      }}
    >
      {designerInitials(name)}
    </span>
  );
};
