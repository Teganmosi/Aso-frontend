import React from 'react';

export type LogoOption = 1 | 2 | 3 | 4;

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light';
  showTagline?: boolean;
  option?: LogoOption;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  variant = 'dark', 
  showTagline = false,
  option = 1 
}) => {
  const primaryColor = variant === 'dark' ? '#111827' : '#FFFFFF';
  const taglineColor = variant === 'dark' ? '#6B7280' : '#D1D5DB';
  const accentGold = '#D4AF37';

  // Option 1: Regal Crown Monogram
  if (option === 1) {
    return (
      <div className={`aso-brand-logo-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
        <svg width={showTagline ? 185 : 135} height={showTagline ? 48 : 38} viewBox="0 0 200 55" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(4, 5)">
            <path d="M22 4 L40 40 H4 L22 4 Z" stroke={accentGold} strokeWidth="2.8" strokeLinejoin="round" fill="none"/>
            <path d="M22 14 L14 32 H30 L22 14 Z" fill={accentGold} fillOpacity="0.22"/>
            <line x1="22" y1="4" x2="22" y2="40" stroke={accentGold} strokeWidth="1.5" strokeDasharray="2 2"/>
            <circle cx="22" cy="4" r="2.5" fill={accentGold}/>
            <circle cx="11" cy="27" r="2" fill={accentGold}/>
            <circle cx="33" cy="27" r="2" fill={accentGold}/>
          </g>
          <text x="54" y="34" fontFamily="'Playfair Display', Georgia, serif" fontSize="28" fontWeight="800" letterSpacing="3" fill={primaryColor}>
            ASO
          </text>
          {showTagline && (
            <text x="55" y="47" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="7.5" fontWeight="600" letterSpacing="2" fill={taglineColor}>
              BESPOKE MARKETPLACE
            </text>
          )}
        </svg>
      </div>
    );
  }

  // Option 2: Continuous Thread & Needle Interlock
  if (option === 2) {
    return (
      <div className={`aso-brand-logo-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
        <svg width={showTagline ? 185 : 135} height={showTagline ? 48 : 38} viewBox="0 0 200 55" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(4, 6)">
            {/* Needle Body */}
            <path d="M12 38 L34 8" stroke={primaryColor} strokeWidth="3" strokeLinecap="round"/>
            <circle cx="32" cy="10" r="1.5" fill={variant === 'dark' ? '#FFFFFF' : '#111827'}/>
            {/* Golden Thread Loop forming Intersecting A & S */}
            <path d="M4 26 C 14 8, 34 12, 28 26 C 22 38, 42 38, 44 22" stroke="#C59B27" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
          </g>
          <text x="58" y="34" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="26" fontWeight="800" letterSpacing="3" fill={primaryColor}>
            ASO
          </text>
          {showTagline && (
            <text x="59" y="47" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="7.5" fontWeight="700" letterSpacing="2" fill="#C59B27">
              MARKETPLACE
            </text>
          )}
        </svg>
      </div>
    );
  }

  // Option 3: Adire Diamond Loom Shield
  if (option === 3) {
    return (
      <div className={`aso-brand-logo-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
        <svg width={showTagline ? 185 : 135} height={showTagline ? 48 : 38} viewBox="0 0 200 55" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(4, 5)">
            {/* Emerald & Gold Diamond Shield */}
            <path d="M22 2 L40 20 L22 38 L4 20 Z" stroke="#0F5132" strokeWidth="2.5" fill="#0F5132" fillOpacity="0.15"/>
            <line x1="22" y1="2" x2="22" y2="38" stroke={accentGold} strokeWidth="2"/>
            <line x1="4" y1="20" x2="40" y2="20" stroke={accentGold} strokeWidth="2"/>
            <circle cx="22" cy="20" r="4" fill="#0F5132" stroke={accentGold} strokeWidth="1.5"/>
          </g>
          <text x="56" y="34" fontFamily="'Playfair Display', Georgia, serif" fontSize="28" fontWeight="700" letterSpacing="3" fill={primaryColor}>
            aso
          </text>
          {showTagline && (
            <text x="57" y="47" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="7" fontWeight="700" letterSpacing="2.5" fill="#0F5132">
              BESPOKE NIGERIA
            </text>
          )}
        </svg>
      </div>
    );
  }

  // Option 4: High-Contrast Editorial Wordmark
  return (
    <div className={`aso-brand-logo-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
      <svg width={showTagline ? 160 : 130} height={showTagline ? 48 : 38} viewBox="0 0 170 55" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="6" y="35" fontFamily="'Playfair Display', serif" fontSize="36" fontWeight="900" letterSpacing="5" fill={primaryColor}>
          ASO
        </text>
        <line x1="8" y1="44" x2="135" y2="44" stroke={accentGold} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="143" cy="44" r="2.5" fill={accentGold}/>
      </svg>
    </div>
  );
};
