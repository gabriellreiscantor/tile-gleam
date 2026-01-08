import React from 'react';
import DraggablePiece from './DraggablePiece';

interface GamePiece {
  shape: number[][];
  colorId: number;
  id: string;
}

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
    <div className="piece-tray w-full max-w-[360px] mx-auto">
      {/* Piece slots with generous spacing */}
      <div className="flex items-center justify-between gap-3 px-1">
        {pieces.map((piece, index) => (
          <div 
            key={piece?.id ?? `empty-${index}`} 
            className="piece-slot flex-1"
          >
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
