import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { GamePiece } from '@/lib/pieces';

// FIXED OFFSET: Piece floats above finger (never covered)
const DRAG_OFFSET_Y = 90; // px above touch point
const DRAG_OFFSET_X = 0;  // centered horizontally

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

  // Calculate piece dimensions in pixels
  const pieceWidthPx = piece.shape[0].length * tileSize + (piece.shape[0].length - 1) * gap;
  const pieceHeightPx = piece.shape.length * tileSize + (piece.shape.length - 1) * gap;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isAvailable || !pieceRef.current) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    // Initial position with fixed offset applied
    const floatingX = e.clientX + DRAG_OFFSET_X;
    const floatingY = e.clientY - DRAG_OFFSET_Y;
    setDragPosition({ x: floatingX, y: floatingY });
    
    onDragStart(piece, pieceRef.current);
    // Notify parent with the BLOCK position (not finger)
    onDrag(floatingX, floatingY);
    pieceRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    // Apply FIXED offset - block floats above finger
    const floatingX = e.clientX + DRAG_OFFSET_X;
    const floatingY = e.clientY - DRAG_OFFSET_Y;
    
    setDragPosition({ x: floatingX, y: floatingY });
    // Pass BLOCK position to parent (not finger position)
    onDrag(floatingX, floatingY);
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

      {/* Floating piece - positioned at BLOCK coords (already offset from finger) */}
      {isDragging && createPortal(
        <div
          className="fixed pointer-events-none"
          style={{
            left: dragPosition.x,
            top: dragPosition.y,
            // Center the piece on the floating position
            marginLeft: -pieceWidthPx / 2,
            marginTop: -pieceHeightPx / 2,
            transform: 'scale(1.1)',
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
