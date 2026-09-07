import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient, vendorApi, reviewApi, productApi, orderApi } from '../../api/client';
import type { BankAccount } from '../../types';
import {
  Store,
  MapPin,
  ShieldCheck,
  Landmark,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Camera,
  Edit2,
  Plus,
  X,
  Truck,
  Save,
  Loader,
  ChevronRight,
  Globe,
  Phone,
  Bookmark,
  BookOpen,
  LogOut,
  User as UserIcon
} from 'lucide-react';

interface DesignerProfileViewProps {
  onNavigateToEarnings?: () => void;
}

export const DesignerProfileView: React.FC<DesignerProfileViewProps> = ({ onNavigateToEarnings }) => {
  const { user, refreshMe, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'story' | 'location' | 'kyc' | 'payout'>('general');
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      navigate('/');
    }
  };

  // Brand & Storefront Details (Loaded from DB)
  const [storeName, setStoreName] = useState(user?.vendor_profile?.store_name || '');
  const [leadDesigner, setLeadDesigner] = useState(
    user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : ''
  );
  const [slug, setSlug] = useState(user?.vendor_profile?.slug || '');
  const [tagline, setTagline] = useState('');
  const [biography, setBiography] = useState('');
  const [coverBannerUrl, setCoverBannerUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);

  // Hidden File Input Refs for Brand Assets
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCoverBannerUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Workshop & Shipping (Loaded from DB)
  const [workshopAddress, setWorkshopAddress] = useState('');
  const [cityState, setCityState] = useState('');
  const [dispatchHub, setDispatchHub] = useState('Lagos Island Logistics Terminal (GIGL / DHL)');

  // Verification & Legal (Loaded from DB)
  const [cacNumber, setCacNumber] = useState('');
  const [nin, setNin] = useState('');
  const [isVerified, setIsVerified] = useState(user?.vendor_profile?.is_verified ?? false);
  const [tierStatus, setTierStatus] = useState(
    user?.vendor_profile?.kyc_tier ? user.vendor_profile.kyc_tier.replace(/_/g, ' ') : 'TIER 1 (STARTER)'
  );

  // Live Metrics (Computed from DB)
  const [averageRating, setAverageRating] = useState('0.0');
  const [reviewCount, setReviewCount] = useState(0);
  const [productsSold, setProductsSold] = useState('0');

  // Social & Contact (Loaded from DB)
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState(user?.phone_number || '');
  const [website, setWebsite] = useState('');

  // Payout Bank Account Details (Loaded from DB)
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('033');

  // Interactive UI Feedback
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // ─── Fetch live database records on mount ──────────────────────────────────
  useEffect(() => {
    const fetchLiveProfileData = async () => {
      setLoading(true);
      try {
        // 1. Fetch live authenticated vendor profile directly from DB
        let profile: any = null;
        try {
          const res = await apiClient.get('/vendors/me/');
          if (res.data?.vendor) {
            profile = res.data.vendor;
          }
        } catch {
          const targetSlug = user?.vendor_profile?.slug;
          if (targetSlug) {
            profile = await vendorApi.getPublicProfile(targetSlug).catch(() => null);
          }
        }

        if (profile) {
          if (profile.store_name) setStoreName(profile.store_name);
          if (profile.slug) setSlug(profile.slug);
          if (profile.description) setBiography(profile.description);
          if (profile.banner_url) setCoverBannerUrl(profile.banner_url);
          if (profile.logo_url) setLogoUrl(profile.logo_url);
          if (profile.workshop_address) setWorkshopAddress(profile.workshop_address);
          if (profile.city || profile.state) {
            setCityState(`${profile.city || ''}${profile.city && profile.state ? ', ' : ''}${profile.state || ''}`);
          }
          if (profile.instagram_handle) setInstagram(profile.instagram_handle.replace('@', ''));
          if (profile.is_verified !== undefined) setIsVerified(profile.is_verified);
          if (profile.kyc_tier) setTierStatus(profile.kyc_tier.replace(/_/g, ' '));
          if (profile.average_rating) setAverageRating(parseFloat(profile.average_rating).toFixed(1));
          if (profile.review_count !== undefined) setReviewCount(profile.review_count);

          const querySlug = profile.slug || profile.id;
          // 2. Fetch live reviews & sold count from DB
          const [reviews, orders, products] = await Promise.allSettled([
            reviewApi.getVendorReviews(querySlug),
            orderApi.vendorGetOrders(),
            productApi.getPublicProducts({ vendor: querySlug }),
          ]);

          if (reviews.status === 'fulfilled' && Array.isArray(reviews.value)) {
            setReviewCount(reviews.value.length);
            if (reviews.value.length > 0) {
              const sum = reviews.value.reduce((acc, r) => acc + (r.rating || 5), 0);
              setAverageRating((sum / reviews.value.length).toFixed(1));
            }
          }

          if (orders.status === 'fulfilled' && Array.isArray(orders.value)) {
            const completedCount = orders.value.filter((o) => o.order_status === 'COMPLETED').length;
            setProductsSold(`${completedCount}`);
          }

          if (products.status === 'fulfilled' && Array.isArray(products.value) && products.value.length > 0) {
            const distinctCategories = Array.from(
              new Set(products.value.map((p) => p.category?.name).filter(Boolean))
            ) as string[];
            if (distinctCategories.length > 0) {
              setTags(distinctCategories.slice(0, 5));
            }
          }
        }

        if (user) {
          if (user.first_name || user.last_name) {
            setLeadDesigner(`${user.first_name || ''} ${user.last_name || ''}`.trim());
          }
          if (user.phone_number && !whatsapp) {
            setWhatsapp(user.phone_number);
          }
          if (user.vendor_profile?.store_name && !storeName) {
            setStoreName(user.vendor_profile.store_name);
          }
          if (user.vendor_profile?.slug && !slug) {
            setSlug(user.vendor_profile.slug);
          }
        }

        // 3. Fetch live bank account from DB
        const bank: BankAccount = await vendorApi.getBankAccount().catch(() => null as any);
        if (bank) {
          if (bank.account_name) setAccountName(bank.account_name);
          if (bank.account_number) setAccountNumber(bank.account_number);
          if (bank.bank_name) setBankName(bank.bank_name);
          if (bank.bank_code) setBankCode(bank.bank_code);
        }
      } catch (err) {
        console.error('Error fetching live vendor profile from DB', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveProfileData();
  }, [user]);

  const handleCopyLink = () => {
    const fullUrl = `https://asomarketplace.ng/store/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput('');
      setShowAddTag(false);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      // Parse city & state from input
      const parts = cityState.split(',').map((s) => s.trim()).filter(Boolean);
      const city = parts[0] || 'Lagos';
      const state = parts[1] || parts[0] || 'Lagos State';

      // Parse first & last name from lead designer
      const nameParts = leadDesigner.trim().split(/\s+/);
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      // 1. Update Core Vendor Storefront Profile in DB
      const updatedProfile = await vendorApi.updateProfile({
        store_name: storeName.trim(),
        description: biography.trim(),
        city,
        state,
        workshop_address: workshopAddress.trim(),
        landmark: cityState.trim(),
        instagram_handle: instagram.trim() ? (instagram.startsWith('@') ? instagram.trim() : ('@' + instagram.trim())) : '',
        logo_url: logoUrl || undefined,
        banner_url: coverBannerUrl || undefined,
        nin_number: nin.trim(),
        cac_number: cacNumber.trim(),
        first_name,
        last_name,
        phone_number: whatsapp.trim(),
      });

      if (updatedProfile?.slug) {
        setSlug(updatedProfile.slug);
      }

      // 2. Persist payout bank account to DB if provided
      if (accountNumber && bankName && accountName) {
        await vendorApi.saveBankAccount({
          account_name: accountName,
          account_number: accountNumber,
          bank_name: bankName,
          bank_code: bankCode,
        });
      }

      // 3. Persist KYC verification details if provided
      if (nin || cacNumber) {
        await vendorApi.verifyKyc({
          nin,
          cac_number: cacNumber,
          workshop_address: workshopAddress,
          landmark: cityState,
        }).catch(() => {});
      }

      await refreshMe();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Save profile error', err);
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to save changes to the database.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const wordCount = biography.trim() ? biography.trim().split(/\s+/).length : 0;
  const storeInitials = storeName
    ? storeName
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AS';

  const scrollToSection = (tab: 'general' | 'story' | 'location' | 'kyc' | 'payout') => {
    setActiveSubTab(tab);
    const element = document.getElementById(`section-${tab}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="vendor-profile-page" style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      
      {/* ═══════════════════════════════════════════════════════════════
          PAGE HEADER (Connected with Live Database)
         ═══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid #E5E2E1', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#00322D', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              <Store size={16} />
              <span>Merchant Settings • Database Connected</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, color: '#00322D', lineHeight: 1.2 }}>
              Store &amp; Artisan Profile
            </h1>
            <p style={{ margin: '0.4rem 0 0', fontSize: '1.05rem', color: '#3F4947', maxWidth: '720px' }}>
              Manage your public storefront presence, brand story, workshop location, and verification details in real-time.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href={`/store/${slug || user?.vendor_profile?.slug || "orji-master-tailoring-house"}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '2px solid #00322D',
                color: '#00322D',
                padding: '0.55rem 1.15rem',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#00322D';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#00322D';
              }}
            >
              <span>View Public Storefront</span>
              <ExternalLink size={15} />
            </a>

            <button
              onClick={handleSaveChanges}
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#00322D',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.65rem 1.4rem',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 50, 45, 0.15)',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#004B44';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#00322D';
              }}
            >
              {saving ? <Loader size={16} className="cart-spinner" /> : <Save size={16} />}
              <span>{saving ? 'Saving to Database...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {/* Global Save Feedback Alert */}
        {saveSuccess && (
          <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #A7F3D0', padding: '0.75rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065F46', fontSize: '0.875rem', fontWeight: 600 }}>
            <CheckCircle2 size={18} />
            <span>Profile and banking records successfully updated in the database!</span>
          </div>
        )}

        {saveError && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', padding: '0.75rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626', fontSize: '0.875rem' }}>
            <AlertCircle size={18} />
            <span>{saveError}</span>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          NAVIGATION ANCHOR TABS
         ═══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid #E5E2E1', gap: '1.75rem', marginBottom: '2rem', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
        <button
          onClick={() => scrollToSection('general')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingBottom: '0.75rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeSubTab === 'general' ? 700 : 500,
            color: activeSubTab === 'general' ? '#00322D' : '#3F4947',
            borderBottom: activeSubTab === 'general' ? '2px solid #00322D' : '2px solid transparent'
          }}
        >
          <Bookmark size={16} />
          <span>General Info &amp; Branding</span>
        </button>

        <button
          onClick={() => scrollToSection('story')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingBottom: '0.75rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeSubTab === 'story' ? 700 : 500,
            color: activeSubTab === 'story' ? '#00322D' : '#3F4947',
            borderBottom: activeSubTab === 'story' ? '2px solid #00322D' : '2px solid transparent'
          }}
        >
          <BookOpen size={16} />
          <span>Story &amp; Craft</span>
        </button>

        <button
          onClick={() => scrollToSection('location')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingBottom: '0.75rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeSubTab === 'location' ? 700 : 500,
            color: activeSubTab === 'location' ? '#00322D' : '#3F4947',
            borderBottom: activeSubTab === 'location' ? '2px solid #00322D' : '2px solid transparent'
          }}
        >
          <MapPin size={16} />
          <span>Location &amp; Shipping</span>
        </button>

        <button
          onClick={() => scrollToSection('kyc')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingBottom: '0.75rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeSubTab === 'kyc' ? 700 : 500,
            color: activeSubTab === 'kyc' ? '#00322D' : '#3F4947',
            borderBottom: activeSubTab === 'kyc' ? '2px solid #00322D' : '2px solid transparent'
          }}
        >
          <ShieldCheck size={16} />
          <span>Verification &amp; Legal (KYC)</span>
        </button>

        <button
          onClick={() => scrollToSection('payout')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingBottom: '0.75rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeSubTab === 'payout' ? 700 : 500,
            color: activeSubTab === 'payout' ? '#00322D' : '#3F4947',
            borderBottom: activeSubTab === 'payout' ? '2px solid #00322D' : '2px solid transparent'
          }}
        >
          <Landmark size={16} />
          <span>Payout Details</span>
        </button>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div style={{ padding: '1rem', backgroundColor: '#F0EDED', borderRadius: '6px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#00322D', fontSize: '0.85rem' }}>
          <Loader size={16} className="cart-spinner" />
          <span>Syncing latest profile records with the database...</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MAIN 2:1 SPLIT CONTENT GRID (Connected with Live Database)
         ═══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* ─── LEFT COLUMN (2/3 Span: Brand Assets, Store Info, Location) ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', gridColumn: 'span 2' }}>
          
          {/* 1. BRAND ASSETS CARD */}
          <div id="section-general" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#00322D' }}>
                  Brand Assets
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#3F4947' }}>
                  Upload visual identity banners and storefront badges
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#3F4947', backgroundColor: '#F0EDED', padding: '0.25rem 0.65rem', borderRadius: '12px', fontWeight: 500 }}>
                Recommended: 1200×360px
              </span>
            </div>

            {/* Hidden File Inputs for Brand Assets */}
            <input
              type="file"
              ref={bannerInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleBannerFileChange}
            />
            <input
              type="file"
              ref={logoInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleLogoFileChange}
            />

            {/* Cover Banner from DB */}
            <div
              style={{
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #E5E2E1',
                height: '180px',
                backgroundColor: '#F6F3F2',
                marginBottom: '1.5rem',
                backgroundImage: coverBannerUrl ? `url("${coverBannerUrl}")` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  color: '#00322D',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <Camera size={15} />
                <span>Change Cover Banner</span>
              </button>
            </div>

            {/* Store Avatar & Monogram Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #E5E2E1', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    border: '2px solid #00322D',
                    backgroundColor: '#004B44',
                    color: '#B1EEE4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Playfair Display, serif',
                    fontWeight: 700,
                    fontSize: '1.3rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                  }}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={storeName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    storeInitials
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: '#00322D',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                  }}
                  title="Edit Avatar"
                >
                  <Edit2 size={12} />
                </button>
              </div>

              <div style={{ flex: 1, minWidth: '200px' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#00322D' }}>
                  Atelier Monogram &amp; Store Icon
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#3F4947' }}>
                  Appears in merchant search, product listing pages, and dispatch labels.
                </p>
              </div>

              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                style={{
                  border: '1px solid #E5E2E1',
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#00322D',
                  borderRadius: '4px',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                Change Logo
              </button>
            </div>
          </div>

          {/* 2. STORE INFORMATION CARD */}
          <div id="section-story" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid #E5E2E1', paddingBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#00322D' }}>
                Store Information
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#3F4947' }}>
                Basic details and brand presentation displayed across Aso Marketplace.
              </p>
            </div>

            {/* Row 1: Brand Name & Lead Designer */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                  Store / Brand Name
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                  Artisan Master / Lead Designer
                </label>
                <input
                  type="text"
                  value={leadDesigner}
                  onChange={(e) => setLeadDesigner(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
                />
              </div>
            </div>

            {/* Row 2: Storefront URL Handle */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                Storefront URL Handle
              </label>
              <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid #E5E2E1', backgroundColor: '#FCF9F8' }}>
                <span style={{ padding: '0.65rem 0.85rem', fontSize: '0.85rem', color: '#3F4947', backgroundColor: '#F0EDED', borderRight: '1px solid #E5E2E1', userSelect: 'none' }}>
                  asomarketplace.ng/store/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  style={{ flex: 1, border: 'none', background: 'transparent', padding: '0.65rem 0.85rem', fontSize: '0.9rem', color: '#1C1B1B', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0 0.85rem', border: 'none', background: 'none', color: '#00322D', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', borderLeft: '1px solid #E5E2E1' }}
                >
                  {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Row 3: Tagline */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                Tagline / Short Bio
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
              />
            </div>

            {/* Row 4: Detailed Biography */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947' }}>
                  Detailed Artisan Biography &amp; Craft Story
                </label>
                <span style={{ fontSize: '0.75rem', color: '#707977' }}>
                  {wordCount} / 500 words
                </span>
              </div>
              <textarea
                rows={4}
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 0.85rem', fontSize: '0.9rem', lineHeight: '1.6', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B', resize: 'vertical' }}
              />
            </div>

            {/* Row 5: Specialties & Craft Tags */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.5rem' }}>
                Specialties &amp; Craft Tags
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.35rem 0.75rem',
                      backgroundColor: '#F0EDED',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      color: '#00322D',
                      border: '1px solid #E5E2E1',
                      fontWeight: 500
                    }}
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={{ border: 'none', background: 'none', color: '#707977', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}

                {showAddTag ? (
                  <form onSubmit={handleAddTag} style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="New tag..."
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      autoFocus
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: '15px', border: '1px solid #00322D', outline: 'none' }}
                    />
                    <button type="submit" style={{ backgroundColor: '#00322D', color: '#FFF', border: 'none', borderRadius: '12px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                      Add
                    </button>
                    <button type="button" onClick={() => setShowAddTag(false)} style={{ background: 'none', border: 'none', color: '#707977', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddTag(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.35rem 0.75rem',
                      border: '1px dashed #00322D',
                      color: '#00322D',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    <Plus size={13} />
                    <span>Add Tag</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. WORKSHOP & FULFILLMENT LOCATION CARD */}
          <div id="section-location" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid #E5E2E1', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#00322D' }}>
                  Workshop &amp; Fulfillment Location
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#3F4947' }}>
                  Physical address used for courier pickups and fulfillment authentication.
                </p>
              </div>
              <Truck size={22} color="#00322D" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                Physical Workshop / Studio Address
              </label>
              <input
                type="text"
                value={workshopAddress}
                onChange={(e) => setWorkshopAddress(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                  Primary City / State
                </label>
                <input
                  type="text"
                  value={cityState}
                  onChange={(e) => setCityState(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                  Dispatch Hub / Courier Pickup
                </label>
                <select
                  value={dispatchHub}
                  onChange={(e) => setDispatchHub(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
                >
                  <option value="Lagos Island Logistics Terminal (GIGL / DHL)">Lagos Island Logistics Terminal (GIGL / DHL)</option>
                  <option value="Ikeja Central Fulfillment Center">Ikeja Central Fulfillment Center</option>
                  <option value="Lekki Phase 1 Express Hub">Lekki Phase 1 Express Hub</option>
                  <option value="Abuja Central Courier Hub">Abuja Central Courier Hub</option>
                  <option value="Ibadan Ring Road Dispatch Hub">Ibadan Ring Road Dispatch Hub</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. VERIFICATION & LEGAL (KYC) CARD */}
          <div id="section-kyc-form" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid #E5E2E1', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#00322D' }}>
                  Verification &amp; Legal (KYC)
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#3F4947' }}>
                  Provide your business registration and national ID details for merchant verification audit.
                </p>
              </div>
              <ShieldCheck size={22} color="#00322D" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                  CAC Business Registration Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. RC-1849204"
                  value={cacNumber}
                  onChange={(e) => setCacNumber(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                  National Identification Number (NIN)
                </label>
                <input
                  type="text"
                  placeholder="11-digit NIN"
                  maxLength={11}
                  value={nin}
                  onChange={(e) => setNin(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN (1/3 Span: Verification, Preview, Banking, Social) ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* 1. VERIFICATION & TRUST BADGE CARD */}
          <div id="section-kyc" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00322D', fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              <ShieldCheck size={22} color="#00322D" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>Verification &amp; Trust</h3>
            </div>

            <div style={{ backgroundColor: '#F6F3F2', border: '1px solid #E5E2E1', borderRadius: '4px', padding: '0.75rem 0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} color="#00322D" />
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#00322D' }}>
                    {isVerified ? 'Verified Luxury Merchant' : 'Verification Under Review'}
                  </p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#3F4947' }}>
                    Top artisan tier on Aso Marketplace
                  </p>
                </div>
              </div>
              <span style={{ backgroundColor: '#00322D', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                {isVerified ? 'Active' : 'Pending'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', borderTop: '1px solid #E5E2E1', paddingTop: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#3F4947' }}>CAC Business Reg:</span>
                <span style={{ fontWeight: 700, color: '#1C1B1B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {cacNumber || 'Pending Registration'}
                  {cacNumber && <Check size={14} color="#00322D" />}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#3F4947' }}>Identity (NIN):</span>
                <span style={{ fontWeight: 700, color: '#1C1B1B' }}>
                  {nin ? 'Submitted for Audit' : (isVerified ? 'Verified in Database' : 'Pending Submission')}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#3F4947' }}>Tier Status:</span>
                <span style={{ fontWeight: 700, color: '#00322D' }}>{tierStatus}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#3F4947' }}>International Shipping:</span>
                <span style={{ backgroundColor: '#B1EEE4', color: '#095049', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                  Enabled
                </span>
              </div>
            </div>
          </div>

          {/* 2. PUBLIC STOREFRONT PREVIEW SNIPPET (Live DB Metrics) */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#00322D' }}>Storefront Preview</h3>
              <span style={{ fontSize: '0.75rem', color: '#3F4947' }}>Live View</span>
            </div>

            <div style={{ border: '1px solid #E5E2E1', borderRadius: '4px', padding: '0.85rem', backgroundColor: '#FCF9F8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#004B44', color: '#B1EEE4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                  {storeInitials}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#00322D' }}>{storeName || 'Your Store Name'}</p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#3F4947' }}>{cityState || 'Location not specified'}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', padding: '0.6rem 0', borderTop: '1px solid #E5E2E1', borderBottom: '1px solid #E5E2E1', textAlign: 'center', margin: '0.5rem 0' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#00322D' }}>{averageRating} ★</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#3F4947' }}>{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#00322D' }}>0</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#3F4947' }}>Followers</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#00322D' }}>{productsSold}</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#3F4947' }}>Handcrafted sold</p>
                </div>
              </div>

              <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#3F4947', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {tagline ? `"${tagline}"` : '(No tagline set yet — enter one on the left)'}
              </p>
            </div>
          </div>

          {/* 3. PAYOUT & BANKING QUICK SUMMARY (Live from DB) */}
          <div id="section-payout" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#00322D' }}>Payout Account</h3>
              <Landmark size={20} color="#00322D" />
            </div>

            {accountNumber ? (
              <div style={{ backgroundColor: '#F6F3F2', padding: '0.85rem', borderRadius: '4px', border: '1px solid #E5E2E1', marginBottom: '0.75rem' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#1C1B1B' }}>{bankName || 'Settlement Bank'}</p>
                <p style={{ margin: '0.3rem 0', fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, color: '#00322D', letterSpacing: '0.15em' }}>
                  •••• •••• {accountNumber.slice(-4)}
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#3F4947' }}>{accountName}</p>
              </div>
            ) : (
              <div style={{ backgroundColor: '#F6F3F2', padding: '0.85rem', borderRadius: '4px', border: '1px solid #E5E2E1', marginBottom: '0.75rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B7280' }}>No payout bank account connected yet.</p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#00322D', fontWeight: 600 }}>Add your Nigerian bank details to receive order settlements.</p>
              </div>
            )}

            {onNavigateToEarnings ? (
              <button
                type="button"
                onClick={onNavigateToEarnings}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', padding: 0, fontSize: '0.8rem', color: '#00322D', fontWeight: 600, cursor: 'pointer' }}
              >
                <span>{accountNumber ? 'Manage Payout Settings & Accounts' : 'Connect Bank Account'}</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <a
                href="/vendor/earnings"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', fontSize: '0.8rem', color: '#00322D', fontWeight: 600 }}
              >
                <span>{accountNumber ? 'Manage Payout Settings & Accounts' : 'Connect Bank Account'}</span>
                <ChevronRight size={16} />
              </a>
            )}
          </div>

          {/* 4. SOCIAL & CONTACT LINKS */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#00322D' }}>
              Social &amp; Contact Links
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#3F4947', marginBottom: '0.3rem' }}>
                Instagram Handle
              </label>
              <div style={{ display: 'flex', borderRadius: '4px', border: '1px solid #E5E2E1', backgroundColor: '#FCF9F8', overflow: 'hidden' }}>
                <span style={{ padding: '0.55rem 0.75rem', fontSize: '0.8rem', color: '#3F4947', backgroundColor: '#F0EDED', borderRight: '1px solid #E5E2E1' }}>@</span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  style={{ width: '100%', border: 'none', background: 'transparent', padding: '0.55rem 0.75rem', fontSize: '0.85rem', outline: 'none', color: '#1C1B1B' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#3F4947', marginBottom: '0.3rem' }}>
                <Phone size={12} />
                <span>WhatsApp Business</span>
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#3F4947', marginBottom: '0.3rem' }}>
                <Globe size={12} />
                <span>Official Website (Optional)</span>
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
              />
            </div>
          </div>

          {/* 5. ACCOUNT & SESSION MANAGEMENT */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#00322D' }}>
                Account &amp; Session
              </h3>
              <UserIcon size={18} color="#00322D" />
            </div>

            <div style={{ backgroundColor: '#F6F3F2', padding: '0.85rem', borderRadius: '4px', border: '1px solid #E5E2E1' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#3F4947' }}>Signed in as:</p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem', fontWeight: 600, color: '#1C1B1B' }}>
                {user?.email || 'designer@asomarketplace.ng'}
              </p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#065F46', fontWeight: 600 }}>
                Role: Verified Designer / Artisan
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.65rem 1rem',
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                border: '1px solid #FECACA',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FECACA';
                e.currentTarget.style.color = '#7F1D1D';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FEE2E2';
                e.currentTarget.style.color = '#991B1B';
              }}
            >
              <LogOut size={16} />
              <span>Sign Out of Designer Studio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignerProfileView;
