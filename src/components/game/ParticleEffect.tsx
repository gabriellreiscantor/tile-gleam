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
}

interface ParticleEffectProps {
  trigger: { x: number; y: number; color: string } | null;
  count?: number;
}

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
];

const ParticleEffect: React.FC<ParticleEffectProps> = ({ trigger, count = 12 }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;

    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 3 + Math.random() * 4;
      newParticles.push({
        id: Date.now() + i,
        x: trigger.x,
        y: trigger.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: trigger.color || COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 6,
        life: 1,
      });
    }

    setParticles(prev => [...prev, ...newParticles]);

    // Animate particles
    let frame: number;
    const animate = () => {
      setParticles(prev => {
        const updated = prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15, // gravity
            life: p.life - 0.03,
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
  }, [trigger, count]);

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
            boxShadow: `0 0 ${p.size}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
};

export default ParticleEffect;
