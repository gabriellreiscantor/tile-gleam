import React, { useEffect, useState } from 'react';
import { ITEM_EMOJI, type CollectedItem } from '@/lib/collectibles';

interface CollectAnimationProps {
  items: CollectedItem[];
  cellSize: number;
  boardLeft: number;
  boardTop: number;
  targetX: number; // Target X position (HUD location)
  targetY: number; // Target Y position (HUD location)
  onComplete?: () => void;
}

interface FlyingItem {
  id: string;
  type: CollectedItem['type'];
  startX: number;
  startY: number;
}

const CollectAnimation: React.FC<CollectAnimationProps> = ({
  items,
  cellSize,
  boardLeft,
  boardTop,
  targetX,
  targetY,
  onComplete,
}) => {
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  
  useEffect(() => {
    if (items.length === 0) return;
    
    // Create flying items with starting positions
    const newItems = items.map((item, i) => ({
      id: `${item.type}-${item.x}-${item.y}-${Date.now()}-${i}`,
      type: item.type,
      startX: boardLeft + item.x * cellSize + cellSize / 2,
      startY: boardTop + item.y * cellSize + cellSize / 2,
    }));
    
    setFlyingItems(newItems);
    
    // Clear after animation completes
    const timeout = setTimeout(() => {
      setFlyingItems([]);
      onComplete?.();
    }, 600);
    
    return () => clearTimeout(timeout);
  }, [items, cellSize, boardLeft, boardTop, onComplete]);
  
  if (flyingItems.length === 0) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {flyingItems.map((item) => (
        <div
          key={item.id}
          className="absolute text-2xl"
          style={{
            left: item.startX,
            top: item.startY,
            transform: 'translate(-50%, -50%)',
            animation: 'collectFly 0.5s ease-in forwards',
            '--target-x': `${targetX - item.startX}px`,
            '--target-y': `${targetY - item.startY}px`,
          } as React.CSSProperties}
        >
          {ITEM_EMOJI[item.type]}
        </div>
      ))}
    </div>
  );
};

export default CollectAnimation;
