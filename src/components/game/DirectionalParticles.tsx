import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  delay: number;
}

export interface ClearLine {
  type: 'row' | 'col';
  index: number;
  color?: string;
}

interface DirectionalParticlesProps {
  lines: ClearLine[];
  boardRect: { left: number; top: number; cellSize: number } | null;
  gridSize?: number;
}

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

const DirectionalParticles: React.FC<DirectionalParticlesProps> = ({ 
  lines, 
  boardRect,
  gridSize = 8 
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!lines.length || !boardRect) return;

    const newParticles: Particle[] = [];
    const { left, top, cellSize } = boardRect;

    lines.forEach((line, lineIndex) => {
      const particlesPerCell = 3;
      const color = line.color || COLORS[Math.floor(Math.random() * COLORS.length)];

      for (let cellIdx = 0; cellIdx < gridSize; cellIdx++) {
        for (let p = 0; p < particlesPerCell; p++) {
          let x: number, y: number, vx: number, vy: number;

          if (line.type === 'row') {
            // Row clears: particles move horizontally outward
            x = left + cellIdx * cellSize + cellSize / 2;
            y = top + line.index * cellSize + cellSize / 2 + (Math.random() - 0.5) * cellSize * 0.5;
            // Explode from center outward
            const centerX = left + (gridSize * cellSize) / 2;
            vx = (x - centerX) * 0.05 + (Math.random() - 0.5) * 2;
            vy = (Math.random() - 0.5) * 3;
          } else {
            // Column clears: particles move vertically outward
            x = left + line.index * cellSize + cellSize / 2 + (Math.random() - 0.5) * cellSize * 0.5;
            y = top + cellIdx * cellSize + cellSize / 2;
            // Explode from center outward
            const centerY = top + (gridSize * cellSize) / 2;
            vx = (Math.random() - 0.5) * 3;
            vy = (y - centerY) * 0.05 + (Math.random() - 0.5) * 2;
          }

          // Staggered delay for wave effect
          const delay = cellIdx * 15 + lineIndex * 30;

          newParticles.push({
            id: Date.now() + lineIndex * 1000 + cellIdx * 100 + p,
            x,
            y,
            vx: vx * (2 + Math.random()),
            vy: vy * (2 + Math.random()),
            color,
            size: 4 + Math.random() * 4,
            life: 1,
            delay,
          });
        }
      }
    });

    // Stagger particle appearance
    const startTime = Date.now();
    
    const addDelayedParticles = () => {
      const elapsed = Date.now() - startTime;
      const ready = newParticles.filter(p => p.delay <= elapsed);
      const pending = newParticles.filter(p => p.delay > elapsed);
      
      if (ready.length > 0) {
        setParticles(prev => [...prev, ...ready.map(p => ({ ...p, delay: 0 }))]);
      }
      
      if (pending.length > 0) {
        requestAnimationFrame(addDelayedParticles);
      }
    };
    
    addDelayedParticles();

    // Animate particles
    let frame: number;
    const animate = () => {
      setParticles(prev => {
        const updated = prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.12, // gravity
            vx: p.vx * 0.98, // friction
            life: p.life - 0.025,
            size: p.size * 0.97,
          }))
          .filter(p => p.life > 0);
        
        if (updated.length > 0) {
          frame = requestAnimationFrame(animate);
        }
        return updated;
      });
    };

    frame = requestAnimationFrame(animate);

    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [lines, boardRect, gridSize]);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: p.life,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 ${p.size * 1.5}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
};

export default DirectionalParticles;
