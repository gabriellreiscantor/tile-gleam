import React, { useState, useEffect } from 'react';
import { ArrowLeft, Target, BarChart3 } from 'lucide-react';
import { loadSettings, saveSettings, type GameSettings } from '@/lib/settings';
import { cn } from '@/lib/utils';

interface PrivacyPreferencePageProps {
  onBack: () => void;
}

const PrivacyPreferencePage: React.FC<PrivacyPreferencePageProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<GameSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const togglePersonalizedAds = () => {
    setSettings(prev => ({ ...prev, personalizedAds: !prev.personalizedAds }));
  };

  const toggleAnalytics = () => {
    setSettings(prev => ({ ...prev, analyticsEnabled: !prev.analyticsEnabled }));
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>
        <h2 className="text-lg font-bold text-white">Privacy Preference</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <p className="text-white/60 text-sm mb-2">
          Control how your data is used within the app. Changes take effect immediately.
        </p>

        {/* Personalized Ads */}
        <div 
          className={cn(
            "p-4 rounded-2xl transition-all",
            settings.personalizedAds 
              ? "bg-emerald-500/10 border border-emerald-500/30" 
              : "bg-white/5 border border-white/10"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className={cn(
                  "w-5 h-5",
                  settings.personalizedAds ? "text-emerald-400" : "text-white/50"
                )} />
                <span className="font-semibold text-white">Personalized Ads</span>
              </div>
              <p className="text-white/50 text-sm">
                When enabled, ads are tailored to your interests based on device data. 
                Disabling shows generic ads instead.
              </p>
            </div>
            <button
              onClick={togglePersonalizedAds}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative flex-shrink-0 mt-1",
                settings.personalizedAds ? "bg-emerald-500" : "bg-white/20"
              )}
            >
              <div 
                className={cn(
                  "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform",
                  settings.personalizedAds ? "translate-x-6" : "translate-x-1"
                )} 
              />
            </button>
          </div>
        </div>

        {/* Analytics */}
        <div 
          className={cn(
            "p-4 rounded-2xl transition-all",
            settings.analyticsEnabled 
              ? "bg-purple-500/10 border border-purple-500/30" 
              : "bg-white/5 border border-white/10"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className={cn(
                  "w-5 h-5",
                  settings.analyticsEnabled ? "text-purple-400" : "text-white/50"
                )} />
                <span className="font-semibold text-white">Analytics</span>
              </div>
              <p className="text-white/50 text-sm">
                Help us improve the game by sharing anonymous usage data. 
                No personal information is collected.
              </p>
            </div>
            <button
              onClick={toggleAnalytics}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative flex-shrink-0 mt-1",
                settings.analyticsEnabled ? "bg-purple-500" : "bg-white/20"
              )}
            >
              <div 
                className={cn(
                  "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform",
                  settings.analyticsEnabled ? "translate-x-6" : "translate-x-1"
                )} 
              />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mt-4">
          <p className="text-blue-300 text-sm">
            Your choices are saved locally and respected immediately. You can change these settings at any time.
          </p>
        </div>

        <div className="h-4" />
      </div>
    </>
  );
};

export default PrivacyPreferencePage;
