import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { ItemResources } from '@/lib/collectibles';

interface ItemHUDProps {
  resources: ItemResources;
  className?: string;
}

interface AnimatedCounterProps {
  value: number;
  emoji: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, emoji }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);
      // Quick animation to new value
      const timeout = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [value, displayValue]);
  
  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 backdrop-blur-sm",
      "transition-all duration-200",
      isAnimating && "scale-110 bg-white/20"
    )}>
      <span className="text-base">{emoji}</span>
      <span className={cn(
        "text-sm font-bold text-white min-w-[20px] text-center",
        "transition-transform duration-150",
        isAnimating && "scale-125 text-yellow-300"
      )}>
        {displayValue}
      </span>
    </div>
  );
};

const ItemHUD: React.FC<ItemHUDProps> = ({ resources, className }) => {
  return (
    <div className={cn(
      "flex items-center gap-2",
      className
    )}>
      <AnimatedCounter value={resources.crystals} emoji="💎" />
      <AnimatedCounter value={resources.ice} emoji="❄️" />
    </div>
  );
};

export default ItemHUD;
