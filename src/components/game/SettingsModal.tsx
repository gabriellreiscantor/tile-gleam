import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, Volume2, VolumeX, Music, Music2, Smartphone, Play, Gamepad2, Settings2 } from 'lucide-react';
import MoreSettingsModal from './MoreSettingsModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onToggleVibration: () => void;
  onReplay: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  musicEnabled,
  vibrationEnabled,
  onToggleSound,
  onToggleMusic,
  onToggleVibration,
  onReplay,
}) => {
  const [showMoreSettings, setShowMoreSettings] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
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
            <h2 className="text-xl font-bold text-white">Settings</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
          
          {/* Content */}
          <div className="px-4 pb-5 space-y-2">
            {/* Sound Toggle */}
            <SettingsRow
              icon={soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              label="Sound"
              isToggle
              isEnabled={soundEnabled}
              onToggle={onToggleSound}
            />
            
            {/* BGM Toggle */}
            <SettingsRow
              icon={musicEnabled ? <Music className="w-5 h-5" /> : <Music2 className="w-5 h-5" />}
              label="BGM"
              isToggle
              isEnabled={musicEnabled}
              onToggle={onToggleMusic}
            />
            
            {/* Vibration Toggle */}
            <SettingsRow
              icon={<Smartphone className="w-5 h-5" />}
              label="Vibration"
              isToggle
              isEnabled={vibrationEnabled}
              onToggle={onToggleVibration}
            />
            
            {/* Replay Button */}
            <SettingsRow
              icon={<Play className="w-5 h-5" />}
              label="Replay"
              buttonLabel="Play"
              onButtonClick={onReplay}
            />
            
            {/* More Games - Disabled */}
            <SettingsRow
              icon={<Gamepad2 className="w-5 h-5" />}
              label="More Games"
              buttonLabel="Start"
              disabled
              comingSoon
            />
            
            {/* More Settings */}
            <SettingsRow
              icon={<Settings2 className="w-5 h-5" />}
              label="More Settings"
              buttonLabel="Set"
              onButtonClick={() => setShowMoreSettings(true)}
            />
          </div>
        </div>
      </div>

      {/* More Settings Modal */}
      <MoreSettingsModal
        isOpen={showMoreSettings}
        onClose={() => setShowMoreSettings(false)}
      />
    </>
  );
};

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  isToggle?: boolean;
  isEnabled?: boolean;
  onToggle?: () => void;
  buttonLabel?: string;
  onButtonClick?: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  label,
  isToggle,
  isEnabled,
  onToggle,
  buttonLabel,
  onButtonClick,
  disabled,
  comingSoon,
}) => {
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 rounded-2xl",
        "bg-white/5 border border-white/10",
        disabled && "opacity-50"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/70">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-white">{label}</span>
          {comingSoon && (
            <span className="text-[10px] text-amber-400">Coming Soon</span>
          )}
        </div>
      </div>

      {isToggle && (
        <button
          onClick={onToggle}
          disabled={disabled}
          className={cn(
            "w-12 h-7 rounded-full transition-colors relative",
            isEnabled ? "bg-emerald-500" : "bg-white/20"
          )}
        >
          <div 
            className={cn(
              "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform",
              isEnabled ? "translate-x-6" : "translate-x-1"
            )} 
          />
        </button>
      )}

      {buttonLabel && (
        <button
          onClick={onButtonClick}
          disabled={disabled}
          className={cn(
            "px-4 py-2 rounded-xl font-semibold text-sm transition-all",
            disabled
              ? "bg-white/10 text-white/30 cursor-not-allowed"
              : "bg-emerald-500 text-white active:scale-95"
          )}
          style={{
            boxShadow: disabled ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.4)',
          }}
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
};

export default SettingsModal;
