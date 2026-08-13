import React from 'react';
import { ShieldCheck, Globe, Lock, Truck, CheckCircle2, ArrowRight, Sparkles, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import './HomePage.css';

interface HomePageProps {
  onOpenVendorRegister?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenVendorRegister }) => {
  return (
    <div className="stitch-homepage">
      {/* Hero Section */}
      <section className="stitch-hero">
        <div className="stitch-hero-bg">
          <div className="stitch-hero-overlay"></div>
        </div>

        <div className="stitch-hero-content">
          <h1 className="stitch-hero-headline">
            Authentic Nigerian <br /> Craftsmanship.
          </h1>

          <p className="stitch-hero-subtitle">
            Discover premium traditional and contemporary fashion from verified designers across Nigeria.
          </p>

          <a href="#collections" className="stitch-btn-hero">
            Explore Collections
          </a>
        </div>
      </section>

      {/* Sub-Hero Trust Bar */}
      <section className="stitch-trust-bar">
        <div className="trust-bar-container">
          <div className="trust-bar-item">
            <ShieldCheck size={18} className="trust-icon" />
            <span>Verified Designers</span>
          </div>

          <div className="trust-bar-item">
            <Globe size={18} className="trust-icon" />
            <span>Authentically Nigerian</span>
          </div>

          <div className="trust-bar-item">
            <Lock size={18} className="trust-icon" />
            <span>Secure Payments</span>
          </div>

          <div className="trust-bar-item">
            <Truck size={18} className="trust-icon" />
            <span>Global Shipping</span>
          </div>

          {onOpenVendorRegister && (
            <button
              onClick={onOpenVendorRegister}
              className="trust-bar-item trust-bar-designer-btn"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Sparkles size={18} style={{ color: '#D4AF37' }} />
              <span style={{ color: '#0E4A38', fontWeight: 700 }}>Sell on Aso</span>
            </button>
          )}
        </div>
      </section>

      {/* Curated Collections Section */}
      <section id="collections" className="stitch-collections-section">
        <div className="stitch-section-container">
          <h2 className="stitch-section-title">Curated Collections</h2>

          <div className="collections-grid">
            {/* Left Tall Card - Modern Adire */}
            <a href="#women" className="collection-card tall-card">
              <div
                className="collection-card-bg"
                style={{
                  backgroundImage: `url('/adire-1.png')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 20%',
                }}
              ></div>
              <div className="card-gradient-overlay"></div>
              <div className="card-text-overlay">
                <h3 className="card-serif-title">Modern Adire</h3>
                <p className="card-link-sub" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>Shop Women's</span>
                  <ArrowRight size={15} />
                </p>
              </div>
            </a>

            {/* Right Column - Stacked Cards */}
            <div className="right-collections-stack">
              {/* Top Right Card - Traditional Men */}
              <a href="#men" className="collection-card stacked-card">
                <div
                  className="collection-card-bg"
                  style={{
                    backgroundImage: `url('/traditional-men-1.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 20%',
                  }}
                ></div>
                <div className="card-gradient-overlay"></div>
                <div className="card-text-overlay">
                  <h3 className="card-bold-title">Traditional Men</h3>
                  <p className="card-sub-text">Explore Agbadas</p>
                </div>
              </a>

              {/* Bottom Right Card - Lagos Streetwear */}
              <a href="#streetwear" className="collection-card stacked-card">
                <div
                  className="collection-card-bg"
                  style={{
                    backgroundImage: `url('/streetwear-4.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 20%',
                  }}
                ></div>
                <div className="card-gradient-overlay"></div>
                <div className="card-text-overlay">
                  <h3 className="card-bold-title">Lagos Streetwear</h3>
                  <p className="card-sub-text">Urban Edge</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Vendor Storefronts Section */}
      <section id="designers" className="stitch-designers-section" style={{ backgroundColor: '#FAFAFA', padding: '4rem 0', borderTop: '1px solid #E5E7EB' }}>
        <div className="stitch-section-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="stitch-section-title" style={{ textAlign: 'left', marginBottom: '0.4rem' }}>Featured Fashion Houses</h2>
              <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>Explore verified bespoke tailors & independent Nigerian designers</p>
            </div>
            <Link to="/store/lagos-couture" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#0E4A38', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
              View All Storefronts <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* Storefront Card 1 */}
            <Link to="/store/lagos-couture" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
                <div style={{ height: '140px', backgroundImage: "url('/hero-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.95)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, color: '#0E4A38', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} /> VERIFIED
                  </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundImage: "url('/traditional-men-1.png')", backgroundSize: 'cover', border: '2px solid #FFF', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}></div>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Lagos Couture House</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#6B7280', marginTop: '0.2rem' }}>
                        <span>Lagos, Nigeria • 4.9</span>
                        <Star size={13} fill="#F59E0B" color="#F59E0B" />
                        <span>(38 reviews)</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5 }}>Premier Nigerian bespoke tailoring house crafting royal Agbadas & Senator kaftans.</p>
                </div>
              </div>
            </Link>

            {/* Storefront Card 2 */}
            <Link to="/store/heritage-cuts" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
                <div style={{ height: '140px', backgroundImage: "url('/traditional-men-2.png')", backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.95)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, color: '#0E4A38', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} /> VERIFIED
                  </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundImage: "url('/traditional-men-3.png')", backgroundSize: 'cover', border: '2px solid #FFF', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}></div>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Heritage Cuts & Threads</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#6B7280', marginTop: '0.2rem' }}>
                        <span>Abuja, FCT • 4.8</span>
                        <Star size={13} fill="#F59E0B" color="#F59E0B" />
                        <span>(24 reviews)</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5 }}>Authentic traditional African menswear and custom bespoke suits handcrafted by master tailors.</p>
                </div>
              </div>
            </Link>

            {/* Storefront Card 3 */}
            <Link to="/store/adire-house" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
                <div style={{ height: '140px', backgroundImage: "url('/adire-1.png')", backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.95)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, color: '#0E4A38', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} /> VERIFIED
                  </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundImage: "url('/adire-2.png')", backgroundSize: 'cover', border: '2px solid #FFF', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}></div>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Adire Mastercraft Atelier</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#6B7280', marginTop: '0.2rem' }}>
                        <span>Ibadan, Oyo State • 5.0</span>
                        <Star size={13} fill="#F59E0B" color="#F59E0B" />
                        <span>(52 reviews)</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5 }}>Contemporary indigo dyed textiles, modern Adire dresses, and luxury silk-blend women’s fashion.</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Become a Designer CTA Banner (Desktop & Mobile) */}
      <section style={{ backgroundColor: '#111827', color: '#FFFFFF', padding: '4.5rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37', padding: '0.4rem 1rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1.25rem', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
            <Sparkles size={15} />
            <span>FOR NIGERIAN FASHION DESIGNERS & TAILORS</span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2, marginBottom: '1rem' }}>
            Are You a Fashion Designer in Nigeria?
          </h2>

          <p style={{ fontSize: '1.05rem', color: '#9CA3AF', lineHeight: 1.6, marginBottom: '2.25rem' }}>
            Get your own verified digital storefront, accept secure digital payments, and showcase your luxury bespoke collections to customers worldwide.
          </p>

          <button
            onClick={onOpenVendorRegister}
            style={{
              padding: '1rem 2.25rem',
              backgroundColor: '#D4AF37',
              color: '#111827',
              fontSize: '0.95rem',
              fontWeight: 800,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(212, 175, 55, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'transform 0.2s ease',
            }}
          >
            <span>Register as a Designer</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
};
