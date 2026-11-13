import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authApi, apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

/** Landing page for the link in the "Reset your Aso password" email. */
export const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const { openAuthModal } = useAuth();
  const uid = params.get('uid') || '';
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Your new password must be at least 8 characters.');
    if (password !== confirm) return setError('The two passwords don’t match.');
    setLoading(true);
    try {
      await authApi.confirmPasswordReset({ uid, token, new_password: password });
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'We couldn’t change your password. Please request a new link.'));
    } finally {
      setLoading(false);
    }
  };

  const card: React.CSSProperties = {
    maxWidth: 420, margin: '3rem auto', padding: '2rem 1.5rem', background: '#FFFFFF',
    border: '1px solid #E5E7EB', borderRadius: 12, boxSizing: 'border-box',
  };

  return (
    <main style={{ padding: '0 16px', minHeight: '60vh' }}>
      <div style={card}>
        <h1 style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: '1.6rem', margin: '0 0 0.5rem', color: '#111827' }}>
          Choose a new password
        </h1>
        {!uid || !token ? (
          <p style={{ color: '#4B5563' }}>
            This link is incomplete. Open the link from your email again, or request a new one from the sign-in screen.
          </p>
        ) : done ? (
          <>
            <p style={{ color: '#064E3B', fontWeight: 600 }}>Your password has been changed.</p>
            <button type="button" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => openAuthModal('login')}>
              SIGN IN
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <p style={{ color: '#4B5563', margin: '0 0 1.25rem' }}>At least 8 characters. Avoid one you use on other sites.</p>
            {error && <p role="alert" style={{ color: '#B91C1C', fontWeight: 600, margin: '0 0 1rem' }}>{error}</p>}
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <input type="password" className="input-field" placeholder="New password" autoComplete="new-password"
                value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <input type="password" className="input-field" placeholder="Type it again" autoComplete="new-password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} required style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'SAVING…' : 'SAVE NEW PASSWORD'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
};
