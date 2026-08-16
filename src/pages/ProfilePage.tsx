import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { addressApi } from '../api/client';
import type { Address } from '../types';
import {
  User as UserIcon, MapPin, Plus, Trash2, CheckCircle, Star,
  Phone, Mail, AlertCircle, Loader
} from 'lucide-react';
import './ProfilePage.css';

const BLANK_ADDRESS: Omit<Address, 'id' | 'created_at'> = {
  full_name: '',
  phone_number: '',
  street_address: '',
  city: '',
  state: '',
  landmark: '',
  is_default: false,
};

export const ProfilePage: React.FC = () => {
  const { user, addresses, fetchAddresses, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [formData, setFormData] = useState({ ...BLANK_ADDRESS });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="profile-gate">
        <UserIcon size={48} color="#D1D5DB" />
        <h2>Sign in to view your profile</h2>
        <button className="profile-signin-btn" onClick={() => openAuthModal('login')}>Sign In</button>
      </div>
    );
  }

  const handleFormChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.street_address.trim() || !formData.city.trim() || !formData.state.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      await addressApi.createAddress(formData);
      await fetchAddresses();
      setShowAddressForm(false);
      setFormData({ ...BLANK_ADDRESS });
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to save address.';
      setFormError(String(msg));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Delete this address?')) return;
    setDeletingId(id);
    try {
      await addressApi.deleteAddress(id);
      await fetchAddresses();
    } catch (err) {
      console.error('Failed to delete address', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <h1 className="profile-page-title">My Profile</h1>
      </div>

      <div className="profile-layout">
        {/* Left: User Details Card */}
        <div className="profile-user-card">
          <div className="profile-avatar-ring">
            <div className="profile-avatar-circle">
              {user.first_name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>

          <div className="profile-user-info">
            <h2 className="profile-user-name">{user.first_name} {user.last_name}</h2>
            {user.vendor_profile && (
              <span className="profile-vendor-badge">
                <Star size={13} /> Verified Designer
              </span>
            )}
          </div>

          <div className="profile-detail-list">
            <div className="profile-detail-row">
              <Mail size={16} />
              <div>
                <p className="profile-detail-label">Email Address</p>
                <p className="profile-detail-value">{user.email}</p>
              </div>
            </div>
            <div className="profile-detail-row">
              <Phone size={16} />
              <div>
                <p className="profile-detail-label">Phone Number</p>
                <p className="profile-detail-value">{user.phone_number || 'Not set'}</p>
              </div>
            </div>
          </div>

          {user.vendor_profile && (
            <button
              className="profile-dashboard-btn"
              onClick={() => navigate('/vendor/dashboard')}
            >
              Go to Vendor Dashboard
            </button>
          )}
        </div>

        {/* Right: Address Book */}
        <div className="profile-addresses-section">
          <div className="profile-section-header">
            <h2 className="profile-section-title">
              <MapPin size={18} /> Saved Addresses
            </h2>
            {!showAddressForm && (
              <button
                className="profile-add-address-btn"
                onClick={() => setShowAddressForm(true)}
              >
                <Plus size={16} /> Add Address
              </button>
            )}
          </div>

          {/* Add Address Form */}
          {showAddressForm && (
            <div className="profile-address-form-card">
              <h3 className="profile-form-title">New Delivery Address</h3>
              {formError && (
                <div className="profile-form-error">
                  <AlertCircle size={15} /> {formError}
                </div>
              )}
              <form onSubmit={handleAddressSubmit}>
                <div className="profile-form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      className="input-field"
                      value={formData.full_name}
                      onChange={e => handleFormChange('full_name', e.target.value)}
                      placeholder="Recipient full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      className="input-field"
                      value={formData.phone_number}
                      onChange={e => handleFormChange('phone_number', e.target.value)}
                      placeholder="e.g. 08012345678"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Street Address *</label>
                  <input
                    className="input-field"
                    value={formData.street_address}
                    onChange={e => handleFormChange('street_address', e.target.value)}
                    placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
                    required
                  />
                </div>

                <div className="profile-form-row">
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      className="input-field"
                      value={formData.city}
                      onChange={e => handleFormChange('city', e.target.value)}
                      placeholder="e.g. Lagos"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input
                      className="input-field"
                      value={formData.state}
                      onChange={e => handleFormChange('state', e.target.value)}
                      placeholder="e.g. Lagos State"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Landmark (Optional)</label>
                  <input
                    className="input-field"
                    value={formData.landmark}
                    onChange={e => handleFormChange('landmark', e.target.value)}
                    placeholder="e.g. Near Shoprite"
                  />
                </div>

                <div className="profile-form-checkbox">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={e => handleFormChange('is_default', e.target.checked)}
                  />
                  <label htmlFor="is_default">Set as default address</label>
                </div>

                <div className="profile-form-actions">
                  <button
                    type="button"
                    className="profile-form-cancel-btn"
                    onClick={() => { setShowAddressForm(false); setFormError(''); setFormData({ ...BLANK_ADDRESS }); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="profile-form-save-btn"
                    disabled={formLoading}
                  >
                    {formLoading ? <><Loader size={15} className="profile-spinner" /> Saving...</> : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Address Cards */}
          {addresses.length === 0 && !showAddressForm ? (
            <div className="profile-no-addresses">
              <MapPin size={40} color="#D1D5DB" />
              <p>No saved addresses yet.</p>
              <button className="profile-add-address-btn" onClick={() => setShowAddressForm(true)}>
                <Plus size={15} /> Add your first address
              </button>
            </div>
          ) : (
            <div className="profile-address-grid">
              {addresses.map((addr) => (
                <div key={addr.id} className={`profile-address-card ${addr.is_default ? 'default-address' : ''}`}>
                  {addr.is_default && (
                    <span className="profile-default-badge">
                      <CheckCircle size={13} /> Default
                    </span>
                  )}
                  <p className="address-card-name">{addr.full_name}</p>
                  <p className="address-card-detail">{addr.street_address}</p>
                  {addr.landmark && <p className="address-card-detail">{addr.landmark}</p>}
                  <p className="address-card-detail">{addr.city}, {addr.state}</p>
                  {addr.phone_number && <p className="address-card-phone">{addr.phone_number}</p>}

                  <div className="address-card-actions">
                    <button
                      className="address-delete-btn"
                      onClick={() => handleDeleteAddress(addr.id)}
                      disabled={deletingId === addr.id}
                    >
                      {deletingId === addr.id
                        ? <Loader size={13} className="profile-spinner" />
                        : <Trash2 size={13} />}
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
