import React from 'react';
import { cn } from '@/lib/utils';
import type { ContinueEligibility } from '@/lib/playerResources';

interface ContinueModalProps {
  isOpen: boolean;
  score: number;
  eligibility: ContinueEligibility;
  onContinueFree: () => void;
  onContinuePaid: () => void;
  onContinueAd: () => void;
  onDecline: () => void;
}

const ContinueModal: React.FC<ContinueModalProps> = ({
  isOpen,
  score,
  eligibility,
  onContinueFree,
  onContinuePaid,
  onContinueAd,
  onDecline,
}) => {
  if (!isOpen) return null;

  const { state, hasPaidContinue, canWatchAd } = eligibility;

  // Determine title and subtitle based on state
  const getTitle = () => {
    if (state === 'paid-only' && !canWatchAd) return 'Final Chance!';
    return 'Continue?';
  };

  const getSubtitle = () => {
    if (state === 'free') return "You're almost there!";
    if (state === 'paid-only' && !canWatchAd) return 'Save this run';
    return "Don't lose your progress!";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-[340px]">
        <div 
          className="rounded-[28px] p-6 text-center overflow-hidden"
          style={{
            background: 'linear-gradient(165deg, #1a2744 0%, #0d1526 50%, #0a1020 100%)',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          {/* Header */}
          <div className="mb-5">
            <h2 className="text-[28px] font-bold text-white mb-1 tracking-tight">
              {getTitle()}
            </h2>
            <p className="text-white/60 text-[15px]">
              {getSubtitle()}
            </p>
          </div>
          
          {/* Score Display */}
          <div className="mb-7 py-4">
            <div 
              className="text-[56px] font-black leading-none mb-1"
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #a8b4c8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 4px 20px rgba(255,255,255,0.15)',
              }}
            >
              {score.toLocaleString()}
            </div>
            <div className="text-[11px] text-white/40 uppercase tracking-[0.2em] font-semibold">
              Points
            </div>
          </div>
          
          {/* Buttons */}
          <div className="space-y-3">
            {/* STATE 1: Free Continue Available */}
            {state === 'free' && (
              <>
                <button
                  onClick={onContinueFree}
                  className={cn(
                    "w-full py-4 px-6 rounded-2xl font-bold text-[17px]",
                    "bg-gradient-to-b from-[#22c55e] to-[#16a34a]",
                    "text-white shadow-[0_8px_32px_rgba(34,197,94,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]",
                    "active:scale-[0.97] transition-all duration-150",
                    "relative overflow-hidden"
                  )}
                  style={{
                    boxShadow: '0 8px 32px rgba(34, 197, 94, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 pointer-events-none" />
                  <div className="flex items-center justify-center gap-2 relative">
                    <span className="text-xl">↻</span>
                    <span>Continue (1 Free Left)</span>
                  </div>
                </button>
                
                <button
                  onClick={onDecline}
                  className={cn(
                    "w-full py-3.5 px-6 rounded-2xl font-semibold text-[15px]",
                    "bg-white/8 text-white/60 border border-white/10",
                    "active:scale-[0.97] transition-all duration-150"
                  )}
                >
                  No, end game
                </button>
              </>
            )}

            {/* STATE 2: Ad Available (Free Used) */}
            {state === 'ad' && (
              <>
                <button
                  onClick={onContinueAd}
                  className={cn(
                    "w-full py-4 px-6 rounded-2xl font-bold text-[17px]",
                    "bg-gradient-to-b from-[#f59e0b] to-[#d97706]",
                    "text-white",
                    "active:scale-[0.97] transition-all duration-150",
                    "relative overflow-hidden"
                  )}
                  style={{
                    boxShadow: '0 8px 32px rgba(245, 158, 11, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 pointer-events-none" />
                  <div className="flex items-center justify-center gap-2 relative">
                    <span className="text-xl">🎬</span>
                    <span>Watch Ad to Continue</span>
                  </div>
                </button>
                
                {hasPaidContinue && (
                  <button
                    onClick={onContinuePaid}
                    className={cn(
                      "w-full py-4 px-6 rounded-2xl font-bold text-[16px]",
                      "bg-gradient-to-b from-[#22c55e] to-[#16a34a]",
                      "text-white",
                      "active:scale-[0.97] transition-all duration-150",
                      "relative overflow-hidden"
                    )}
                    style={{
                      boxShadow: '0 6px 24px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 pointer-events-none" />
                    <div className="flex flex-col items-center relative">
                      <span>Continue (Paid)</span>
                      <span className="text-[12px] text-white/70 font-normal mt-0.5">$0.99</span>
                    </div>
                  </button>
                )}
                
                <button
                  onClick={onDecline}
                  className={cn(
                    "w-full py-3.5 px-6 rounded-2xl font-semibold text-[15px]",
                    "bg-white/8 text-white/60 border border-white/10",
                    "active:scale-[0.97] transition-all duration-150"
                  )}
                >
                  No, end game
                </button>
              </>
            )}

            {/* STATE 3: Paid Only (No Ads Available) */}
            {state === 'paid-only' && (
              <>
                {hasPaidContinue && (
                  <button
                    onClick={onContinuePaid}
                    className={cn(
                      "w-full py-4 px-6 rounded-2xl font-bold text-[17px]",
                      "bg-gradient-to-b from-[#22c55e] to-[#16a34a]",
                      "text-white",
                      "active:scale-[0.97] transition-all duration-150",
                      "relative overflow-hidden"
                    )}
                    style={{
                      boxShadow: '0 8px 32px rgba(34, 197, 94, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 pointer-events-none" />
                    <div className="flex flex-col items-center relative">
                      <span>Continue (Paid)</span>
                      <span className="text-[12px] text-white/70 font-normal mt-0.5">$0.99</span>
                    </div>
                  </button>
                )}
                
                <button
                  onClick={onDecline}
                  className={cn(
                    "w-full py-3.5 px-6 rounded-2xl font-semibold text-[15px]",
                    "bg-white/8 text-white/60 border border-white/10",
                    "active:scale-[0.97] transition-all duration-150"
                  )}
                >
                  No, end game
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContinueModal;
