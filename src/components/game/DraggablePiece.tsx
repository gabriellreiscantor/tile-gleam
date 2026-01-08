import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { GamePiece } from '@/lib/pieces';

interface DraggablePieceProps {
  piece: GamePiece;
  isAvailable: boolean;
  onDragStart: (piece: GamePiece, element: HTMLElement) => void;
  onDragEnd: () => void;
  onDrag: (x: number, y: number) => void;
}

const DraggablePiece: React.FC<DraggablePieceProps> = ({
  piece,
  isAvailable,
  onDragStart,
  onDragEnd,
  onDrag,
}) => {
  const pieceRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const tileSize = 28;
  const gap = 2;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isAvailable || !pieceRef.current) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const rect = pieceRef.current.getBoundingClientRect();
    setOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    });
    
    onDragStart(piece, pieceRef.current);
    pieceRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    onDrag(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    onDragEnd();
    pieceRef.current?.releasePointerCapture(e.pointerId);
  };

  if (!isAvailable) {
    return <div className="w-20 h-20" />;
  }

  return (
    <div
      ref={pieceRef}
      className={cn(
        'draggable-piece touch-none select-none',
        isDragging && 'dragging'
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${piece.shape[0].length}, ${tileSize}px)`,
          gap: `${gap}px`,
        }}
      >
        {piece.shape.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              style={{ width: tileSize, height: tileSize }}
            >
              {cell === 1 && (
                <div
                  className={cn('game-tile w-full h-full', `tile-${piece.colorId}`)}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DraggablePiece;
