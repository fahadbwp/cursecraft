import React from 'react';
import { Trophy, Skull, Sparkles, RotateCcw, Shield, Clock } from 'lucide-react';

interface GameOverModalProps {
  isVictory: boolean;
  timeSurvived: number;
  kills: number;
  crystalsEarned: number;
  relicsEarned: number;
  bossDefeated: boolean;
  onPlayAgain: () => void;
  onOpenSanctum: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  timeSurvived,
  kills,
  crystalsEarned,
  relicsEarned,
  bossDefeated,
  onPlayAgain,
  onOpenSanctum,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md select-none">
      <div className="w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center text-center">
        {/* Banner Icon */}
        <div className={`p-4 rounded-full mb-4 border ${
          isVictory 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
        }`}>
          {isVictory ? <Trophy className="w-10 h-10" /> : <Skull className="w-10 h-10" />}
        </div>

        {/* Title */}
        <div className="text-xs font-mono font-bold tracking-widest uppercase mb-1 text-slate-400">
          {isVictory ? "EXPEDITION COMPLETE" : "THE CURSE CONSUMED YOU"}
        </div>
        <h2 className="font-cinzel text-3xl font-black text-slate-100 mb-2">
          {isVictory ? "GLORIOUS EXTRACTION" : "MORTAL FALL"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mb-6 max-w-sm">
          {isVictory 
            ? "You extracted with ancient knowledge and uncorrupted soul essence."
            : "Your physical form dissolved, but gathered soul crystals echo back to the Sanctum."}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6 text-left">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Time Survived</span>
            </div>
            <div className="font-mono-numbers text-lg font-bold text-slate-200">
              {formatTime(timeSurvived)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Skull className="w-3.5 h-3.5" />
              <span>Nightmares Slain</span>
            </div>
            <div className="font-mono-numbers text-lg font-bold text-slate-200">
              {kills}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-purple-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Soul Crystals</span>
            </div>
            <div className="font-mono-numbers text-lg font-bold text-purple-300">
              +{crystalsEarned}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>Relics Banked</span>
            </div>
            <div className="font-mono-numbers text-lg font-bold text-amber-300">
              +{relicsEarned}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onOpenSanctum}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Shield className="w-4 h-4 text-purple-400" />
            <span>SANCTUM ALTAR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
