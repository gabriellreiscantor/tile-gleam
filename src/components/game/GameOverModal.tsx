import React, { useState } from 'react';
import { Play, RotateCcw, Crown, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContinueEligibility } from '@/lib/playerResources';
import { showRewardedAd } from '@/lib/adService';
import { 
  CONTINUE_CRYSTAL_COST, 
  canAffordCrystalContinue,
  type ItemResources 
} from '@/lib/collectibles';
import SimulatedAdOverlay from './SimulatedAdOverlay';
import type { ReplayData } from '@/lib/replayRecorder';

interface GameOverModalProps {
  score: number;
  highScore: number;
  onRestart: () => void;
  // Continue options
  showContinueOptions?: boolean;
  eligibility?: ContinueEligibility;
  itemResources?: ItemResources;
  onContinueFree?: () => void;
  onContinuePaid?: () => void;
  onContinueAd?: () => void;
  onContinueCrystal?: () => void;
  onDecline?: () => void;
  // Replay
  replayData?: ReplayData | null;
  onWatchReplay?: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ 
  score, 
  highScore, 
  onRestart,
  showContinueOptions = false,
  eligibility,
  itemResources,
  onContinueFree,
  onContinuePaid,
  onContinueAd,
  onContinueCrystal,
  onDecline,
  replayData,
  onWatchReplay,
}) => {
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [showSimulatedAd, setShowSimulatedAd] = useState(false);

  const isNewRecord = score >= highScore && score > 0;

  const handleWatchAd = async () => {
    setIsLoadingAd(true);
    setAdError(null);
    
    try {
      const result = await showRewardedAd();
      
      if (result.success) {
        if (result.isSimulated) {
          setShowSimulatedAd(true);
          setIsLoadingAd(false);
        } else {
          onContinueAd?.();
        }
      } else {
        setAdError(result.error || 'Ad not available');
        setIsLoadingAd(false);
      }
    } catch {
      setAdError('Failed to show ad');
      setIsLoadingAd(false);
    }
  };

  const handleSimulatedAdComplete = () => {
    setShowSimulatedAd(false);
    onContinueAd?.();
  };

  // Show simulated ad overlay (fullscreen)
  if (showSimulatedAd) {
    return (
      <SimulatedAdOverlay
        isOpen={true}
        onComplete={handleSimulatedAdComplete}
        duration={5}
      />
    );
  }

  const canUseCrystals = itemResources && canAffordCrystalContinue(itemResources);
  const state = eligibility?.state;
  const hasPaidContinue = eligibility?.hasPaidContinue;
  const canWatchAd = eligibility?.canWatchAd;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[70] flex flex-col items-center justify-center",
        "animate-fade-in"
      )}
      style={{
        background: isNewRecord
          ? 'linear-gradient(180deg, #581c87 0%, #7e22ce 30%, #6b21a8 70%, #4c1d95 100%)'
          : 'linear-gradient(180deg, #0c1929 0%, #1e3a5f 30%, #1e3a5f 70%, #0c1929 100%)',
      }}
    >
      {/* Restart Button - Top Right */}
      <button
        onClick={onRestart}
        className={cn(
          "absolute top-6 right-6",
          "w-12 h-12 rounded-full",
          "flex items-center justify-center",
          "transition-all duration-200 active:scale-95",
          isNewRecord 
            ? "bg-amber-500/30 text-amber-300" 
            : "bg-white/10 text-white/70"
        )}
        style={{
          marginTop: 'env(safe-area-inset-top)',
          boxShadow: isNewRecord 
            ? '0 4px 20px rgba(251, 191, 36, 0.3)' 
            : '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <RotateCcw className="w-6 h-6" />
      </button>

      {/* Main Content */}
      <div className="flex flex-col items-center px-8 animate-scale-in">
        
        {/* Crown Icon - Only for New Record */}
        {isNewRecord && (
          <div 
            className="mb-6"
            style={{
              animation: 'bounce 2s ease-in-out infinite',
            }}
          >
            <Crown 
              className="w-24 h-24 text-amber-400" 
              style={{
                filter: 'drop-shadow(0 0 30px rgba(251, 191, 36, 0.7))',
              }}
            />
          </div>
        )}

        {/* Title */}
        <h1 
          className={cn(
            "text-4xl font-black mb-8 text-center",
            isNewRecord ? "text-amber-300" : "text-white"
          )}
          style={{
            textShadow: isNewRecord
              ? '0 4px 0 #92400e, 0 0 40px rgba(251, 191, 36, 0.5)'
              : '0 4px 0 rgba(0, 0, 0, 0.3), 0 0 30px rgba(255, 255, 255, 0.2)',
            letterSpacing: '-0.02em',
          }}
        >
          {isNewRecord ? 'Best Score!' : 'Game Over'}
        </h1>

        {/* Score Card */}
        <div 
          className="rounded-3xl px-12 py-8 mb-8 text-center"
          style={{
            background: isNewRecord 
              ? 'linear-gradient(180deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)'
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
            border: isNewRecord 
              ? '1px solid rgba(251, 191, 36, 0.3)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: isNewRecord 
              ? 'inset 0 1px 0 rgba(251, 191, 36, 0.2), 0 20px 40px -10px rgba(0, 0, 0, 0.4)'
              : 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 20px 40px -10px rgba(0, 0, 0, 0.4)',
          }}
        >
          <span className="text-sm text-white/50 uppercase tracking-widest font-medium block mb-2">
            Score
          </span>
          <span 
            className="text-6xl font-black text-white tabular-nums block"
            style={{
              textShadow: '0 4px 0 rgba(0, 0, 0, 0.2)',
            }}
          >
            {score.toLocaleString()}
          </span>
          
          {/* Best Score - Only for Standard State */}
          {!isNewRecord && highScore > 0 && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <span className="text-xs text-amber-400/70 uppercase tracking-widest font-medium block mb-1">
                Best Score
              </span>
              <div className="flex items-center justify-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span 
                  className="text-2xl font-bold text-amber-400 tabular-nums"
                  style={{
                    textShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
                  }}
                >
                  {highScore.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Continue Options */}
        {showContinueOptions && eligibility && (
          <div className="w-full max-w-[300px] space-y-3 mb-6">
            {/* STATE 1: Free Continue Available */}
            {state === 'free' && (
              <button
                onClick={onContinueFree}
                className={cn(
                  "w-full py-4 px-6 rounded-2xl font-bold text-[17px]",
                  "bg-gradient-to-b from-[#22c55e] to-[#16a34a]",
                  "text-white",
                  "active:scale-[0.97] transition-all duration-150",
                  "relative overflow-hidden"
                )}
                style={{
                  boxShadow: '0 6px 0 #047857, 0 10px 30px rgba(34, 197, 94, 0.4)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 pointer-events-none" />
                <div className="flex items-center justify-center gap-2 relative">
                  <span className="text-xl">↻</span>
                  <span>Continue (1 Free)</span>
                </div>
              </button>
            )}

            {/* STATE 2: Ad Available */}
            {state === 'ad' && (
              <>
                <button
                  onClick={handleWatchAd}
                  disabled={isLoadingAd}
                  className={cn(
                    "w-full py-4 px-6 rounded-2xl font-bold text-[17px]",
                    "bg-gradient-to-b from-[#f59e0b] to-[#d97706]",
                    "text-white",
                    "active:scale-[0.97] transition-all duration-150",
                    "relative overflow-hidden",
                    isLoadingAd && "opacity-80 cursor-wait"
                  )}
                  style={{
                    boxShadow: '0 6px 0 #b45309, 0 10px 30px rgba(245, 158, 11, 0.4)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 pointer-events-none" />
                  <div className="flex items-center justify-center gap-2 relative">
                    {isLoadingAd ? (
                      <>
                        <span className="animate-spin text-xl">⏳</span>
                        <span>Loading Ad...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl">🎬</span>
                        <span>Watch Ad to Continue</span>
                      </>
                    )}
                  </div>
                </button>
                
                {adError && (
                  <p className="text-red-400 text-sm text-center">
                    {adError}. Try again or use crystals.
                  </p>
                )}
              </>
            )}

            {/* Crystal Continue - Available in 'ad' or 'paid-only' states */}
            {(state === 'ad' || state === 'paid-only') && canUseCrystals && itemResources && (
              <button
                onClick={onContinueCrystal}
                className={cn(
                  "w-full py-4 px-6 rounded-2xl font-bold text-[16px]",
                  "bg-gradient-to-b from-[#8b5cf6] to-[#7c3aed]",
                  "text-white",
                  "active:scale-[0.97] transition-all duration-150",
                  "relative overflow-hidden"
                )}
                style={{
                  boxShadow: '0 6px 0 #5b21b6, 0 10px 30px rgba(139, 92, 246, 0.4)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 pointer-events-none" />
                <div className="flex items-center justify-center gap-2 relative">
                  <span className="text-xl">💎</span>
                  <span>Use {CONTINUE_CRYSTAL_COST} Crystals</span>
                  <span className="text-white/60 text-sm">({itemResources.crystals})</span>
                </div>
              </button>
            )}

            {/* Paid Continue - in 'ad' or 'paid-only' states */}
            {(state === 'ad' || state === 'paid-only') && hasPaidContinue && (
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
                  boxShadow: '0 6px 0 #047857, 0 10px 30px rgba(34, 197, 94, 0.35)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 pointer-events-none" />
                <div className="flex flex-col items-center relative">
                  <span>Continue (Paid)</span>
                  <span className="text-[12px] text-white/70 font-normal mt-0.5">$0.99</span>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Replay Button - Only show when game is over (not continue options) and has replay data */}
        {!showContinueOptions && replayData && replayData.moves.length > 0 && (
          <button
            onClick={onWatchReplay}
            className={cn(
              "flex items-center justify-center gap-3",
              "px-8 py-3 rounded-2xl mb-4",
              "font-bold text-base",
              "transition-all duration-200 active:scale-95",
              "bg-white/10 text-white/80 border border-white/20"
            )}
            style={{
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Film className="w-5 h-5" />
            <span>Watch Replay</span>
          </button>
        )}

        {/* Play Again Button */}
        <button
          onClick={showContinueOptions && onDecline ? onDecline : onRestart}
          className={cn(
            "flex items-center justify-center gap-3",
            "px-10 py-4 rounded-2xl",
            "font-bold text-lg",
            "transition-all duration-200 active:scale-95",
            showContinueOptions
              ? "bg-white/10 text-white/70 border border-white/20"
              : isNewRecord
                ? "bg-gradient-to-b from-amber-400 to-amber-500 text-amber-900"
                : "bg-gradient-to-b from-emerald-400 to-emerald-500 text-emerald-900"
          )}
          style={{
            boxShadow: showContinueOptions
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : isNewRecord
                ? '0 6px 0 #b45309, 0 10px 30px rgba(251, 191, 36, 0.4)'
                : '0 6px 0 #047857, 0 10px 30px rgba(16, 185, 129, 0.4)',
          }}
        >
          <Play className="w-6 h-6" fill="currentColor" />
          <span>{showContinueOptions ? 'No, End Game' : 'Play Again'}</span>
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;
