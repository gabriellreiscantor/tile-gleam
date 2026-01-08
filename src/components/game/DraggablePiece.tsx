import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  const tileSize = 28;
  const gap = 2;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isAvailable || !pieceRef.current) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragPosition({ x: e.clientX, y: e.clientY });
    
    onDragStart(piece, pieceRef.current);
    pieceRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragPosition({ x: e.clientX, y: e.clientY });
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

  const pieceContent = (
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
  );

  return (
    <>
      {/* Placeholder to keep layout space */}
      <div
        ref={pieceRef}
        className={cn(
          'draggable-piece touch-none select-none',
          isDragging && 'opacity-30'
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {pieceContent}
      </div>

      {/* Floating piece that follows cursor - rendered via Portal to escape container stacking context */}
      {isDragging && createPortal(
        <div
          className="fixed pointer-events-none"
          style={{
            left: dragPosition.x,
            top: dragPosition.y,
            transform: 'translate(-50%, -110%) scale(1.15)',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))',
            zIndex: 9999,
          }}
        >
          {pieceContent}
        </div>,
        document.body
      )}
    </>
  );
};

export default DraggablePiece;
