import React from 'react';
import { SaveData, SanctumUpgrades } from '../types/game';
import { UPGRADE_CONFIG, getUpgradeCost } from '../storage/saveSystem';
import { Sparkles, ArrowLeft, Play, ShieldCheck, Heart, Swords, Orbit, Wind, Shield, Zap } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface SanctumAltarProps {
  saveData: SaveData;
  onUpgrade: (key: keyof SanctumUpgrades) => void;
  onBack: () => void;
  onStartRun: () => void;
}

const UPGRADE_ICONS: Record<keyof SanctumUpgrades, React.ReactNode> = {
  vitality: <Heart className="w-5 h-5 text-rose-400" />,
  ruinousBlade: <Swords className="w-5 h-5 text-amber-400" />,
  arcaneOrbMastery: <Orbit className="w-5 h-5 text-cyan-400" />,
  swiftstride: <Wind className="w-5 h-5 text-emerald-400" />,
  arcaneWard: <Shield className="w-5 h-5 text-indigo-400" />,
  dashMastery: <Zap className="w-5 h-5 text-sky-400" />,
  fortuneFavor: <Sparkles className="w-5 h-5 text-purple-400" />,
};

export const SanctumAltar: React.FC<SanctumAltarProps> = ({
  saveData,
  onUpgrade,
  onBack,
  onStartRun,
}) => {
  const upgradesList = Object.keys(UPGRADE_CONFIG) as (keyof SanctumUpgrades)[];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-y-auto z-20 bg-[#07090e]">
      {/* Top Header */}
      <div className="w-full max-w-5xl flex items-center justify-between pb-6 border-b border-slate-800">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO GATES</span>
        </button>

        <div className="flex items-center gap-2 text-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-950/60 border border-purple-800/80 text-purple-200">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="font-mono-numbers text-base font-bold">{saveData.bankedCrystals}</span>
            <span className="text-xs text-purple-300/80">Banked Soul Crystals</span>
          </div>
        </div>

        <button
          onClick={onStartRun}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all cursor-pointer text-xs tracking-wide shadow-md shadow-cyan-500/20"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>START RUN</span>
        </button>
      </div>

      {/* Main Altar Grid */}
      <div className="w-full max-w-5xl my-6 flex-1">
        <div className="text-center mb-6">
          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-wide text-slate-100">
            THE ANCIENT SANCTUM
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Imbue your Arcane Spellblade with permanent eldritch attributes before descending into the cursed groves.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upgradesList.map((key) => {
            const conf = UPGRADE_CONFIG[key];
            const currentRank = saveData.sanctumUpgrades[key];
            const isMax = currentRank >= conf.maxRank;
            const cost = isMax ? 0 : getUpgradeCost(key, currentRank);
            const canAfford = !isMax && saveData.bankedCrystals >= cost;

            return (
              <div
                key={key}
                className="flex flex-col justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-800/80">
                        {UPGRADE_ICONS[key]}
                      </div>
                      <h3 className="font-cinzel font-bold text-sm text-slate-200">
                        {conf.name}
                      </h3>
                    </div>

                    <span className="font-mono-numbers text-xs text-slate-400">
                      Rank {currentRank}/{conf.maxRank}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                    {conf.desc}
                  </p>

                  <div className="text-[11px] font-medium text-cyan-400 mb-3">
                    {conf.bonusText}
                  </div>

                  {/* Rank pips */}
                  <div className="flex items-center gap-1.5 mb-4">
                    {Array.from({ length: conf.maxRank }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 flex-1 rounded-full ${
                          idx < currentRank
                            ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50'
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  disabled={isMax || !canAfford}
                  onClick={() => {
                    sound.playLevelUp();
                    onUpgrade(key);
                  }}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isMax
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : canAfford
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-800/70 text-slate-500 border border-slate-800 cursor-not-allowed'
                  }`}
                >
                  {isMax ? (
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      MAX RANK
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span>UPGRADE</span>
                      <span className="font-mono-numbers text-purple-200">({cost} Crystals)</span>
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Summary Footer */}
      <div className="w-full max-w-5xl pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <div>Total Runs: {saveData.totalRuns} · Victories: {saveData.victories}</div>
        <div>Permanent progress automatically preserved in local storage</div>
      </div>
    </div>
  );
};
