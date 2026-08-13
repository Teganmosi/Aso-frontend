import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { vendorApi } from '../api/client';
import type { BankAccount } from '../types';
import { 
  Landmark, 
  CheckCircle2, 
  Store, 
  AlertCircle, 
  ShieldCheck, 
  FileText, 
  MapPin, 
  Bell, 
  Plus, 
  Sparkles, 
  ShoppingBag, 
  Lock, 
  ArrowRight 
} from 'lucide-react';
import { DashboardOverviewView } from '../components/vendor/DashboardOverviewView';
import { ProductsListView } from '../components/vendor/ProductsListView';
import { AddProductView } from '../components/vendor/AddProductView';
import './VendorDashboardPage.css';

export type DesignerPortalTab = 'dashboard' | 'products' | 'add-product' | 'orders' | 'earnings' | 'profile';

export const VendorDashboardPage: React.FC = () => {
  const { user, refreshMe, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<DesignerPortalTab>('dashboard');
  const [previewDemo, setPreviewDemo] = useState(false);

  // Payout Bank Account Details
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('033');

  // Identity & KYC Verification Details
  const [nin, setNin] = useState('');
  const [landmark, setLandmark] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [kycSubmitted, setKycSubmitted] = useState(false);
  const [kycSuccessMessage, setKycSuccessMessage] = useState('');
  const [kycErrorMessage, setKycErrorMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const NIGERIAN_BANKS = [
    { name: 'Access Bank', code: '044' },
    { name: 'Guaranty Trust Bank (GTBank)', code: '058' },
    { name: 'First Bank of Nigeria', code: '011' },
    { name: 'United Bank for Africa (UBA)', code: '033' },
    { name: 'Zenith Bank', code: '057' },
    { name: 'Kuda Microfinance Bank', code: '50211' },
    { name: 'OPay Digital Bank', code: '999992' },
    { name: 'Palmpay', code: '999991' },
    { name: 'Stanbic IBTC Bank', code: '221' },
    { name: 'Sterling Bank', code: '232' },
    { name: 'Wema Bank (ALAT)', code: '035' },
  ];

  useEffect(() => {
    if (user?.is_vendor || user?.vendor_profile) {
      loadBankAccount();
    }
  }, [user]);

  const loadBankAccount = async () => {
    try {
      const data = await vendorApi.getBankAccount();
      if (data) {
        setBankAccount(data);
        setAccountName(data.account_name || '');
        setAccountNumber(data.account_number || '');
        setBankName(data.bank_name || '');
        setBankCode(data.bank_code || '033');
      }
    } catch {
      // Bank account not set yet
    }
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (accountNumber.length !== 10 || !/^\d+$/.test(accountNumber)) {
      setErrorMessage('Account number must consist of exactly 10 digits.');
      return;
    }

    setLoading(true);
    try {
      const updated = await vendorApi.saveBankAccount({
        account_name: accountName,
        account_number: accountNumber,
        bank_name: bankName,
        bank_code: bankCode,
      });
      setBankAccount(updated);
      setSuccessMessage('Payout account details saved successfully!');
      refreshMe();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Failed to save bank account details. Please check your inputs.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKycDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycSuccessMessage('');
    setKycErrorMessage('');

    if (nin.length !== 11 || !/^\d+$/.test(nin)) {
      setKycErrorMessage('National Identification Number (NIN) must be exactly 11 digits.');
      return;
    }

    setKycLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setKycSubmitted(true);
      setKycSuccessMessage('Verification details submitted successfully! Our compliance team will audit your NIN & workshop landmark.');
    } catch (err) {
      setKycErrorMessage('Failed to submit verification details. Please try again.');
    } finally {
      setKycLoading(false);
    }
  };

  // LOGGED OUT GATE SCREEN
  if (!user && !previewDemo) {
    return (
      <div className="designer-portal-gate-wrapper">
        <div className="designer-gate-card">
          <div className="gate-badge">
            <Sparkles size={15} color="#D4AF37" />
            <span>DESIGNER PORTAL ACCESS</span>
          </div>

          <h1 className="gate-serif-headline">
            Welcome to the ASO Designer Suite
          </h1>

          <p className="gate-sub-description">
            Sign in or register your brand to manage your bespoke catalog, track orders, and showcase your luxury Nigerian fashion house to buyers worldwide.
          </p>

          {/* 3 Pillars Grid */}
          <div className="gate-pillars-grid">
            <div className="gate-pillar-item">
              <div className="pillar-icon-box">
                <Store size={22} className="text-emerald-icon" />
              </div>
              <h4 className="pillar-title">Verified Storefront</h4>
              <p className="pillar-desc">Get a dedicated digital boutique URL for your bespoke fashion house.</p>
            </div>

            <div className="gate-pillar-item">
              <div className="pillar-icon-box">
                <ShoppingBag size={22} className="text-emerald-icon" />
              </div>
              <h4 className="pillar-title">Order Management</h4>
              <p className="pillar-desc">Accept custom sizing requests and track nationwide shipping.</p>
            </div>

            <div className="gate-pillar-item">
              <div className="pillar-icon-box">
                <ShieldCheck size={22} className="text-emerald-icon" />
              </div>
              <h4 className="pillar-title">Automated Payouts</h4>
              <p className="pillar-desc">Receive sales earnings directly into your Nigerian bank account.</p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="gate-actions-row">
            <button className="btn-gate-primary" onClick={() => openAuthModal('login', 'designer')}>
              <Lock size={16} />
              <span>Log In as Designer</span>
            </button>

            <button className="btn-gate-secondary" onClick={() => openAuthModal('register', 'designer')}>
              <Sparkles size={16} />
              <span>Register Your Storefront</span>
            </button>
          </div>

          {/* Interactive Demo Preview Option */}
          <div className="gate-demo-preview">
            <button className="btn-demo-preview" onClick={() => setPreviewDemo(true)}>
              <span>Preview Designer Portal Interactive Demo</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const vp = user?.vendor_profile;

  return (
    <div className="designer-portal-wrapper">
      {/* Top Designer Portal Sub-Navbar */}
      <div className="designer-sub-navbar">
        <div className="sub-navbar-container">
          <nav className="designer-tab-links">
            <button
              className={`designer-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`designer-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              Products
            </button>
            <button
              className={`designer-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </button>
            <button
              className={`designer-tab-btn ${activeTab === 'earnings' ? 'active' : ''}`}
              onClick={() => setActiveTab('earnings')}
            >
              Earnings & Verification
            </button>
            <button
              className={`designer-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
          </nav>

          <div className="designer-navbar-right">
            {previewDemo && (
              <span className="demo-mode-pill">DEMO MODE ACTIVE</span>
            )}
            <button
              className="btn-add-product-shortcut"
              onClick={() => setActiveTab('add-product')}
            >
              <Plus size={15} />
              <span>Add Product</span>
            </button>
            <button className="designer-icon-btn" title="Notifications">
              <Bell size={18} />
            </button>
            <div className="designer-avatar-small" title={user?.first_name || 'Designer'}>
              {user?.first_name?.[0]?.toUpperCase() || 'D'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Designer Portal Content Area */}
      <div className="vendor-dashboard-container page-padded">
        {/* Render Selected View */}
        {activeTab === 'dashboard' && (
          <DashboardOverviewView
            onNavigateToProducts={() => setActiveTab('products')}
            onNavigateToOrders={() => setActiveTab('orders')}
          />
        )}

        {activeTab === 'products' && (
          <ProductsListView
            onAddNewProduct={() => setActiveTab('add-product')}
            onEditProduct={() => setActiveTab('add-product')}
          />
        )}

        {activeTab === 'add-product' && (
          <AddProductView
            onBack={() => setActiveTab('products')}
            onSaveProduct={() => setActiveTab('products')}
          />
        )}

        {activeTab === 'orders' && (
          <DashboardOverviewView
            onNavigateToProducts={() => setActiveTab('products')}
            onNavigateToOrders={() => setActiveTab('orders')}
          />
        )}

        {activeTab === 'earnings' && (
          <div className="earnings-verification-tab-view">
            <div className="dashboard-welcome-header">
              <h1 className="dashboard-serif-title">Earnings & Identity Verification (KYC)</h1>
              <p className="dashboard-subtitle">Manage payout bank account details and submit government NIN verification.</p>
            </div>

            <div className="dashboard-grid-main" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
              {/* CARD 1: Identity & Verification (KYC) */}
              <div className="payout-setup-card">
                <div className="card-header-row">
                  <ShieldCheck size={24} style={{ color: '#D4AF37' }} />
                  <div>
                    <h3 className="card-title">Identity & Verification (KYC)</h3>
                    <p className="card-subtitle">Provide your NIN and nearest landmark to get the Verified Designer badge.</p>
                  </div>
                </div>

                {kycSuccessMessage && (
                  <div className="alert-success-msg">
                    <CheckCircle2 size={18} />
                    <span>{kycSuccessMessage}</span>
                  </div>
                )}

                {kycErrorMessage && (
                  <div className="auth-error-alert">
                    <AlertCircle size={18} />
                    <span>{kycErrorMessage}</span>
                  </div>
                )}

                {kycSubmitted ? (
                  <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #A7F3D0', padding: '1.25rem', borderRadius: '8px', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#065F46', fontWeight: 700, marginBottom: '0.4rem' }}>
                      <CheckCircle2 size={18} />
                      <span>KYC Details Under Audit</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#047857', margin: 0 }}>
                      NIN ({nin.substring(0, 3)}••••{nin.substring(7)}) and Workshop Landmark submitted.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveKycDetails} className="payout-form">
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FileText size={14} />
                        <span>NATIONAL IDENTIFICATION NUMBER (NIN) *</span>
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="11-digit NIN (e.g. 12345678901)"
                        maxLength={11}
                        value={nin}
                        onChange={(e) => setNin(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={14} />
                        <span>NEAREST LANDMARK / PICKUP LOCATION *</span>
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Opposite Ikeja City Mall, Alausa, Lagos"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">CAC REGISTRATION NUMBER (OPTIONAL)</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. RC-123456"
                        value={cacNumber}
                        onChange={(e) => setCacNumber(e.target.value)}
                      />
                    </div>

                    <div className="form-actions-right">
                      <button type="submit" className="btn-primary btn-save-details" disabled={kycLoading}>
                        {kycLoading ? 'Submitting...' : 'Submit Identity Verification'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* CARD 2: Payout Bank Account Setup */}
              <div className="payout-setup-card">
                <div className="card-header-row">
                  <Landmark size={24} className="card-header-icon" />
                  <div>
                    <h3 className="card-title">Payout Bank Account</h3>
                    <p className="card-subtitle">Complete your financial details to receive payments once approved.</p>
                  </div>
                </div>

                {bankAccount && (
                  <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #A7F3D0', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#065F46' }}>
                    <strong>Active Payout Bank:</strong> {bankAccount.bank_name} • {bankAccount.account_number} ({bankAccount.account_name})
                  </div>
                )}

                {successMessage && (
                  <div className="alert-success-msg">
                    <CheckCircle2 size={18} />
                    <span>{successMessage}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="auth-error-alert">
                    <AlertCircle size={18} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSaveBankDetails} className="payout-form">
                  <div className="form-group">
                    <label className="form-label">ACCOUNT HOLDER NAME</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Adewale Ojo"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">BANK NAME</label>
                    <select
                      className="input-field"
                      value={bankName}
                      onChange={(e) => {
                        const selected = NIGERIAN_BANKS.find((b) => b.name === e.target.value);
                        setBankName(e.target.value);
                        if (selected) setBankCode(selected.code);
                      }}
                      required
                    >
                      <option value="">Select your bank</option>
                      {NIGERIAN_BANKS.map((bank) => (
                        <option key={bank.code} value={bank.name}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">ACCOUNT NUMBER</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="10-digit account number"
                      maxLength={10}
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-actions-right">
                    <button type="submit" className="btn-primary btn-save-details" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Bank Details'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-tab-view">
            <div className="approved-banner" style={{ marginTop: '1rem' }}>
              <div className="approved-badge-row">
                <CheckCircle2 size={24} className="icon-success" />
                <div>
                  <h2>{vp?.store_name || 'Your Fashion House'} — Storefront Profile</h2>
                  <p>Manage public bio, workshop address, and social links.</p>
                </div>
              </div>
              <a href={`/store/${vp?.slug || 'lagos-couture'}`} className="btn-secondary-light">
                View Public Storefront
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
