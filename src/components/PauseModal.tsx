import React from 'react';
import { Play, Volume2, VolumeX, RotateCcw, Home } from 'lucide-react';

interface PauseModalProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResume: () => void;
  onAbandon: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  soundEnabled,
  onToggleSound,
  onResume,
  onAbandon,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm select-none">
      <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center text-center">
        <h2 className="font-cinzel text-2xl font-bold text-slate-100 mb-1">
          EXPEDITION PAUSED
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          The living curse pauses its evolution while you catch your breath.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full mb-6">
          <button
            onClick={onResume}
            className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME EXPEDITION</span>
          </button>

          <button
            onClick={onToggleSound}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>MUTE AUDIO</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span>UNMUTE AUDIO</span>
              </>
            )}
          </button>

          <button
            onClick={onAbandon}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-rose-400 border border-slate-800 hover:border-rose-900/50 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>ABANDON TO SANCTUM</span>
          </button>
        </div>

        {/* Controls Reminder */}
        <div className="w-full pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono text-left space-y-1">
          <div><strong className="text-slate-400">WASD / Arrows:</strong> Move Character</div>
          <div><strong className="text-slate-400">Mouse Aim / Left Click:</strong> Spectral Blade Slash</div>
          <div><strong className="text-slate-400">Space:</strong> Phase Dash (i-frames)</div>
          <div><strong className="text-slate-400">Q / E:</strong> Arcane Nova</div>
        </div>
      </div>
    </div>
  );
};
