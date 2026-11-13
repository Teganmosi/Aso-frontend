import React from 'react';
import { Link } from 'react-router-dom';

/** Shown for any address the app doesn't know (old or mistyped links). */
export const NotFoundPage: React.FC = () => (
  <main style={{ padding: '4rem 16px', minHeight: '55vh', textAlign: 'center' }}>
    <p style={{ letterSpacing: '0.12em', fontSize: '0.75rem', fontWeight: 700, color: '#B45309', margin: 0 }}>PAGE NOT FOUND</p>
    <h1 style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: '2rem', color: '#111827', margin: '0.5rem 0 0.75rem' }}>
      We couldn’t find that page
    </h1>
    <p style={{ color: '#4B5563', maxWidth: 420, margin: '0 auto 1.75rem' }}>
      The link may be old or mistyped. The piece or studio may also have been removed.
    </p>
    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
      <Link to="/" className="btn-primary" style={{ textDecoration: 'none', padding: '0.75rem 1.5rem' }}>Go to the home page</Link>
      <Link to="/designers" style={{ padding: '0.75rem 1.25rem', color: '#064E3B', fontWeight: 600 }}>Browse designers</Link>
    </div>
  </main>
);
