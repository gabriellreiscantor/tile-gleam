import React from 'react';
import DraggablePiece from './DraggablePiece';
import type { GamePiece } from '@/lib/pieces';

interface PieceTrayProps {
  pieces: (GamePiece | null)[];
  onDragStart: (piece: GamePiece, element: HTMLElement) => void;
  onDragEnd: () => void;
  onDrag: (x: number, y: number) => void;
}

const PieceTray: React.FC<PieceTrayProps> = ({
  pieces,
  onDragStart,
  onDragEnd,
  onDrag,
}) => {
  return (
    <div className="piece-tray w-full max-w-md mx-auto">
      <div className="flex items-center justify-evenly gap-1">
        {pieces.map((piece, index) => (
          <div key={piece?.id ?? `empty-${index}`} className="flex items-center justify-center min-w-16 min-h-16">
            {piece && (
              <DraggablePiece
                piece={piece}
                isAvailable={true}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDrag={onDrag}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieceTray;
