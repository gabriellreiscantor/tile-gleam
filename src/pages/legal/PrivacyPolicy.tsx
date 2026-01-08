import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onBack: () => void;
}

const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack }) => {
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
        <h2 className="text-lg font-bold text-white">Privacy Policy</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-white/80 text-sm leading-relaxed">
        <p className="text-white/50 text-xs">Last updated: January 2025</p>

        <section>
          <h3 className="font-bold text-white mb-2">Overview</h3>
          <p>
            This Privacy Policy explains how we collect, use, and protect your information when you use Block Puzzle. 
            Your privacy is very important to us.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-white mb-2">Information We Collect</h3>
          <p className="mb-2">We may collect the following types of information:</p>
          <ul className="list-disc list-inside space-y-1 text-white/70">
            <li><strong className="text-white/90">Device Information:</strong> Device type, OS version, and unique identifiers for analytics and ads</li>
            <li><strong className="text-white/90">Game Progress:</strong> Scores and achievements stored locally on your device</li>
            <li><strong className="text-white/90">Usage Data:</strong> How you interact with the app (if analytics is enabled)</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-white mb-2">Advertisements</h3>
          <p>
            We use Google AdMob to display advertisements. AdMob may collect device information to serve 
            personalized or non-personalized ads based on your preferences. You can manage ad personalization 
            in the Privacy Preference section.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-white mb-2">In-App Purchases</h3>
          <p>
            Purchases are processed through the Apple App Store or Google Play Store. We do not collect or 
            store your payment information. We only store your entitlement status to unlock purchased features.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-white mb-2">Data Storage</h3>
          <p>
            Your game progress and preferences are stored locally on your device. We do not upload your 
            personal game data to external servers unless you choose to use cloud sync features (if available).
          </p>
        </section>

        <section>
          <h3 className="font-bold text-white mb-2">Children's Privacy</h3>
          <p>
            This app is not directed to children under 13. We do not knowingly collect personal information 
            from children under 13. If you believe a child has provided us with personal information, 
            please contact us.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-white mb-2">Your Rights</h3>
          <p className="mb-2">You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 text-white/70">
            <li>Access the personal data we hold about you</li>
            <li>Request deletion of your data</li>
            <li>Opt out of personalized advertising</li>
            <li>Disable analytics tracking</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, please contact us through the Contact Us section or email us directly.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-white mb-2">Third-Party Services</h3>
          <p>
            We may use third-party services such as Google AdMob and analytics providers. These services 
            have their own privacy policies that govern their collection and use of your information.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-white mb-2">Changes to This Policy</h3>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any significant 
            changes through the app.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-white mb-2">Contact Us</h3>
          <p>
            If you have questions about this Privacy Policy, please contact us through the app's Contact Us section.
          </p>
        </section>

        <div className="h-4" />
      </div>
    </>
  );
};

export default PrivacyPolicyPage;
