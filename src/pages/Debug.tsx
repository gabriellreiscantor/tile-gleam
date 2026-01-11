import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FeedbackText from '@/components/game/FeedbackText';
import ParticleEffect from '@/components/game/ParticleEffect';
import AnimatedScore from '@/components/game/AnimatedScore';
import GameOverModal from '@/components/game/GameOverModal';
import {
  getClearMessage,
  getComboMessage,
  getPerfectMessage,
  getCloseMessage,
  getPlaceMessage,
  triggerHaptic,
  type FeedbackMessage,
} from '@/lib/feedback';
import { 
  loadResources, 
  saveResources, 
  grantPaidUndos, 
  resetDailyUndo,
  type ContinueEligibility 
} from '@/lib/playerResources';
import ItemHUD from '@/components/game/ItemHUD';
import { 
  loadItemResources, 
  saveItemResources, 
  loadSessionStats,
  type ItemResources 
} from '@/lib/collectibles';
import { resetTutorial } from '@/lib/tutorial';
import { resetStarTutorial, clearGameStartTime } from '@/lib/starTutorial';
const Debug: React.FC = () => {
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null);
  const [particleTrigger, setParticleTrigger] = useState<{ x: number; y: number; color: string } | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameOverIsRecord, setGameOverIsRecord] = useState(false);
  const [continueState, setContinueState] = useState<'free' | 'ad' | 'paid-only'>('free');
  const [itemResources, setItemResources] = useState<ItemResources>(loadItemResources());

  const showFeedback = (message: FeedbackMessage) => {
    setFeedbackMessage(null);
    setTimeout(() => setFeedbackMessage(message), 50);
  };

  const triggerParticles = (color: string) => {
    setParticleTrigger(null);
    setTimeout(() => {
      setParticleTrigger({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        color,
      });
    }, 50);
  };

  return (
    <div className="fixed inset-0 bg-background p-4 pb-20 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">🔧 DEBUG MODE</h1>
      </div>

      {/* Feedback Display Area */}
      <div className="relative h-32 mb-6 bg-muted/30 rounded-xl flex items-center justify-center border border-border">
        <span className="text-muted-foreground text-sm">Preview Area</span>
        <FeedbackText message={feedbackMessage} onComplete={() => setFeedbackMessage(null)} />
        <ParticleEffect trigger={particleTrigger} count={20} />
      </div>

      {/* Clear Messages */}
      <Section title="📢 CLEAR MESSAGES">
        <div className="flex flex-col items-center gap-2">
          {/* Row 1: 1, 2, 3 Lines */}
          <div className="flex gap-2 justify-center">
            {[1, 2, 3].map((lines) => (
              <Button
                key={lines}
                variant="outline"
                onClick={() => showFeedback(getClearMessage(lines))}
              >
                {lines} Line{lines > 1 ? 's' : ''}
              </Button>
            ))}
          </div>
          {/* Row 2: 4 Lines centered */}
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => showFeedback(getClearMessage(4))}>
              4 Lines
            </Button>
          </div>
        </div>
      </Section>

      {/* Combo Messages */}
      <Section title="🔥 COMBO MESSAGES">
        <div className="flex flex-col items-center gap-2">
          {/* Linha 1: x2, x3, x4 */}
          <div className="flex gap-2 justify-center">
            {[2, 3, 4].map((c) => {
              const msg = getComboMessage(c);
              return (
                <Button
                  key={c}
                  variant="outline"
                  className="w-24"
                  onClick={() => {
                    if (msg) {
                      showFeedback(msg);
                      setCombo(c);
                    }
                  }}
                >
                  x{c} Combo
                </Button>
              );
            })}
          </div>
          {/* Linha 2: x5, x6 */}
          <div className="flex gap-2 justify-center">
            {[5, 6].map((c) => {
              const msg = getComboMessage(c);
              return (
                <Button
                  key={c}
                  variant="outline"
                  className="w-24"
                  onClick={() => {
                    if (msg) {
                      showFeedback(msg);
                      setCombo(c);
                    }
                  }}
                >
                  x{c} Combo
                </Button>
              );
            })}
          </div>
          {/* Reset */}
          <Button variant="ghost" size="sm" onClick={() => setCombo(0)}>
            Reset Combo
          </Button>
        </div>
      </Section>

      {/* Special Messages */}
      <Section title="⭐ SPECIAL MESSAGES">
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            className="border-yellow-500/50"
            onClick={() => showFeedback(getPerfectMessage())}
          >
            🏆 PERFECT!
          </Button>
          <Button
            variant="outline"
            className="border-red-500/50"
            onClick={() => showFeedback(getCloseMessage())}
          >
            😰 Careful!
          </Button>
          <Button
            variant="outline"
            onClick={() => showFeedback(getPlaceMessage())}
          >
            👍 Nice Place
          </Button>
        </div>
      </Section>

      {/* Particles */}
      <Section title="💥 PARTICLES">
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            className="border-cyan-500/50"
            onClick={() => triggerParticles('#22d3ee')}
          >
            Cyan
          </Button>
          <Button
            variant="outline"
            className="border-yellow-500/50"
            onClick={() => triggerParticles('#facc15')}
          >
            Yellow
          </Button>
          <Button
            variant="outline"
            className="border-orange-500/50"
            onClick={() => triggerParticles('#f97316')}
          >
            Orange
          </Button>
          <Button
            variant="outline"
            className="border-purple-500/50"
            onClick={() => triggerParticles('#a855f7')}
          >
            Purple
          </Button>
          <Button
            variant="outline"
            className="border-pink-500/50"
            onClick={() => triggerParticles('#ec4899')}
          >
            Rainbow
          </Button>
        </div>
      </Section>

      {/* Score */}
      <Section title="🎯 ANIMATED SCORE">
        <div className="flex items-center justify-center gap-6 mb-4">
          <AnimatedScore score={score} combo={combo} />
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="outline" onClick={() => setScore((s) => s + 100)}>
            +100
          </Button>
          <Button variant="outline" onClick={() => setScore((s) => s + 500)}>
            +500
          </Button>
          <Button variant="outline" onClick={() => setScore((s) => s + 1000)}>
            +1000
          </Button>
          <Button variant="ghost" onClick={() => setScore(0)}>
            Reset
          </Button>
        </div>
      </Section>

      {/* Haptics */}
      <Section title="📳 HAPTICS (mobile)">
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="outline" onClick={() => triggerHaptic('light')}>
            Light
          </Button>
          <Button variant="outline" onClick={() => triggerHaptic('medium')}>
            Medium
          </Button>
          <Button variant="outline" onClick={() => triggerHaptic('heavy')}>
            Heavy
          </Button>
          <Button variant="outline" onClick={() => triggerHaptic('success')}>
            Success
          </Button>
          <Button variant="outline" onClick={() => triggerHaptic('warning')}>
            Warning
          </Button>
          <Button variant="outline" onClick={() => triggerHaptic('error')}>
            Error
          </Button>
        </div>
      </Section>

      {/* Continue Modal */}
      <Section title="💀 CONTINUE MODAL (Game Over)">
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            className="border-green-500/50"
            onClick={() => {
              setContinueState('free');
              setShowContinueModal(true);
            }}
          >
            Free Continue
          </Button>
          <Button
            variant="outline"
            className="border-orange-500/50"
            onClick={() => {
              setContinueState('ad');
              setShowContinueModal(true);
            }}
          >
            Ad Available
          </Button>
          <Button
            variant="outline"
            className="border-purple-500/50"
            onClick={() => {
              setContinueState('paid-only');
              setShowContinueModal(true);
            }}
          >
            Paid Only
          </Button>
        </div>
      </Section>

      {/* Game Over Modal */}
      <Section title="🏆 GAME OVER MODAL">
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            className="border-blue-500/50"
            onClick={() => {
              setGameOverIsRecord(false);
              setShowGameOverModal(true);
            }}
          >
            Standard
          </Button>
          <Button
            variant="outline"
            className="border-amber-500/50"
            onClick={() => {
              setGameOverIsRecord(true);
              setShowGameOverModal(true);
            }}
          >
            🏆 New Record!
          </Button>
        </div>
      </Section>

      {/* Undo Debug */}
      <Section title="↩️ UNDO SYSTEM">
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            className="border-amber-500/50"
            onClick={() => {
              const resources = loadResources();
              saveResources(grantPaidUndos(resources, 3));
              triggerHaptic('success');
            }}
          >
            🎁 +3 Paid Undos
          </Button>
          <Button
            variant="outline"
            className="border-green-500/50"
            onClick={() => {
              const resources = loadResources();
              saveResources(resetDailyUndo(resources));
              triggerHaptic('success');
            }}
          >
            🔄 Reset Daily Undo
          </Button>
        </div>
      </Section>

      {/* Collectibles Debug */}
      <Section title="💎⭐ COLLECTIBLES">
        <div className="mb-4">
          <ItemHUD resources={itemResources} />
        </div>
        <div className="text-xs text-muted-foreground mb-4 space-y-2 max-w-xs text-left">
          <div>
            <strong className="text-purple-400">💎 Crystal</strong> — Moeda premium
            <ul className="ml-4 list-disc">
              <li>3💎 → Continue extra</li>
              <li>2💎 → Re-roll peças</li>
            </ul>
          </div>
          <div>
            <strong className="text-yellow-400">⭐ Star</strong> — Evento épico (ultra raro!)
            <ul className="ml-4 list-disc">
              <li>1⭐ → COLOR CONVERGENCE</li>
              <li>Converte cor dominante → explosão massiva</li>
              <li>Multiplicador ×2.5 nos pontos</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            className="border-purple-500/50"
            onClick={() => {
              const updated = { ...itemResources, crystals: itemResources.crystals + 1 };
              saveItemResources(updated);
              setItemResources(updated);
              triggerHaptic('success');
            }}
          >
            💎 +1 Crystal
          </Button>
          <Button
            variant="outline"
            className="border-yellow-500/50"
            onClick={() => {
              const updated = { ...itemResources, stars: itemResources.stars + 1 };
              saveItemResources(updated);
              setItemResources(updated);
              triggerHaptic('success');
            }}
          >
            ⭐ +1 Star
          </Button>
          <Button
            variant="outline"
            className="border-red-500/50"
            onClick={() => {
              const reset = { crystals: 0, stars: 0 };
              saveItemResources(reset);
              setItemResources(reset);
              triggerHaptic('warning');
            }}
          >
            🔄 Reset Items
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              console.log('📊 Session Stats:', loadSessionStats());
              console.log('📊 Item Resources:', itemResources);
            }}
          >
            📊 Log Stats
          </Button>
        </div>
      </Section>

      {/* Test Items in Game */}
      <Section title="🎮 TESTAR NO JOGO">
        <p className="text-xs text-muted-foreground mb-3 text-center">
          Inicia um jogo com o item aparecendo no tabuleiro (posição 3,3)
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            className="border-purple-500/50 bg-purple-500/10"
            onClick={() => {
              localStorage.setItem('debug_force_spawn_item', 'crystal');
              window.location.href = '/';
            }}
          >
            💎 Jogar com Crystal
          </Button>
          <Button
            variant="outline"
            className="border-yellow-500/50 bg-yellow-500/10"
            onClick={() => {
              localStorage.setItem('debug_force_spawn_item', 'star');
              window.location.href = '/';
            }}
          >
            ⭐ Jogar com Star
          </Button>
        </div>
      </Section>

      {/* Tutorial Debug */}
      <Section title="📚 TUTORIAL">
        <p className="text-xs text-muted-foreground mb-3 text-center max-w-xs">
          Reseta os tutoriais para testar como usuário novo
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            className="border-cyan-500/50 bg-cyan-500/10"
            onClick={() => {
              resetTutorial();
              triggerHaptic('success');
              window.location.href = '/';
            }}
          >
            🎓 Resetar Tutorial Principal
          </Button>
          <Button
            variant="outline"
            className="border-yellow-500/50 bg-yellow-500/10"
            onClick={() => {
              resetStarTutorial();
              clearGameStartTime();
              triggerHaptic('success');
              window.location.href = '/';
            }}
          >
            ⭐ Resetar Tutorial da Estrela
          </Button>
          <Button
            variant="outline"
            className="border-green-500/50 bg-green-500/10"
            onClick={() => {
              resetTutorial();
              resetStarTutorial();
              clearGameStartTime();
              triggerHaptic('success');
              window.location.href = '/';
            }}
          >
            🔄 Resetar TODOS Tutoriais
          </Button>
        </div>
      </Section>

      {/* Continue Modal Component - Now uses GameOverModal */}
      {showContinueModal && (
        <GameOverModal
          score={score || 1248}
          highScore={500}
          onRestart={() => {
            setShowContinueModal(false);
            showFeedback({ text: 'NEW GAME!', emoji: '🎮', intensity: 'medium', color: 'cyan' });
          }}
          showContinueOptions={true}
          eligibility={{
            canOffer: true,
            state: continueState,
            hasPaidContinue: true,
            canWatchAd: continueState === 'ad',
          } as ContinueEligibility}
          itemResources={{ crystals: 5, stars: 1 }}
          onContinueFree={() => {
            setShowContinueModal(false);
            showFeedback({ text: 'FREE CONTINUE!', emoji: '🎁', intensity: 'high', color: 'green' });
          }}
          onContinuePaid={() => {
            setShowContinueModal(false);
            showFeedback({ text: 'PAID CONTINUE!', emoji: '💰', intensity: 'high', color: 'green' });
          }}
          onContinueAd={() => {
            setShowContinueModal(false);
            showFeedback({ text: 'AD CONTINUE!', emoji: '🎬', intensity: 'high', color: 'green' });
          }}
          onContinueCrystal={() => {
            setShowContinueModal(false);
            showFeedback({ text: 'CRYSTAL CONTINUE!', emoji: '💎', intensity: 'high', color: 'purple' });
          }}
          onDecline={() => {
            setShowContinueModal(false);
            showFeedback({ text: 'GAME OVER', emoji: '💀', intensity: 'medium', color: 'destructive' });
          }}
        />
      )}

      {/* Game Over Modal Component */}
      {showGameOverModal && (
        <GameOverModal
          score={gameOverIsRecord ? 1248 : 45}
          highScore={gameOverIsRecord ? 1248 : 262}
          onRestart={() => {
            setShowGameOverModal(false);
            showFeedback({ text: 'NEW GAME!', emoji: '🎮', intensity: 'medium', color: 'cyan' });
          }}
        />
      )}
    </div>
  );
};

// Helper component for sections
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6 flex flex-col items-center">
    <h2 className="text-sm font-semibold text-muted-foreground mb-3">{title}</h2>
    {children}
  </div>
);

export default Debug;
