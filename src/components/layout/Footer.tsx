import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Logo, type LogoOption } from './Logo';
import './Footer.css';

interface FooterProps {
  logoOption?: LogoOption;
  onOpenVendorRegister?: () => void;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ logoOption = 2, onOpenVendorRegister, className = '' }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Accordion open states for mobile
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    discover: false,
    sell: false,
    support: false,
    company: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className={`stitch-footer ${className}`.trim()}>
      <div className="footer-container">
        
        {/* Brand Info */}
        <div className="footer-brand-section">
          <div style={{ marginBottom: '0.65rem' }}>
            <Logo showTagline={true} option={logoOption} />
          </div>
          <p className="footer-brand-bio">
            The premier operating platform for authentic African bespoke fashion, connecting discerning shoppers worldwide with verified master tailors and fashion houses.
          </p>
        </div>

        <div className="footer-grid">
          {/* Column 1: Discover */}
          <div className={`footer-col ${openSections.discover ? 'is-open' : ''}`}>
            <button
              type="button"
              className="footer-accordion-header"
              onClick={() => toggleSection('discover')}
            >
              <span>DISCOVER</span>
              <span className="accordion-arrow">
                {openSections.discover ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            <ul className="footer-links-list">
              <li><Link to="/men">Men's Senator &amp; Agbada</Link></li>
              <li><Link to="/women">Women's Gowns &amp; Sets</Link></li>
              <li><Link to="/traditional">Traditional &amp; Bridal Aṣọ</Link></li>
              <li><Link to="/designers">Verified Designers Directory</Link></li>
            </ul>
          </div>

          {/* Column 2: Sell on Aso */}
          <div className={`footer-col ${openSections.sell ? 'is-open' : ''}`}>
            <button
              type="button"
              className="footer-accordion-header"
              onClick={() => toggleSection('sell')}
            >
              <span>DESIGNER ATELIER</span>
              <span className="accordion-arrow">
                {openSections.sell ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            <ul className="footer-links-list">
              {onOpenVendorRegister ? (
                <li>
                  <button 
                    type="button"
                    onClick={onOpenVendorRegister} 
                    className="footer-action-link"
                  >
                    Open Your Studio
                  </button>
                </li>
              ) : (
                <li><Link to="/vendor">Open Your Studio</Link></li>
              )}
              <li><Link to="/vendor/dashboard">Studio Dashboard</Link></li>
              <li><Link to="/faq">Designer FAQs &amp; Payouts</Link></li>
            </ul>
          </div>

          {/* Column 3: Support & Escrow */}
          <div className={`footer-col ${openSections.support ? 'is-open' : ''}`}>
            <button
              type="button"
              className="footer-accordion-header"
              onClick={() => toggleSection('support')}
            >
              <span>TRUST &amp; SUPPORT</span>
              <span className="accordion-arrow">
                {openSections.support ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            <ul className="footer-links-list">
              <li><Link to="/faq">Help Center &amp; FAQs</Link></li>
              <li><Link to="/escrow-policy">Aso Escrow Guarantee</Link></li>
              <li><Link to="/shipping-returns">Dellyman Delivery &amp; Returns</Link></li>
              <li><Link to="/contact">Contact Atelier Concierge</Link></li>
            </ul>
          </div>

          {/* Column 4: Company & Legal */}
          <div className={`footer-col ${openSections.company ? 'is-open' : ''}`}>
            <button
              type="button"
              className="footer-accordion-header"
              onClick={() => toggleSection('company')}
            >
              <span>COMPANY</span>
              <span className="accordion-arrow">
                {openSections.company ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            <ul className="footer-links-list">
              <li><Link to="/about">About Aso Manifesto</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy (NDPA)</Link></li>
              <li><Link to="/contact">Atelier HQ &amp; Partnerships</Link></li>
            </ul>
          </div>

          {/* Column 5: Newsletter */}
          <div className="footer-col newsletter-col">
            <h4 className="footer-newsletter-header">Atelier Newsletter</h4>
            <p className="newsletter-subtitle">
              Exclusive bespoke drops, artisan highlights, and fashion releases.
            </p>

            {subscribed ? (
              <p className="newsletter-success-msg">Welcome to the Aso circle!</p>
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

        {/* Bottom Bar: Copyright & Direct Legal Navigation */}
        <div className="footer-bottom-bar">
          <p className="footer-copyright">
            © 2026 Aso Marketplace Ltd. All rights reserved.
          </p>
          <ul className="footer-legal-links">
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/escrow-policy">Escrow Protection</Link></li>
            <li><Link to="/shipping-returns">Fulfillment &amp; Alterations</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
