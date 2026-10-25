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
  Lock,
  Building,
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
  const [_loading, setLoading] = useState(true);

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
  const dispatchHub = 'Dellyman Logistics Dispatch Terminal';

  // Section 3: Verification & KYC (Withdrawal Requirement)
  const [kycMethod, setKycMethod] = useState<'nin' | 'cac'>('nin');
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

  // Section 5: Social & Contact Links
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
          if (user.vendor_profile?.nin_number) {
            setNin(user.vendor_profile.nin_number);
            setKycMethod('nin');
          } else if (user.vendor_profile?.cac_number) {
            setCacNumber(user.vendor_profile.cac_number);
            setKycMethod('cac');
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
    const fullUrl = `https://asomarketplace.com.ng/store/${slug}`;
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

      // 1. Update Core Vendor Storefront Profile
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

      // 2. Persist payout bank account if provided
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
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Save profile error', err);
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to save profile changes.';
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.25rem 5rem' }}>
      
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#004B44', fontWeight: 700 }}>
                Designer Studio
              </span>
              <span style={{ color: '#C4C7C5' }}>|</span>
              <span style={{ fontSize: '0.75rem', color: '#535F5C', fontWeight: 500 }}>
                Profile &amp; Settings
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.65rem', fontFamily: 'serif', fontWeight: 600, color: '#1C1B1B' }}>
              {storeName || 'Designer Profile'}
            </h1>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#535F5C' }}>
              Manage your brand identity, workshop pickup location, identity verification, and payout details.
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
                  padding: '0.6rem 0.95rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#004B44',
                  backgroundColor: '#E8F5F1',
                  border: '1px solid #B1EEE4',
                  borderRadius: '6px',
                  textDecoration: 'none'
                }}
              >
                <ExternalLink size={14} />
                <span>View Storefront</span>
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
                padding: '0.6rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: saving ? '#535F5C' : '#004B44',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 3px rgba(0, 75, 68, 0.15)'
              }}
            >
              {saving ? <Loader size={15} className="cart-spinner" /> : <Save size={15} />}
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </div>

        {/* Feedback alerts */}
        {saveSuccess && (
          <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.75rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065F46', fontSize: '0.85rem' }}>
            <CheckCircle2 size={16} />
            <span>Profile saved successfully.</span>
          </div>
        )}

        {saveError && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', padding: '0.75rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>{saveError}</span>
          </div>
        )}
      </div>

      {/* NAVIGATION TABS */}
      <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid #E5E2E1', gap: '1.5rem', marginBottom: '1.75rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
        <button
          type="button"
          onClick={() => scrollToSection('general')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            paddingBottom: '0.75rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeSubTab === 'general' ? 700 : 500,
            color: activeSubTab === 'general' ? '#004B44' : '#535F5C',
            borderBottom: activeSubTab === 'general' ? '2px solid #004B44' : '2px solid transparent'
          }}
        >
          <Bookmark size={15} />
          <span>Brand &amp; Storefront</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('location')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            paddingBottom: '0.75rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeSubTab === 'location' ? 700 : 500,
            color: activeSubTab === 'location' ? '#004B44' : '#535F5C',
            borderBottom: activeSubTab === 'location' ? '2px solid #004B44' : '2px solid transparent'
          }}
        >
          <MapPin size={15} />
          <span>Location &amp; Pickup</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('kyc')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            paddingBottom: '0.75rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeSubTab === 'kyc' ? 700 : 500,
            color: activeSubTab === 'kyc' ? '#004B44' : '#535F5C',
            borderBottom: activeSubTab === 'kyc' ? '2px solid #004B44' : '2px solid transparent'
          }}
        >
          <ShieldCheck size={15} />
          <span>Identity &amp; Withdrawals</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('payout')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            paddingBottom: '0.75rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeSubTab === 'payout' ? 700 : 500,
            color: activeSubTab === 'payout' ? '#004B44' : '#535F5C',
            borderBottom: activeSubTab === 'payout' ? '2px solid #004B44' : '2px solid transparent'
          }}
        >
          <LandmarkIcon size={15} />
          <span>Payout Account</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('social')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            paddingBottom: '0.75rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeSubTab === 'social' ? 700 : 500,
            color: activeSubTab === 'social' ? '#004B44' : '#535F5C',
            borderBottom: activeSubTab === 'social' ? '2px solid #004B44' : '2px solid transparent'
          }}
        >
          <Phone size={15} />
          <span>Contacts &amp; Links</span>
        </button>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.75rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: EDITABLE FORMS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* 1. BRAND IDENTITY & STOREFRONT */}
          <div id="section-general" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid #E5E2E1', paddingBottom: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'serif', fontWeight: 600, color: '#004B44' }}>
                  Brand Identity &amp; Assets
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#535F5C' }}>
                  Visual assets and store identity displayed on your public storefront.
                </p>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#535F5C' }}>
                Recommended: Landscape banner (3:1 ratio)
              </span>
            </div>

            {/* Hidden File Inputs */}
            <input type="file" ref={bannerInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleBannerFileChange} />
            <input type="file" ref={logoInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleLogoFileChange} />

            {/* Cover Banner */}
            <div
              style={{
                position: 'relative',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid #E5E2E1',
                height: '160px',
                backgroundColor: '#F6F3F2',
                marginBottom: '1rem',
                backgroundImage: coverBannerUrl ? `url("${coverBannerUrl}")` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '0.85rem'
              }}
            >
              {!coverBannerUrl && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#707977' }}>
                  <Camera size={24} />
                  <span style={{ fontSize: '0.8rem', marginTop: '0.35rem', fontWeight: 500 }}>Upload Store Cover Banner</span>
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
                    padding: '0.35rem 0.7rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#004B44',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Camera size={13} />
                  <span>{coverBannerUrl ? 'Change Banner' : 'Upload Banner'}</span>
                </button>
              </div>

              {/* Logo / Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 2 }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#004B44',
                    border: '3px solid #FFFFFF',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#B1EEE4',
                    fontSize: '1.15rem',
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
                    <Camera size={16} color="#FFFFFF" />
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                    Store / Brand Name *
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Vyce Designs"
                    style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.875rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
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
                    placeholder="e.g. Seyi Vodi or Lanre da Silva"
                    style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.875rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#707977', display: 'block', marginTop: '0.2rem' }}>
                    Displayed on your public storefront alongside your brand name.
                  </span>
                </div>
              </div>

              {/* Storefront URL Handle */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                  Storefront URL Handle
                </label>
                <div style={{ display: 'flex', borderRadius: '4px', border: '1px solid #E5E2E1', backgroundColor: '#F0EDED', overflow: 'hidden' }}>
                  <span style={{ padding: '0.6rem 0.8rem', fontSize: '0.825rem', color: '#535F5C', backgroundColor: '#E5E2E1' }}>
                    asomarketplace.com.ng/store/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="brand-name"
                    style={{ width: '100%', border: 'none', background: 'transparent', padding: '0.6rem 0.8rem', fontSize: '0.875rem', outline: 'none', color: '#1C1B1B' }}
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{ padding: '0.6rem 0.85rem', backgroundColor: '#004B44', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Tagline / Bio */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                  Tagline / Short Bio
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Contemporary bespoke menswear and authentic ceremonial wear."
                  maxLength={120}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.875rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
                />
              </div>

              {/* Detailed Brand Story */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947' }}>
                    Brand Story &amp; Craftsmanship
                  </label>
                  <span style={{ fontSize: '0.7rem', color: wordCount > 500 ? '#DC2626' : '#707977' }}>
                    {wordCount} / 500 words
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder="Tell buyers about your craftsmanship, inspiration, and signature tailoring..."
                  style={{ width: '100%', padding: '0.65rem 0.8rem', fontSize: '0.875rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B', resize: 'vertical' }}
                />
                <span style={{ fontSize: '0.7rem', color: '#707977', display: 'block', marginTop: '0.2rem' }}>
                  Share your background, craftsmanship, and what defines your tailoring.
                </span>
              </div>

              {/* Structured Specialties & Categories */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.5rem' }}>
                  Specialties &amp; Categories
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center', marginBottom: '0.65rem' }}>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.3rem 0.7rem',
                        backgroundColor: '#E8F5F1',
                        borderRadius: '16px',
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
                        <X size={12} />
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
                        <X size={13} />
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
                        padding: '0.3rem 0.7rem',
                        border: '1px dashed #004B44',
                        color: '#004B44',
                        borderRadius: '16px',
                        fontSize: '0.8rem',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      <Plus size={12} />
                      <span>Add Specialty</span>
                    </button>
                  )}
                </div>

                {/* Quick Add Taxonomy Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#707977', marginRight: '0.2rem' }}>Popular:</span>
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
                          padding: '0.2rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          cursor: isAdded ? 'default' : 'pointer',
                          fontWeight: 500
                        }}
                      >
                        {isAdded ? spec : `+ ${spec}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 2. LOCATION & FULFILLMENT */}
          <div id="section-location" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid #E5E2E1', paddingBottom: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'serif', fontWeight: 600, color: '#004B44' }}>
                  Location &amp; Courier Pickup
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#535F5C' }}>
                  Your city is visible to buyers. Your workshop address is confidential and only used for courier pickups.
                </p>
              </div>
              <Truck size={20} color="#004B44" />
            </div>

            {/* Public Location Box */}
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Globe size={15} color="#166534" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#166534' }}>
                  Public Location (Customer Facing)
                </span>
              </div>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.785rem', color: '#166534' }}>
                Displayed on your public storefront header (e.g. <strong>{publicCity}, {publicState}</strong>). Your street address is never shown to customers.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#166534', marginBottom: '0.3rem' }}>
                    Public City *
                  </label>
                  <input
                    type="text"
                    value={publicCity}
                    onChange={(e) => setPublicCity(e.target.value)}
                    placeholder="e.g. Ikeja, Lekki, or Yaba"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem', border: '1px solid #86EFAC', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#1C1B1B' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#166534', marginBottom: '0.3rem' }}>
                    Public State *
                  </label>
                  <select
                    value={publicState}
                    onChange={(e) => setPublicState(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem', border: '1px solid #86EFAC', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#1C1B1B' }}
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Private Workshop Pickup Address */}
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <MapPin size={15} color="#334155" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#334155' }}>
                  Workshop Pickup Address (Confidential)
                </span>
              </div>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.785rem', color: '#475569' }}>
                Used strictly for automated courier dispatch (Dellyman) to pick up ready parcels.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#334155', marginBottom: '0.3rem' }}>
                    Physical Workshop / Studio Address
                  </label>
                  <input
                    type="text"
                    value={workshopAddress}
                    onChange={(e) => setWorkshopAddress(e.target.value)}
                    placeholder="e.g. 14 Commercial Avenue, Sabo, Yaba"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem', border: '1px solid #CBD5E1', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#1C1B1B' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#334155', marginBottom: '0.3rem' }}>
                      Nearest Landmark (Private)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Opposite Ozone Cinemas, near Total station"
                      style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem', border: '1px solid #CBD5E1', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#1C1B1B' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#334155', marginBottom: '0.3rem' }}>
                      Logistics Dispatch Partner
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={dispatchHub}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem', border: '1px solid #CBD5E1', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#64748B' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. IDENTITY VERIFICATION & WITHDRAWALS */}
          <div id="section-kyc" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid #E5E2E1', paddingBottom: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'serif', fontWeight: 600, color: '#004B44' }}>
                  Identity Verification &amp; Bank Withdrawals
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#535F5C' }}>
                  To withdraw earnings to your bank account, Nigerian financial regulations require identity verification. You can list products and make sales immediately.
                </p>
              </div>
              <ShieldCheck size={20} color="#004B44" />
            </div>

            {/* Status Banner */}
            <div style={{
              backgroundColor: isVerified ? '#ECFDF5' : (verificationStatus === 'PENDING' && (nin || cacNumber) ? '#FFFBEB' : '#F8FAFC'),
              border: `1px solid ${isVerified ? '#A7F3D0' : (verificationStatus === 'PENDING' && (nin || cacNumber) ? '#FDE68A' : '#E2E8F0')}`,
              borderRadius: '6px',
              padding: '0.9rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {isVerified ? (
                  <CheckCircle2 size={18} color="#059669" />
                ) : (verificationStatus === 'PENDING' && (nin || cacNumber)) ? (
                  <Clock size={18} color="#D97706" />
                ) : (
                  <Lock size={18} color="#64748B" />
                )}
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: isVerified ? '#065F46' : (verificationStatus === 'PENDING' && (nin || cacNumber) ? '#92400E' : '#1E293B') }}>
                    {isVerified ? 'Verified Designer • Bank Withdrawals Active' : (verificationStatus === 'PENDING' && (nin || cacNumber) ? 'Verification in Progress' : 'Action Required to Enable Withdrawals')}
                  </p>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.775rem', color: isVerified ? '#047857' : (verificationStatus === 'PENDING' && (nin || cacNumber) ? '#B45309' : '#64748B') }}>
                    {isVerified
                      ? 'Your identity has been verified. Withdrawals to your bank account are fully unlocked.'
                      : (verificationStatus === 'PENDING' && (nin || cacNumber))
                      ? 'Your verification details have been submitted and are under review. You can continue uploading garments.'
                      : 'You can sell immediately. Submit either your NIN or CAC registration below to enable bank withdrawals when you make sales.'}
                  </p>
                </div>
              </div>
              <span style={{
                backgroundColor: isVerified ? '#004B44' : (verificationStatus === 'PENDING' && (nin || cacNumber) ? '#D97706' : '#64748B'),
                color: '#FFFFFF',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.25rem 0.6rem',
                borderRadius: '12px'
              }}>
                {isVerified ? 'VERIFIED' : (verificationStatus === 'PENDING' && (nin || cacNumber) ? 'UNDER REVIEW' : 'WITHDRAWALS LOCKED')}
              </span>
            </div>

            {/* Verification Method Toggle */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.5rem' }}>
                Choose Verification Document
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setKycMethod('nin')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    border: kycMethod === 'nin' ? '2px solid #004B44' : '1px solid #D1D5DB',
                    backgroundColor: kycMethod === 'nin' ? '#E8F5F1' : '#FFFFFF',
                    color: kycMethod === 'nin' ? '#004B44' : '#374151',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <UserIcon size={16} />
                  <div>
                    <div>NIN (National ID)</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 400, color: '#535F5C' }}>For Individual Tailors &amp; Designers</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setKycMethod('cac')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    border: kycMethod === 'cac' ? '2px solid #004B44' : '1px solid #D1D5DB',
                    backgroundColor: kycMethod === 'cac' ? '#E8F5F1' : '#FFFFFF',
                    color: kycMethod === 'cac' ? '#004B44' : '#374151',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Building size={16} />
                  <div>
                    <div>CAC Business Number</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 400, color: '#535F5C' }}>For Registered Business Names &amp; Ltd</div>
                  </div>
                </button>
              </div>

              {kycMethod === 'nin' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                    11-Digit National Identification Number (NIN)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 11-digit NIN"
                    maxLength={11}
                    value={nin}
                    onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.875rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#707977', display: 'block', marginTop: '0.25rem' }}>
                    Used solely for one-time identity verification. Never displayed publicly.
                  </span>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                    CAC Business Registration Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BN-2938102 or RC-1928374"
                    value={cacNumber}
                    onChange={(e) => setCacNumber(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.875rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#707977', display: 'block', marginTop: '0.25rem' }}>
                    Corporate Affairs Commission registration number for your brand.
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#535F5C', backgroundColor: '#F8FAFC', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
              <Lock size={13} color="#004B44" />
              <span>Identity information is encrypted and strictly protected under Nigerian data privacy regulations.</span>
            </div>
          </div>

          {/* 4. PAYOUT DETAILS */}
          <div id="section-payout" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid #E5E2E1', paddingBottom: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'serif', fontWeight: 600, color: '#004B44' }}>
                  Settlement Bank Account
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#535F5C' }}>
                  Bank account for receiving customer order settlements in Naira. Confidential and never exposed publicly.
                </p>
              </div>
              <LandmarkIcon size={20} color="#004B44" />
            </div>

            {/* Current Bank Card */}
            {accountNumber ? (
              <div style={{ backgroundColor: '#FCF9F8', padding: '1.15rem', borderRadius: '6px', border: '1px solid #E5E2E1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#535F5C', fontWeight: 600 }}>Active Settlement Account</span>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '1rem', fontWeight: 700, color: '#1C1B1B' }}>{bankName || 'Commercial Bank'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingBank(!editingBank)}
                    style={{ background: 'none', border: '1px solid #004B44', color: '#004B44', padding: '0.3rem 0.65rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {editingBank ? 'Close' : 'Update Account'}
                  </button>
                </div>
                <p style={{ margin: '0.2rem 0', fontFamily: 'monospace', fontSize: '1.15rem', fontWeight: 700, color: '#004B44', letterSpacing: '0.1em' }}>
                  •••• •••• {accountNumber.slice(-4)}
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#535F5C' }}>
                  Beneficiary: <strong>{accountName}</strong>
                </p>
              </div>
            ) : (
              <div style={{ backgroundColor: '#F8FAFC', padding: '1.15rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>No settlement account connected</p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>Add your Nigerian bank details to receive order settlements directly into your account.</p>
              </div>
            )}

            {/* Edit / Add Bank Form */}
            {(editingBank || !accountNumber) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.3rem' }}>
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GTBank, Zenith, Access"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem', border: '1px solid #D1D5DB', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#1C1B1B' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.3rem' }}>
                    10-Digit NUBAN Account Number *
                  </label>
                  <input
                    type="text"
                    placeholder="0123456789"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem', border: '1px solid #D1D5DB', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#1C1B1B' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.3rem' }}>
                    Account Beneficiary Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Adeyemi Alabi"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem', border: '1px solid #D1D5DB', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#1C1B1B' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW & CONTACTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* 1. PUBLIC STOREFRONT PREVIEW CARD */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#004B44' }}>
                Storefront Preview
              </span>
              <span style={{ fontSize: '0.7rem', color: '#535F5C', backgroundColor: '#F0EDED', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                Customer View
              </span>
            </div>

            <div style={{ border: '1px solid #E5E2E1', borderRadius: '6px', padding: '0.85rem', backgroundColor: '#FCF9F8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#004B44', color: '#B1EEE4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden' }}>
                  {logoUrl ? <img src={logoUrl} alt={storeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : storeInitials}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#004B44' }}>{storeName || 'Brand Name'}</p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#535F5C' }}>
                    {publicCity}, {publicState}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ marginBottom: '0.65rem' }}>
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

              {/* Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', padding: '0.5rem 0', borderTop: '1px solid #E5E2E1', borderBottom: '1px solid #E5E2E1', textAlign: 'center', margin: '0.5rem 0' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#004B44' }}>{productCount}</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#535F5C' }}>{productCount === 1 ? 'Product' : 'Products'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#004B44' }}>
                    {reviewCount > 0 ? averageRating : 'New'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#535F5C' }}>
                    {reviewCount > 0 ? `${reviewCount} reviews` : 'No reviews'}
                  </p>
                </div>
              </div>

              {tagline && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#535F5C', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
                    marginTop: '0.75rem',
                    padding: '0.5rem',
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

          {/* 2. CHANNELS & PRIVATE NOTIFICATIONS */}
          <div id="section-social" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontFamily: 'serif', fontWeight: 600, color: '#004B44' }}>
                Contact &amp; Notification Channels
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#535F5C' }}>
                Public social handles and private order alert details.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#3F4947', marginBottom: '0.25rem', fontWeight: 600 }}>
                Instagram Handle
              </label>
              <div style={{ display: 'flex', borderRadius: '4px', border: '1px solid #E5E2E1', backgroundColor: '#FCF9F8', overflow: 'hidden' }}>
                <span style={{ padding: '0.5rem 0.7rem', fontSize: '0.785rem', color: '#535F5C', backgroundColor: '#F0EDED', borderRight: '1px solid #E5E2E1' }}>@</span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="brandhandle"
                  style={{ width: '100%', border: 'none', background: 'transparent', padding: '0.5rem 0.7rem', fontSize: '0.825rem', outline: 'none', color: '#1C1B1B' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#3F4947', marginBottom: '0.25rem', fontWeight: 600 }}>
                <Phone size={12} />
                <span>Order Alert Phone / WhatsApp (Private)</span>
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+2348012345678"
                style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.825rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
              />
              <span style={{ fontSize: '0.68rem', color: '#707977', display: 'block', marginTop: '0.2rem' }}>
                Used privately by Aso to send you urgent order updates and courier pickup alerts. Never exposed on your public storefront.
              </span>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#3F4947', marginBottom: '0.25rem', fontWeight: 600 }}>
                <Globe size={12} />
                <span>Official Website (Optional)</span>
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourbrand.com"
                style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.825rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8', color: '#1C1B1B' }}
              />
            </div>
          </div>

          {/* 3. DESIGNER STUDIO SESSION */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#004B44' }}>
                Studio Session
              </h3>
              <UserIcon size={16} color="#004B44" />
            </div>

            <div style={{ backgroundColor: '#F6F3F2', padding: '0.75rem', borderRadius: '4px', border: '1px solid #E5E2E1' }}>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#535F5C' }}>Authenticated Designer:</p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.825rem', fontWeight: 600, color: '#1C1B1B' }}>
                {user?.email || 'designer@asomarketplace.com.ng'}
              </p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: '#065F46', fontWeight: 600 }}>
                Status: {isVerified ? 'Verified Designer' : 'Registered Designer'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                width: '100%',
                padding: '0.55rem 0.85rem',
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                border: '1px solid #FECACA',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <LogOut size={13} />
              <span>Sign Out of Designer Studio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignerProfileView;
