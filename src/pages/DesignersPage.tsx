import React, { useState, useEffect } from 'react';
import { vendorApi } from '../api/client';
import type { PublicVendorProfile } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';
import { MobileDesignersView } from '../components/designers/MobileDesignersView';
import { DesktopDesignersView } from '../components/designers/DesktopDesignersView';

interface DesignersPageProps {
  onOpenVendorRegister?: () => void;
}

export const DesignersPage: React.FC<DesignersPageProps> = ({ onOpenVendorRegister }) => {
  const [vendors, setVendors] = useState<PublicVendorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile(768);

  useEffect(() => {
    const fetchDesigners = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await vendorApi.getVendors();
        setVendors(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load designers:', err);
        setError('Unable to load designers at this moment.');
      } finally {
        setLoading(false);
      }
    };

    fetchDesigners();
  }, []);

  if (isMobile) {
    return (
      <MobileDesignersView
        vendors={vendors}
        loading={loading}
        error={error}
        onOpenVendorRegister={onOpenVendorRegister}
      />
    );
  }

  return (
    <DesktopDesignersView
      vendors={vendors}
      loading={loading}
      error={error}
      onOpenVendorRegister={onOpenVendorRegister}
    />
  );
};

export default DesignersPage;
