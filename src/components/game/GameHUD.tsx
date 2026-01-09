import React from "react";
import type { ItemResources } from "@/lib/collectibles";
import { cn } from "@/lib/utils";

type GameHUDProps = {
  score: number;
  bestScore: number;
  combo?: number;
  itemResources?: ItemResources;
  onOpenSettings: () => void;
};

// Compact pill for items
const HUDPill: React.FC<{ icon: string; value: number }> = ({ icon, value }) => (
  <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 backdrop-blur-sm">
    <span className="text-sm leading-none">{icon}</span>
    <span className="text-sm font-semibold text-white">{value}</span>
  </div>
);

const GameHUD: React.FC<GameHUDProps> = ({
  score,
  bestScore,
  combo = 0,
  itemResources,
  onOpenSettings,
}) => {
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
          {combo > 1 && (
            <span className="text-cyan-300 text-xs font-bold mt-0.5">
              🔥 x{combo}
            </span>
          )}
        </div>

        {/* RIGHT — ITEMS + SETTINGS */}
        <div className="absolute right-0 top-2 flex items-center gap-2">
          {/* Item counters (smaller than score) */}
          {itemResources && (
            <>
              <HUDPill icon="💎" value={itemResources.crystals} />
              <HUDPill icon="❄️" value={itemResources.ice} />
            </>
          )}
          
          {/* Settings button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className={cn(
              "h-10 w-10 rounded-xl",
              "bg-white/10 backdrop-blur-sm",
              "flex items-center justify-center",
              "active:scale-95 transition-transform"
            )}
            aria-label="Settings"
          >
            <span className="text-lg leading-none">⚙️</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameHUD;
