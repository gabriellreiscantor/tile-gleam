import React from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import { getAppVersion } from '@/lib/settings';

interface AboutPageProps {
  onBack: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>
        <h2 className="text-lg font-bold text-white">About</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col items-center text-center">
        {/* App Icon */}
        <div 
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-4"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
          }}
        >
          <span className="text-5xl">🧩</span>
        </div>

        {/* App Name */}
        <h1 className="text-2xl font-bold text-white mb-1">Block Puzzle</h1>
        <p className="text-white/50 text-sm mb-6">Version {getAppVersion()}</p>

        {/* Description */}
        <div className="text-white/70 text-sm leading-relaxed space-y-4 mb-8">
          <p>
            Block Puzzle is a relaxing yet challenging puzzle game designed to train your brain 
            and provide hours of entertainment.
          </p>
          <p>
            Drag and drop blocks onto the board to create complete rows or columns. 
            Clear lines to score points and prevent the board from filling up!
          </p>
          <p>
            Challenge yourself to beat your high score and become a puzzle master!
          </p>
        </div>

        {/* Made with love */}
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <span>Made with</span>
          <Heart className="w-4 h-4 text-red-400 fill-red-400" />
          <span>by Savini Comunicação</span>
        </div>

        {/* Copyright */}
        <p className="mt-4 text-white/30 text-xs">
          © 2025 Savini Comunicação. All rights reserved.
        </p>

        <div className="h-4" />
      </div>
    </>
  );
};

export default AboutPage;
