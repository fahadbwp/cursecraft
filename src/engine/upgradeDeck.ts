import { UpgradeCard, PlayerStats } from '../types/game';

export const ALL_UPGRADES: UpgradeCard[] = [
  {
    id: 'orbital_resonance',
    name: 'Arcane Satellite',
    description: 'Summon +1 permanent orbiting spell orb and increase orbit speed by 25%.',
    icon: 'Orbit',
    rarity: 'rare',
    type: 'spell',
    apply: (p: PlayerStats) => {
      p.orbCount += 1;
      p.orbSpeed *= 1.25;
      p.orbDamage += 6;
    },
  },
  {
    id: 'blade_mastery',
    name: 'Grand Cleave',
    description: 'Expand your spectral blade swing arc by +35% and knockback by +30%.',
    icon: 'Sword',
    rarity: 'common',
    type: 'stat',
    apply: (p: PlayerStats) => {
      p.slashArcRadius += 28;
      p.slashDamage += 10;
      p.slashKnockback += 4;
    },
  },
  {
    id: 'flame_trail',
    name: 'Brimstone Dash',
    description: 'Your phase dash ignites the earth, leaving a scorching flame trail behind you.',
    icon: 'Flame',
    rarity: 'rare',
    type: 'spell',
    apply: (p: PlayerStats) => {
      p.flameTrail = true;
      p.dashCooldown = Math.max(1.0, p.dashCooldown * 0.85);
    },
  },
  {
    id: 'glacial_spike',
    name: 'Frostbite Infusion',
    description: 'All attacks chill monsters, slowing their movement by 40% for 2.0s.',
    icon: 'Snowflake',
    rarity: 'rare',
    type: 'spell',
    apply: (p: PlayerStats) => {
      p.glacialFreeze = true;
      p.slashDamage += 6;
    },
  },
  {
    id: 'lightning_chain',
    name: 'Static Discharge',
    description: 'Strikes trigger chain lightning jumping between up to 4 nearby enemies.',
    icon: 'Zap',
    rarity: 'legendary',
    type: 'spell',
    apply: (p: PlayerStats) => {
      p.lightningChain = true;
      p.critChance += 0.08;
    },
  },
  {
    id: 'vampiric_edge',
    name: 'Soul Siphon',
    description: 'Blade slashes harvest life force, restoring 6% of damage dealt as Health.',
    icon: 'HeartPulse',
    rarity: 'rare',
    type: 'passive',
    apply: (p: PlayerStats) => {
      p.lifeStealPercent += 0.06;
      p.hp = Math.min(p.maxHp, p.hp + 20);
    },
  },
  {
    id: 'soul_magnet',
    name: 'Eldritch Vacuum',
    description: 'Expand your pickup attraction radius by +80% to pull in distant gems.',
    icon: 'Compass',
    rarity: 'common',
    type: 'passive',
    apply: (p: PlayerStats) => {
      p.pickupMagnetRadius += 90;
    },
  },
  {
    id: 'arcane_nova_mastery',
    name: 'Nova Cataclysm',
    description: 'Increase Arcane Nova blast radius by +40% and lower its cooldown by 25%.',
    icon: 'Sparkles',
    rarity: 'legendary',
    type: 'spell',
    apply: (p: PlayerStats) => {
      p.novaRadius += 50;
      p.novaDamage += 25;
      p.novaCooldown *= 0.75;
    },
  },
  {
    id: 'swift_zephyr',
    name: 'Zephyr Stride',
    description: 'Gain +18% movement agility and lower dash cooldown by 15%.',
    icon: 'Wind',
    rarity: 'common',
    type: 'stat',
    apply: (p: PlayerStats) => {
      p.moveSpeed *= 1.18;
      p.dashCooldown = Math.max(0.8, p.dashCooldown * 0.85);
    },
  },
  {
    id: 'keen_edge',
    name: 'Critical Keenness',
    description: 'Gain +15% Critical Chance and +50% Critical Strike Damage bonus.',
    icon: 'Target',
    rarity: 'common',
    type: 'stat',
    apply: (p: PlayerStats) => {
      p.critChance += 0.15;
      p.critDamageMult += 0.5;
    },
  },
  {
    id: 'iron_vitality',
    name: 'Colossus Ward',
    description: 'Increase Max Health by +35 and immediately restore 35 HP.',
    icon: 'Shield',
    rarity: 'common',
    type: 'stat',
    apply: (p: PlayerStats) => {
      p.maxHp += 35;
      p.hp += 35;
      p.armor = Math.min(0.6, p.armor + 0.05);
    },
  },
  {
    id: 'executioner',
    name: 'Executioner Wrath',
    description: 'Deal +50% damage against enemies below 35% health, instakilling minor bats.',
    icon: 'Skull',
    rarity: 'legendary',
    type: 'passive',
    apply: (p: PlayerStats) => {
      p.slashDamage += 15;
      p.orbDamage += 10;
    },
  },
];

export function getRandomUpgrades(count: number = 3): UpgradeCard[] {
  const shuffled = [...ALL_UPGRADES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
