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
  soundEnabled?: boolean;
}

const PieceTray: React.FC<PieceTrayProps> = ({
  pieces,
  onDragStart,
  onDragEnd,
  onDrag,
  soundEnabled = true,
}) => {
  return (
    <div className="piece-tray w-full max-w-[360px] mx-auto">
      {/* Piece slots with generous spacing */}
      <div className="flex items-center justify-between gap-3 px-3 py-3 rounded-2xl bg-white/10 backdrop-blur-sm">
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
                soundEnabled={soundEnabled}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieceTray;
