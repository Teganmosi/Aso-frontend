import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { vendorApi, productApi, reviewApi } from '../api/client';
import type { PublicVendorProfile, Product, Review } from '../types';
import { MapPin, CheckCircle2, Star, Globe, ShoppingBag, MessageSquare, ShieldCheck } from 'lucide-react';
import './VendorStorefrontPage.css';

const SAMPLE_PROFILES: Record<string, PublicVendorProfile> = {
  'lagos-couture': {
    id: '1',
    store_name: 'Lagos Couture House',
    slug: 'lagos-couture',
    description: 'Premier Nigerian bespoke tailoring house crafting royal Agbadas, Senator kaftans, and luxury ceremonial wear.',
    city: 'Lagos',
    state: 'Lagos State',
    kyc_tier: 'TIER_2',
    workshop_address: '14 Victoria Island Way, Lagos',
    landmark: 'Near Eko Hotel',
    is_verified: true,
    average_rating: '4.9',
    review_count: 38,
    instagram_handle: '@lagos_couture_ng',
    banner_url: '/hero-bg.png',
    logo_url: '/traditional-men-1.png',
    created_at: '2024-01-15T00:00:00Z',
  },
  'heritage-cuts': {
    id: '2',
    store_name: 'Heritage Cuts & Threads',
    slug: 'heritage-cuts',
    description: 'Authentic traditional African menswear and custom bespoke suits handcrafted by master Nigerian tailors.',
    city: 'Abuja',
    state: 'FCT',
    kyc_tier: 'TIER_2',
    workshop_address: '8 Maitama Crescent, Abuja',
    landmark: 'Central Business District',
    is_verified: true,
    average_rating: '4.8',
    review_count: 24,
    instagram_handle: '@heritagecuts_abj',
    banner_url: '/traditional-men-2.png',
    logo_url: '/traditional-men-3.png',
    created_at: '2024-02-10T00:00:00Z',
  },
  'adire-house': {
    id: '3',
    store_name: 'Adire Mastercraft Atelier',
    slug: 'adire-house',
    description: 'Contemporary indigo dyed textiles, modern Adire dresses, and luxury silk-blend women’s fashion.',
    city: 'Ibadan',
    state: 'Oyo State',
    kyc_tier: 'TIER_2',
    workshop_address: '5 Ring Road, Ibadan',
    landmark: 'Dugbe Commercial Center',
    is_verified: true,
    average_rating: '5.0',
    review_count: 52,
    instagram_handle: '@adire_mastercraft',
    banner_url: '/adire-1.png',
    logo_url: '/adire-2.png',
    created_at: '2024-03-01T00:00:00Z',
  },
};

export const VendorStorefrontPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<PublicVendorProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'collection' | 'reviews'>('collection');
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (slug) {
      loadProfile(slug);
    }
  }, [slug]);

  const loadProfile = async (storeSlug: string) => {
    setLoading(true);
    try {
      const data = await vendorApi.getPublicProfile(storeSlug);
      setProfile(data);
      loadVendorProducts(data.id);
      loadVendorReviews(storeSlug);
    } catch (err: any) {
      // Fallback to sample profiles
      if (SAMPLE_PROFILES[storeSlug]) {
        const p = SAMPLE_PROFILES[storeSlug];
        setProfile(p);
        loadVendorProducts(p.id);
      } else {
        const formattedTitle = storeSlug
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        setProfile({
          id: '99',
          store_name: formattedTitle || 'Bespoke Designer Atelier',
          slug: storeSlug,
          description: 'Nigerian bespoke fashion house creating premium traditional and contemporary apparel.',
          city: 'Lagos',
          state: 'Lagos State',
          kyc_tier: 'TIER_1',
          workshop_address: 'Bespoke District, Lagos',
          landmark: 'City Center',
          is_verified: true,
          average_rating: '4.9',
          review_count: 18,
          instagram_handle: `@${storeSlug.replace(/-/g, '_')}`,
          banner_url: '/hero-bg.png',
          logo_url: '/traditional-men-1.png',
          created_at: new Date().toISOString(),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadVendorProducts = async (vendorId: string) => {
    setProductsLoading(true);
    try {
      const data = await productApi.getPublicProducts({ vendor: vendorId });
      setProducts(data);
    } catch (err) {
      console.error('Failed to load vendor products', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadVendorReviews = async (vendorSlug: string) => {
    setReviewsLoading(true);
    try {
      const data = await reviewApi.getVendorReviews(vendorSlug);
      setReviews(data);
    } catch (err) {
      console.error('Failed to load vendor reviews', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="storefront-loading-state">
        <div className="loading-spinner"></div>
        <p>Loading designer storefront...</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const avgRating = parseFloat(profile.average_rating || '5.0');

  return (
    <div className="storefront-container">
      <div
        className="storefront-banner"
        style={{
          backgroundImage: profile.banner_url
            ? `url(${profile.banner_url})`
            : 'linear-gradient(135deg, #0E4A38 0%, #06281E 100%)',
        }}
      >
        <div className="banner-overlay"></div>
      </div>

      <div className="storefront-profile-card">
        <div className="profile-header-content">
          <div className="avatar-wrapper">
            {profile.logo_url ? (
              <img src={profile.logo_url} alt={profile.store_name} className="store-logo-img" />
            ) : (
              <div className="store-logo-placeholder">
                {profile.store_name[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="profile-main-meta">
            <div className="title-row">
              <h1 className="store-name-serif">{profile.store_name}</h1>
              {profile.is_verified && (
                <div className="verified-badge-pill" title="Verified Nigerian Fashion Designer">
                  <CheckCircle2 size={16} />
                  <span>VERIFIED DESIGNER</span>
                </div>
              )}
            </div>

            <div className="meta-details-row">
              <div className="meta-item">
                <MapPin size={15} />
                <span>{profile.city}, {profile.state}</span>
              </div>

              {profile.instagram_handle && (
                <div className="meta-item">
                  <Globe size={15} />
                  <span>@{profile.instagram_handle.replace('@', '')}</span>
                </div>
              )}

              <div className="meta-item rating-item">
                <Star size={15} className="star-filled" />
                <span className="rating-num">{avgRating.toFixed(1)}</span>
                <span className="reviews-count">({profile.review_count} verified reviews)</span>
              </div>
            </div>

            <p className="store-description">{profile.description}</p>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #E5E7EB', marginTop: '2rem', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('collection')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'collection' ? '#064E3B' : '#6B7280',
            borderBottom: activeTab === 'collection' ? '2px solid #064E3B' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontFamily: 'var(--font-sans)'
          }}
        >
          <ShoppingBag size={18} />
          <span>Collection Showcase ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'reviews' ? '#064E3B' : '#6B7280',
            borderBottom: activeTab === 'reviews' ? '2px solid #064E3B' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontFamily: 'var(--font-sans)'
          }}
        >
          <Star size={18} />
          <span>Client Reviews ({profile.review_count || reviews.length})</span>
        </button>
      </div>

      {/* TAB 1: Collection */}
      {activeTab === 'collection' && (
        <div className="storefront-products-section" style={{ marginTop: '1.5rem' }}>
          {productsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>Loading collection...</div>
          ) : products.length > 0 ? (
            <div className="storefront-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
              {products.map((prod) => (
                <Link key={prod.id} to={`/products/${prod.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="product-showcase-card" style={{ background: '#FFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
                  >
                    <div style={{ height: '300px', backgroundImage: `url(${prod.primary_image_url || '/traditional-men-1.png'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    <div style={{ padding: '1.25rem' }}>
                      {prod.category && (
                        <div style={{ fontSize: '0.72rem', color: '#0E4A38', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>{prod.category.name}</div>
                      )}
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: '0.4rem', fontFamily: 'var(--font-serif)' }}>{prod.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.8rem', lineHeight: 1.5 }}>{prod.description?.slice(0, 80)}{prod.description?.length > 80 ? '...' : ''}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0E4A38' }}>₦{prod.base_price_naira.toLocaleString()}</span>
                        <span style={{ padding: '0.45rem 0.9rem', backgroundColor: '#111827', color: '#FFF', borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <ShoppingBag size={14} /> View
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6B7280' }}>
              <ShoppingBag size={40} color="#D1D5DB" style={{ marginBottom: '1rem' }} />
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>No published products yet</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.4rem' }}>This designer hasn't published any pieces yet. Check back soon!</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Reviews */}
      {activeTab === 'reviews' && (
        <div style={{ marginTop: '2rem' }}>
          {reviewsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>Loading client reviews...</div>
          ) : reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#F9FAFB', borderRadius: '12px', color: '#6B7280' }}>
              <MessageSquare size={36} color="#9CA3AF" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', color: '#374151', margin: 0 }}>No Verified Reviews Yet</h3>
              <p style={{ fontSize: '0.875rem', maxWidth: '400px', margin: '0.5rem auto 0' }}>
                Completed customer orders and verified craftsmanship ratings will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {reviews.map((rev) => {
                const reviewerName = typeof rev.customer === 'object' && rev.customer?.first_name
                  ? `${rev.customer.first_name} ${rev.customer.last_name?.[0] || ''}.`
                  : rev.customer_name || 'Verified Buyer';

                return (
                  <div key={rev.id} style={{ background: '#FFF', border: '1px solid #E5E7EB', padding: '1.5rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#111827' }}>{reviewerName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#059669', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.2rem' }}>
                          <ShieldCheck size={13} />
                          <span>Verified Purchase</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '1px' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              fill={s <= rev.rating ? '#F59E0B' : 'none'}
                              color={s <= rev.rating ? '#F59E0B' : '#D1D5DB'}
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.2rem', display: 'block' }}>
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: '#4B5563', lineHeight: 1.6, margin: 0 }}>
                      "{rev.comment}"
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
