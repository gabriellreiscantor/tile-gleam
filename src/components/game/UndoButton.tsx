import React from 'react';
import { cn } from '@/lib/utils';
import type { UndoAvailability } from '@/lib/playerResources';
import undoBuyIcon from '@/assets/undo-buy-icon.png';
import undoFreeIcon from '@/assets/undo-free-icon.png';

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

  // Determine which icon to show
  const showFullIcon = availability.canUndo || showBuyState;
  const iconSrc = showBuyState ? undoBuyIcon : undoFreeIcon;

  return (
    <button
      onClick={handleClick}
      disabled={!isClickable}
      className={cn(
        "relative flex items-center justify-center",
        "w-14 h-14 rounded-2xl overflow-hidden",
        "transition-all duration-200",
        // Only show gradient bg when disabled (no icon)
        !showFullIcon && "bg-white/10 opacity-40",
        isClickable && "active:scale-95",
        !isClickable && "cursor-not-allowed",
        className
      )}
    >
      {showFullIcon ? (
        <img 
          src={iconSrc} 
          alt={showBuyState ? "Buy Undo" : "Undo"} 
          className="w-14 h-14 object-cover rounded-2xl"
        />
      ) : (
        <img 
          src={undoFreeIcon} 
          alt="Undo" 
          className="w-14 h-14 object-cover rounded-2xl opacity-50"
        />
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
