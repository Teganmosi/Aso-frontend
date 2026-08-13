import React, { useState } from 'react';
import { useAuth, type UserTypeMode } from '../../context/AuthContext';
import { vendorApi } from '../../api/client';
import { X, AlertCircle, Sparkles, ArrowRight, Store, User as UserIcon } from 'lucide-react';
import './AuthModal.css';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalTab, authModalUserType, login, register, refreshMe } = useAuth();
  
  const [tab, setTab] = useState<'login' | 'register'>(authModalTab);
  const [userType, setUserType] = useState<UserTypeMode>(authModalUserType || 'customer');

  // Customer & Designer Auth Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Designer Storefront Registration Fields
  const [designerStep, setDesignerStep] = useState<1 | 2>(1);
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Lagos');
  const [state, setState] = useState('Lagos State');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [workshopAddress, setWorkshopAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    setTab(authModalTab);
    setUserType(authModalUserType || 'customer');
    setDesignerStep(1);
    setErrorMessage('');
  }, [authModalTab, authModalUserType, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      await login(email, password);
      if (userType === 'designer') {
        window.location.href = '/vendor/dashboard';
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Invalid email or password.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      await register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
      });
    } catch (err: any) {
      console.error(err);
      const data = err.response?.data;
      if (typeof data === 'object' && data !== null) {
        const firstKey = Object.keys(data)[0];
        const val = data[firstKey];
        const msg = Array.isArray(val) ? val[0] : String(val);
        setErrorMessage(`${firstKey.replace('_', ' ')}: ${msg}`);
      } else {
        setErrorMessage('Registration failed. Please check your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDesignerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      // 1. Create User Account
      await register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
      });

      // 2. Register Designer Storefront
      await vendorApi.registerVendor({
        store_name: storeName,
        description,
        city,
        state,
        instagram_handle: instagramHandle,
        workshop_address: workshopAddress,
      });

      await refreshMe();
      closeAuthModal();
      window.location.href = '/vendor/dashboard';
    } catch (err: any) {
      console.error(err);
      const data = err.response?.data;
      if (typeof data === 'object' && data !== null) {
        const firstKey = Object.keys(data)[0];
        const val = data[firstKey];
        const msg = Array.isArray(val) ? val[0] : String(val);
        setErrorMessage(`${firstKey.replace('_', ' ')}: ${msg}`);
      } else {
        setErrorMessage('Designer registration failed. Please verify your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div className={`modal-card auth-modal-card ${userType === 'designer' ? 'designer-mode-card' : ''}`} onClick={(e) => e.stopPropagation()}>
        
        {/* Designer Mode Header Badge */}
        {userType === 'designer' && (
          <div className="designer-portal-badge-bar">
            <div className="designer-badge-content">
              <Sparkles size={16} color="#D4AF37" />
              <span>DESIGNER PORTAL</span>
            </div>
          </div>
        )}

        <div className="auth-header-tabs">
          <div className="tab-buttons">
            <button
              className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
              onClick={() => {
                setTab('login');
                setErrorMessage('');
              }}
            >
              {userType === 'designer' ? 'Designer Sign In' : 'Customer Sign In'}
            </button>
            <button
              className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
              onClick={() => {
                setTab('register');
                setDesignerStep(1);
                setErrorMessage('');
              }}
            >
              {userType === 'designer' ? 'Designer Register' : 'Customer Register'}
            </button>
          </div>
          <button className="auth-close-btn" onClick={closeAuthModal} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="auth-modal-content">
          {errorMessage && (
            <div className="auth-error-alert">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* LOGIN TAB */}
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="auth-title-container">
                <h2 className="auth-serif-title">
                  {userType === 'designer' ? 'Designer Sign In' : 'Welcome Back'}
                </h2>
                <p className="auth-subtitle">
                  {userType === 'designer'
                    ? 'Sign in to manage your storefront, catalog, and orders.'
                    : 'Sign in to discover authentic Nigerian fashion and track your orders.'}
                </p>
              </div>

              <div className="form-group">
                <input
                  type="email"
                  className="input-field"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="password"
                  className="input-field"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="auth-forgot-link-wrapper">
                <a href="#forgot" onClick={(e) => e.preventDefault()} className="auth-forgot-link">
                  Forgot Password?
                </a>
              </div>

              <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                {loading ? 'SIGNING IN...' : userType === 'designer' ? 'SIGN IN TO DESIGNER DASHBOARD' : 'SIGN IN'}
              </button>

              {/* Role Switcher Option Link */}
              <div className="auth-role-switch-banner">
                {userType === 'customer' ? (
                  <button
                    type="button"
                    className="role-switch-btn"
                    onClick={() => {
                      setUserType('designer');
                      setErrorMessage('');
                    }}
                  >
                    <Store size={15} color="#D4AF37" />
                    <span>Are you a Fashion Designer? Log in as a Designer</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="role-switch-btn"
                    onClick={() => {
                      setUserType('customer');
                      setErrorMessage('');
                    }}
                  >
                    <UserIcon size={15} />
                    <span>Shopping for fashion? Log in as a Customer</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </form>
          ) : (
            /* REGISTER TAB */
            <div className="auth-register-container">
              {userType === 'customer' ? (
                /* CUSTOMER REGISTRATION FORM */
                <form onSubmit={handleCustomerRegisterSubmit} className="auth-form">
                  <div className="auth-title-container">
                    <h2 className="auth-serif-title">Create Customer Account</h2>
                    <p className="auth-subtitle">Join Aso Marketplace to discover bespoke fashion.</p>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <input
                        type="text"
                        className="input-field"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <input
                      type="email"
                      className="input-field"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="Phone Number (e.g. 08012345678)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Password (min. 8 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>

                  <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                    {loading ? 'CREATING ACCOUNT...' : 'REGISTER AS CUSTOMER'}
                  </button>

                  <div className="auth-role-switch-banner">
                    <button
                      type="button"
                      className="role-switch-btn"
                      onClick={() => {
                        setUserType('designer');
                        setErrorMessage('');
                      }}
                    >
                      <Store size={15} color="#D4AF37" />
                      <span>Are you a Fashion Designer? Register as a Designer</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </form>
              ) : (
                /* DESIGNER REGISTRATION FORM (2-STEP) */
                <form onSubmit={handleDesignerRegisterSubmit} className="auth-form">
                  <div className="auth-title-container">
                    <h2 className="auth-serif-title">Register as a Designer</h2>
                    <p className="auth-subtitle">
                      Step {designerStep} of 2: {designerStep === 1 ? 'Account Credentials' : 'Fashion House Storefront Setup'}
                    </p>
                  </div>

                  {designerStep === 1 ? (
                    /* Step 1: User Account Credentials */
                    <div className="step-fields">
                      <div className="form-row-2">
                        <div className="form-group">
                          <input
                            type="text"
                            className="input-field"
                            placeholder="First Name *"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Last Name *"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <input
                          type="email"
                          className="input-field"
                          placeholder="Business Email Address *"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <input
                          type="tel"
                          className="input-field"
                          placeholder="Phone Number (WhatsApp) *"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <input
                          type="password"
                          className="input-field"
                          placeholder="Password (min. 8 characters) *"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={8}
                        />
                      </div>

                      <button
                        type="button"
                        className="btn-primary auth-submit-btn"
                        onClick={() => {
                          if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
                            setErrorMessage('Please fill out all required account fields.');
                            return;
                          }
                          setErrorMessage('');
                          setDesignerStep(2);
                        }}
                      >
                        <span>NEXT: BRAND & STOREFRONT SETUP</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  ) : (
                    /* Step 2: Designer Brand Setup */
                    <div className="step-fields">
                      <div className="form-group">
                        <input
                          type="text"
                          className="input-field"
                          placeholder="BRAND / STOREFRONT NAME *"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <textarea
                          className="input-field textarea-field"
                          placeholder="Describe your tailoring expertise, fabric craft, and signature collections..."
                          rows={2}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>

                      <div className="form-row-2">
                        <div className="form-group">
                          <input
                            type="text"
                            className="input-field"
                            placeholder="City * (e.g. Lagos)"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <input
                            type="text"
                            className="input-field"
                            placeholder="State * (e.g. Lagos State)"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Instagram Handle (e.g. @yourbrand)"
                          value={instagramHandle}
                          onChange={(e) => setInstagramHandle(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Workshop / Pickup Street Address"
                          value={workshopAddress}
                          onChange={(e) => setWorkshopAddress(e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                        <button
                          type="button"
                          className="btn-secondary-light"
                          style={{ padding: '0.75rem 1.25rem' }}
                          onClick={() => setDesignerStep(1)}
                        >
                          BACK
                        </button>
                        <button type="submit" className="btn-primary auth-submit-btn" style={{ flex: 1 }} disabled={loading}>
                          {loading ? 'SUBMITTING DESIGNER REGISTRATION...' : 'REGISTER & OPEN STOREFRONT'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="auth-role-switch-banner">
                    <button
                      type="button"
                      className="role-switch-btn"
                      onClick={() => {
                        setUserType('customer');
                        setErrorMessage('');
                      }}
                    >
                      <UserIcon size={15} />
                      <span>Shopping for fashion? Register as a Customer</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
