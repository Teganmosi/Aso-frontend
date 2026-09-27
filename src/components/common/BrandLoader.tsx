import React from 'react';
import './BrandLoader.css';

interface BrandLoaderProps {
  fullScreen?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
}

export const BrandLoader: React.FC<BrandLoaderProps> = ({
  fullScreen = false,
  message,
  size = 'md',
  theme = 'dark'
}) => {
  const pixelSize = size === 'sm' ? 56 : size === 'lg' ? 96 : 72;

  return (
    <div 
      className={`aso-brand-loader-container ${fullScreen ? 'fullscreen' : 'embedded'} ${theme === 'light' ? 'light-theme' : 'dark-theme'}`}
      role="status"
      aria-live="polite"
    >
      <div className="aso-loader-emblem-wrap">
        <div className={`aso-loader-glow size-${size}`} />
        
        {/* Animated Needle & Gold Thread SVG Logo */}
        <svg 
          className="aso-loader-svg" 
          width={pixelSize} 
          height={pixelSize} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Silver Needle */}
          <g className="aso-needle-path">
            <path 
              d="M32 78 L72 22" 
              stroke={theme === 'light' ? '#1F2937' : '#FFFFFF'} 
              strokeWidth="5.5" 
              strokeLinecap="round"
            />
            <circle cx="68" cy="27" r="2.8" fill={theme === 'light' ? '#FFFFFF' : '#111827'} />
          </g>

          {/* Interlocking Gold Thread Loop */}
          <path 
            className="aso-thread-path"
            d="M16 54 C 36 16, 78 22, 66 54 C 54 80, 92 78, 96 46" 
            stroke="#D4AF37" 
            strokeWidth="6" 
            strokeLinecap="round" 
            fill="none"
          />
        </svg>
      </div>

      <div className="aso-loader-brand">
        <span className="aso-loader-title">ASO</span>
        <span className="aso-loader-subtitle">MARKETPLACE</span>
      </div>

      <div className="aso-loader-shimmer-track">
        <div className="aso-loader-shimmer-bar" />
      </div>

      {message && <p className="aso-loader-message">{message}</p>}
    </div>
  );
};
