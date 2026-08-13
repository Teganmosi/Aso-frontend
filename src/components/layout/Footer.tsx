import React, { useState } from 'react';
import './Footer.css';
import { Logo, type LogoOption } from './Logo';

interface FooterProps {
  logoOption?: LogoOption;
  onOpenVendorRegister?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ logoOption = 2, onOpenVendorRegister }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="stitch-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Column 1: Brand Info */}
          <div className="footer-col brand-col">
            <div style={{ marginBottom: '0.75rem' }}>
              <Logo showTagline={true} option={logoOption} />
            </div>
            <p className="footer-brand-bio">
              Bridging traditional Nigerian craftsmanship with contemporary global commerce.
            </p>
            <p className="footer-copyright">
              © 2024 Aso Marketplace. Authentically Nigerian.
            </p>
          </div>

          {/* Column 2: Discover */}
          <div className="footer-col">
            <h4 className="footer-col-header">DISCOVER</h4>
            <ul className="footer-links-list">
              <li><a href="#mission">Mission</a></li>
              <li><a href="/store/lagos-couture">Designers</a></li>
              <li><a href="#collections">Collections</a></li>
              {onOpenVendorRegister && (
                <li>
                  <button 
                    onClick={onOpenVendorRegister} 
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Register as a Designer
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="footer-col">
            <h4 className="footer-col-header">SUPPORT</h4>
            <ul className="footer-links-list">
              <li><a href="#help">Help & FAQs</a></li>
              <li><a href="#shipping">Worldwide Shipping</a></li>
              <li><a href="#returns">Returns Policy</a></li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="footer-col newsletter-col">
            <h4 className="footer-col-header">NEWSLETTER</h4>
            <p className="newsletter-subtitle">Subscribe for exclusive releases.</p>

            {subscribed ? (
              <p className="newsletter-success-msg">Thank you for subscribing!</p>
            ) : (
              <form onSubmit={handleSubscribe} className="newsletter-form">
                <input
                  type="email"
                  className="newsletter-input"
                  placeholder="Email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn-newsletter-join">
                  Join
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
