import React from 'react';
import { cn } from '@/lib/utils';
import { Undo2 } from 'lucide-react';
import type { UndoAvailability } from '@/lib/playerResources';
import undoBuyIcon from '@/assets/undo-buy-icon.png';

interface UndoButtonProps {
  availability: UndoAvailability;
  onUndo: () => void;
  onBuyUndo: () => void;
  className?: string;
}

const UndoButton: React.FC<UndoButtonProps> = ({
  availability,
  onUndo,
  onBuyUndo,
  className,
}) => {
  const handleClick = () => {
    if (availability.canUndo) {
      onUndo();
    } else if (availability.canBuyUndo) {
      onBuyUndo();
    }
  };

  // Button is always clickable if: can undo OR can buy
  const isClickable = availability.canUndo || availability.canBuyUndo;
  
  // Show buy state when free is used and no paid undos
  const showBuyState = availability.canBuyUndo && !availability.canUndo;

  return (
    <button
      onClick={handleClick}
      disabled={!isClickable}
      className={cn(
        "relative flex items-center justify-center",
        "w-14 h-14 rounded-2xl",
        "transition-all duration-200",
        availability.canUndo ? (
          availability.isFree 
            ? "bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30"
            : "bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30"
        ) : showBuyState ? (
          // Buy state - transparent bg, icon replaces entire button
          "bg-transparent shadow-none"
        ) : (
          "bg-white/10 opacity-40"
        ),
        isClickable && "active:scale-95",
        !isClickable && "cursor-not-allowed",
        className
      )}
    >
      {showBuyState ? (
        <img 
          src={undoBuyIcon} 
          alt="Buy Undo" 
          className="w-14 h-14 object-contain"
        />
      ) : (
        <Undo2 className="w-6 h-6 text-white" />
      )}
      
      {/* Badge - Free daily indicator (green "1") */}
      {availability.isFree && availability.canUndo && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">1</span>
        </div>
      )}
      
      {/* Badge - Paid undo count (orange number) */}
      {!availability.isFree && availability.hasPaidUndos && availability.canUndo && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">{availability.paidUndoCount}</span>
        </div>
      )}
    </button>
  );
};

export default UndoButton;
