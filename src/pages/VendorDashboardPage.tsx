import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { vendorApi, payoutApi } from '../api/client';
import type { BankAccount, VendorBalance, PayoutRequest, LedgerEntry, ProductItem } from '../types';
import { 
  Landmark, 
  CheckCircle2, 
  Store, 
  AlertCircle, 
  ShieldCheck, 
  FileText, 
  MapPin, 
  Bell, 
  Sparkles, 
  ShoppingBag, 
  ArrowRight,
  Wallet,
  Clock,
  History,
  X,
  Loader,
  LogOut,
  Home,
  User as UserIcon,
  ExternalLink
} from 'lucide-react';
import { Logo } from '../components/layout/Logo';
import { DashboardOverviewView } from '../components/vendor/DashboardOverviewView';
import { ProductsListView } from '../components/vendor/ProductsListView';
import { AddProductView } from '../components/vendor/AddProductView';
import { OrdersManagementView } from '../components/vendor/OrdersManagementView';
import { DesignerProfileView } from '../components/vendor/DesignerProfileView';
import './VendorDashboardPage.css';

export type DesignerPortalTab = 'dashboard' | 'products' | 'add-product' | 'orders' | 'earnings' | 'profile';

export const VendorDashboardPage: React.FC = () => {
  const { user, refreshMe, openAuthModal, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/vendor/products') {
      if (location.search.includes('action=add')) {
        setActiveTab('add-product');
      } else {
        setActiveTab('products');
      }
      setProductToEdit(null);
    } else if (location.pathname === '/vendor/orders') {
      setActiveTab('orders');
      setProductToEdit(null);
    } else if (location.pathname === '/vendor/earnings') {
      setActiveTab('earnings');
      setProductToEdit(null);
    } else if (location.pathname === '/vendor/settings' || location.pathname === '/vendor/profile') {
      setActiveTab('profile');
      setProductToEdit(null);
    } else if (location.pathname === '/vendor/dashboard' || location.pathname === '/vendor') {
      setActiveTab('dashboard');
      setProductToEdit(null);
    }
  }, [location.pathname, location.search]);
  const [activeTab, setActiveTab] = useState<DesignerPortalTab>('dashboard');
  const [productToEdit, setProductToEdit] = useState<ProductItem | null>(null);
  const [previewDemo, setPreviewDemo] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      navigate('/');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Financial Ledger & Payout States
  const [balance, setBalance] = useState<VendorBalance | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [financeLoading, setFinanceLoading] = useState(false);

  // Withdrawal Modal States in Earnings tab
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawModalError, setWithdrawModalError] = useState('');
  const [withdrawModalSuccess, setWithdrawModalSuccess] = useState('');

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

  useEffect(() => {
    if ((user?.is_vendor || user?.vendor_profile) && activeTab === 'earnings') {
      loadFinancialData();
    }
  }, [user, activeTab]);

  const loadFinancialData = async () => {
    setFinanceLoading(true);
    try {
      const [bal, ledger, reqs] = await Promise.allSettled([
        payoutApi.getBalance(),
        payoutApi.getLedger(),
        payoutApi.getPayoutRequests(),
      ]);
      if (bal.status === 'fulfilled') setBalance(bal.value);
      if (ledger.status === 'fulfilled') setLedgerEntries(ledger.value);
      if (reqs.status === 'fulfilled') setPayoutRequests(reqs.value);
    } catch (err) {
      console.error('Failed to load financial records', err);
    } finally {
      setFinanceLoading(false);
    }
  };

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

  const handleWithdrawalFromEarnings = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawModalError('');
    setWithdrawModalSuccess('');

    const val = parseFloat(withdrawAmount);
    if (isNaN(val) || val <= 0) {
      setWithdrawModalError('Please enter a valid withdrawal amount.');
      return;
    }

    const valKobo = Math.round(val * 100);
    const availKobo = balance?.available_balance_kobo ?? 0;

    if (valKobo > availKobo) {
      setWithdrawModalError(`Amount exceeds your available balance of ₦${(availKobo / 100).toLocaleString()}.`);
      return;
    }

    setWithdrawSubmitting(true);
    try {
      await payoutApi.requestWithdrawal(valKobo);
      setWithdrawModalSuccess(`Withdrawal of ₦${val.toLocaleString()} submitted!`);
      setWithdrawAmount('');
      await loadFinancialData();
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawModalSuccess('');
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to submit withdrawal request.';
      setWithdrawModalError(msg);
    } finally {
      setWithdrawSubmitting(false);
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
      await vendorApi.verifyKyc({
        nin,
        landmark,
        cac_number: cacNumber,
      });
      setKycSubmitted(true);
      setKycSuccessMessage('Verification details submitted successfully! Your NIN and workshop landmark have been recorded for the Verified Atelier badge review.');
      refreshMe();
    } catch (err: any) {
      console.error('KYC submission error', err);
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to submit verification details. Please try again.';
      setKycErrorMessage(msg);
    } finally {
      setKycLoading(false);
    }
  };

  // LOGGED OUT GATE SCREEN
  if (!user && !previewDemo) {
    return (
      <div className="designer-portal-gate-wrapper">
        <div className="designer-gate-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <Logo option={2} variant="dark" showTagline={true} />
          </div>

          <div className="gate-badge">
            <Sparkles size={15} color="#D4AF37" />
            <span>DESIGNER PORTAL ACCESS</span>
          </div>

          <h1 className="gate-serif-headline">
            The Studio Dashboard for Nigerian Fashion Artisans
          </h1>

          <p className="gate-subtitle">
            Manage your bespoke catalogue, process client orders, track delivery dispatches, and withdraw earnings directly to your Nigerian bank account.
          </p>

          <div className="gate-pillars-grid">
            <div className="pillar-item">
              <div className="pillar-icon-box">
                <Store size={22} color="#064E3B" />
              </div>
              <h4 className="pillar-title">Digital Storefront</h4>
              <p className="pillar-desc">Custom luxury storefront showcasing your craft to thousands of fashion lovers nationwide.</p>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon-box">
                <ShoppingBag size={22} color="#064E3B" />
              </div>
              <h4 className="pillar-title">Bespoke SLA Orders</h4>
              <p className="pillar-desc">48-hour order acceptance, real-time tailoring status tracker, and nationwide courier dispatch.</p>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon-box">
                <Landmark size={22} color="#064E3B" />
              </div>
              <h4 className="pillar-title">Automated Payouts</h4>
              <p className="pillar-desc">Clear financial ledger accounting with direct settlements to your registered bank account.</p>
            </div>
          </div>

          <div className="gate-actions-row">
            <button
              className="btn-primary-emerald"
              onClick={() => openAuthModal('login', 'designer')}
            >
              <span>Sign In to Designer Portal</span>
              <ArrowRight size={18} />
            </button>

            <button
              className="btn-secondary-dark"
              onClick={() => setPreviewDemo(true)}
            >
              <span>Preview Demo Portal</span>
            </button>
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link
              to="/"
              style={{
                fontSize: '0.875rem',
                color: '#4B5563',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 500
              }}
            >
              <Home size={15} />
              <span>← Back to Aso Customer Marketplace</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const storeSlug = user?.vendor_profile?.slug || (user?.first_name ? user.first_name.toLowerCase().replace(/\s+/g, '-') : '');
  const availableNaira = balance?.available_balance_naira ?? 0;
  const pendingNaira = balance?.pending_balance_naira ?? 0;
  const reservedNaira = balance?.reserved_balance_naira ?? 0;
  const withdrawnNaira = balance?.withdrawn_balance_naira ?? 0;

  return (
    <div className="designer-portal-layout">
      {/* Top Aso Studio Header Bar */}
      <header className="heritage-dashboard-header">
        <div className="heritage-header-inner">
          {/* Brand Logo */}
          <div className="heritage-header-left">
            <Link
              to="/vendor/dashboard"
              className="heritage-brand-logo-link"
              style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
              title="Aso Marketplace Designer Studio"
            >
              <Logo option={2} variant="dark" showTagline={true} />
            </Link>
          </div>

          {/* Navigation Tabs (Desktop) */}
          <nav className="heritage-nav-links">
            <button
              className={`heritage-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`heritage-nav-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              Products
            </button>
            <button
              className={`heritage-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </button>
            <button
              className={`heritage-nav-btn ${activeTab === 'earnings' ? 'active' : ''}`}
              onClick={() => setActiveTab('earnings')}
            >
              Earnings
            </button>
            <button
              className={`heritage-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
          </nav>

          {/* Right Icons & Store Shortcut */}
          <div className="heritage-header-right">
            {/* Quick Switch to Customer Marketplace */}
            <Link
              to="/"
              className="btn-heritage-marketplace"
              title="Switch to Customer Marketplace"
            >
              <Home size={15} />
              <span>Marketplace</span>
            </Link>

            {/* Public Storefront Link */}
            <a
              href={`/store/${storeSlug}`}
              target="_blank"
              rel="noreferrer"
              className="btn-heritage-view-store"
              title="View Public Storefront in New Tab"
            >
              <span>Public Store</span>
              <ExternalLink size={13} />
            </a>

            {previewDemo && (
              <span className="demo-mode-pill">DEMO MODE</span>
            )}

            {/* Notifications Button */}
            <button className="heritage-round-icon-btn" title="Notifications">
              <Bell size={18} />
            </button>

            {/* Header Direct Sign Out Button */}
            <button
              onClick={handleLogout}
              className="btn-heritage-logout"
              title="Sign Out of Designer Studio"
            >
              <LogOut size={15} />
              <span>Log Out</span>
            </button>

            {/* Avatar with Popover Profile Menu */}
            <div className="heritage-avatar-menu-container" ref={profileDropdownRef} style={{ position: 'relative' }}>
              <button
                className="heritage-round-icon-btn avatar-trigger-btn"
                title={user?.first_name ? `${user.first_name} (${user.vendor_profile?.store_name || 'Studio'})` : 'Designer Account'}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                aria-expanded={showProfileDropdown}
                aria-haspopup="true"
              >
                <div className="avatar-letter-circle">
                  {user?.first_name?.[0]?.toUpperCase() || user?.vendor_profile?.store_name?.[0]?.toUpperCase() || 'D'}
                </div>
              </button>

              {showProfileDropdown && (
                <div className="vendor-avatar-dropdown-menu">
                  <div className="dropdown-user-header">
                    <p className="dropdown-user-name">
                      {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Designer Account'}
                    </p>
                    <p className="dropdown-store-name">
                      {user?.vendor_profile?.store_name || 'Aso Artisan Studio'}
                    </p>
                    <span className="dropdown-role-badge">{user?.vendor_profile?.is_verified ? "Verified Designer" : "Registered Designer"}</span>
                  </div>

                  <div className="dropdown-divider" />

                  <button
                    type="button"
                    className="dropdown-menu-item"
                    onClick={() => {
                      setActiveTab('profile');
                      setShowProfileDropdown(false);
                    }}
                  >
                    <UserIcon size={15} />
                    <span>Store &amp; Artisan Profile</span>
                  </button>

                  <a
                    href={`/store/${storeSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="dropdown-menu-item"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <ExternalLink size={15} />
                    <span>View Public Store</span>
                  </a>

                  <Link
                    to="/"
                    className="dropdown-menu-item"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <Home size={15} />
                    <span>Switch to Marketplace</span>
                  </Link>

                  <div className="dropdown-divider" />

                  <button
                    type="button"
                    className="dropdown-menu-item text-danger"
                    onClick={() => {
                      setShowProfileDropdown(false);
                      handleLogout();
                    }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out / Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
              
      </header>

      {/* Main Designer Portal Content Area */}
      <div className="vendor-dashboard-container page-padded">
        {/* Render Selected View */}
        {activeTab === 'dashboard' && (
          <DashboardOverviewView
            onNavigateToProducts={() => setActiveTab('products')}
            onNavigateToOrders={() => setActiveTab('orders')}
            onNavigateToAddProduct={() => setActiveTab('add-product')}
            onNavigateToEarnings={() => setActiveTab('earnings')}
          />
        )}

        {activeTab === 'products' && (
          <ProductsListView
            onAddNewProduct={() => {
              setProductToEdit(null);
              setActiveTab('add-product');
            }}
            onEditProduct={(product) => {
              setProductToEdit(product);
              setActiveTab('add-product');
            }}
          />
        )}

        {activeTab === 'add-product' && (
          <AddProductView
            onBack={() => {
              setProductToEdit(null);
              setActiveTab('products');
            }}
            onSaveProduct={() => {
              setProductToEdit(null);
              setActiveTab('products');
            }}
            productToEdit={productToEdit}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersManagementView />
        )}

        {activeTab === 'earnings' && (
          <div className="earnings-verification-tab-view">
            <div className="dashboard-welcome-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 className="dashboard-serif-title">Earnings, Ledger & Bank Settlements</h1>
                <p className="dashboard-subtitle">Real-time marketplace balances, payout withdrawal requests, and immutable financial ledger.</p>
              </div>
              <button
                className="btn-primary"
                onClick={() => setShowWithdrawModal(true)}
                disabled={availableNaira <= 0}
                style={{ backgroundColor: '#064E3B', color: '#FFF', padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
              >
                <Landmark size={18} />
                <span>Withdraw to Bank</span>
              </button>
            </div>

            {/* 4 Financial Metric Cards */}
            <div className="dashboard-stats-grid" style={{ marginTop: '1.5rem' }}>
              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-label">AVAILABLE BALANCE</span>
                  <div className="stat-icon-wrapper"><Wallet size={18} /></div>
                </div>
                <div className="stat-value">₦ {availableNaira.toLocaleString()}</div>
                <div className="stat-meta text-emerald"><span>Ready for immediate payout</span></div>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-label">PENDING BALANCE</span>
                  <div className="stat-icon-wrapper"><Clock size={18} /></div>
                </div>
                <div className="stat-value">₦ {pendingNaira.toLocaleString()}</div>
                <div className="stat-meta text-muted"><span>72h Customer Protection Hold</span></div>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-label">RESERVED IN PAYOUT</span>
                  <div className="stat-icon-wrapper"><Landmark size={18} /></div>
                </div>
                <div className="stat-value">₦ {reservedNaira.toLocaleString()}</div>
                <div className="stat-meta text-muted"><span>Bank processing in progress</span></div>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-label">LIFETIME WITHDRAWN</span>
                  <div className="stat-icon-wrapper"><History size={18} /></div>
                </div>
                <div className="stat-value">₦ {withdrawnNaira.toLocaleString()}</div>
                <div className="stat-meta text-emerald"><span>Successfully settled to bank</span></div>
              </div>
            </div>

            {/* LEDGER ENTRIES & PAYOUT REQUESTS SECTION */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
              {/* Financial Ledger Log */}
              <div className="dashboard-card" style={{ padding: '1.5rem' }}>
                <div className="card-header-flex">
                  <h3 className="card-heading">Financial Ledger Breakdown</h3>
                  <span style={{ fontSize: '0.75rem', color: '#6B7280', fontFamily: 'monospace' }}>DOUBLE-ENTRY LEDGER</span>
                </div>
                {financeLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}><Loader size={20} className="cart-spinner" /></div>
                ) : ledgerEntries.length === 0 ? (
                  <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: '1.5rem 0' }}>No ledger transactions recorded yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                    {ledgerEntries.slice(0, 6).map((entry) => (
                      <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '6px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>{entry.description || entry.entry_type.replace(/_/g, ' ')}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{new Date(entry.created_at).toLocaleString()}</div>
                        </div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: entry.amount_naira >= 0 ? '#065F46' : '#991B1B' }}>
                          {entry.amount_naira >= 0 ? '+' : ''}₦ {entry.amount_naira.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payout Withdrawal History */}
              <div className="dashboard-card" style={{ padding: '1.5rem' }}>
                <div className="card-header-flex">
                  <h3 className="card-heading">Withdrawal Requests</h3>
                </div>
                {financeLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}><Loader size={20} className="cart-spinner" /></div>
                ) : payoutRequests.length === 0 ? (
                  <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: '1.5rem 0' }}>No payout requests found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                    {payoutRequests.slice(0, 6).map((req) => (
                      <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '6px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>
                            {req.bank_name_snapshot || 'Bank Account'} {req.account_number_snapshot ? `(••••${req.account_number_snapshot.slice(-4)})` : ''}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Ref: {req.reference} • {new Date(req.created_at).toLocaleDateString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>₦ {req.amount_naira.toLocaleString()}</div>
                          <span className={`status-pill status-${req.status.toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                            {req.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* KYC & BANK ACCOUNT CONFIGURATION */}
            <div className="dashboard-grid-main" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
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
                    <label className="form-label">10-DIGIT NUBAN ACCOUNT NUMBER</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. 0123456789"
                      maxLength={10}
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-actions-right">
                    <button type="submit" className="btn-primary btn-save-details" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Payout Details'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* WITHDRAW MODAL IN EARNINGS TAB */}
            {showWithdrawModal && (
              <div className="designer-modal-overlay">
                <div className="designer-modal-box" style={{ maxWidth: '440px' }}>
                  <div className="modal-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Landmark size={20} color="#D4AF37" />
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Cinzel, Georgia, serif' }}>Withdraw Earnings</h3>
                    </div>
                    <button 
                      onClick={() => setShowWithdrawModal(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available for Settlement</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#064E3B', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                      ₦ {availableNaira.toLocaleString()}
                    </div>
                    {bankAccount ? (
                      <div style={{ fontSize: '0.8rem', color: '#4B5563', marginTop: '0.5rem' }}>
                        To: <strong>{bankAccount.bank_name}</strong> • {bankAccount.account_number} ({bankAccount.account_name})
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#DC2626', marginTop: '0.5rem' }}>
                        Please save a valid payout bank account below first.
                      </div>
                    )}
                  </div>

                  {withdrawModalError && (
                    <div className="auth-error-alert" style={{ marginBottom: '1rem' }}>
                      <AlertCircle size={16} />
                      <span>{withdrawModalError}</span>
                    </div>
                  )}

                  {withdrawModalSuccess && (
                    <div className="alert-success-msg" style={{ marginBottom: '1rem' }}>
                      <CheckCircle2 size={16} />
                      <span>{withdrawModalSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleWithdrawalFromEarnings}>
                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                      <label className="form-label">WITHDRAWAL AMOUNT (₦)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="100"
                        max={availableNaira}
                        className="input-field"
                        placeholder="e.g. 25000"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setWithdrawAmount(availableNaira.toString())}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#065F46',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginTop: '0.4rem',
                          padding: 0
                        }}
                      >
                        Withdraw All (₦{availableNaira.toLocaleString()})
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setShowWithdrawModal(false)}
                        disabled={withdrawSubmitting}
                        style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', border: '1px solid #D1D5DB', background: '#FFF' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={withdrawSubmitting || availableNaira <= 0}
                        style={{ padding: '0.6rem 1.4rem', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#064E3B', color: '#FFF', border: 'none' }}
                      >
                        {withdrawSubmitting ? 'Processing...' : 'Submit Withdrawal'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <DesignerProfileView onNavigateToEarnings={() => setActiveTab('earnings')} />
        )}
      </div>
    </div>
  );
};

