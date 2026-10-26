import React, { useRef, useState, useEffect } from 'react';
import { Zap, Sparkles, Swords } from 'lucide-react';

interface MobileControlsProps {
  onMove: (vector: { x: number; y: number }) => void;
  onSlash: () => void;
  onDash: () => void;
  onNova: () => void;
  dashCdRatio: number;
  novaCdRatio: number;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onSlash,
  onDash,
  onNova,
  dashCdRatio,
  novaCdRatio,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeTouchId, setActiveTouchId] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTouchId !== null) return;
    const touch = e.changedTouches[0];
    if (!touch || !joystickBaseRef.current) return;

    setActiveTouchId(touch.identifier);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (activeTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (activeTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId) {
        setActiveTouchId(null);
        setKnobPos({ x: 0, y: 0 });
        onMove({ x: 0, y: 0 });
        break;
      }
    }
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const maxRadius = rect.width / 2;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: dx, y: dy });
    onMove({ x: dx / maxRadius, y: dy / maxRadius });
  };

  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none z-20 flex items-end justify-between p-4 sm:p-8 select-none">
      {/* Virtual Joystick (Left Thumb) */}
      <div
        ref={joystickBaseRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="pointer-events-auto relative w-32 h-32 rounded-full bg-slate-950/40 border-2 border-slate-700/60 flex items-center justify-center touch-none backdrop-blur-none"
      >
        <div
          className="w-14 h-14 rounded-full bg-cyan-500/50 border-2 border-cyan-400 shadow-lg shadow-cyan-500/30 transition-transform duration-75"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        />
      </div>

      {/* Action Buttons (Right Thumb) */}
      <div className="pointer-events-auto flex items-end gap-3 mb-2">
        {/* Nova Button */}
        <button
          onClick={onNova}
          className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border font-bold text-xs transition-all ${
            novaCdRatio <= 0
              ? 'bg-purple-900/80 border-purple-400 text-purple-200 active:scale-90'
              : 'bg-slate-950/70 border-slate-800 text-slate-600'
          }`}
        >
          <Sparkles className="w-5 h-5 fill-current" />
          <span className="text-[9px] mt-0.5">NOVA</span>
        </button>

        {/* Dash Button */}
        <button
          onClick={onDash}
          className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border font-bold text-xs transition-all ${
            dashCdRatio <= 0
              ? 'bg-sky-900/80 border-sky-400 text-sky-200 active:scale-90'
              : 'bg-slate-950/70 border-slate-800 text-slate-600'
          }`}
        >
          <Zap className="w-5 h-5 fill-current" />
          <span className="text-[9px] mt-0.5">DASH</span>
        </button>

        {/* Primary Melee Slash Button */}
        <button
          onClick={onSlash}
          className="w-18 h-18 rounded-3xl bg-cyan-500 hover:bg-cyan-400 active:scale-90 text-slate-950 flex flex-col items-center justify-center shadow-lg shadow-cyan-500/30 font-bold border-2 border-cyan-300"
        >
          <Swords className="w-7 h-7 fill-current" />
          <span className="text-[10px] mt-0.5">SLASH</span>
        </button>
      </div>
    </div>
  );
};
