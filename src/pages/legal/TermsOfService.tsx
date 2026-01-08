import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsOfServicePageProps {
  onBack: () => void;
}

const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ onBack }) => {
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
        <h2 className="text-lg font-bold text-white">Terms of Service</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-white/80 text-sm leading-relaxed">
        <p className="text-white/50 text-xs">Last updated: January 2025</p>

        <section>
          <h3 className="font-bold text-white mb-2">1. Acceptance of Terms</h3>
          <p>
            By downloading, installing, or using this game ("Block Puzzle"), you agree to be bound by these Terms of Service. 
            If you do not agree, please do not use the app.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-white mb-2">2. License</h3>
          <p>
            We grant you a limited, non-exclusive, non-transferable, revocable license to use the app for personal, 
            non-commercial purposes. You may not copy, modify, distribute, sell, or lease any part of the app.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-white mb-2">3. Prohibited Use</h3>
          <p>You agree not to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-white/70">
            <li>Use cheats, exploits, or unauthorized third-party tools</li>
            <li>Reverse engineer, decompile, or disassemble the app</li>
            <li>Use the app for any illegal or unauthorized purpose</li>
            <li>Interfere with or disrupt the app's functionality</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-white mb-2">4. Virtual Items & Purchases</h3>
          <p>
            The app may offer in-app purchases. All purchases are final and non-refundable, except where required by law. 
            Virtual items have no real-world value and cannot be exchanged for cash.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-white mb-2">5. Advertisements</h3>
          <p>
            The free version of the app may display advertisements. These ads are provided by third-party networks and 
            are subject to their own terms and privacy policies.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-white mb-2">6. Disclaimer</h3>
          <p>
            The app is provided "as is" without warranties of any kind. We do not guarantee that the app will be 
            error-free or uninterrupted.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-white mb-2">7. Limitation of Liability</h3>
          <p>
            To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, 
            or consequential damages arising from your use of the app.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-white mb-2">8. Termination</h3>
          <p>
            We may terminate or suspend your access to the app at any time, without prior notice, for any reason, 
            including violation of these terms.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-white mb-2">9. Changes to Terms</h3>
          <p>
            We may update these terms from time to time. Continued use of the app after changes constitutes 
            acceptance of the new terms.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-white mb-2">10. Contact</h3>
          <p>
            For questions about these terms, please contact us through the app's Contact Us section.
          </p>
        </section>

        <div className="h-4" />
      </div>
    </>
  );
};

export default TermsOfServicePage;
