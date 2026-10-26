import React from 'react';
import { CurseLevel, CurseAffix, LandmarkEventState } from '../types/game';
import { 
  Heart, 
  Sparkles, 
  Trophy, 
  Pause, 
  Volume2, 
  VolumeX, 
  Zap, 
  Flame, 
  ShieldAlert, 
  Eye, 
  Skull,
  Compass,
  AlertTriangle,
  MapPin
} from 'lucide-react';

interface GameHUDProps {
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpToNext: number;
  crystals: number;
  relics: number;
  curseLevel: CurseLevel;
  curseTimer: number;
  activeAffixes: CurseAffix[];
  bossHp?: number;
  bossMaxHp?: number;
  bossName?: string;
  dashCdRatio: number; // 0 (ready) to 1 (cooling)
  novaCdRatio: number; // 0 (ready) to 1 (cooling)
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPause: () => void;
  activeLandmarkEvent?: LandmarkEventState | null;
  nearbyLandmark?: { id: string; name: string; description: string; canInteract: boolean; isCompleted: boolean } | null;
  sectorIndex?: number;
  sectorName?: string;
  rewardMultiplier?: number;
  bossWarningTimer?: number;
  onInteract?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hp,
  maxHp,
  level,
  xp,
  xpToNext,
  crystals,
  relics,
  curseLevel,
  curseTimer,
  activeAffixes,
  bossHp,
  bossMaxHp,
  bossName,
  dashCdRatio,
  novaCdRatio,
  soundEnabled,
  onToggleSound,
  onPause,
  activeLandmarkEvent,
  nearbyLandmark,
  sectorIndex = 1,
  sectorName = "The Haunted Forest",
  rewardMultiplier = 1.0,
  bossWarningTimer,
  onInteract,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const xpPercent = Math.max(0, Math.min(100, (xp / xpToNext) * 100));

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getCurseBadge = () => {
    if (curseLevel === 1) {
      return {
        name: "Awakening",
        color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/40",
        pulse: false,
      };
    }
    if (curseLevel === 2) {
      return {
        name: "Corruption",
        color: "text-purple-400 border-purple-500/50 bg-purple-950/50",
        pulse: true,
      };
    }
    return {
      name: "Nightmare",
      color: "text-rose-400 border-rose-500/60 bg-rose-950/60",
      pulse: true,
    };
  };

  const curseInfo = getCurseBadge();

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 sm:p-5 select-none">
      {/* --------------------------------------------------------------------- */}
      {/* TOP BAR CLUSTER */}
      {/* --------------------------------------------------------------------- */}
      <div className="w-full flex items-start justify-between gap-4">
        {/* Top-Left: Player Vitality & XP */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Health Bar */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 shadow-lg backdrop-blur-none">
            <Heart className="w-4 h-4 text-rose-500 shrink-0 fill-current" />
            <div className="w-36 sm:w-48">
              <div className="flex justify-between items-center text-[11px] mb-1 font-medium">
                <span className="text-slate-400">VIT</span>
                <span className="font-mono-numbers text-slate-200">
                  {hp} / {maxHp}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-150"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* XP & Level Bar */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] font-bold text-cyan-400 shrink-0">LV.{level}</span>
            <div className="w-36 sm:w-48">
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-150 shadow-sm shadow-cyan-400/50"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Loot Tally */}
          <div className="flex items-center gap-3 text-xs font-semibold px-2">
            <div className="flex items-center gap-1 text-purple-300">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-mono-numbers">{crystals}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-300">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono-numbers">{relics}</span>
            </div>
          </div>
        </div>

        {/* Top-Center: Living Curse Dial & Doom Clock */}
        <div className="flex flex-col items-center">
          <div className={`px-4 py-1.5 rounded-full border text-xs font-bold tracking-wider uppercase flex items-center gap-2 shadow-lg ${curseInfo.color}`}>
            <span className="w-2 h-2 rounded-full bg-current" />
            <span>Curse {curseLevel} · {curseInfo.name}</span>
          </div>

          <div className="font-mono-numbers text-lg sm:text-xl font-black text-slate-200 mt-1 tracking-tight drop-shadow-md">
            {formatTimer(curseTimer)}
          </div>

          {/* Active Adaptive Curse Affixes */}
          {activeAffixes.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {activeAffixes.map((affix) => (
                <div
                  key={affix}
                  className="px-2 py-0.5 rounded bg-slate-900/90 border border-purple-500/40 text-[10px] font-mono text-purple-300 flex items-center gap-1"
                >
                  <Skull className="w-3 h-3 text-purple-400" />
                  <span>{affix.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top-Right: Sound & Pause Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={onPause}
            className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Pause (Esc)"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* BOSS WARNING & HEALTH BAR */}
      {/* --------------------------------------------------------------------- */}
      {bossWarningTimer !== undefined && bossWarningTimer > 0 && !bossHp && (
        <div className="w-full max-w-lg mx-auto my-2 p-2.5 rounded-xl bg-rose-950/90 border-2 border-rose-500 text-center animate-pulse shadow-xl shadow-rose-900/40">
          <div className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>NIGHTMARE ESCALATION IN {bossWarningTimer}s</span>
          </div>
          <div className="font-cinzel text-sm sm:text-base font-bold text-rose-100">
            THE SECTOR TITAN IS AWAKENING
          </div>
        </div>
      )}

      {bossHp !== undefined && bossMaxHp !== undefined && (
        <div className="w-full max-w-xl mx-auto my-2 pointer-events-none">
          <div className="flex items-center justify-between text-xs font-cinzel font-bold text-rose-300 mb-1 px-1 drop-shadow">
            <span>{bossName || "CORRUPTED SECTOR TITAN"}</span>
            <span className="font-mono-numbers text-slate-300">
              {bossHp} / {bossMaxHp}
            </span>
          </div>
          <div className="h-3 w-full bg-slate-950/90 border border-rose-900/60 rounded-full overflow-hidden p-0.5 shadow-xl">
            <div
              className="h-full bg-gradient-to-r from-rose-700 via-rose-500 to-amber-500 rounded-full transition-all duration-100"
              style={{ width: `${Math.max(0, Math.min(100, (bossHp / bossMaxHp) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* LANDMARK TRIAL NOTIFICATIONS & PROMPTS */}
      {/* --------------------------------------------------------------------- */}
      {activeLandmarkEvent && (
        <div className="w-full max-w-md mx-auto my-1.5 p-3 rounded-xl bg-slate-950/90 border border-amber-500/50 shadow-xl backdrop-blur-none text-center">
          <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
            <span className="font-cinzel">{activeLandmarkEvent.name}</span>
            {activeLandmarkEvent.timer !== undefined ? (
              <span className="font-mono-numbers">{Math.ceil(activeLandmarkEvent.timer)}s REMAINING</span>
            ) : (
              <span className="font-mono-numbers">{Math.round((activeLandmarkEvent.progress ?? 0) * 100)}%</span>
            )}
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-1">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-100"
              style={{ width: `${Math.round((activeLandmarkEvent.progress ?? 0) * 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-300">{activeLandmarkEvent.description}</div>
        </div>
      )}

      {nearbyLandmark && !activeLandmarkEvent && (
        <div className="w-full max-w-md mx-auto my-1.5 p-3 rounded-xl bg-slate-950/90 border border-cyan-500/40 shadow-xl pointer-events-auto flex items-center justify-between gap-3">
          <div className="text-left">
            <div className="text-xs font-cinzel font-bold text-cyan-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{nearbyLandmark.name}</span>
            </div>
            <div className="text-[11px] text-slate-300">{nearbyLandmark.description}</div>
          </div>
          {nearbyLandmark.canInteract && (
            <button
              onClick={onInteract}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 text-xs font-bold font-mono tracking-wider transition-all cursor-pointer shadow-md shadow-cyan-500/20 shrink-0"
            >
              [E] INTERACT
            </button>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* BOTTOM ACTION BAR (ABILITY COOLDOWNS & MINIMAP) */}
      {/* --------------------------------------------------------------------- */}
      <div className="w-full flex items-end justify-between">
        {/* Bottom Left: Passive Blade Tip */}
        <div className="hidden sm:flex flex-col text-[11px] text-slate-500 font-mono">
          <div>Aim: Mouse Cursor</div>
          <div>Melee Strike: Auto / Left Click</div>
          <div>Interact: [E] Key / Touch Prompt</div>
        </div>

        {/* Center: Cooldown Rings */}
        <div className="flex items-center gap-4 mx-auto pointer-events-auto">
          {/* Dash (Space) */}
          <div className="relative flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border font-bold text-xs transition-all ${
                dashCdRatio <= 0
                  ? 'bg-slate-900/90 border-cyan-500/80 text-cyan-300 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-950/80 border-slate-800 text-slate-500'
              }`}
            >
              <Zap className="w-5 h-5 fill-current" />
              {dashCdRatio > 0 && (
                <div
                  className="absolute inset-0 bg-slate-950/70 rounded-xl"
                  style={{
                    clipPath: `polygon(0 0, 100% 0, 100% ${dashCdRatio * 100}%, 0 ${dashCdRatio * 100}%)`,
                  }}
                />
              )}
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-1">SPACE</span>
          </div>

          {/* Arcane Nova (Q) */}
          <div className="relative flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border font-bold text-xs transition-all ${
                novaCdRatio <= 0
                  ? 'bg-slate-900/90 border-purple-500/80 text-purple-300 shadow-lg shadow-purple-500/20'
                  : 'bg-slate-950/80 border-slate-800 text-slate-500'
              }`}
            >
              <Sparkles className="w-5 h-5 fill-current" />
              {novaCdRatio > 0 && (
                <div
                  className="absolute inset-0 bg-slate-950/70 rounded-xl"
                  style={{
                    clipPath: `polygon(0 0, 100% 0, 100% ${novaCdRatio * 100}%, 0 ${novaCdRatio * 100}%)`,
                  }}
                />
              )}
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-1">Q / NOVA</span>
          </div>
        </div>

        {/* Bottom Right: Radar / Sector indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300">{sectorName}</span>
          {rewardMultiplier > 1 && (
            <span className="ml-1 px-1.5 py-0.5 rounded bg-rose-900/60 border border-rose-500/50 text-rose-300 font-bold">
              {rewardMultiplier}X SPOILS
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
