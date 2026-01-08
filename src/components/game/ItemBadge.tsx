import React from 'react';
import { cn } from '@/lib/utils';
import { ITEM_EMOJI, type ItemType } from '@/lib/collectibles';

interface ItemBadgeProps {
  itemType: ItemType;
  className?: string;
}

/**
 * Small badge shown in corner of blocks that contain items
 */
const ItemBadge: React.FC<ItemBadgeProps> = ({ itemType, className }) => {
  return (
    <div 
      className={cn(
        "absolute -top-1 -right-1 z-10",
        "w-4 h-4 flex items-center justify-center",
        "text-[10px] leading-none",
        "animate-pulse",
        className
      )}
      style={{
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
      }}
    >
      {ITEM_EMOJI[itemType]}
    </div>
  );
};

export default ItemBadge;
