import React from 'react';
import { cn } from '@/lib/utils';
import { Undo2 } from 'lucide-react';
import type { UndoAvailability } from '@/lib/playerResources';

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
    } else if (!availability.hasPaidUndo) {
      onBuyUndo();
    }
  };

  const isDisabled = !availability.canUndo && !availability.hasPaidUndo;

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        "relative flex items-center justify-center",
        "w-14 h-14 rounded-2xl",
        "transition-all duration-200",
        availability.canUndo ? (
          availability.isFree 
            ? "bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30"
            : "bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30"
        ) : (
          "bg-white/10"
        ),
        isDisabled && "opacity-40 cursor-not-allowed",
        !isDisabled && "active:scale-95",
        className
      )}
    >
      <Undo2 className="w-6 h-6 text-white" />
      
      {/* Badge - Free daily indicator (green "1") */}
      {availability.isFree && availability.canUndo && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">1</span>
        </div>
      )}
      
      {/* Badge - Premium unlimited (orange "$") - shows when free is used AND has premium */}
      {!availability.isFree && availability.hasPaidUndo && availability.canUndo && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">∞</span>
        </div>
      )}
    </button>
  );
};

export default UndoButton;
