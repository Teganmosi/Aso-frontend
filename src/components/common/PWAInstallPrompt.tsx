import React, { useEffect, useState } from 'react';
import { Download, X, Share2, PlusSquare, Check } from 'lucide-react';
import './PWAInstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalledSuccess, setIsInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(checkStandalone);
    if (checkStandalone) return;

    // 2. Check if dismissed recently (24 hours cooldown)
    const dismissedTimestamp = localStorage.getItem('aso_pwa_dismissed');
    if (dismissedTimestamp) {
      const hoursSinceDismiss = (Date.now() - parseInt(dismissedTimestamp, 10)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) return;
    }

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
    if (isIOSDevice && isSafari) {
      setIsIOS(true);
      // Reveal prompt after 3.5 seconds on iOS
      const timer = setTimeout(() => setShowPrompt(true), 3500);
      return () => clearTimeout(timer);
    }

    // 4. Listen for Chrome / Android beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Reveal banner after 2.5 seconds
      setTimeout(() => setShowPrompt(true), 2500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setIsInstalledSuccess(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      setTimeout(() => setIsInstalledSuccess(false), 4000);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.error('Error triggering PWA install:', err);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem('aso_pwa_dismissed', Date.now().toString());
  };

  if (isStandalone || (!showPrompt && !showIOSGuide && !isInstalledSuccess)) {
    return null;
  }

  return (
    <>
      {/* Toast confirmation when successfully installed */}
      {isInstalledSuccess && (
        <div className="aso-pwa-success-toast">
          <Check size={18} color="#004B44" />
          <span>Aso App installed successfully to your Home Screen!</span>
        </div>
      )}

      {/* Main Floating Banner */}
      {showPrompt && !showIOSGuide && (
        <div className="aso-pwa-banner-card animate-slide-up">
          <div className="pwa-banner-content">
            <div className="pwa-logo-wrapper">
              <img src="/aso-logo-option2-profile.svg" alt="Aso Logo" className="pwa-app-icon" />
            </div>
            <div className="pwa-text-group">
              <div className="pwa-title-row">
                <span className="pwa-app-name">Install Aso App</span>
                <span className="pwa-tag-pill">PWA</span>
              </div>
              <p className="pwa-description">
                Fast, offline-ready Nigerian luxury fashion at your fingertips.
              </p>
            </div>
          </div>

          <div className="pwa-action-group">
            <button type="button" onClick={handleDismiss} className="pwa-btn-dismiss" title="Dismiss">
              <X size={16} />
            </button>
            <button type="button" onClick={handleInstallClick} className="pwa-btn-install">
              <Download size={14} />
              <span>Install</span>
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Step-by-Step Modal */}
      {showIOSGuide && (
        <div className="aso-pwa-modal-overlay" onClick={handleDismiss}>
          <div className="aso-pwa-modal-body animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="pwa-modal-header">
              <div className="pwa-logo-wrapper-lg">
                <img src="/aso-logo-option2-profile.svg" alt="Aso App" />
              </div>
              <div>
                <h3 className="pwa-modal-title">Install Aso on iPhone / iPad</h3>
                <p className="pwa-modal-subtitle">Add to your Home Screen for instant standalone access</p>
              </div>
              <button type="button" onClick={handleDismiss} className="pwa-modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="pwa-steps-list">
              <div className="pwa-step-item">
                <div className="pwa-step-number">1</div>
                <div className="pwa-step-text">
                  Tap the <Share2 size={16} className="inline-icon" /> <strong>Share</strong> icon in your Safari browser bar below.
                </div>
              </div>
              <div className="pwa-step-item">
                <div className="pwa-step-number">2</div>
                <div className="pwa-step-text">
                  Scroll down and tap <PlusSquare size={16} className="inline-icon" /> <strong>Add to Home Screen</strong>.
                </div>
              </div>
              <div className="pwa-step-item">
                <div className="pwa-step-number">3</div>
                <div className="pwa-step-text">
                  Tap <strong>Add</strong> in the top-right corner to enjoy full-screen Aso app experience!
                </div>
              </div>
            </div>

            <button type="button" onClick={handleDismiss} className="pwa-btn-understood">
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
