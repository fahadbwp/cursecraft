import { SaveData, SanctumUpgrades } from '../types/game';

const SAVE_KEY = 'cursecraft_save_v1';

export const INITIAL_SANCTUM_UPGRADES: SanctumUpgrades = {
  vitality: 0,
  ruinousBlade: 0,
  arcaneOrbMastery: 0,
  swiftstride: 0,
  arcaneWard: 0,
  dashMastery: 0,
  fortuneFavor: 0,
};

export const UPGRADE_CONFIG: Record<keyof SanctumUpgrades, {
  name: string;
  desc: string;
  maxRank: number;
  baseCost: number;
  costMult: number;
  bonusText: string;
}> = {
  vitality: {
    name: "Vitality Infusion",
    desc: "Permanently boost your maximum life pool.",
    maxRank: 5,
    baseCost: 25,
    costMult: 1.8,
    bonusText: "+15 Max HP per rank",
  },
  ruinousBlade: {
    name: "Ruinous Blade",
    desc: "Sharpen your spectral blade with primordial arcane power.",
    maxRank: 5,
    baseCost: 35,
    costMult: 1.9,
    bonusText: "+15% Melee damage per rank",
  },
  arcaneOrbMastery: {
    name: "Orbital Resonance",
    desc: "Channel an additional permanent orb and increase orbit velocity.",
    maxRank: 3,
    baseCost: 50,
    costMult: 2.2,
    bonusText: "+1 Starting Orb & +12% orbit speed per rank",
  },
  swiftstride: {
    name: "Swiftstride Grace",
    desc: "Traverse the cursed groves with heightened tactical agility.",
    maxRank: 5,
    baseCost: 20,
    costMult: 1.7,
    bonusText: "+7% Movement speed per rank",
  },
  arcaneWard: {
    name: "Sanctum Aegis",
    desc: "Enchant your body with defensive barrier plating.",
    maxRank: 5,
    baseCost: 30,
    costMult: 1.85,
    bonusText: "+5% Damage reduction per rank",
  },
  dashMastery: {
    name: "Blink Quickening",
    desc: "Shorten the recovery window of your phase dash.",
    maxRank: 4,
    baseCost: 40,
    costMult: 2.0,
    bonusText: "-12% Dash cooldown per rank",
  },
  fortuneFavor: {
    name: "Soul Attunement",
    desc: "Draw greater yields of Soul Crystals from slain nightmares.",
    maxRank: 5,
    baseCost: 30,
    costMult: 1.8,
    bonusText: "+20% Soul Crystal harvest per rank",
  },
};

export function getUpgradeCost(key: keyof SanctumUpgrades, currentRank: number): number {
  const conf = UPGRADE_CONFIG[key];
  return Math.round(conf.baseCost * Math.pow(conf.costMult, currentRank));
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        bankedCrystals: parsed.bankedCrystals ?? 0,
        bankedRelics: parsed.bankedRelics ?? 0,
        totalRuns: parsed.totalRuns ?? 0,
        victories: parsed.victories ?? 0,
        bestSurvivalSeconds: parsed.bestSurvivalSeconds ?? 0,
        totalEnemiesKilled: parsed.totalEnemiesKilled ?? 0,
        sanctumUpgrades: {
          ...INITIAL_SANCTUM_UPGRADES,
          ...(parsed.sanctumUpgrades || {}),
        },
        soundEnabled: parsed.soundEnabled ?? true,
        sfxVolume: parsed.sfxVolume ?? 0.7,
      };
    }
  } catch (e) {
    console.warn("Could not load save data, initializing default", e);
  }

  return {
    bankedCrystals: 20, // Free starting starter gift for testing first upgrade!
    bankedRelics: 0,
    totalRuns: 0,
    victories: 0,
    bestSurvivalSeconds: 0,
    totalEnemiesKilled: 0,
    sanctumUpgrades: { ...INITIAL_SANCTUM_UPGRADES },
    soundEnabled: true,
    sfxVolume: 0.7,
  };
}

export function saveGame(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Could not write save data", e);
  }
}
