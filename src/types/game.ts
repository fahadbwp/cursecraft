export type GameState = 
  | 'TITLE'
  | 'SANCTUM'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_UP'
  | 'EXTRACTION_CHOICE'
  | 'VICTORY'
  | 'GAME_OVER';

export type CurseLevel = 1 | 2 | 3;

export type CurseAffix = 
  | 'ARCANE_WARD'     // Enemies gain magic resistance shields when hit frequently with ranged orbs
  | 'BLINK_HUNTERS'   // Stalkers blink rapidly if player kites continuously
  | 'VOID_FISSURES'   // Pulsing cursed rift zones on the ground
  | 'CORROSIVE_SPORES' // Exploding toxic spores on enemy death
  | 'ENRAGED_HORDE';  // Enemies move 20% faster below 40% HP

export interface UpgradeCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'legendary';
  type: 'stat' | 'spell' | 'passive';
  apply: (player: PlayerStats) => void;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  moveSpeed: number;
  armor: number; // damage reduction percentage (0 to 0.7)
  
  // Melee Blade
  slashDamage: number;
  slashCooldown: number; // in seconds
  slashArcRadius: number;
  slashKnockback: number;
  
  // Orbiting Arcane Orbs
  orbCount: number;
  orbDamage: number;
  orbSpeed: number;
  orbRadius: number;
  
  // Phase Dash
  dashCooldown: number;
  dashDuration: number;
  dashSpeedMult: number;
  dashInvulnerable: boolean;
  
  // Arcane Nova (Special Ability)
  novaCooldown: number;
  novaDamage: number;
  novaRadius: number;
  
  // Passives & Modifiers
  critChance: number;
  critDamageMult: number;
  lifeStealPercent: number;
  pickupMagnetRadius: number;
  flameTrail: boolean;
  lightningChain: boolean;
  glacialFreeze: boolean;
  
  // Progression in run
  level: number;
  xp: number;
  xpToNext: number;
  soulCrystals: number;
  relicsFound: number;
}

export interface SanctumUpgrades {
  vitality: number;       // +15 Max HP per rank (max 5)
  ruinousBlade: number;   // +12% Melee Slash damage per rank (max 5)
  arcaneOrbMastery: number; // +1 Starting Orb & +10% orb speed per rank (max 3)
  swiftstride: number;    // +7% Move speed per rank (max 5)
  arcaneWard: number;     // +4% Damage reduction per rank (max 5)
  dashMastery: number;    // -10% Dash cooldown per rank (max 4)
  fortuneFavor: number;   // +20% Soul Crystal gain per rank (max 5)
}

export interface SaveData {
  bankedCrystals: number;
  bankedRelics: number;
  totalRuns: number;
  victories: number;
  bestSurvivalSeconds: number;
  totalEnemiesKilled: number;
  sanctumUpgrades: SanctumUpgrades;
  soundEnabled: boolean;
  sfxVolume: number;
}

export type EnemyType = 'BAT' | 'WOLF' | 'SPITTER' | 'STALKER' | 'GROVE_TITAN' | 'CRYPT_LORD';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  xpValue: number;
  crystalDropChance: number;
  color: string;
  glowColor: string;
  isBoss: boolean;
  isElite: boolean;
  
  // AI states
  state: 'CHASE' | 'TELEGRAPH' | 'ATTACK' | 'STUN';
  stateTimer: number;
  targetAngle: number;
  attackCooldown: number;
  hitFlashTimer: number;
  
  // Affixes & resistances
  arcaneShield: number; // temporary absorbing barrier
  isEnraged: boolean;
  burnTimer: number;
  freezeTimer: number;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  duration: number;
  isPlayer: boolean;
  color: string;
  glowColor: string;
  penetrate: number;
  type?: 'ORB' | 'NEEDLE' | 'LIGHTNING' | 'FIREBALL' | 'BOSS_BEAM';
}

export interface HazardZone {
  id: number;
  x: number;
  y: number;
  radius: number;
  type: 'VOID_FISSURE' | 'THORN_BRAMBLE' | 'CURSED_MIASMA' | 'FIRE_PATCH';
  duration: number;
  damageTickRate: number;
  damageTimer: number;
  damage: number;
  telegraphTimer: number; // >0 means warning circle
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
  isCrit?: boolean;
}

export interface LootDrop {
  id: number;
  x: number;
  y: number;
  type: 'XP_GEM' | 'CRYSTAL' | 'RELIC' | 'HEALTH_POTION';
  value: number;
  radius: number;
  color: string;
}

export interface Chest {
  id: number;
  x: number;
  y: number;
  opened: boolean;
  relicChest: boolean;
  radius: number;
}

export interface ExtractionPortal {
  x: number;
  y: number;
  active: boolean;
  pulseTimer: number;
  radius: number;
}

export interface Biome {
  id: number;
  name: string;
  subtitle: string;
  themeColor: string;
  ambientLight: string;
  groundColor1: string;
  groundColor2: string;
  gridLineColor: string;
  bossType: EnemyType;
  bossName: string;
}

export type LandmarkEventType = 
  | 'SHRINE_TRIAL'
  | 'GRAVEYARD_HAUNT'
  | 'CORRUPTED_PURGE'
  | 'WATCHTOWER_BEACON'
  | 'PORTAL_CLEARING';

export interface LandmarkTargetObjective {
  id: number;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  destroyed: boolean;
  name: string;
}

export interface LandmarkEventState {
  id: string;
  type: LandmarkEventType;
  name: string;
  x: number;
  y: number;
  radius: number;
  isActive: boolean;
  isCompleted: boolean;
  progress: number; // 0 to 1
  duration?: number;
  timer?: number;
  description: string;
  rewardText: string;
  guardianEnemyId?: number;
  targetObjectives?: LandmarkTargetObjective[];
}
