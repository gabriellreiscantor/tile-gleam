import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { FeedbackMessage } from '@/lib/feedback';

interface FeedbackTextProps {
  message: FeedbackMessage | null;
  messageKey?: number; // Force re-render on new message
  onComplete?: () => void;
}

const FeedbackText: React.FC<FeedbackTextProps> = ({ message, messageKey, onComplete }) => {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (message) {
      // Reset state immediately for new message
      setVisible(true);
      setAnimating(true);
      
      const duration = message.intensity === 'epic' ? 1200 : message.intensity === 'high' ? 800 : 500;
      
      const timeout = setTimeout(() => {
        setAnimating(false);
        setTimeout(() => {
          setVisible(false);
          onComplete?.();
        }, 150);
      }, duration);
      
      return () => clearTimeout(timeout);
    } else {
      setVisible(false);
      setAnimating(false);
    }
  }, [message, messageKey, onComplete]);

  if (!visible || !message) return null;

  const sizeClasses = {
    low: 'text-2xl',
    medium: 'text-3xl',
    high: 'text-4xl',
    epic: 'text-5xl',
  };

  const colorClasses = {
    primary: 'text-primary',
    cyan: 'text-cyan-400',
    yellow: 'text-yellow-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
    accent: 'text-accent',
    destructive: 'text-destructive',
    rainbow: 'text-amber-300',
    green: 'text-green-400',
  };

  return (
    <div
      className={cn(
        'fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none',
        'font-black tracking-tight flex items-center gap-2',
        sizeClasses[message.intensity],
        colorClasses[message.color as keyof typeof colorClasses] || 'text-white',
        animating ? 'animate-feedback-in' : 'animate-feedback-out'
      )}
      style={{
        textShadow: message.color === 'rainbow'
          ? '0 0 30px #fbbf24, 0 0 60px #f59e0b, 0 0 90px #d97706'
          : message.intensity === 'epic' 
          ? '0 0 40px currentColor, 0 0 80px currentColor'
          : message.intensity === 'high'
          ? '0 0 20px currentColor'
          : '0 0 10px currentColor',
      }}
    >
      <span>{message.emoji}</span>
      <span>{message.text}</span>
    </div>
  );
};

export default FeedbackText;
