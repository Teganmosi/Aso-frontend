import React from 'react';
import type { LogoOption } from './Logo';

interface LogoSwitcherBarProps {
  activeOption: LogoOption;
  onSelectOption: (option: LogoOption) => void;
}

export const LogoSwitcherBar: React.FC<LogoSwitcherBarProps> = ({ activeOption, onSelectOption }) => {
  const options: { id: LogoOption; label: string; icon: string }[] = [
    { id: 1, label: 'Option 1: Regal Crown', icon: '👑' },
    { id: 2, label: 'Option 2: Thread & Needle', icon: '🪡' },
    { id: 3, label: 'Option 3: Adire Shield', icon: '💎' },
    { id: 4, label: 'Option 4: Wordmark', icon: '✒️' },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.25rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      backgroundColor: '#111827',
      color: '#FFFFFF',
      padding: '0.4rem 0.6rem',
      borderRadius: '9999px',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
      fontSize: '0.8rem',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      backdropFilter: 'blur(8px)',
    }}>
      <span style={{ fontSize: '0.72rem', color: '#9CA3AF', paddingLeft: '0.5rem', paddingRight: '0.2rem', fontWeight: 600 }}>
        Logo Preview:
      </span>
      {options.map((opt) => {
        const isActive = activeOption === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onSelectOption(opt.id)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: isActive ? '#D4AF37' : 'transparent',
              color: isActive ? '#111827' : '#E5E7EB',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
