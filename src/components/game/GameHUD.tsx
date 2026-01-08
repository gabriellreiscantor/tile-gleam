import React from "react";

type GameHUDProps = {
  score: number;
  bestScore: number;
  combo?: number;
  onOpenSettings: () => void;
};

const GameHUD: React.FC<GameHUDProps> = ({
  score,
  bestScore,
  combo = 0,
  onOpenSettings,
}) => {
  return (
    <div
      className="w-full px-3 pt-2 select-none"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 12px)",
      }}
    >
      {/* Container RELATIVE + W-FULL para ABSOLUTE funcionar */}
      <div className="relative w-full h-[72px]">
        {/* LEFT — BEST */}
        <div className="absolute left-0 top-0 flex flex-col items-start">
          <div className="flex items-center gap-1">
            <span className="text-[14px] leading-none">👑</span>
            <span className="text-[11px] tracking-[0.20em] text-yellow-300/90">
              BEST
            </span>
          </div>

          <div className="mt-1 text-[18px] font-extrabold text-yellow-300 drop-shadow">
            {bestScore}
          </div>
        </div>

        {/* CENTER — SCORE + COMBO */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 flex flex-col items-center">
          <div className="text-[11px] tracking-[0.25em] text-white/70">
            SCORE
          </div>

          <div className="mt-1 text-[34px] font-extrabold text-white drop-shadow">
            {score}
          </div>

          {/* Combo só aparece quando > 1 */}
          {combo > 1 && (
            <div className="mt-0.5 text-[12px] font-bold text-cyan-300/90">
              🔥 x{combo}
            </div>
          )}
        </div>

        {/* RIGHT — SETTINGS */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="
            absolute right-0 top-0
            h-11 w-11
            rounded-2xl
            bg-white/10
            backdrop-blur
            flex items-center justify-center
            active:scale-95
          "
          aria-label="Settings"
        >
          <span className="text-[18px] leading-none">⚙️</span>
        </button>
      </div>
    </div>
  );
};

export default GameHUD;
