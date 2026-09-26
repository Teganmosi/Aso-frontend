import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { vendorApi, reviewApi, productApi } from '../../api/client';
import type { BankAccount } from '../../types';
import {
  MapPin,
  ShieldCheck,
  Landmark as LandmarkIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Camera,
  Plus,
  X,
  Truck,
  Save,
  Loader,
  Globe,
  Phone,
  Bookmark,
  LogOut,
  User as UserIcon,
  Clock,
  Info,
  Building
} from 'lucide-react';

interface DesignerProfileViewProps {
  onNavigateToEarnings?: () => void;
}

const NIGERIAN_STATES = [
  'Abia State', 'Adamawa State', 'Akwa Ibom State', 'Anambra State', 'Bauchi State',
  'Bayelsa State', 'Benue State', 'Borno State', 'Cross River State', 'Delta State',
  'Ebonyi State', 'Edo State', 'Ekiti State', 'Enugu State', 'FCT - Abuja',
  'Gombe State', 'Imo State', 'Jigawa State', 'Kaduna State', 'Kano State',
  'Katsina State', 'Kebbi State', 'Kogi State', 'Kwara State', 'Lagos State',
  'Nasarawa State', 'Niger State', 'Ogun State', 'Ondo State', 'Osun State',
  'Oyo State', 'Plateau State', 'Rivers State', 'Sokoto State', 'Taraba State',
  'Yobe State', 'Zamfara State'
];

const STANDARD_SPECIALTIES = [
  'Menswear', 'Womenswear', 'Traditional', 'Agbada', 'Senator',
  'Suits', 'Kaftans', 'Bridal', 'Couture', 'Ready-to-Wear', 'Bespoke'
];

export const DesignerProfileView: React.FC<DesignerProfileViewProps> = ({ onNavigateToEarnings: _onNavigateToEarnings }) => {
  const { user, refreshMe, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'location' | 'kyc' | 'payout' | 'social'>('general');
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

  // Section 1: Store & Branding
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

  // Section 2: Location & Shipping (Separating Public from Private)
  const [publicCity, setPublicCity] = useState(user?.vendor_profile?.city || 'Lagos');
  const [publicState, setPublicState] = useState(user?.vendor_profile?.state || 'Lagos State');
  const [workshopAddress, setWorkshopAddress] = useState(user?.vendor_profile?.workshop_address || '');
  const [landmark, setLandmark] = useState(user?.vendor_profile?.landmark || '');
  const [dispatchHub, setDispatchHub] = useState('Lagos Central Logistics Terminal (GIGL / DHL / Fez)');

  // Section 3: Verification & KYC (Private)
  const [cacNumber, setCacNumber] = useState(user?.vendor_profile?.cac_number || '');
  const [nin, setNin] = useState(user?.vendor_profile?.nin_number || '');
  const [isVerified, setIsVerified] = useState(user?.vendor_profile?.is_verified ?? false);
  const [verificationStatus, setVerificationStatus] = useState<string>(user?.vendor_profile?.status || 'PENDING');

  // Live Metrics (Storefront Preview)
  const [averageRating, setAverageRating] = useState('0.0');
  const [reviewCount, setReviewCount] = useState(0);
  const [productCount, setProductCount] = useState(0);

  // Section 4: Payout Details (Private)
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('033');
  const [editingBank, setEditingBank] = useState(false);

  // Section 5: Social & Contact Links (Public)
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState(user?.phone_number || '');
  const [website, setWebsite] = useState('');

  // Status & Feedback States
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    const fetchLiveProfileData = async () => {
      try {
        setLoading(true);
        let profile: any = null;

        try {
          const res = await vendorApi.getVendors();
          if (Array.isArray(res) && res.length > 0) {
            const currentVendor = res.find(
              (v: any) => v.id === user?.vendor_profile?.id || v.slug === user?.vendor_profile?.slug
            );
            if (currentVendor) profile = currentVendor;
          }
        } catch {
          // fallback
        }

        const targetSlug = user?.vendor_profile?.slug;
        if (!profile && targetSlug) {
          profile = await vendorApi.getPublicProfile(targetSlug).catch(() => null);
        }

        if (profile) {
          if (profile.store_name) setStoreName(profile.store_name);
          if (profile.slug) setSlug(profile.slug);
          if (profile.description) setBiography(profile.description);
          if (profile.banner_url) setCoverBannerUrl(profile.banner_url);
          if (profile.logo_url) setLogoUrl(profile.logo_url);
          if (profile.city) setPublicCity(profile.city);
          if (profile.state) setPublicState(profile.state);
          if (profile.workshop_address) setWorkshopAddress(profile.workshop_address);
          if (profile.landmark) setLandmark(profile.landmark);
          if (profile.instagram_handle) setInstagram(profile.instagram_handle.replace('@', ''));
          if (profile.is_verified !== undefined) setIsVerified(profile.is_verified);
          if (profile.status) setVerificationStatus(profile.status);
          if (profile.average_rating) setAverageRating(parseFloat(profile.average_rating).toFixed(1));
          if (profile.review_count !== undefined) setReviewCount(profile.review_count);
          if (profile.lead_designer_name) setLeadDesigner(profile.lead_designer_name);
          if (profile.whatsapp_phone) setWhatsapp(profile.whatsapp_phone);

          const querySlug = profile.slug || profile.id;
          const [reviews, products] = await Promise.allSettled([
            reviewApi.getVendorReviews(querySlug),
            productApi.getPublicProducts({ vendor: querySlug }),
          ]);

          if (reviews.status === 'fulfilled' && Array.isArray(reviews.value)) {
            setReviewCount(reviews.value.length);
            if (reviews.value.length > 0) {
              const sum = reviews.value.reduce((acc, r) => acc + (r.rating || 5), 0);
              setAverageRating((sum / reviews.value.length).toFixed(1));
            }
          }

          if (products.status === 'fulfilled' && Array.isArray(products.value)) {
            setProductCount(products.value.length);
            const distinctCategories = Array.from(
              new Set(products.value.map((p) => p.category?.name).filter(Boolean))
            ) as string[];
            if (distinctCategories.length > 0) {
              setTags(distinctCategories.slice(0, 6));
            }
          }
        }

        if (user) {
          if ((user.first_name || user.last_name) && !leadDesigner) {
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

        // Fetch live bank account
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

  const handleAddTag = (tagToAdd: string) => {
    const cleaned = tagToAdd.trim();
    if (cleaned && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
      setNewTagInput('');
      setShowAddTag(false);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      const nameParts = leadDesigner.trim().split(/\s+/);
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      // 1. Update Core Vendor Storefront Profile in DB
      const updatedProfile = await vendorApi.updateProfile({
        store_name: storeName.trim(),
        description: biography.trim(),
        city: publicCity.trim(),
        state: publicState.trim(),
        workshop_address: workshopAddress.trim(),
        landmark: landmark.trim(),
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
        setEditingBank(false);
      }

      // 3. Persist KYC verification details if provided
      if (nin || cacNumber || workshopAddress) {
        await vendorApi.verifyKyc({
          nin: nin.trim(),
          cac_number: cacNumber.trim(),
          workshop_address: workshopAddress.trim(),
          landmark: landmark.trim(),
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

  const scrollToSection = (subTab: 'general' | 'location' | 'kyc' | 'payout' | 'social') => {
    setActiveSubTab(subTab);
    const element = document.getElementById(`section-${subTab}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 1.5rem 5rem' }}>
      
      {/* ---------------------------------------------------------------
          PAGE TITLE & HEADER ACTIONS
         --------------------------------------------------------------- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#004B44', fontWeight: 700 }}>
                Designer Studio
              </span>
              <span style={{ color: '#C4C7C5' }}>•</span>
              <span style={{ fontSize: '0.75rem', color: '#535F5C', fontWeight: 500 }}>
                Profile &amp; Storefront Management
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.85rem', fontFamily: 'serif', fontWeight: 600, color: '#1C1B1B', letterSpacing: '-0.01em' }}>
              {storeName || 'Designer Profile'}
            </h1>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem', color: '#535F5C' }}>
              Manage your brand identity, approved story, location, verification, and payout details. Designer Studio is the source of truth for your public storefront.
            </p>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {slug && (
              <a
                href={`/store/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#004B44',
                  backgroundColor: '#E8F5F1',
                  border: '1px solid #B1EEE4',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  transition: 'background 0.2s'
                }}
              >
                <ExternalLink size={15} />
                <span>View Public Storefront</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.35rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: saving ? '#535F5C' : '#004B44',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 4px rgba(0, 75, 68, 0.15)',
                transition: 'all 0.2s'
              }}
            >
              {saving ? <Loader size={16} className="cart-spinner" /> : <Save size={16} />}
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </div>

        {/* Feedback alerts */}
        {saveSuccess && (
          <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.85rem 1.15rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#065F46', fontSize: '0.875rem' }}>
            <CheckCircle2 size={18} />
            <span>Profile and storefront settings successfully updated in the database.</span>
          </div>
        )}

        {saveError && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', padding: '0.85rem 1.15rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#DC2626', fontSize: '0.875rem' }}>
            <AlertCircle size={18} />
            <span>{saveError}</span>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------
          NAVIGATION ANCHOR TABS
         --------------------------------------------------------------- */}
      <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid #E5E2E1', gap: '1.75rem', marginBottom: '2rem', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
        <button
          type="button"
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
            color: activeSubTab === 'general' ? '#004B44' : '#535F5C',
            borderBottom: activeSubTab === 'general' ? '2px solid #004B44' : '2px solid transparent'
          }}
        >
          <Bookmark size={16} />
          <span>General Info &amp; Branding (Public)</span>
        </button>

        <button
          type="button"
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
            color: activeSubTab === 'location' ? '#004B44' : '#535F5C',
            borderBottom: activeSubTab === 'location' ? '2px solid #004B44' : '2px solid transparent'
          }}
        >
          <MapPin size={16} />
          <span>Location &amp; Fulfillment</span>
        </button>

        <button
          type="button"
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
            color: activeSubTab === 'kyc' ? '#004B44' : '#535F5C',
            borderBottom: activeSubTab === 'kyc' ? '2px solid #004B44' : '2px solid transparent'
          }}
        >
          <ShieldCheck size={16} />
          <span>Verification &amp; Legal (Private)</span>
        </button>

        <button
          type="button"
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
            color: activeSubTab === 'payout' ? '#004B44' : '#535F5C',
            borderBottom: activeSubTab === 'payout' ? '2px solid #004B44' : '2px solid transparent'
          }}
        >
          <LandmarkIcon size={16} />
          <span>Payout Details (Private)</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('social')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingBottom: '0.75rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeSubTab === 'social' ? 700 : 500,
            color: activeSubTab === 'social' ? '#004B44' : '#535F5C',
            borderBottom: activeSubTab === 'social' ? '2px solid #004B44' : '2px solid transparent'
          }}
        >
          <Phone size={16} />
          <span>Social &amp; Contact Links (Public)</span>
        </button>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div style={{ padding: '0.9rem 1.25rem', backgroundColor: '#F0EDED', borderRadius: '6px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#004B44', fontSize: '0.85rem' }}>
          <Loader size={16} className="cart-spinner" />
          <span>Synchronizing profile settings with database...</span>
        </div>
      )}

      {/* ---------------------------------------------------------------
          MAIN 2:1 SPLIT CONTENT GRID
         --------------------------------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* --- LEFT COLUMN (Brand Assets, Store Info, Location, KYC, Payout) --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', gridColumn: 'span 2' }}>
          
          {/* 1. BRAND ASSETS & GENERAL INFO (PUBLIC) */}
          <div id="section-general" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#004B44', backgroundColor: '#E8F5F1', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  Public Information
                </span>
                <h2 style={{ margin: '0.5rem 0 0', fontSize: '1.25rem', fontFamily: 'serif', fontWeight: 600, color: '#004B44' }}>
                  Store Identity &amp; Brand Assets
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.825rem', color: '#535F5C' }}>
                  Visual assets and store identity visible on your public storefront.
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#535F5C', backgroundColor: '#F0EDED', padding: '0.25rem 0.65rem', borderRadius: '12px', fontWeight: 500 }}>
                Recommended Banner: 1200 × 360 px
              </span>
            </div>

            {/* Hidden File Inputs */}
            <input type="file" ref={bannerInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleBannerFileChange} />
            <input type="file" ref={logoInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleLogoFileChange} />

            {/* Cover Banner */}
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
                alignItems: 'flex-end',
                padding: '1rem'
              }}
            >
              {!coverBannerUrl && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#707977' }}>
                  <Camera size={28} />
                  <span style={{ fontSize: '0.8rem', marginTop: '0.4rem', fontWeight: 500 }}>Upload Store Cover Banner</span>
                </div>
              )}
              <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    border: '1px solid #E5E2E1',
                    borderRadius: '4px',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#004B44',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  <Camera size={14} />
                  <span>{coverBannerUrl ? 'Change Banner' : 'Upload Banner'}</span>
                </button>
              </div>

              {/* Logo / Badge Overlap */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 2 }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#004B44',
                    border: '3px solid #FFFFFF',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#B1EEE4',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt={storeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    storeInitials
                  )}
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0,0,0,0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      cursor: 'pointer',
                      border: 'none'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
                  >
                    <Camera size={18} color="#FFFFFF" />
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: coverBannerUrl ? '#FFFFFF' : '#004B44',
                      textShadow: coverBannerUrl ? '0 1px 2px rgba(0,0,0,0.6)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Camera size={12} />
                    <span>Upload Logo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Store Information Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                    Store / Brand Name *
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. VYCE DESIGNS"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                    Lead Designer Name
                  </label>
                  <input
                    type="text"
                    value={leadDesigner}
                    onChange={(e) => setLeadDesigner(e.target.value)}
                    placeholder="e.g. Adeyemi Alabi"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#707977', display: 'block', marginTop: '0.2rem' }}>
                    Entered value is displayed as the designer name. No inflated titles applied.
                  </span>
                </div>
              </div>

              {/* Storefront URL Handle */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                  Storefront URL Handle
                </label>
                <div style={{ display: 'flex', borderRadius: '4px', border: '1px solid #E5E2E1', backgroundColor: '#F0EDED', overflow: 'hidden' }}>
                  <span style={{ padding: '0.65rem 0.85rem', fontSize: '0.85rem', color: '#535F5C', backgroundColor: '#E5E2E1' }}>
                    asomarketplace.ng/store/
                  </span>
                  <input
                    type="text"
                    readOnly
                    value={slug || 'store-handle'}
                    style={{ width: '100%', border: 'none', background: 'transparent', padding: '0.65rem 0.85rem', fontSize: '0.85rem', color: '#004B44', fontWeight: 600, outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{ border: 'none', background: '#E5E2E1', padding: '0 0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#004B44', fontWeight: 600 }}
                  >
                    {copied ? <Check size={14} color="#004B44" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Tagline / Short Bio */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                  Tagline / Short Bio
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Modern Nigerian silhouettes, bespoke tailoring & ready-to-wear pieces"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
                />
              </div>

              {/* Detailed Designer Story */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947' }}>
                    Detailed Designer Story
                  </label>
                  <span style={{ fontSize: '0.75rem', color: wordCount > 500 ? '#DC2626' : '#707977' }}>
                    {wordCount} / 500 words
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder="Share your brand story, craftsmanship values, and design philosophy. This approved text is displayed on your public storefront About section."
                  style={{ width: '100%', padding: '0.75rem 0.85rem', fontSize: '0.9rem', lineHeight: '1.6', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B', resize: 'vertical' }}
                />
                <span style={{ fontSize: '0.7rem', color: '#707977', display: 'block', marginTop: '0.2rem' }}>
                  The frontend displays your submitted story directly. No biographical text is fabricated by the platform.
                </span>
              </div>

              {/* Structured Specialties & Categories */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.5rem' }}>
                  Specialties &amp; Categories
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.35rem 0.75rem',
                        backgroundColor: '#E8F5F1',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        color: '#004B44',
                        border: '1px solid #B1EEE4',
                        fontWeight: 600
                      }}
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        style={{ border: 'none', background: 'none', color: '#004B44', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}

                  {showAddTag ? (
                    <div style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Add specialty..."
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag(newTagInput);
                          }
                        }}
                        autoFocus
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: '15px', border: '1px solid #004B44', outline: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTag(newTagInput)}
                        style={{ backgroundColor: '#004B44', color: '#FFF', border: 'none', borderRadius: '12px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Add
                      </button>
                      <button type="button" onClick={() => setShowAddTag(false)} style={{ background: 'none', border: 'none', color: '#707977', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddTag(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.35rem 0.75rem',
                        border: '1px dashed #004B44',
                        color: '#004B44',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      <Plus size={13} />
                      <span>Add Specialty</span>
                    </button>
                  )}
                </div>

                {/* Quick Add Taxonomy Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#707977', marginRight: '0.25rem' }}>Popular:</span>
                  {STANDARD_SPECIALTIES.map((spec) => {
                    const isAdded = tags.includes(spec);
                    return (
                      <button
                        key={spec}
                        type="button"
                        disabled={isAdded}
                        onClick={() => handleAddTag(spec)}
                        style={{
                          border: isAdded ? '1px solid #E5E2E1' : '1px solid #D0D5DD',
                          background: isAdded ? '#F9FAFB' : '#FFFFFF',
                          color: isAdded ? '#9CA3AF' : '#374151',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          cursor: isAdded ? 'default' : 'pointer',
                          fontWeight: 500
                        }}
                      >
                        {isAdded ? `✓ ${spec}` : `+ ${spec}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 2. LOCATION & FULFILLMENT (PUBLIC VS PRIVATE) */}
          <div id="section-location" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ borderBottom: '1px solid #E5E2E1', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'serif', fontWeight: 600, color: '#004B44' }}>
                  Location &amp; Fulfillment
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.825rem', color: '#535F5C' }}>
                  Separation of authoritative public location and confidential courier fulfillment address.
                </p>
              </div>
              <Truck size={22} color="#004B44" />
            </div>

            {/* Public Location Box */}
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', padding: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem' }}>
                <Globe size={16} color="#166534" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#166534' }}>
                  Public Location (Customer Facing)
                </span>
              </div>
              <p style={{ margin: '0 0 0.85rem', fontSize: '0.8rem', color: '#166534' }}>
                Displayed publicly on your storefront header and about section (e.g. <strong>{publicCity}, {publicState}</strong>). Full residential or workshop addresses are never exposed to customers.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#166534', marginBottom: '0.35rem' }}>
                    Public City *
                  </label>
                  <input
                    type="text"
                    value={publicCity}
                    onChange={(e) => setPublicCity(e.target.value)}
                    placeholder="e.g. Lagos, Aba, Abuja"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #86EFAC', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#1C1B1B' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#166534', marginBottom: '0.35rem' }}>
                    Public State *
                  </label>
                  <select
                    value={publicState}
                    onChange={(e) => setPublicState(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #86EFAC', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#1C1B1B' }}
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Private Workshop Address Box */}
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem' }}>
                <Building size={16} color="#475569" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569' }}>
                  Private Workshop Address &amp; Courier Hub (Confidential)
                </span>
              </div>
              <p style={{ margin: '0 0 0.85rem', fontSize: '0.8rem', color: '#64748B' }}>
                Operational fulfillment details used solely for courier pickups (GIGL / DHL / Fez) and Aso verification. Strictly private.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#334155', marginBottom: '0.35rem' }}>
                    Physical Workshop / Studio Address
                  </label>
                  <input
                    type="text"
                    value={workshopAddress}
                    onChange={(e) => setWorkshopAddress(e.target.value)}
                    placeholder="e.g. 92 Lateef Adegboyega Street, Ago Palace, Okota"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #CBD5E1', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#1C1B1B' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#334155', marginBottom: '0.35rem' }}>
                      Landmark / Pickup Note (Private)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Ago Roundabout / Behind Zenith Bank"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #CBD5E1', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#1C1B1B' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#334155', marginBottom: '0.35rem' }}>
                      Operational Dispatch Hub
                    </label>
                    <input
                      type="text"
                      value={dispatchHub}
                      onChange={(e) => setDispatchHub(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #CBD5E1', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#1C1B1B' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. VERIFICATION & LEGAL (KYC) (PRIVATE) */}
          <div id="section-kyc" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid #E5E2E1', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7C2D12', backgroundColor: '#FFEDD5', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  Private Operational Data
                </span>
                <h2 style={{ margin: '0.5rem 0 0', fontSize: '1.25rem', fontFamily: 'serif', fontWeight: 600, color: '#004B44' }}>
                  Verification &amp; Legal (KYC)
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.825rem', color: '#535F5C' }}>
                  Compliance documents are private and never exposed to customers on the public storefront.
                </p>
              </div>
              <ShieldCheck size={22} color="#004B44" />
            </div>

            {/* Status Banner */}
            <div style={{
              backgroundColor: isVerified ? '#ECFDF5' : '#FFFBEB',
              border: `1px solid ${isVerified ? '#A7F3D0' : '#FDE68A'}`,
              borderRadius: '6px',
              padding: '1rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <CheckCircle2 size={20} color={isVerified ? '#059669' : '#D97706'} />
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: isVerified ? '#065F46' : '#92400E' }}>
                    {isVerified ? 'Verified Designer' : (verificationStatus === 'PENDING' ? 'Verification in Progress' : 'Pending Verification')}
                  </p>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.775rem', color: isVerified ? '#047857' : '#B45309' }}>
                    {isVerified
                      ? 'Your business has completed verification. The Verified Designer badge is live on your public storefront.'
                      : 'Your documents have been submitted and are under review. Public storefront reflects Verification in Progress.'}
                  </p>
                </div>
              </div>
              <span style={{
                backgroundColor: isVerified ? '#004B44' : '#D97706',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.25rem 0.65rem',
                borderRadius: '12px'
              }}>
                {isVerified ? 'VERIFIED' : 'UNDER REVIEW'}
              </span>
            </div>

            {/* Legal Document Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                  CAC Business Registration Number (Private)
                </label>
                <input
                  type="text"
                  placeholder="e.g. RC-1849204 or BN-3920194"
                  value={cacNumber}
                  onChange={(e) => setCacNumber(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                  National Identification Number (NIN) (Private)
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#535F5C', backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
              <Info size={14} color="#004B44" />
              <span>Identity and registration details are encrypted and strictly protected under Aso Marketplace data privacy governance.</span>
            </div>
          </div>

          {/* 4. PAYOUT DETAILS (PRIVATE) */}
          <div id="section-payout" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid #E5E2E1', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7C2D12', backgroundColor: '#FFEDD5', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  Private Financial Data
                </span>
                <h2 style={{ margin: '0.5rem 0 0', fontSize: '1.25rem', fontFamily: 'serif', fontWeight: 600, color: '#004B44' }}>
                  Payout Details
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.825rem', color: '#535F5C' }}>
                  Bank account for receiving customer order settlements in Naira. Confidential and never exposed on public storefronts.
                </p>
              </div>
              <LandmarkIcon size={22} color="#004B44" />
            </div>

            {/* Current Bank Card */}
            {accountNumber ? (
              <div style={{ backgroundColor: '#FCF9F8', padding: '1.25rem', borderRadius: '6px', border: '1px solid #E5E2E1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#535F5C', fontWeight: 600 }}>Active Settlement Account</span>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '1.05rem', fontWeight: 700, color: '#1C1B1B' }}>{bankName || 'Nigerian Commercial Bank'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingBank(!editingBank)}
                    style={{ background: 'none', border: '1px solid #004B44', color: '#004B44', padding: '0.3rem 0.65rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {editingBank ? 'Close' : 'Update Account'}
                  </button>
                </div>
                <p style={{ margin: '0.2rem 0', fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 700, color: '#004B44', letterSpacing: '0.12em' }}>
                  •••• •••• {accountNumber.slice(-4)}
                </p>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.825rem', color: '#535F5C' }}>
                  Beneficiary Name: <strong>{accountName}</strong>
                </p>
              </div>
            ) : (
              <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>No settlement account connected</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>Add your Nigerian bank details to receive order settlements directly into your account.</p>
              </div>
            )}

            {/* Edit / Add Bank Form */}
            {(editingBank || !accountNumber) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Zenith Bank, GTBank, Access Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #D1D5DB', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#1C1B1B' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                    10-Digit NUBAN Account Number *
                  </label>
                  <input
                    type="text"
                    placeholder="0123456789"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #D1D5DB', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#1C1B1B' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                    Account Beneficiary Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Adeyemi Alabi Enterprise"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', border: '1px solid #D1D5DB', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#1C1B1B' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT COLUMN (Storefront Preview, Social Links, Account Hub) --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* 1. PUBLIC STOREFRONT PREVIEW CARD (Real Backend Data) */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#004B44' }}>
                Customer View Preview
              </span>
              <span style={{ fontSize: '0.72rem', color: '#535F5C', backgroundColor: '#F0EDED', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                Live Storefront
              </span>
            </div>

            <div style={{ border: '1px solid #E5E2E1', borderRadius: '6px', padding: '1rem', backgroundColor: '#FCF9F8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#004B44', color: '#B1EEE4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden' }}>
                  {logoUrl ? <img src={logoUrl} alt={storeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : storeInitials}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#004B44' }}>{storeName || 'Store Name'}</p>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#535F5C' }}>
                    {publicCity}, {publicState}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ marginBottom: '0.75rem' }}>
                {isVerified ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: 700, color: '#004B44', backgroundColor: '#E8F5F1', border: '1px solid #B1EEE4', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>
                    <CheckCircle2 size={12} />
                    <span>Verified Designer</span>
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: 600, color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>
                    <Clock size={12} />
                    <span>Verification in Progress</span>
                  </span>
                )}
              </div>

              {/* Authoritative Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', padding: '0.65rem 0', borderTop: '1px solid #E5E2E1', borderBottom: '1px solid #E5E2E1', textAlign: 'center', margin: '0.5rem 0' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#004B44' }}>{productCount}</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#535F5C' }}>{productCount === 1 ? 'Product' : 'Products'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#004B44' }}>
                    {reviewCount > 0 ? `${averageRating} ★` : 'New'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#535F5C' }}>
                    {reviewCount > 0 ? `${reviewCount} reviews` : 'No reviews yet'}
                  </p>
                </div>
              </div>

              {tagline && (
                <p style={{ margin: '0.65rem 0 0', fontSize: '0.775rem', color: '#535F5C', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  "{tagline}"
                </p>
              )}

              {slug && (
                <a
                  href={`/store/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    width: '100%',
                    marginTop: '0.85rem',
                    padding: '0.55rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#004B44',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #004B44',
                    borderRadius: '4px',
                    textDecoration: 'none'
                  }}
                >
                  <span>Open Storefront</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>

          {/* 2. SOCIAL & CONTACT LINKS (PUBLIC) */}
          <div id="section-social" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#004B44', backgroundColor: '#E8F5F1', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                Public Channels
              </span>
              <h3 style={{ margin: '0.4rem 0 0', fontSize: '1.1rem', fontFamily: 'serif', fontWeight: 600, color: '#004B44' }}>
                Social &amp; Contact Links
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#535F5C' }}>
                Public channels displayed on your storefront for customer enquiries.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#3F4947', marginBottom: '0.3rem', fontWeight: 600 }}>
                Instagram Handle
              </label>
              <div style={{ display: 'flex', borderRadius: '4px', border: '1px solid #E5E2E1', backgroundColor: '#FCF9F8', overflow: 'hidden' }}>
                <span style={{ padding: '0.55rem 0.75rem', fontSize: '0.8rem', color: '#535F5C', backgroundColor: '#F0EDED', borderRight: '1px solid #E5E2E1' }}>@</span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="brandhandle"
                  style={{ width: '100%', border: 'none', background: 'transparent', padding: '0.55rem 0.75rem', fontSize: '0.85rem', outline: 'none', color: '#1C1B1B' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#3F4947', marginBottom: '0.3rem', fontWeight: 600 }}>
                <Phone size={12} />
                <span>WhatsApp Business Number</span>
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+2348012345678"
                style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
              />
              <span style={{ fontSize: '0.7rem', color: '#707977', display: 'block', marginTop: '0.2rem' }}>
                Powers the "Contact Designer on WhatsApp" button on your storefront.
              </span>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#3F4947', marginBottom: '0.3rem', fontWeight: 600 }}>
                <Globe size={12} />
                <span>Official Website (Optional)</span>
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourbrand.com"
                style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
              />
            </div>
          </div>

          {/* 3. DESIGNER STUDIO SESSION */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#004B44' }}>
                Studio Session
              </h3>
              <UserIcon size={18} color="#004B44" />
            </div>

            <div style={{ backgroundColor: '#F6F3F2', padding: '0.85rem', borderRadius: '4px', border: '1px solid #E5E2E1' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#535F5C' }}>Authenticated Designer:</p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem', fontWeight: 600, color: '#1C1B1B' }}>
                {user?.email || 'designer@asomarketplace.ng'}
              </p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#065F46', fontWeight: 600 }}>
                Role: {isVerified ? 'Verified Designer' : 'Registered Designer'}
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
