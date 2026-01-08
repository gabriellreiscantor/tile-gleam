import React from 'react';
import { cn } from '@/lib/utils';
import type { ContinueEligibility } from '@/lib/playerResources';

interface ContinueModalProps {
  isOpen: boolean;
  score: number;
  eligibility: ContinueEligibility;
  onContinuePaid: () => void;
  onContinueAd: () => void;
  onDecline: () => void;
}

const ContinueModal: React.FC<ContinueModalProps> = ({
  isOpen,
  score,
  eligibility,
  onContinuePaid,
  onContinueAd,
  onDecline,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative z-10 w-[90%] max-w-sm mx-auto">
        <div className="continue-modal rounded-3xl p-6 text-center">
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white mb-1">Continue?</h2>
            <p className="text-muted-foreground text-sm">
              {eligibility.reason}
            </p>
          </div>
          
          {/* Score */}
          <div className="mb-6">
            <div className="text-5xl font-bold score-gradient mb-1">
              {score.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              pontos
            </div>
          </div>
          
          {/* Buttons */}
          <div className="space-y-3">
            {/* Paid Continue */}
            {eligibility.hasPaidContinue && (
              <button
                onClick={onContinuePaid}
                className={cn(
                  "w-full py-4 px-6 rounded-2xl font-bold text-lg",
                  "bg-gradient-to-r from-green-500 to-emerald-500",
                  "text-white shadow-lg shadow-green-500/30",
                  "active:scale-[0.98] transition-transform"
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">🔁</span>
                  <span>Continuar</span>
                </div>
              </button>
            )}
            
            {/* Ad Continue */}
            {eligibility.canWatchAd && (
              <button
                onClick={onContinueAd}
                className={cn(
                  "w-full py-4 px-6 rounded-2xl font-bold text-lg",
                  "bg-gradient-to-r from-amber-500 to-orange-500",
                  "text-white shadow-lg shadow-amber-500/30",
                  "active:scale-[0.98] transition-transform"
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">🎬</span>
                  <span>Assistir Anúncio</span>
                </div>
              </button>
            )}
            
            {/* Decline */}
            <button
              onClick={onDecline}
              className={cn(
                "w-full py-3 px-6 rounded-2xl font-medium",
                "bg-white/10 text-white/70",
                "active:scale-[0.98] transition-transform"
              )}
            >
              Não, encerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContinueModal;
