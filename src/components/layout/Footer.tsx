import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Logo, type LogoOption } from './Logo';
import './Footer.css';

interface FooterProps {
  logoOption?: LogoOption;
  onOpenVendorRegister?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ logoOption = 2, onOpenVendorRegister }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [activeSupportModal, setActiveSupportModal] = useState<'help' | 'delivery' | 'protection' | null>(null);

  // Accordion open states for mobile
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    discover: false,
    sell: false,
    support: false,
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
    <>
      <footer className="stitch-footer">
        <div className="footer-container">
          
          {/* Brand Info */}
          <div className="footer-brand-section">
            <div style={{ marginBottom: '0.5rem' }}>
              <Logo showTagline={true} option={logoOption} />
            </div>
            <p className="footer-brand-bio">
              Discover and shop authentic Nigerian fashion directly from verified independent designers.
            </p>
          </div>

          <div className="footer-grid">
            {/* Column: Discover */}
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
                <li><Link to="/men">Men's Collection</Link></li>
                <li><Link to="/women">Women's Collection</Link></li>
                <li><Link to="/traditional">Traditional &amp; Bridal</Link></li>
                <li><Link to="/designers">Designers Directory</Link></li>
              </ul>
            </div>

            {/* Column: Sell on Aso */}
            <div className={`footer-col ${openSections.sell ? 'is-open' : ''}`}>
              <button
                type="button"
                className="footer-accordion-header"
                onClick={() => toggleSection('sell')}
              >
                <span>SELL ON ASO</span>
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
                      Become a Designer
                    </button>
                  </li>
                ) : (
                  <li><Link to="/designers">Become a Designer</Link></li>
                )}
                <li><Link to="/vendor/dashboard">Studio Dashboard</Link></li>
              </ul>
            </div>

            {/* Column: Support */}
            <div className={`footer-col ${openSections.support ? 'is-open' : ''}`}>
              <button
                type="button"
                className="footer-accordion-header"
                onClick={() => toggleSection('support')}
              >
                <span>SUPPORT</span>
                <span className="accordion-arrow">
                  {openSections.support ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>
              <ul className="footer-links-list">
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveSupportModal('help')}
                    className="footer-action-link"
                  >
                    Help &amp; FAQs
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveSupportModal('delivery')}
                    className="footer-action-link"
                  >
                    Delivery &amp; Logistics
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveSupportModal('protection')}
                    className="footer-action-link"
                  >
                    Buyer Protection
                  </button>
                </li>
              </ul>
            </div>

            {/* Column: Newsletter */}
            <div className="footer-col newsletter-col">
              <h4 className="footer-newsletter-header">Get the latest from Aso</h4>
              <p className="newsletter-subtitle">
                New pieces and verified releases delivered to your inbox.
              </p>

              {subscribed ? (
                <p className="newsletter-success-msg">Thank you for joining!</p>
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

          <div className="footer-bottom-bar">
            <p className="footer-copyright">
              © 2026 Aso Marketplace. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Interactive Support Modal */}
      {activeSupportModal && (
        <div className="footer-modal-backdrop" onClick={() => setActiveSupportModal(null)}>
          <div className="footer-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="footer-modal-close" onClick={() => setActiveSupportModal(null)} aria-label="Close">
              <X size={20} />
            </button>

            {activeSupportModal === 'help' && (
              <div>
                <div className="footer-modal-header">
                  <HelpCircle size={24} color="#8B500A" />
                  <h3>Help Center &amp; Frequently Asked Questions</h3>
                </div>
                <div className="footer-modal-body">
                  <h4>How does custom tailoring work on Aso?</h4>
                  <p>When you place an order, the designer receives your confirmed size specifications. Tailoring starts immediately upon order acceptance.</p>

                  <h4>How do I know my size?</h4>
                  <p>Every piece includes size specifications. You can also select "Bespoke Fit" to provide your custom measurements.</p>
                </div>
              </div>
            )}

            {activeSupportModal === 'delivery' && (
              <div>
                <div className="footer-modal-header">
                  <Truck size={24} color="#00322D" />
                  <h3>Delivery &amp; Logistics</h3>
                </div>
                <div className="footer-modal-body">
                  <h4>Nationwide Nigerian Shipping</h4>
                  <p>We partner with verified courier and dispatch services across all Nigerian states and the FCT Abuja.</p>

                  <h4>Preparation and Transit Times</h4>
                  <p>Each product card displays the designer's tailoring time (e.g. 3-5 days). Once dispatched, delivery in Lagos takes 24–48 hours; outside Lagos takes 2–4 business days.</p>
                </div>
              </div>
            )}

            {activeSupportModal === 'protection' && (
              <div>
                <div className="footer-modal-header">
                  <ShieldCheck size={24} color="#00322D" />
                  <h3>Buyer Protection Guarantee</h3>
                </div>
                <div className="footer-modal-body">
                  <h4>How Buyer Protection Works</h4>
                  <p>Your payment is safely held while your order is being crafted and is only disbursed to the designer after your piece is delivered and verified.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
