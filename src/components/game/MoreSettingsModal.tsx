import React, { useState } from 'react';
import { X, ChevronRight, Mail, Share2, Youtube, FileText, Shield, Info, Settings } from 'lucide-react';
import { getAppVersion } from '@/lib/playerResources';

// Page components
import TermsOfServicePage from '@/pages/legal/TermsOfService';
import PrivacyPolicyPage from '@/pages/legal/PrivacyPolicy';
import AboutPage from '@/pages/legal/About';
import ContactPage from '@/pages/legal/Contact';
import PrivacyPreferencePage from '@/pages/legal/PrivacyPreference';

interface MoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActivePage = 'menu' | 'terms' | 'privacy' | 'about' | 'contact' | 'privacy-preference';

const MoreSettingsModal: React.FC<MoreSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activePage, setActivePage] = useState<ActivePage>('menu');

  if (!isOpen) return null;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Block Puzzle Game',
          text: 'Try this puzzle game! Can you beat my best score?',
          url: window.location.origin,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `Try this puzzle game! Can you beat my best score? ${window.location.origin}`
        );
        alert('Link copied to clipboard!');
      }
    } catch (e) {
      console.log('Share cancelled or failed:', e);
    }
  };

  const handleBack = () => {
    setActivePage('menu');
  };

  const handleClose = () => {
    setActivePage('menu');
    onClose();
  };

  // Render active page content
  if (activePage !== 'menu') {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
        
        <div 
          className="relative w-[340px] max-h-[80vh] rounded-3xl overflow-hidden animate-scale-in flex flex-col"
          style={{
            background: 'linear-gradient(180deg, #1e3a5f 0%, #0f2744 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {activePage === 'terms' && <TermsOfServicePage onBack={handleBack} />}
          {activePage === 'privacy' && <PrivacyPolicyPage onBack={handleBack} />}
          {activePage === 'about' && <AboutPage onBack={handleBack} />}
          {activePage === 'contact' && <ContactPage onBack={handleBack} />}
          {activePage === 'privacy-preference' && <PrivacyPreferencePage onBack={handleBack} />}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-[320px] rounded-3xl overflow-hidden animate-scale-in"
        style={{
          background: 'linear-gradient(180deg, #1e3a5f 0%, #0f2744 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-xl font-bold text-white">More Settings</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
        
        {/* App Info */}
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            }}
          >
            <span className="text-2xl">🧩</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white">Block Puzzle</h3>
            <p className="text-sm text-white/50">Version: {getAppVersion()}</p>
          </div>
        </div>
        
        {/* Menu Items */}
        <div className="px-4 pb-5 space-y-1">
          <MenuItem
            icon={<Mail className="w-5 h-5" />}
            label="Contact Us"
            onClick={() => setActivePage('contact')}
          />
          
          <MenuItem
            icon={<Share2 className="w-5 h-5" />}
            label="Share With Friends"
            onClick={handleShare}
          />
          
          <MenuItem
            icon={<Youtube className="w-5 h-5" />}
            label="Event"
            onClick={() => {}}
            disabled
          />
          
          <div className="h-px bg-white/10 my-2" />
          
          <MenuItem
            icon={<FileText className="w-5 h-5" />}
            label="Terms of Service"
            onClick={() => setActivePage('terms')}
          />
          
          <MenuItem
            icon={<Shield className="w-5 h-5" />}
            label="Privacy Policy"
            onClick={() => setActivePage('privacy')}
          />
          
          <MenuItem
            icon={<Info className="w-5 h-5" />}
            label="About Us"
            onClick={() => setActivePage('about')}
          />
          
          <MenuItem
            icon={<Settings className="w-5 h-5" />}
            label="Privacy Preference"
            onClick={() => setActivePage('privacy-preference')}
          />
        </div>
      </div>
    </div>
  );
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center justify-between p-3 rounded-xl
        transition-colors
        ${disabled 
          ? 'opacity-40 cursor-not-allowed bg-white/5' 
          : 'bg-white/5 hover:bg-white/10 active:bg-white/15'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className="text-white/60">{icon}</div>
        <span className="font-medium text-white">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-white/40" />
    </button>
  );
};

export default MoreSettingsModal;
