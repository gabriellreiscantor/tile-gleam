import React from "react";
import type { ItemResources } from "@/lib/collectibles";
import { getComboLevel } from "@/lib/feedback";
import { cn } from "@/lib/utils";

type GameHUDProps = {
  score: number;
  bestScore: number;
  combo?: number;
  itemResources?: ItemResources;
  onOpenSettings: () => void;
  onActivateStar?: () => void;
  starDisabled?: boolean;
  starButtonRef?: React.RefObject<HTMLButtonElement>;
};

// Compact pill for items
const HUDPill: React.FC<{ icon: string; value: number }> = ({ icon, value }) => (
  <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 backdrop-blur-sm">
    <span className="text-sm leading-none">{icon}</span>
    <span className="text-sm font-semibold text-white">{value}</span>
  </div>
);

// Combo color mapping
const COMBO_COLORS: Record<string, string> = {
  normal: 'text-cyan-300',
  hot: 'text-orange-400',
  electric: 'text-yellow-300',
  insane: 'text-pink-400',
  godlike: 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500',
};

const GameHUD: React.FC<GameHUDProps> = ({
  score,
  bestScore,
  combo = 0,
  itemResources,
  onOpenSettings,
  onActivateStar,
  starDisabled = false,
  starButtonRef,
}) => {
  const hasStars = itemResources && itemResources.stars > 0;
  const comboLevel = combo > 1 ? getComboLevel(combo) : null;
  
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 pointer-events-auto select-none"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 8px)",
        paddingLeft: "max(env(safe-area-inset-left), 12px)",
        paddingRight: "max(env(safe-area-inset-right), 12px)",
      }}
    >
      {/* Relative container for absolute positioning */}
      <div className="relative h-[72px] mx-auto max-w-[520px]">
        
        {/* LEFT — BEST SCORE */}
        <div className="absolute left-0 top-2 flex items-center gap-1">
          <span className="text-lg leading-none">👑</span>
          <span className="text-yellow-400 font-extrabold text-lg drop-shadow">
            {bestScore}
          </span>
        </div>

        {/* CENTER — SCORE + COMBO (TRUE CENTER) */}
        <div className="absolute left-1/2 top-1 -translate-x-1/2 flex flex-col items-center">
          <span className="text-[11px] tracking-[0.25em] text-white/70 uppercase">
            Score
          </span>
          <span className="text-white text-3xl font-extrabold drop-shadow-lg">
            {score}
          </span>
          {combo > 1 && comboLevel && (
            <span className={cn(
              "text-xs font-bold mt-0.5 transition-all",
              COMBO_COLORS[comboLevel.tier] || 'text-cyan-300',
              comboLevel.shake && "combo-shake",
              comboLevel.tier === 'godlike' && "combo-rainbow text-sm"
            )}>
              {comboLevel.prefix} x{combo} {comboLevel.emoji}
            </span>
          )}
        </div>

        {/* RIGHT — SETTINGS (TOP) */}
        <div className="absolute right-0 top-2">
          <button
            type="button"
            onClick={onOpenSettings}
            className={cn(
              "h-11 w-11 rounded-2xl",
              "bg-white/10 backdrop-blur-sm",
              "flex items-center justify-center",
              "active:scale-95 transition-transform"
            )}
            aria-label="Settings"
          >
            <span className="text-lg leading-none">⚙️</span>
          </button>
        </div>

        {/* RIGHT — ITEMS (BELOW SETTINGS) */}
        {itemResources && (
          <div className="absolute right-0 top-[56px] flex flex-col gap-1 items-end">
            <HUDPill icon="💎" value={itemResources.crystals} />
            
            {/* STAR BUTTON - Interactive when has stars */}
            {onActivateStar ? (
              <button
                ref={starButtonRef}
                type="button"
                onClick={onActivateStar}
                disabled={starDisabled || !hasStars}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-xl",
                  "transition-all duration-200",
                  hasStars && !starDisabled
                    ? "bg-yellow-500/20 border border-yellow-500/50 active:scale-95 hover:bg-yellow-500/30"
                    : "bg-white/10 backdrop-blur-sm opacity-50 cursor-not-allowed"
                )}
              >
                <span className={cn(
                  "text-sm leading-none",
                  hasStars && !starDisabled && "animate-pulse"
                )}>⭐</span>
                <span className={cn(
                  "text-sm font-semibold",
                  hasStars && !starDisabled ? "text-yellow-300" : "text-white"
                )}>
                  {itemResources.stars}
                </span>
              </button>
            ) : (
              <HUDPill icon="⭐" value={itemResources.stars} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameHUD;
