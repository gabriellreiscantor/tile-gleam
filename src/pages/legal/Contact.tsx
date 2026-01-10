import React, { useState } from 'react';
import { ArrowLeft, Send, Mail } from 'lucide-react';

interface ContactPageProps {
  onBack: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    // Easter egg: código secreto para acessar debug mode
    if (
      subject.toLowerCase().trim() === 'debug' && 
      message.toLowerCase().trim() === '@@debug'
    ) {
      window.location.href = '/debug';
      return;
    }

    // For MVP: Open mail composer
    const email = 'support@blockpuzzle.app';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject || 'Feedback')}&body=${encodeURIComponent(message)}`;
    window.open(mailtoUrl, '_blank');
    setSent(true);
  };

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
        <h2 className="text-lg font-bold text-white">Contact Us</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {sent ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Thank You!</h3>
            <p className="text-white/60 text-sm">
              Your message has been prepared. Please complete sending it in your email app.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-6 px-6 py-2 rounded-xl bg-white/10 text-white font-medium"
            >
              Send Another
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-white/60 text-sm mb-4">
              Have questions, feedback, or need help? We'd love to hear from you!
            </p>

            {/* Subject */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Bug Report, Feature Request"
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-white/5 border border-white/10
                  text-white placeholder-white/30
                  focus:outline-none focus:border-white/30
                  transition-colors
                "
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={5}
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-white/5 border border-white/10
                  text-white placeholder-white/30
                  focus:outline-none focus:border-white/30
                  transition-colors resize-none
                "
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className={`
                w-full flex items-center justify-center gap-2
                px-6 py-3 rounded-xl font-semibold
                transition-all
                ${message.trim()
                  ? 'bg-emerald-500 text-white active:scale-95'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
                }
              `}
              style={{
                boxShadow: message.trim() ? '0 4px 12px rgba(16, 185, 129, 0.4)' : 'none',
              }}
            >
              <Send className="w-5 h-5" />
              <span>Send Message</span>
            </button>

            {/* Alternative */}
            <p className="text-center text-white/40 text-xs mt-4">
              Or email us directly at support@blockpuzzle.app
            </p>
          </div>
        )}

        <div className="h-4" />
      </div>
    </>
  );
};

export default ContactPage;
