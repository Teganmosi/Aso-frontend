import React, { useState } from 'react';
import { useAuth, type UserTypeMode } from '../../context/AuthContext';
import { vendorApi, authApi, apiErrorMessage, isEmailNotVerifiedError } from '../../api/client';
import { stateOptions } from '../../data/nigerianStates';
import { EmailVerifyPanel } from './EmailVerifyPanel';
import type { User } from '../../types';
import { X, AlertCircle, Sparkles, ArrowRight, Store, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import './AuthModal.css';

/**
 * Where the person is in the flow:
 *  - form:   sign-in / create-account / designer account form
 *  - verify: 6-digit email code (after sign-up, or before opening a studio)
 *  - studio: designer brand details (last step for designers)
 */
type Stage = 'form' | 'verify' | 'studio';

const needsVerification = (u: User | null | undefined) => u?.email_verified === false;

/** Same rule as the server: a Nigerian mobile number. Empty is allowed where the field is optional. */
const looksLikeNigerianMobile = (raw: string) => {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length > 11) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.length === 10 && '789'.includes(digits[0]);
};

const goToStudio = () => { window.location.href = '/vendor/dashboard'; };

export const AuthModal: React.FC = () => {
  const { user, isAuthModalOpen, closeAuthModal, authModalTab, authModalUserType, login, register, refreshMe } = useAuth();

  const [tab, setTab] = useState<'login' | 'register'>(authModalTab);
  const [userType, setUserType] = useState<UserTypeMode>(authModalUserType || 'customer');
  const [stage, setStage] = useState<Stage>('form');
  const [codeJustSent, setCodeJustSent] = useState(false);
  // True once a designer created their account in this modal: shows "Step x of 3".
  const [freshDesignerSignup, setFreshDesignerSignup] = useState(false);

  // Account fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Studio fields
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Lagos');
  const [state, setState] = useState('Lagos');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [workshopAddress, setWorkshopAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSentMessage, setResetSentMessage] = useState('');

  // Reset only when the modal is opened or retargeted, not every time `user` changes
  // (signing up changes `user` mid-flow and must not throw the person back to step 1).
  React.useEffect(() => {
    if (!isAuthModalOpen) return;
    setTab(authModalTab);
    setUserType(authModalUserType || 'customer');
    setErrorMessage('');
    setForgotMode(false);
    setResetSentMessage('');
    setCodeJustSent(false);
    setFreshDesignerSignup(false);
    setShowPassword(false);
    if (user && authModalUserType === 'designer') {
      if (user.vendor_profile) {
        goToStudio();
        return;
      }
      setStage(needsVerification(user) ? 'verify' : 'studio');
    } else {
      setStage('form');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authModalTab, authModalUserType, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const isDesigner = userType === 'designer';
  const showDesignerSteps = isDesigner && ((stage === 'form' && tab === 'register') || freshDesignerSignup);
  const designerStepLabel = showDesignerSteps
    ? { form: 'Step 1 of 3 · Your account', verify: 'Step 2 of 3 · Confirm your email', studio: 'Step 3 of 3 · Your studio' }[stage]
    : '';

  const switchType = (next: UserTypeMode) => {
    setUserType(next);
    setErrorMessage('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      const signedIn = await login(email.trim(), password);
      if (!isDesigner) {
        closeAuthModal();
      } else if (signedIn.vendor_profile) {
        closeAuthModal();
        goToStudio();
      } else {
        // A shopper account signing in on the designer side: continue to open the studio here.
        setStage(needsVerification(signedIn) ? 'verify' : 'studio');
      }
    } catch (err: any) {
      setErrorMessage(apiErrorMessage(err, 'That email and password don’t match.'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await authApi.requestPasswordReset(email.trim());
      setResetSentMessage(res.message || 'If that email has an Aso account, we’ve sent a reset link.');
    } catch (err: any) {
      setErrorMessage(apiErrorMessage(err, 'We couldn’t send the reset email. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (isDesigner && !phone.trim()) {
      setErrorMessage('Add a WhatsApp number so shoppers’ orders and riders can reach you.');
      return;
    }
    if (phone.trim() && !looksLikeNigerianMobile(phone)) {
      setErrorMessage('Enter a Nigerian mobile number, e.g. 08012345678.');
      return;
    }
    setLoading(true);
    try {
      const created = await register({
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phone.trim(),
      });
      setPassword('');
      if (isDesigner) setFreshDesignerSignup(true);
      if (needsVerification(created)) {
        setCodeJustSent(true);
        setStage('verify');
      } else if (isDesigner) {
        setStage('studio');
      } else {
        closeAuthModal();
      }
    } catch (err: any) {
      setErrorMessage(apiErrorMessage(err, 'We couldn’t create your account. Please check your details.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = () => {
    setErrorMessage('');
    if (isDesigner) {
      setStage('studio');
    } else {
      closeAuthModal();
    }
  };

  const handleStudioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      await vendorApi.registerVendor({
        store_name: storeName.trim(),
        description: description.trim(),
        city: city.trim(),
        state,
        instagram_handle: instagramHandle.trim(),
        workshop_address: workshopAddress.trim(),
      });
      await refreshMe();
      closeAuthModal();
      goToStudio();
    } catch (err: any) {
      if (isEmailNotVerifiedError(err)) {
        setStage('verify');
        return;
      }
      setErrorMessage(apiErrorMessage(err, 'We couldn’t open your studio. Please check your details.'));
    } finally {
      setLoading(false);
    }
  };

  const passwordInput = (mode: 'current-password' | 'new-password', placeholder: string) => (
    <div className="form-group auth-password-field">
      <input
        type={showPassword ? 'text' : 'password'}
        className="input-field"
        placeholder={placeholder}
        aria-label="Password"
        autoComplete={mode}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={mode === 'new-password' ? 8 : undefined}
      />
      <button
        type="button"
        className="auth-password-toggle"
        onClick={() => setShowPassword((s) => !s)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );

  const nameFields = (
    <div className="form-row-2">
      <div className="form-group">
        <input type="text" className="input-field" placeholder="First name" aria-label="First name"
          autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      </div>
      <div className="form-group">
        <input type="text" className="input-field" placeholder="Last name" aria-label="Last name"
          autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
      </div>
    </div>
  );

  const legalNote = (
    <p className="auth-legal-note">
      By creating an account you agree to Aso’s <a href="/terms" target="_blank" rel="noreferrer">Terms</a> and{' '}
      <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
    </p>
  );

  const renderHeader = () => {
    if (stage !== 'form' || forgotMode) {
      const title = stage === 'verify' ? 'Confirm your email' : stage === 'studio' ? 'Open your studio' : 'Reset password';
      return (
        <div className="auth-stage-heading">
          {isDesigner ? <Store size={18} color="#D4AF37" /> : <UserIcon size={18} />}
          <span>{title}</span>
        </div>
      );
    }
    return (
      <div className="tab-buttons">
        <button className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
          onClick={() => { setTab('login'); setErrorMessage(''); }}>
          {isDesigner ? 'Designer sign in' : 'Sign in'}
        </button>
        <button className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
          onClick={() => { setTab('register'); setErrorMessage(''); }}>
          {isDesigner ? 'Join as a designer' : 'Create account'}
        </button>
      </div>
    );
  };

  const renderLogin = () => (
    <form onSubmit={handleLoginSubmit} className="auth-form">
      <div className="auth-title-container">
        <h2 className="auth-serif-title">{isDesigner ? 'Designer sign in' : 'Welcome back'}</h2>
        <p className="auth-subtitle">
          {isDesigner
            ? 'Manage your pieces, orders and earnings.'
            : 'Sign in to check out, track orders and use your saved measurements.'}
        </p>
      </div>

      <div className="form-group">
        <input type="email" className="input-field" placeholder="Email address" aria-label="Email address"
          autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      {passwordInput('current-password', 'Password')}

      <div className="auth-forgot-link-wrapper">
        <a href="#forgot" className="auth-forgot-link"
          onClick={(e) => { e.preventDefault(); setForgotMode(true); setErrorMessage(''); setResetSentMessage(''); }}>
          Forgot password?
        </a>
      </div>

      <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
        {loading ? 'SIGNING IN…' : 'SIGN IN'}
      </button>

      <div className="auth-role-switch-banner">
        {isDesigner ? (
          <button type="button" className="role-switch-btn" onClick={() => switchType('customer')}>
            <UserIcon size={15} />
            <span>Here to shop? Sign in as a shopper</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <button type="button" className="role-switch-btn" onClick={() => switchType('designer')}>
            <Store size={15} color="#D4AF37" />
            <span>Are you a fashion designer? Sign in to your studio</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </form>
  );

  const renderForgot = () => (
    <form onSubmit={handleForgotSubmit} className="auth-form">
      <div className="auth-title-container">
        <h2 className="auth-serif-title">Reset your password</h2>
        <p className="auth-subtitle">Enter the email you signed up with and we’ll send you a link to choose a new password.</p>
      </div>
      {resetSentMessage ? (
        <p className="auth-subtitle" role="status" style={{ color: '#064E3B', fontWeight: 600 }}>{resetSentMessage}</p>
      ) : (
        <>
          <div className="form-group">
            <input type="email" className="input-field" placeholder="Email address" aria-label="Email address"
              value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
            {loading ? 'SENDING…' : 'SEND RESET LINK'}
          </button>
        </>
      )}
      <div className="auth-forgot-link-wrapper" style={{ textAlign: 'center', marginTop: '1rem' }}>
        <a href="#signin" className="auth-forgot-link"
          onClick={(e) => { e.preventDefault(); setForgotMode(false); setErrorMessage(''); }}>
          Back to sign in
        </a>
      </div>
    </form>
  );

  const renderCreateAccount = () => (
    <form onSubmit={handleCreateAccount} className="auth-form">
      <div className="auth-title-container">
        <h2 className="auth-serif-title">{isDesigner ? 'Sell on Aso' : 'Create your account'}</h2>
        <p className="auth-subtitle">
          {isDesigner
            ? 'Opening a studio is free. Aso only earns a commission when you make a sale.'
            : 'Shop Nigerian designers, save your measurements once and track every order.'}
        </p>
        {designerStepLabel && <p className="auth-step-indicator">{designerStepLabel}</p>}
      </div>

      {nameFields}
      <div className="form-group">
        <input type="email" className="input-field" aria-label="Email address" autoComplete="email"
          placeholder={isDesigner ? 'Business email address' : 'Email address'}
          value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="form-group">
        <input type="tel" className="input-field" inputMode="tel" autoComplete="tel"
          aria-label={isDesigner ? 'WhatsApp number' : 'Phone number (optional)'}
          placeholder={isDesigner ? 'WhatsApp number, e.g. 08012345678' : 'Phone number (optional), e.g. 08012345678'}
          value={phone} onChange={(e) => setPhone(e.target.value)} required={isDesigner} />
      </div>
      {passwordInput('new-password', 'Password (at least 8 characters)')}

      <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
        {loading ? 'CREATING ACCOUNT…' : isDesigner ? <><span>CONTINUE</span><ArrowRight size={16} /></> : 'CREATE ACCOUNT'}
      </button>
      {legalNote}

      <div className="auth-role-switch-banner">
        {isDesigner ? (
          <button type="button" className="role-switch-btn" onClick={() => switchType('customer')}>
            <UserIcon size={15} />
            <span>Here to shop? Create a shopper account</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <button type="button" className="role-switch-btn" onClick={() => switchType('designer')}>
            <Store size={15} color="#D4AF37" />
            <span>Are you a fashion designer? Open a studio</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </form>
  );

  const renderVerify = () => (
    <div className="auth-form">
      {designerStepLabel && <p className="auth-step-indicator" style={{ marginBottom: '1rem' }}>{designerStepLabel}</p>}
      <EmailVerifyPanel
        hideTitle
        justSent={codeJustSent}
        reason={isDesigner
          ? 'One quick check before your studio opens, so order and payout emails reach you.'
          : 'This keeps your receipts and order updates going to the right inbox.'}
        onVerified={handleVerified}
        onSkip={isDesigner ? undefined : closeAuthModal}
      />
      {!isDesigner && (
        <p className="auth-legal-note">You can browse and fill your cart now. We’ll ask for the code again at checkout.</p>
      )}
    </div>
  );

  const renderStudio = () => (
    <form onSubmit={handleStudioSubmit} className="auth-form">
      <div className="auth-title-container">
        <h2 className="auth-serif-title">Your studio</h2>
        <p className="auth-subtitle">
          {user && !freshDesignerSignup
            ? `Signed in as ${user.email}. Tell shoppers about your brand. You can change all of this later.`
            : 'Tell shoppers about your brand. You can change all of this later.'}
        </p>
        {designerStepLabel && <p className="auth-step-indicator">{designerStepLabel}</p>}
      </div>

      <div className="form-group">
        <input type="text" className="input-field" placeholder="Brand name" aria-label="Brand name"
          autoComplete="organization" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
      </div>
      <div className="form-group">
        <textarea className="input-field textarea-field" rows={2} aria-label="What you make"
          placeholder="What do you make? e.g. Bespoke agbada and kaftans, ready-to-wear adire"
          value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="form-row-2">
        <div className="form-group">
          <input type="text" className="input-field" placeholder="City" aria-label="City"
            autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} required />
        </div>
        <div className="form-group">
          <select className="input-field" aria-label="State" value={state} onChange={(e) => setState(e.target.value)} required>
            {stateOptions(state).map((st) => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <input type="text" className="input-field" placeholder="Instagram handle (optional), e.g. @yourbrand"
          aria-label="Instagram handle" value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} />
      </div>
      <div className="form-group">
        <input type="text" className="input-field" placeholder="Workshop address (where riders collect orders)"
          aria-label="Workshop address" autoComplete="street-address"
          value={workshopAddress} onChange={(e) => setWorkshopAddress(e.target.value)} />
      </div>

      <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
        {loading ? 'OPENING YOUR STUDIO…' : 'OPEN MY STUDIO'}
      </button>
    </form>
  );

  const renderBody = () => {
    if (stage === 'verify') return renderVerify();
    if (stage === 'studio') return renderStudio();
    if (tab === 'login') return forgotMode ? renderForgot() : renderLogin();
    return renderCreateAccount();
  };

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div
        className={`modal-card auth-modal-card ${isDesigner ? 'designer-mode-card' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isDesigner ? 'Designer sign in or sign up' : 'Sign in or create an account'}
      >
        {isDesigner && (
          <div className="designer-portal-badge-bar">
            <div className="designer-badge-content">
              <Sparkles size={16} color="#D4AF37" />
              <span>DESIGNER STUDIO</span>
            </div>
          </div>
        )}

        <div className="auth-header-tabs">
          {renderHeader()}
          <button className="auth-close-btn" onClick={closeAuthModal} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="auth-modal-content">
          {errorMessage && (
            <div className="auth-error-alert" role="alert">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}
          {renderBody()}
        </div>
      </div>
    </div>
  );
};
