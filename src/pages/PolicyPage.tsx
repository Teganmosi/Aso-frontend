import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  Truck, 
  Sparkles, 
  Mail, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import './PolicyPage.css';

export type PolicySection = 'terms' | 'privacy' | 'escrow' | 'shipping' | 'about' | 'contact' | 'faq';

interface PolicyPageProps {
  initialSection?: PolicySection;
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ initialSection }) => {
  const location = useLocation();

  const getSectionFromPath = (): PolicySection => {
    const path = location.pathname.toLowerCase();
    if (path.includes('privacy')) return 'privacy';
    if (path.includes('escrow')) return 'escrow';
    if (path.includes('shipping') || path.includes('return')) return 'shipping';
    if (path.includes('about')) return 'about';
    if (path.includes('contact')) return 'contact';
    if (path.includes('faq')) return 'faq';
    return initialSection || 'terms';
  };

  const activeSection = getSectionFromPath();

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  return (
    <div className="policy-page-layout">
      {/* Hero Banner */}
      <section className="policy-hero-banner">
        <div className="policy-hero-inner">
          <div className="policy-badge">
            <Sparkles size={14} color="#D4AF37" />
            <span>TRUST, GOVERNANCE & LEGAL</span>
          </div>

          <h1 className="policy-title">
            {activeSection === 'terms' && 'Terms of Service'}
            {activeSection === 'privacy' && 'Privacy & Data Protection Policy'}
            {activeSection === 'escrow' && 'Aso Escrow & Buyer Protection'}
            {activeSection === 'shipping' && 'Fulfillment, Delivery & Returns'}
            {activeSection === 'about' && 'About Aso: The African Fashion Operating System'}
            {activeSection === 'contact' && 'Contact Atelier Support'}
            {activeSection === 'faq' && 'Help Center & Frequently Asked Questions'}
          </h1>

          <p className="policy-subtitle">
            {activeSection === 'terms' && 'Rules, rights, and contractual obligations governing shoppers and verified fashion designers on Aso.'}
            {activeSection === 'privacy' && 'How we protect your personal, measurement, and financial data in full compliance with the Nigeria Data Protection Act (NDPA).'}
            {activeSection === 'escrow' && 'Your funds are held securely until you receive and verify your bespoke garment. 100% dispute-free guarantee.'}
            {activeSection === 'shipping' && 'Automated Dellyman nationwide dispatch, tailoring lead times, and bespoke alteration terms.'}
            {activeSection === 'about' && 'Empowering master African artisans with digital storefronts, automated logistics, and smart sizing.'}
            {activeSection === 'contact' && 'Direct channels to our customer concierge, designer onboarding desk, and dispute resolution team.'}
            {activeSection === 'faq' && 'Clear answers to common questions on bespoke sizing, Escrow security, delivery times, and payments.'}
          </p>

          <span className="policy-updated-date">Effective Date: October 2026 • Version 1.2</span>
        </div>
      </section>

      {/* Policy Navigation Bar */}
      <nav className="policy-tabs-wrapper" aria-label="Legal Navigation">
        <div className="policy-tabs-container">
          <Link to="/terms" className={`policy-tab-link ${activeSection === 'terms' ? 'active' : ''}`}>
            <FileText size={15} />
            <span>Terms of Service</span>
          </Link>
          <Link to="/escrow-policy" className={`policy-tab-link ${activeSection === 'escrow' ? 'active' : ''}`}>
            <ShieldCheck size={15} />
            <span>Escrow Protection</span>
          </Link>
          <Link to="/shipping-returns" className={`policy-tab-link ${activeSection === 'shipping' ? 'active' : ''}`}>
            <Truck size={15} />
            <span>Shipping &amp; Alterations</span>
          </Link>
          <Link to="/privacy" className={`policy-tab-link ${activeSection === 'privacy' ? 'active' : ''}`}>
            <Lock size={15} />
            <span>Privacy Policy</span>
          </Link>
          <Link to="/about" className={`policy-tab-link ${activeSection === 'about' ? 'active' : ''}`}>
            <Sparkles size={15} />
            <span>About Aso</span>
          </Link>
          <Link to="/faq" className={`policy-tab-link ${activeSection === 'faq' ? 'active' : ''}`}>
            <HelpCircle size={15} />
            <span>FAQs</span>
          </Link>
          <Link to="/contact" className={`policy-tab-link ${activeSection === 'contact' ? 'active' : ''}`}>
            <Mail size={15} />
            <span>Contact Us</span>
          </Link>
        </div>
      </nav>

      {/* Main Content Card */}
      <main className="policy-main-container">
        <div className="policy-content-card policy-prose">
          
          {/* 1. TERMS OF SERVICE */}
          {activeSection === 'terms' && (
            <article>
              <h2>1. Introduction &amp; Marketplace Model</h2>
              <p>
                Welcome to <strong>Aso Marketplace</strong> (accessible at <code>asomarketplace.com.ng</code>). Aso operates as a curated luxury multi-vendor marketplace connecting independent African fashion designers, bespoke tailors, and textile artisans with domestic and international fashion buyers.
              </p>
              <p>
                By creating an account, browsing collections, or transacting on Aso, you enter into a legally binding agreement governed by the Laws of the Federal Republic of Nigeria.
              </p>

              <h2>2. Bespoke Made-to-Measure Garments</h2>
              <p>
                A substantial portion of products showcased on Aso are hand-tailored pieces cut from raw textile bolts. When placing a custom order:
              </p>
              <ul>
                <li><strong>Measurement Accuracy:</strong> The buyer is responsible for submitting accurate body measurements or utilizing our verified "My Aso Fit" smart anthropometric estimator.</li>
                <li><strong>Immutable Cut Sheets:</strong> Once an order is paid, measurement specifications are locked into an immutable Atelier Tailoring Cut Sheet. Subsequent adjustments must be requested via the in-app Atelier Order Workspace.</li>
                <li><strong>Fabric Variance:</strong> Traditional hand-dyed and woven fabrics (such as Adire and Aso-Oke) possess organic variations in dye pattern and weave texture that are intrinsic to artisan craft.</li>
              </ul>

              <div className="policy-callout gold">
                <AlertTriangle size={20} className="policy-callout-icon" />
                <div>
                  <strong>Platform Integrity &amp; Escrow Clause:</strong> All communications, measurement checks, and financial payments must remain within the Aso platform. Attempting to exchange direct bank accounts or off-platform contact details voids all Aso Escrow protections and constitutes grounds for immediate account suspension.
                </div>
              </div>

              <h2>Designer Verification &amp; the Verified Badge</h2>
              <p>
                Any fashion designer may open a studio on Aso and list garments. Designers who display the
                {' '}<strong>&#10003; Verified</strong> badge have had their identity (National Identification Number or
                CAC business registration) reviewed and approved by the Aso team.
              </p>
              <ul>
                <li><strong>Every order is protected:</strong> Whether or not a designer is verified, all payments are held under Aso Escrow and are released to the designer only after your order has been delivered.</li>
                <li><strong>Verification unlocks payouts:</strong> Designers cannot withdraw earnings to a bank account until Aso has verified their identity. Every payout is reviewed by Aso before it is sent.</li>
                <li><strong>Choosing a designer:</strong> For additional assurance, look for the Verified badge on a designer's storefront and products, or use the &ldquo;Verified designers&rdquo; filter.</li>
                <li><strong>What the badge means:</strong> The badge confirms identity only; it is not an endorsement of a specific garment. Aso may remove listings or suspend any studio that breaches these Terms.</li>
              </ul>

              <h2>3. Order Lifecycle &amp; Escrow Settlements</h2>
              <p>
                All shopper payments are captured securely via Paystack and held under the <strong>Aso Escrow Shield</strong>. Funds are never released directly to designers upon checkout:
              </p>
              <ul>
                <li><strong>Order Confirmation SLA:</strong> Designers have forty-eight (48) hours to review and accept an incoming tailoring order.</li>
                <li><strong>Tailoring &amp; Fulfillment:</strong> The designer crafts the garment within their declared SLA (typically 3 to 7 working days) and marks the parcel "Ready for Pickup".</li>
                <li><strong>Automated Delivery:</strong> Dellyman Logistics couriers collect the parcel directly from the designer's verified workshop.</li>
                <li><strong>Settlement Release:</strong> Payout is released to the designer's registered Nigerian bank account forty-eight (48) hours following confirmed courier delivery, provided no dispute has been raised.</li>
              </ul>

              <h2>4. Alterations &amp; Dispute Resolution</h2>
              <p>
                Because custom bespoke garments are created specifically for an individual’s body dimensions, made-to-measure orders cannot be cancelled or returned for a cash refund simply due to buyer change of mind. However, tailors are contractually bound to perform free alterations if the delivered garment deviates by more than 1.5 inches from the agreed cut sheet specifications.
              </p>
            </article>
          )}

          {/* 2. ESCROW POLICY */}
          {activeSection === 'escrow' && (
            <article>
              <h2>How Aso Escrow Protects Your Money</h2>
              <p>
                Traditional African bespoke tailoring has historically been plagued by trust deficits: tailors demanding 100% upfront deposits before going missing, or customers refusing to pay final balances after clothes are completed. 
              </p>
              <p>
                Aso permanently eliminates this anxiety through our <strong>Two-Way Escrow Architecture</strong>.
              </p>

              <div className="policy-callout emerald">
                <CheckCircle2 size={20} className="policy-callout-icon" />
                <div>
                  <strong>The 100% Delivery Guarantee:</strong> Your payment remains locked in a segregated banking escrow account. The fashion designer only receives their payout AFTER our integrated courier delivers your parcel and you confirm satisfaction.
                </div>
              </div>

              <h2>The 4-Step Escrow Lifecycle</h2>
              <ol>
                <li>
                  <strong>Checkout Deposit:</strong> When you pay via Paystack (Debit/Credit Card, Bank Transfer, or USSD), 100% of the funds are deposited into Aso Escrow.
                </li>
                <li>
                  <strong>Atelier Production:</strong> The tailor receives guaranteed proof of funds and begins cutting fabric with confidence that payment is secured.
                </li>
                <li>
                  <strong>Dellyman Live Dispatch:</strong> When tailoring finishes, Dellyman automatically generates a trackable shipping label and dispatches a courier to the workshop.
                </li>
                <li>
                  <strong>Release or Dispute:</strong> Upon delivery confirmation, you have 48 hours to inspect the garment. If no sizing dispute is submitted, the designer's earnings are credited to their ledger for withdrawal.
                </li>
              </ol>

              <h2>What Happens If an Order Has Issues?</h2>
              <p>
                If your delivered garment has a defect or significantly deviates from your submitted measurements:
              </p>
              <ul>
                <li>Click <strong>[ Raise Order Dispute ]</strong> directly in your Order Workspace within 48 hours.</li>
                <li>Our Atelier Quality Concierge reviews your submitted measurement cut sheet against photos of the delivered garment.</li>
                <li>If the tailor deviated from specifications, the tailor is required to make free alterations, or your funds are refunded directly to your original payment method.</li>
              </ul>
            </article>
          )}

          {/* 3. SHIPPING & RETURNS */}
          {activeSection === 'shipping' && (
            <article>
              <h2>Dellyman Automated Nationwide Fulfillment</h2>
              <p>
                Aso partners directly with <strong>Dellyman Logistics</strong> to provide automated urban dispatch across Lagos and secure interstate shipping to all 36 Nigerian states and Abuja FCT.
              </p>

              <h2>Delivery Timeframes &amp; Calculation</h2>
              <p>
                Total delivery turnaround comprises two distinct phases:
              </p>
              <div className="policy-callout gold">
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  Total Delivery Time = Tailoring Lead Time (3–7 Working Days) + Dellyman Transit (1–3 Days)
                </div>
              </div>
              <ul>
                <li><strong>Ready-to-Wear (RTW):</strong> Ships within 24 to 48 hours of order confirmation.</li>
                <li><strong>Bespoke / Custom Made-to-Measure:</strong> Requires 4 to 8 working days for pattern drafting, cutting, and finishing by the designer.</li>
                <li><strong>Intra-State Lagos Transit:</strong> 24 to 48 hours via dedicated Dellyman bike dispatch.</li>
                <li><strong>Inter-State Transit (Abuja, Port Harcourt, Ibadan, etc.):</strong> 2 to 4 working days via regional hubs.</li>
              </ul>

              <h2>Alteration &amp; Return Policy</h2>
              <h3>A. Custom Made-to-Measure Pieces:</h3>
              <p>
                Custom pieces are tailored exclusively for you. They are not eligible for cash refunds due to change of mind. However, we provide an <strong>Unconditional Alteration Guarantee</strong>:
              </p>
              <ul>
                <li>If a garment deviates by more than 1.5 inches from your submitted measurements, the designer must alter it at zero additional cost to you.</li>
                <li>Aso arranges and covers courier pickup for legitimate alteration requests.</li>
              </ul>

              <h3>B. Ready-to-Wear Standard Size Items:</h3>
              <p>
                Standard size items (XS to 3XL) may be returned for exchange or store credit within seven (7) days of delivery, provided the garment is unworn, unwashed, and retains all original tags.
              </p>
            </article>
          )}

          {/* 4. PRIVACY POLICY */}
          {activeSection === 'privacy' && (
            <article>
              <h2>Nigeria Data Protection Act (NDPA) Compliance</h2>
              <p>
                Aso Marketplace is committed to protecting your privacy and handling your personal data with absolute integrity in compliance with the Nigeria Data Protection Act (NDPA) and global data protection standards.
              </p>

              <h2>Information We Collect</h2>
              <ul>
                <li><strong>Account Credentials:</strong> Full name, verified email address, and Nigerian phone number for order SMS/WhatsApp alerts.</li>
                <li><strong>Bespoke Tailoring Profiles:</strong> Anatomical measurements (chest, waist, hips, length, shoulder) saved under "My Aso Fit" to streamline future bespoke orders.</li>
                <li><strong>Delivery Addresses:</strong> Street address, city, state, and landmarks shared strictly with Dellyman couriers for parcel drop-off.</li>
                <li><strong>Payment Information:</strong> Financial transactions are processed via PCI-DSS Level 1 compliant Paystack. Aso does not store your debit/credit card CVV or banking pins.</li>
              </ul>

              <h2>Data Sharing &amp; Third Parties</h2>
              <p>
                We do not sell, rent, or trade your personal information to third-party advertisers. Information is shared strictly on a need-to-know basis:
              </p>
              <ul>
                <li><strong>Fashion Designers:</strong> Receive only your first name and anatomical cut measurements. Direct buyer phone numbers and emails are masked to prevent leakage.</li>
                <li><strong>Logistics Couriers:</strong> Dellyman receives recipient drop-off address and contact phone number solely for physical parcel delivery.</li>
              </ul>
            </article>
          )}

          {/* 5. ABOUT ASO */}
          {activeSection === 'about' && (
            <article>
              <h2>Heritage Reimagined: The African Fashion Operating System</h2>
              <p>
                African fashion is celebrated globally for its vibrancy, bespoke craftsmanship, and cultural pride. From majestic three-piece Agbadas in Yoruba culture to intricately beaded Edo bridal gowns and modern street-cut Ankara two-pieces, our artisans are master craftsmen.
              </p>
              <p>
                However, for decades, buying African fashion has meant endless back-and-forth WhatsApp chats, tape measure anxiety, unpredictable tailor delays, and off-platform bank transfer risks.
              </p>

              <div className="policy-callout emerald">
                <Sparkles size={20} className="policy-callout-icon" />
                <div>
                  <strong>Our Mission:</strong> Aso builds the digital infrastructure powering African fashion commerce. We connect talented independent ateliers with global fashion lovers backed by verified escrow, automated logistics, and smart sizing.
                </div>
              </div>

              <h2>Our Three Founding Pillars</h2>
              <ul>
                <li>
                  <strong>Sizing Confidence ("My Aso Fit"):</strong> We remove fit anxiety. Buyers can enter exact dimensions directly or utilize our anthropometric smart estimator to generate tailor cut sheets in seconds.
                </li>
                <li>
                  <strong>Payment Integrity (Aso Escrow):</strong> Funds are protected until the parcel is physically received and verified.
                </li>
                <li>
                  <strong>Logistics Without Stress:</strong> Automated Dellyman integration generates digital waybills, books riders, and tracks dispatches nationwide.
                </li>
              </ul>
            </article>
          )}

          {/* 6. HELP CENTER / FAQS */}
          {activeSection === 'faq' && (
            <article>
              <h2>Frequently Asked Questions</h2>
              <p>Find instant answers to common questions about buying, sizing, and selling on Aso.</p>

              <div className="faq-list">
                {[
                  {
                    q: "How does bespoke custom tailoring work on Aso?",
                    a: "When ordering a garment marked 'Bespoke Fit', you can enter your exact body measurements directly into the fields (e.g. chest, waist, hips). If you don't have a measuring tape handy, you can click '⚡ Estimate with My Aso Fit' which predicts your measurements using your height, normal size, and build. Your designer receives an immutable cut sheet and begins crafting your piece immediately."
                  },
                  {
                    q: "How is my payment protected under Aso Escrow?",
                    a: "When you checkout, 100% of your payment is held in escrow via Paystack. The designer only receives payout release after Dellyman delivers your parcel to your address and you've had 48 hours to inspect the fit and craftsmanship."
                  },
                  {
                    q: "What if my bespoke outfit doesn't fit properly?",
                    a: "Under our Atelier Sizing Guarantee, if your outfit deviates from the measurements submitted in your order cut sheet by more than 1.5 inches, the designer is contractually bound to perform free alterations. Aso arranges and covers the courier dispatch."
                  },
                  {
                    q: "How long does tailoring and delivery take?",
                    a: "Ready-to-wear items dispatch within 24–48 hours. Bespoke pieces typically require 4 to 7 working days for artisan tailoring, followed by 1–2 days for Lagos delivery or 2–4 days for interstate delivery via Dellyman."
                  },
                  {
                    q: "How do I become a verified designer on Aso?",
                    a: "Click 'Sell on Aso' to open your studio. You can list garments and start selling straight away. To earn the Verified badge and unlock withdrawals, submit your NIN or CAC registration number in Studio Profile. The Aso team reviews every submission and you'll get an email once you're approved (or if we need you to correct something)."
                  },
                  {
                    q: "Can I communicate with the tailor sewing my clothes?",
                    a: "Yes! Every active order includes an interactive in-app Atelier Order Workspace Chat where you and the designer can clarify styling preferences (such as collar lining, zipper placements, or cuff styles) securely."
                  }
                ].map((faq, idx) => (
                  <div key={idx} className="faq-item">
                    <button
                      type="button"
                      className="faq-question"
                      onClick={() => toggleFaq(idx)}
                    >
                      <span>{faq.q}</span>
                      {openFaq === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    {openFaq === idx && (
                      <div className="faq-answer">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </article>
          )}

          {/* 7. CONTACT US */}
          {activeSection === 'contact' && (
            <article>
              <h2>Get in Touch with Atelier Concierge</h2>
              <p>
                Have questions regarding an active bespoke order, dispute, designer application, or corporate partnership? Our team is available Monday through Saturday, 8:00 AM – 7:00 PM (WAT).
              </p>

              <div className="contact-channels-grid">
                <div className="contact-channel-card">
                  <div className="contact-card-icon">
                    <Mail size={22} />
                  </div>
                  <h3 className="contact-card-title">Customer Concierge &amp; Escrow</h3>
                  <a href="mailto:support@asomarketplace.com.ng" className="contact-card-detail">
                    support@asomarketplace.com.ng
                  </a>
                  <p className="contact-card-desc">For order status, sizing alterations, and Escrow dispute resolution.</p>
                </div>

                <div className="contact-channel-card">
                  <div className="contact-card-icon">
                    <Sparkles size={22} />
                  </div>
                  <h3 className="contact-card-title">Designer &amp; Studio Partnerships</h3>
                  <a href="mailto:designers@asomarketplace.com.ng" className="contact-card-detail">
                    designers@asomarketplace.com.ng
                  </a>
                  <p className="contact-card-desc">For fashion houses, tailor onboarding, and catalog curation support.</p>
                </div>

                <div className="contact-channel-card">
                  <div className="contact-card-icon">
                    <Phone size={22} />
                  </div>
                  <h3 className="contact-card-title">WhatsApp Priority Hotline</h3>
                  <a href="https://wa.me/2348000000000" target="_blank" rel="noreferrer" className="contact-card-detail">
                    +234 800 ASO MARKET
                  </a>
                  <p className="contact-card-desc">Instant messaging concierge for active orders and urgent queries.</p>
                </div>

                <div className="contact-channel-card">
                  <div className="contact-card-icon">
                    <MapPin size={22} />
                  </div>
                  <h3 className="contact-card-title">Atelier Operations Hub</h3>
                  <span className="contact-card-detail">
                    Victoria Island, Lagos, Nigeria
                  </span>
                  <p className="contact-card-desc">HQ hub coordinating Dellyman nationwide parcel dispatches.</p>
                </div>
              </div>
            </article>
          )}

        </div>
      </main>
    </div>
  );
};

export default PolicyPage;
