import React from 'react';
import { ShieldCheck, Flame, Trophy, Sparkles, AlertTriangle } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface ExtractionChoiceModalProps {
  crystalsEarned: number;
  relicsEarned: number;
  onExtractSafe: () => void;
  onPushDeeper: () => void;
}

export const ExtractionChoiceModal: React.FC<ExtractionChoiceModalProps> = ({
  crystalsEarned,
  relicsEarned,
  onExtractSafe,
  onPushDeeper,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md select-none">
      <div className="w-full max-w-2xl flex flex-col items-center text-center">
        {/* Banner */}
        <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4 animate-bounce">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase mb-1">
          SECTOR TITAN CONQUERED
        </div>
        <h2 className="font-cinzel text-3xl sm:text-4xl font-black text-slate-100 tracking-wide mb-2">
          THE EXTRACTION PORTAL AWAKENS
        </h2>
        <p className="text-sm text-slate-300 max-w-lg mb-6 leading-relaxed">
          The barrier between realms fractures. Will you seal your triumphs and bank your spoils, or dive deeper into the nightmare crypt for double relics?
        </p>

        {/* Current Spoils Bar */}
        <div className="flex items-center gap-6 px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 mb-8">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="font-mono-numbers text-base font-bold text-slate-100">{crystalsEarned}</span>
            <span className="text-xs text-slate-400">Soul Crystals</span>
          </div>
          <div className="w-px h-5 bg-slate-800" />
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-mono-numbers text-base font-bold text-slate-100">{relicsEarned}</span>
            <span className="text-xs text-slate-400">Ancient Relic</span>
          </div>
        </div>

        {/* The Two Choices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {/* Choice 1: Safe Extraction */}
          <div
            onClick={() => {
              sound.playPortalActive();
              onExtractSafe();
            }}
            className="flex flex-col justify-between p-6 rounded-2xl bg-slate-900/80 border-2 border-emerald-500/50 hover:border-emerald-400 hover:bg-slate-900 shadow-lg shadow-emerald-500/10 transition-all cursor-pointer group text-left"
          >
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono uppercase mb-3">
                <ShieldCheck className="w-4 h-4" />
                <span>SAFE EXTRACTION</span>
              </div>
              <h3 className="font-cinzel text-xl font-bold text-slate-100 mb-2 group-hover:text-emerald-300 transition-colors">
                Return to Sanctum
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Bank 100% of collected Soul Crystals and Ancient Relics permanently. Complete this expedition as a victor.
              </p>
            </div>

            <div className="w-full py-2.5 rounded-lg bg-emerald-600 group-hover:bg-emerald-500 text-slate-950 font-bold text-xs text-center transition-colors">
              EXTRACT SAFELY
            </div>
          </div>

          {/* Choice 2: Push Deeper */}
          <div
            onClick={() => {
              sound.playBossRoar();
              onPushDeeper();
            }}
            className="flex flex-col justify-between p-6 rounded-2xl bg-slate-900/80 border-2 border-rose-500/60 hover:border-rose-400 hover:bg-slate-900 shadow-lg shadow-rose-500/15 transition-all cursor-pointer group text-left"
          >
            <div>
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs font-mono uppercase mb-3">
                <Flame className="w-4 h-4 fill-current" />
                <span>PUSH DEEPER (SECTOR 2)</span>
              </div>
              <h3 className="font-cinzel text-xl font-bold text-slate-100 mb-2 group-hover:text-rose-300 transition-colors">
                The Sunken Crypt
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Venture into the molten subterranean ruins. Gain <strong className="text-rose-300">+100% bonus crystals & relics</strong>, but face instant Nightmare curse escalation!
              </p>
            </div>

            <div className="w-full py-2.5 rounded-lg bg-rose-600 group-hover:bg-rose-500 text-white font-bold text-xs text-center transition-colors shadow-md shadow-rose-600/30">
              PLUNGE INTO SECTOR 2
            </div>
          </div>
        </div>

        {/* Warning note */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-6">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>If you perish in Sector 2, you keep banked altar progression but forfeit run glory.</span>
        </div>
      </div>
    </div>
  );
};
