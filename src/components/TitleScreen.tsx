import React, { useEffect } from 'react';
import { SaveData } from '../types/game';
import { Volume2, VolumeX, Shield, Trophy, Sparkles, Play } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface TitleScreenProps {
  saveData: SaveData;
  onStartGame: () => void;
  onOpenSanctum: () => void;
  onToggleSound: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  saveData,
  onStartGame,
  onOpenSanctum,
  onToggleSound,
}) => {
  // Key listener for Enter / Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden z-20">
      {/* Background Animated Gradient / Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(15,23,42,0.6)_0%,_rgba(7,9,14,0.9)_60%,_#040608_100%)] pointer-events-none" />

      {/* Top Bar: Banked Crystals & Sound Controls */}
      <div className="w-full max-w-5xl flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-purple-300">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="font-mono-numbers text-sm font-semibold text-purple-200">
              {saveData.bankedCrystals}
            </span>
            <span className="text-[11px] text-purple-400/80">Crystals</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-amber-300">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-mono-numbers text-sm font-semibold text-amber-200">
              {saveData.bankedRelics}
            </span>
            <span className="text-[11px] text-amber-400/80">Relics</span>
          </div>

          {saveData.bestSurvivalSeconds > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
              <span>Best:</span>
              <span className="font-mono-numbers text-slate-200">{formatTime(saveData.bestSurvivalSeconds)}</span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleSound}
          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          title={saveData.soundEnabled ? "Mute Audio" : "Unmute Audio"}
        >
          {saveData.soundEnabled ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
        </button>
      </div>

      {/* Center Brand Lockup & Hero Presentation */}
      <div className="flex flex-col items-center text-center max-w-3xl my-auto relative z-10 px-4">
        {/* Bespoke Inline SVG Title Lockup */}
        <div className="relative mb-6">
          <svg className="w-72 sm:w-96 h-28 mx-auto" viewBox="0 0 380 110" fill="none">
            {/* Mystic Runic Wings */}
            <path
              d="M30 55 C 80 20, 140 30, 180 50 C 140 70, 80 80, 30 55 Z"
              fill="rgba(56, 189, 248, 0.08)"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <path
              d="M350 55 C 300 20, 240 30, 200 50 C 240 70, 300 80, 350 55 Z"
              fill="rgba(168, 85, 247, 0.08)"
              stroke="#a855f7"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Center Runic Diamond */}
            <polygon
              points="190,15 208,45 190,75 172,45"
              fill="rgba(56, 189, 248, 0.15)"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            {/* Title Text */}
            <text
              x="190"
              y="68"
              textAnchor="middle"
              className="font-cinzel text-4xl sm:text-5xl font-black tracking-widest fill-slate-100"
              style={{ letterSpacing: '0.22em' }}
            >
              CURSECRAFT
            </text>
            <text
              x="190"
              y="95"
              textAnchor="middle"
              className="font-cinzel text-xs font-semibold fill-cyan-400 tracking-widest"
              style={{ letterSpacing: '0.45em' }}
            >
              LIVING CURSE ROGUELITE
            </text>
          </svg>
        </div>

        <p className="text-slate-300 text-sm sm:text-base max-w-lg mb-8 leading-relaxed">
          The cursed groves adapt to your every strike. Slay the sector titan, harvest soul crystals, and decide: <span className="text-amber-300 font-medium">Extract to safety</span> or <span className="text-rose-400 font-medium">plunge into deeper nightmares</span>.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
          <button
            onClick={() => {
              sound.ensureAudio();
              onStartGame();
            }}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>ENTER REALM</span>
          </button>

          <button
            onClick={() => {
              sound.ensureAudio();
              onOpenSanctum();
            }}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Shield className="w-4 h-4 text-purple-400" />
            <span>SANCTUM ALTAR</span>
          </button>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="relative z-10 text-center">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400 tracking-wide font-medium">
          <span>WASD Move</span>
          <span className="text-slate-600">·</span>
          <span>Click Slash</span>
          <span className="text-slate-600">·</span>
          <span>Space Dash</span>
          <span className="text-slate-600">·</span>
          <span>Q Nova</span>
          <span className="text-slate-600">·</span>
          <span>Esc Pause</span>
        </div>
      </div>
    </div>
  );
};
