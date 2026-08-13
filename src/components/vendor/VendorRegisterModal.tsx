import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { vendorApi } from '../../api/client';
import { X, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import './VendorRegisterModal.css';

interface VendorRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VendorRegisterModal: React.FC<VendorRegisterModalProps> = ({ isOpen, onClose }) => {
  const { refreshMe } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);

  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Lagos');
  const [state, setState] = useState('Lagos');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [workshopAddress, setWorkshopAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [ninNumber, setNinNumber] = useState('');
  const [cacNumber, setCacNumber] = useState('');

  const [accountName] = useState('');
  const [accountNumber] = useState('');
  const [bankName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      await vendorApi.registerVendor({
        store_name: storeName,
        description,
        city,
        state,
        instagram_handle: instagramHandle,
        workshop_address: workshopAddress,
        landmark,
        nin_number: ninNumber || undefined,
        cac_number: cacNumber || undefined,
        account_name: accountName || undefined,
        account_number: accountNumber || undefined,
        bank_name: bankName || undefined,
      });

      await refreshMe();
      onClose();
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
        setErrorMessage('Failed to submit application. Please verify your information.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card vendor-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="vendor-modal-header">
          <div className="header-brand-badge">
            <Sparkles size={18} className="text-gold" />
            <span>DESIGNER ONBOARDING</span>
          </div>
          <button className="auth-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="vendor-modal-body">
          <div className="vendor-title-wrapper">
            <h2 className="auth-serif-title">Register your Designer Storefront</h2>
            <p className="auth-subtitle">
              Join Nigeria's leading luxury fashion marketplace. Showcase your collection to thousands of buyers.
            </p>
          </div>

          {errorMessage && (
            <div className="auth-error-alert">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <div className="step-content">
                <div className="form-group">
                  <label className="form-label">STORE / BRAND NAME *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Lagos Luxe Native"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">BRAND DESCRIPTION</label>
                  <textarea
                    className="input-field textarea-field"
                    placeholder="Tell buyers about your tailoring expertise, fabrics, and signature collections..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">CITY *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Lagos"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">STATE *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Lagos"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">INSTAGRAM HANDLE</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="@yourbrand"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="btn-primary auth-submit-btn"
                  onClick={() => {
                    if (!storeName.trim()) {
                      setErrorMessage('Store Name is required.');
                      return;
                    }
                    setErrorMessage('');
                    setStep(2);
                  }}
                >
                  <span>NEXT: LOGISTICS & VERIFICATION</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="step-content">
                <div className="form-group">
                  <label className="form-label">WORKSHOP / PICKUP ADDRESS</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Street address where orders will be picked up by logistics dispatch"
                    value={workshopAddress}
                    onChange={(e) => setWorkshopAddress(e.target.value)}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">LANDMARK</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Nearby landmark (e.g. Ikeja City Mall)"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">NIN NUMBER (OPTIONAL)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="11-digit NIN for fast-track verification"
                      maxLength={11}
                      value={ninNumber}
                      onChange={(e) => setNinNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">CAC REGISTRATION (OPTIONAL)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="CAC RC Number (e.g. RC-123456)"
                    value={cacNumber}
                    onChange={(e) => setCacNumber(e.target.value)}
                  />
                </div>

                <div className="step-actions-row">
                  <button
                    type="button"
                    className="btn-secondary-light"
                    onClick={() => setStep(1)}
                  >
                    BACK
                  </button>
                  <button type="submit" className="btn-primary btn-flex-1" disabled={loading}>
                    {loading ? 'SUBMITTING APPLICATION...' : 'SUBMIT APPLICATION'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
