import React from 'react';
import { cn } from '@/lib/utils';
import { X, Volume2, VolumeX, Music, Music2, RotateCcw, Shield, FileText } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onRestorePurchases: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  musicEnabled,
  onToggleSound,
  onToggleMusic,
  onRestorePurchases,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-[320px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
              soundEnabled 
                ? "bg-emerald-500/20 border border-emerald-500/30" 
                : "bg-white/5 border border-white/10"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              soundEnabled ? "bg-emerald-500" : "bg-white/10"
            )}>
              {soundEnabled ? (
                <Volume2 className="w-6 h-6 text-white" />
              ) : (
                <VolumeX className="w-6 h-6 text-white/50" />
              )}
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-white">Sound Effects</div>
              <div className="text-sm text-white/50">{soundEnabled ? 'On' : 'Off'}</div>
            </div>
            <div className={cn(
              "w-12 h-7 rounded-full transition-colors relative",
              soundEnabled ? "bg-emerald-500" : "bg-white/20"
            )}>
              <div className={cn(
                "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform",
                soundEnabled ? "translate-x-6" : "translate-x-1"
              )} />
            </div>
          </button>
          
          {/* Music Toggle */}
          <button
            onClick={onToggleMusic}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
              musicEnabled 
                ? "bg-purple-500/20 border border-purple-500/30" 
                : "bg-white/5 border border-white/10"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              musicEnabled ? "bg-purple-500" : "bg-white/10"
            )}>
              {musicEnabled ? (
                <Music className="w-6 h-6 text-white" />
              ) : (
                <Music2 className="w-6 h-6 text-white/50" />
              )}
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-white">Music</div>
              <div className="text-sm text-white/50">{musicEnabled ? 'On' : 'Off'}</div>
            </div>
            <div className={cn(
              "w-12 h-7 rounded-full transition-colors relative",
              musicEnabled ? "bg-purple-500" : "bg-white/20"
            )}>
              <div className={cn(
                "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform",
                musicEnabled ? "translate-x-6" : "translate-x-1"
              )} />
            </div>
          </button>
          
          {/* Divider */}
          <div className="h-px bg-white/10 my-2" />
          
          {/* Restore Purchases */}
          <button
            onClick={onRestorePurchases}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-white">Restore Purchases</div>
              <div className="text-sm text-white/50">Recover your items</div>
            </div>
          </button>
          
          {/* Links */}
          <div className="flex gap-2 pt-2">
            <a
              href="#privacy"
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <Shield className="w-4 h-4 text-white/50" />
              <span className="text-sm text-white/70">Privacy</span>
            </a>
            <a
              href="#terms"
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <FileText className="w-4 h-4 text-white/50" />
              <span className="text-sm text-white/70">Terms</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
