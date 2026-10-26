import React, { useEffect } from 'react';
import { UpgradeCard } from '../types/game';
import { 
  Orbit, 
  Swords, 
  Flame, 
  Snowflake, 
  Zap, 
  HeartPulse, 
  Compass, 
  Sparkles, 
  Wind, 
  Target, 
  Shield, 
  Skull 
} from 'lucide-react';

interface LevelUpModalProps {
  cards: UpgradeCard[];
  onSelectCard: (card: UpgradeCard) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Orbit: <Orbit className="w-8 h-8 text-cyan-400" />,
  Sword: <Swords className="w-8 h-8 text-amber-400" />,
  Flame: <Flame className="w-8 h-8 text-orange-500" />,
  Snowflake: <Snowflake className="w-8 h-8 text-sky-300" />,
  Zap: <Zap className="w-8 h-8 text-yellow-400" />,
  HeartPulse: <HeartPulse className="w-8 h-8 text-rose-400" />,
  Compass: <Compass className="w-8 h-8 text-emerald-400" />,
  Sparkles: <Sparkles className="w-8 h-8 text-purple-400" />,
  Wind: <Wind className="w-8 h-8 text-teal-300" />,
  Target: <Target className="w-8 h-8 text-red-400" />,
  Shield: <Shield className="w-8 h-8 text-indigo-400" />,
  Skull: <Skull className="w-8 h-8 text-purple-300" />,
};

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  cards,
  onSelectCard,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' && cards[0]) onSelectCard(cards[0]);
      if (e.key === '2' && cards[1]) onSelectCard(cards[1]);
      if (e.key === '3' && cards[2]) onSelectCard(cards[2]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cards, onSelectCard]);

  const getRarityBadge = (rarity: UpgradeCard['rarity']) => {
    if (rarity === 'legendary') {
      return {
        text: 'LEGENDARY',
        border: 'border-amber-500/80 hover:border-amber-400 shadow-amber-500/20',
        badge: 'text-amber-400 bg-amber-950/60 border-amber-500/50',
      };
    }
    if (rarity === 'rare') {
      return {
        text: 'RARE',
        border: 'border-purple-500/80 hover:border-purple-400 shadow-purple-500/20',
        badge: 'text-purple-400 bg-purple-950/60 border-purple-500/50',
      };
    }
    return {
      text: 'COMMON',
      border: 'border-cyan-500/50 hover:border-cyan-400 shadow-cyan-500/10',
      badge: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/50',
    };
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm select-none">
      <div className="w-full max-w-4xl flex flex-col items-center">
        {/* Modal Header */}
        <div className="text-center mb-8">
          <div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase mb-1">
            ARCANE TRANSCENDENCE
          </div>
          <h2 className="font-cinzel text-3xl sm:text-4xl font-black text-slate-100 tracking-wide">
            CHOOSE YOUR BLESSING
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Select a synergistic power to adapt your combat form against the living curse.
          </p>
        </div>

        {/* 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
          {cards.map((card, idx) => {
            const style = getRarityBadge(card.rarity);
            return (
              <div
                key={card.id}
                onClick={() => onSelectCard(card)}
                className={`relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/90 border-2 ${style.border} shadow-2xl transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer group`}
              >
                {/* Number Key Hint */}
                <div className="absolute top-3 right-3 w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-mono font-bold text-slate-400 group-hover:text-cyan-300">
                  {idx + 1}
                </div>

                <div>
                  {/* Rarity & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border tracking-wider ${style.badge}`}>
                      {style.text}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 w-fit mb-4 group-hover:scale-105 transition-transform">
                    {ICON_MAP[card.icon] || <Sparkles className="w-8 h-8 text-cyan-400" />}
                  </div>

                  <h3 className="font-cinzel text-lg font-bold text-slate-100 mb-2 group-hover:text-cyan-300 transition-colors">
                    {card.name}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Bottom CTA */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400">
                  <span>INSCRIBE RUNE</span>
                  <span className="text-slate-500 font-mono">[{idx + 1}]</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
