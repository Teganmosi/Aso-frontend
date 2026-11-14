import React, { useEffect, useState } from 'react';
import { MailCheck } from 'lucide-react';
import { authApi, apiErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { User } from '../../types';
import './EmailVerifyPanel.css';

interface EmailVerifyPanelProps {
  /** Called once the code is accepted, with the refreshed user. */
  onVerified?: (user: User) => void;
  /** Shown under the heading, e.g. why we need it right now. */
  reason?: string;
  /** Renders a "Do this later" link (sign-up modal only). */
  onSkip?: () => void;
  /** Set when the code email was just sent, so "Send a new code" starts on its cooldown. */
  justSent?: boolean;
  compact?: boolean;
  /** Hide the "Confirm your email" heading when the container already shows it (sign-up modal). */
  hideTitle?: boolean;
}

/**
 * The 6-digit email code box. The server emails the code at sign-up; this lets the
 * person type it, or ask for a new one (at most once a minute).
 */
export const EmailVerifyPanel: React.FC<EmailVerifyPanelProps> = ({
  onVerified, reason, onSkip, justSent = false, compact = false, hideTitle = false,
}) => {
  const { user, refreshMe } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(justSent ? 60 : 0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      setError('Enter the 6 digits from the email.');
      return;
    }
    setLoading(true);
    setError('');
    setNotice('');
    try {
      await authApi.verifyEmail(digits);
      const fresh = await refreshMe();
      if (fresh) onVerified?.(fresh);
    } catch (err) {
      setError(apiErrorMessage(err, 'That code didn’t work. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError('');
    setNotice('');
    try {
      const res = await authApi.resendVerification();
      setNotice(res.message || 'We sent a new code.');
      setCode('');
      setCooldown(res.retry_after || 60);
    } catch (err: any) {
      const wait = err?.response?.data?.retry_after;
      if (wait) setCooldown(wait);
      setError(apiErrorMessage(err, 'We couldn’t send a new code. Please try again in a minute.'));
    }
  };

  return (
    <form className={`email-verify-panel ${compact ? 'compact' : ''}`} onSubmit={submit} noValidate>
      <div className="evp-head">
        <MailCheck size={compact ? 20 : 26} color="#064E3B" aria-hidden="true" style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          {!hideTitle && <h3 className="evp-title">Confirm your email</h3>}
          <p className="evp-text">
            {reason ? `${reason} ` : ''}We sent a 6-digit code to <strong>{user?.email}</strong>.
            Check your spam folder if it isn’t in your inbox.
          </p>
        </div>
      </div>

      <label className="evp-label" htmlFor="evp-code">6-digit code</label>
      <div className="evp-row">
        <input
          id="evp-code"
          className="input-field evp-input"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]*"
          maxLength={7}
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ''))}
          autoFocus={!compact}
        />
        <button type="submit" className="btn-primary evp-submit" disabled={loading}>
          {loading ? 'CHECKING…' : 'CONFIRM'}
        </button>
      </div>

      {error && <p className="evp-error" role="alert">{error}</p>}
      {notice && !error && <p className="evp-notice" role="status">{notice}</p>}

      <div className="evp-links">
        <button type="button" className="evp-link" onClick={resend} disabled={cooldown > 0}>
          {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
        </button>
        {onSkip && (
          <button type="button" className="evp-link muted" onClick={onSkip}>
            Do this later
          </button>
        )}
      </div>
    </form>
  );
};
