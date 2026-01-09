import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Dices } from 'lucide-react';

interface ConsentModalProps {
  onAccept: () => void;
}

const ConsentModal: React.FC<ConsentModalProps> = ({ onAccept }) => {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleAccept = () => {
    onAccept();
  };

  // Simple inline terms/privacy content
  if (showTerms) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl bg-card p-6">
          <h2 className="text-xl font-bold mb-4">Terms of Use</h2>
          <div className="text-sm text-muted-foreground space-y-3">
            <p>Welcome to Block Blast! By using this app, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Use the app for personal, non-commercial purposes only</li>
              <li>Not attempt to cheat, hack, or exploit the game</li>
              <li>Accept that game progress is stored locally on your device</li>
              <li>Understand that in-app purchases are non-refundable</li>
              <li>Allow optional ads to support free gameplay</li>
            </ul>
            <p className="pt-2">We reserve the right to update these terms at any time. Continued use constitutes acceptance.</p>
          </div>
          <button
            onClick={() => setShowTerms(false)}
            className="mt-6 w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (showPrivacy) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl bg-card p-6">
          <h2 className="text-xl font-bold mb-4">Privacy Policy</h2>
          <div className="text-sm text-muted-foreground space-y-3">
            <p>Your privacy matters to us. Here's how we handle your data:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Local Storage:</strong> Game progress, scores, and settings are stored only on your device</li>
              <li><strong>No Account Required:</strong> We don't collect personal information</li>
              <li><strong>Analytics:</strong> Anonymous usage data may be collected to improve the game</li>
              <li><strong>Ads:</strong> Third-party ad networks may use cookies for personalization</li>
              <li><strong>No Sharing:</strong> We don't sell or share your data with third parties</li>
            </ul>
            <p className="pt-2">You can manage ad preferences in Settings → Privacy Preference.</p>
          </div>
          <button
            onClick={() => setShowPrivacy(false)}
            className="mt-6 w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred background */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className={cn(
          "relative w-full max-w-sm rounded-3xl p-6 text-center",
          "animate-scale-in"
        )}
        style={{
          background: 'linear-gradient(180deg, hsl(230 25% 18%) 0%, hsl(230 25% 12%) 100%)',
          border: '1px solid hsl(230 20% 25% / 0.6)',
          boxShadow: '0 25px 50px -12px hsl(0 0% 0% / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.08)',
        }}
      >
        {/* Animated icon */}
        <div className="relative mx-auto mb-6 w-20 h-20 flex items-center justify-center">
          <div 
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, hsl(200 100% 60%) 0%, transparent 70%)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          <div className="relative">
            <Dices 
              className="w-14 h-14 text-primary" 
              style={{
                filter: 'drop-shadow(0 0 10px hsl(200 100% 60% / 0.5))',
              }}
            />
          </div>
        </div>

        {/* Welcome text */}
        <h2 
          className="text-2xl font-bold mb-2"
          style={{
            background: 'linear-gradient(to bottom, hsl(0 0% 100%), hsl(0 0% 80%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Welcome to Block Blast!
        </h2>
        
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Please read and accept our{' '}
          <button 
            onClick={() => setShowTerms(true)}
            className="text-primary underline underline-offset-2 hover:brightness-110 transition-all"
          >
            Terms of Use
          </button>
          {' '}and{' '}
          <button 
            onClick={() => setShowPrivacy(true)}
            className="text-primary underline underline-offset-2 hover:brightness-110 transition-all"
          >
            Privacy Policy
          </button>
        </p>

        {/* Accept button */}
        <button
          onClick={handleAccept}
          className={cn(
            "w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200",
            "hover:scale-[1.02] active:scale-[0.98]"
          )}
          style={{
            background: 'linear-gradient(135deg, hsl(145 70% 45%) 0%, hsl(145 60% 35%) 100%)',
            color: 'white',
            boxShadow: '0 4px 20px hsl(145 70% 40% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.2)',
          }}
        >
          Accept
        </button>

        {/* Subtle note */}
        <p className="text-muted-foreground/50 text-xs mt-4">
          By tapping Accept, you agree to our terms
        </p>
      </div>
    </div>
  );
};

export default ConsentModal;
