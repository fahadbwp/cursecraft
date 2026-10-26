import { 
  PlayerStats, 
  Enemy, 
  Projectile, 
  HazardZone, 
  FloatingText, 
  LootDrop, 
  Chest, 
  ExtractionPortal, 
  CurseLevel, 
  CurseAffix,
  Biome,
  SaveData,
  LandmarkEventState,
  LandmarkEventType,
  LandmarkTargetObjective
} from '../types/game';
import { sound } from '../audio/soundEngine';
import { WorldEnvironment } from './WorldEnvironment';
import { EntityRenderer } from './EntityRenderer';

export const BIOMES: Biome[] = [
  {
    id: 1,
    name: "The Haunted Forest",
    subtitle: "Curse Level: Awakening to Nightmare",
    themeColor: "#10b981",
    ambientLight: "rgba(10, 25, 20, 0.45)",
    groundColor1: "#0b1210",
    groundColor2: "#070c0a",
    gridLineColor: "rgba(16, 185, 129, 0.05)",
    bossType: 'GROVE_TITAN',
    bossName: "Malakor, The Cursed Grove Titan",
  },
  {
    id: 2,
    name: "The Sunken Crypt",
    subtitle: "Nightmare Realm: Double Relics",
    themeColor: "#f43f5e",
    ambientLight: "rgba(35, 10, 15, 0.55)",
    groundColor1: "#140a0e",
    groundColor2: "#0c0609",
    gridLineColor: "rgba(244, 63, 94, 0.06)",
    bossType: 'CRYPT_LORD',
    bossName: "Ignis, The Obsidian Overlord",
  }
];

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface EngineCallbacks {
  onLevelUp: () => void;
  onGameOver: (stats: { timeSurvived: number; kills: number; crystalsEarned: number; relicsEarned: number; bossDefeated: boolean }) => void;
  onExtractionPortalReady: () => void;
  onStepOnPortal: () => void;
  onStatsUpdate: (stats: { 
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
    dashCdRatio: number; 
    novaCdRatio: number;
    activeLandmarkEvent?: LandmarkEventState | null;
    nearbyLandmark?: { id: string; name: string; description: string; canInteract: boolean; isCompleted: boolean } | null;
    sectorIndex: number;
    sectorName: string;
    rewardMultiplier: number;
    bossWarningTimer?: number;
  }) => void;
  onLandmarkEventStart?: (event: LandmarkEventState) => void;
  onLandmarkEventComplete?: (event: LandmarkEventState) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private lastTime: number = 0;
  private rafId: number | null = null;
  private totalElapsedTime: number = 0;
  
  // World bounds
  public readonly WORLD_WIDTH = 3400;
  public readonly WORLD_HEIGHT = 3400;

  // Environment & Scenery
  public environment: WorldEnvironment;

  // Camera
  public cameraX: number = 0;
  public cameraY: number = 0;
  private screenShake: number = 0;
  private hitstopTimer: number = 0;

  // Biome & Sector
  public currentBiomeIndex: number = 0;
  public get currentBiome(): Biome {
    return BIOMES[this.currentBiomeIndex] || BIOMES[0];
  }

  // Entities
  public player!: PlayerStats;
  public playerX: number = 1700;
  public playerY: number = 1700;
  public playerVx: number = 0;
  public playerVy: number = 0;
  public playerAngle: number = 0;
  public isDashing: boolean = false;
  public dashTimer: number = 0;
  public dashCooldownTimer: number = 0;
  public novaCooldownTimer: number = 0;
  public slashCooldownTimer: number = 0;
  public slashAnimTimer: number = 0;
  public slashArcFacing: number = 0;
  public invincibleTimer: number = 0;

  // Orbiting orbs
  public orbBaseAngle: number = 0;

  // Pools
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public hazards: HazardZone[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public lootDrops: LootDrop[] = [];
  public chests: Chest[] = [];
  public portal: ExtractionPortal = { x: 1700, y: 1700, active: false, pulseTimer: 0, radius: 48 };

  // Living Curse Engine State
  public sectorTimer: number = 0; // in seconds
  public curseLevel: CurseLevel = 1;
  public activeAffixes: CurseAffix[] = [];
  public nextEnemySpawnTimer: number = 0;
  public bossSpawned: boolean = false;
  public bossDefeated: boolean = false;
  public bossEntity: Enemy | null = null;
  public adaptiveOrbHitCounter: number = 0;
  public adaptiveDashCounter: number = 0;

  // Run stats
  public runEnemiesKilled: number = 0;
  public totalCrystalsEarned: number = 0;
  public totalRelicsEarned: number = 0;

  // Landmark Gameplay Events (Phase 4)
  public landmarkEvents: Map<string, LandmarkEventState> = new Map();
  public activeLandmarkEvent: LandmarkEventState | null = null;
  public nearbyLandmark: { id: string; name: string; description: string; canInteract: boolean; isCompleted: boolean } | null = null;
  public sectorRewardMultiplier: number = 1.0;
  public bossWarningTimer: number = 0;
  public chestSightTimer: number = 0;

  // Input states
  public keys: Record<string, boolean> = {
    KeyW: false, KeyS: false, KeyA: false, KeyD: false,
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    Space: false, KeyQ: false, KeyE: false
  };
  public mouseX: number = 0;
  public mouseY: number = 0;
  public isMouseDown: boolean = false;
  public joystickVector: { x: number; y: number } = { x: 0, y: 0 };

  private static idCounter: number = 1;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.callbacks = callbacks;
    this.environment = new WorldEnvironment(this.WORLD_WIDTH, this.WORLD_HEIGHT);
    this.resizeCanvas();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onResize);
    }
  }

  private onResize = () => {
    this.resizeCanvas();
  };

  public resizeCanvas() {
    if (typeof window !== 'undefined') {
      this.canvas.width = window.innerWidth || document?.documentElement?.clientWidth || 1024;
      this.canvas.height = window.innerHeight || document?.documentElement?.clientHeight || 768;
    } else {
      this.canvas.width = this.canvas.width || 1024;
      this.canvas.height = this.canvas.height || 768;
    }
  }

  public initRun(saveData: SaveData, sectorIndex: number = 0, runSeed?: number) {
    this.currentBiomeIndex = sectorIndex;
    this.sectorRewardMultiplier = sectorIndex === 1 ? 2.0 : 1.0;
    this.playerX = this.WORLD_WIDTH / 2;
    this.playerY = this.WORLD_HEIGHT / 2;
    this.playerVx = 0;
    this.playerVy = 0;
    this.cameraX = this.playerX - this.canvas.width / 2;
    this.cameraY = this.playerY - this.canvas.height / 2;
    this.invincibleTimer = 2.0; // Early survivability buffer
    this.bossWarningTimer = 0;
    this.chestSightTimer = 0;

    const sanctum = saveData.sanctumUpgrades;
    const baseMaxHp = 100 + sanctum.vitality * 15;

    this.player = {
      hp: baseMaxHp,
      maxHp: baseMaxHp,
      moveSpeed: 230 * (1 + sanctum.swiftstride * 0.07),
      armor: sanctum.arcaneWard * 0.05,
      
      slashDamage: 38 * (1 + sanctum.ruinousBlade * 0.15),
      slashCooldown: 0.38,
      slashArcRadius: 85,
      slashKnockback: 20,
      
      orbCount: 2 + sanctum.arcaneOrbMastery,
      orbDamage: 18 + sanctum.arcaneOrbMastery * 3,
      orbSpeed: 2.8 * (1 + sanctum.arcaneOrbMastery * 0.12),
      orbRadius: 13,
      
      dashCooldown: 3.2 * (1 - sanctum.dashMastery * 0.12),
      dashDuration: 0.22,
      dashSpeedMult: 3.2,
      dashInvulnerable: true,
      
      novaCooldown: 12.0,
      novaDamage: 95,
      novaRadius: 170,
      
      critChance: 0.10,
      critDamageMult: 2.0,
      lifeStealPercent: 0,
      pickupMagnetRadius: 130,
      flameTrail: false,
      lightningChain: false,
      glacialFreeze: false,
      
      level: 1,
      xp: 0,
      xpToNext: 20,
      soulCrystals: 0,
      relicsFound: 0,
    };

    // Reset entities
    this.enemies = [];
    this.projectiles = [];
    this.hazards = [];
    this.particles = [];
    this.floatingTexts = [];
    this.lootDrops = [];
    this.chests = [];
    this.sectorTimer = 0;
    this.curseLevel = 1;
    this.activeAffixes = [];
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.bossEntity = null;
    this.runEnemiesKilled = 0;
    this.totalCrystalsEarned = 0;
    this.totalRelicsEarned = 0;
    this.adaptiveOrbHitCounter = 0;
    this.adaptiveDashCounter = 0;

    // Generate new procedural world landmarks with deterministic seed
    const isCrypt = sectorIndex === 1;
    const seed = runSeed ?? Math.floor(Math.random() * 1000000);
    this.environment.generateWorld(seed, isCrypt);

    // Position extraction portal at Sealed Portal Clearing
    const portalLm = this.environment.landmarks.find(l => l.id === 'SEALED_PORTAL_CLEARING');
    this.portal = {
      x: portalLm ? portalLm.x : 2000,
      y: portalLm ? portalLm.y : 1600,
      active: false,
      pulseTimer: 0,
      radius: 48,
    };

    // Initialize landmark events
    this.initLandmarkEvents(isCrypt);

    // Spawn chests (landmark treasures + exploration caches)
    this.spawnWorldChests(14);
    
    // Initial gentle enemy pack (2 bats far away) to eliminate cheap early deaths
    for (let i = 0; i < 2; i++) {
      this.spawnRandomEnemy('BAT');
    }

    sound.updateCurseAmbience(1);
  }

  public advanceToSector(sectorIndex: number = 1, runSeed?: number) {
    if (!this.player) return;
    this.currentBiomeIndex = sectorIndex;
    this.sectorRewardMultiplier = sectorIndex === 1 ? 2.0 : 1.0;

    // Reset combat state & pools, but PRESERVE player progression (level, xp, upgrades, crystals, relics)
    this.enemies = [];
    this.projectiles = [];
    this.hazards = [];
    this.particles = [];
    this.floatingTexts = [];
    this.lootDrops = [];
    this.chests = [];
    this.sectorTimer = 0;
    this.curseLevel = 1;
    this.activeAffixes = [];
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.bossEntity = null;
    this.adaptiveOrbHitCounter = 0;
    this.adaptiveDashCounter = 0;
    this.bossWarningTimer = 0;
    this.chestSightTimer = 0;

    // Center player in spawn clearing
    this.playerX = this.WORLD_WIDTH / 2;
    this.playerY = this.WORLD_HEIGHT / 2;
    this.playerVx = 0;
    this.playerVy = 0;
    this.cameraX = this.playerX - this.canvas.width / 2;
    this.cameraY = this.playerY - this.canvas.height / 2;
    this.invincibleTimer = 2.5; // Brief entry buffer

    // Generate Sector 2: The Sunken Crypt
    const isCrypt = sectorIndex === 1;
    const seed = runSeed ?? Math.floor(Math.random() * 1000000);
    this.environment.generateWorld(seed, isCrypt);

    // Position extraction portal
    const portalLm = this.environment.landmarks.find(l => l.id === 'SEALED_PORTAL_CLEARING');
    this.portal = {
      x: portalLm ? portalLm.x : 2000,
      y: portalLm ? portalLm.y : 1600,
      active: false,
      pulseTimer: 0,
      radius: 48,
    };

    // Initialize landmark events for Sector 2
    this.initLandmarkEvents(isCrypt);

    // Spawn 14 chests with 2x rewards
    this.spawnWorldChests(14);

    // Initial gentle enemies
    for (let i = 0; i < 2; i++) {
      this.spawnRandomEnemy('BAT');
    }

    sound.updateCurseAmbience(1);
    this.addFloatingText(this.playerX, this.playerY - 80, "SECTOR 2: THE SUNKEN CRYPT (2X SPOILS)", "#f43f5e");
  }

  public initLandmarkEvents(isCrypt: boolean) {
    this.landmarkEvents.clear();
    this.activeLandmarkEvent = null;

    // Landmark 1: Ancient Shrine / Crypt Altar (2350, 850)
    this.landmarkEvents.set('ANCIENT_SHRINE', {
      id: 'ANCIENT_SHRINE',
      type: 'SHRINE_TRIAL',
      name: isCrypt ? 'Molten Blood Altar' : 'Ancient Runic Shrine',
      x: 2350,
      y: 850,
      radius: 140,
      isActive: false,
      isCompleted: false,
      progress: 0,
      duration: 12,
      timer: 12,
      description: isCrypt ? 'Channel the obsidian flame. Survive the infernal onslaught for 12s.' : 'Consecrate the elder shrine. Defend against shadows for 12s.',
      rewardText: isCrypt ? '+30% Melee Damage & +25 Max HP' : '+20% Slash Damage & +15 Max HP',
    });

    // Landmark 2: Forgotten Graveyard / Molten Catacombs (850, 2350)
    this.landmarkEvents.set('FORGOTTEN_GRAVEYARD', {
      id: 'FORGOTTEN_GRAVEYARD',
      type: 'GRAVEYARD_HAUNT',
      name: isCrypt ? 'Molten Catacombs' : 'Forgotten Graveyard',
      x: 850,
      y: 2350,
      radius: 140,
      isActive: false,
      isCompleted: false,
      progress: 0,
      description: isCrypt ? 'Awaken and slay the Magma Revenant guardian.' : 'Disturb sepulcher to summon and slay the Tomb Revenant.',
      rewardText: isCrypt ? '2x Ancient Relics & +15% Crit Chance' : 'Guaranteed Ancient Relic & +10% Crit Chance',
    });

    // Landmark 3: Corrupted Grove / Infernal Fissure (850, 850)
    const groveRoots: LandmarkTargetObjective[] = [
      { id: 1, x: 800, y: 820, radius: 20, hp: 70, maxHp: 70, destroyed: false, name: isCrypt ? 'Magma Spire I' : 'Corrupted Root I' },
      { id: 2, x: 900, y: 820, radius: 20, hp: 70, maxHp: 70, destroyed: false, name: isCrypt ? 'Magma Spire II' : 'Corrupted Root II' },
      { id: 3, x: 850, y: 910, radius: 20, hp: 70, maxHp: 70, destroyed: false, name: isCrypt ? 'Magma Spire III' : 'Corrupted Root III' },
    ];
    this.landmarkEvents.set('CORRUPTED_GROVE', {
      id: 'CORRUPTED_GROVE',
      type: 'CORRUPTED_PURGE',
      name: isCrypt ? 'Infernal Magma Fissure' : 'Corrupted Grove',
      x: 850,
      y: 850,
      radius: 150,
      isActive: false,
      isCompleted: false,
      progress: 0,
      description: isCrypt ? 'Shatter the 3 Molten Spires to extinguish eruptions.' : 'Sever the 3 Blighted Roots to cleanse the toxic miasma.',
      rewardText: isCrypt ? '40 Crystals & Flame Dash Aura' : 'Shower of XP & Sacred Bramble Dash',
      targetObjectives: groveRoots,
    });

    // Landmark 4: Ruined Watchtower / Obsidian Bastion (2350, 2350)
    this.landmarkEvents.set('RUINED_WATCHTOWER', {
      id: 'RUINED_WATCHTOWER',
      type: 'WATCHTOWER_BEACON',
      name: isCrypt ? 'Obsidian Bastion' : 'Ruined Watchtower',
      x: 2350,
      y: 2350,
      radius: 130,
      isActive: false,
      isCompleted: false,
      progress: 0,
      description: isCrypt ? 'Rekindle the Hellfire Signal (stand near hearth for 4s).' : 'Rekindle the Bastion Beacon (stand near hearth for 4s).',
      rewardText: isCrypt ? '+25% Speed & Map Chest Sight' : '+15% Speed & Map Chest Sight',
    });

    // Landmark 5: Sealed Portal Clearing (2000, 1600)
    this.landmarkEvents.set('SEALED_PORTAL_CLEARING', {
      id: 'SEALED_PORTAL_CLEARING',
      type: 'PORTAL_CLEARING',
      name: isCrypt ? 'Crypt Gate Clearing' : 'Sealed Portal Clearing',
      x: 2000,
      y: 1600,
      radius: 120,
      isActive: false,
      isCompleted: false,
      progress: 0,
      description: 'Defeat the Sector Titan to ignite the Planar Extraction Rift.',
      rewardText: 'Safe Extraction or Push Deeper',
    });
  }

  public triggerLandmarkInteraction(landmarkId?: string): boolean {
    if (!this.player) return false;
    for (const [, ev] of this.landmarkEvents) {
      if (landmarkId && ev.id !== landmarkId) continue;
      if (ev.isCompleted) continue;
      const dist = Math.hypot(ev.x - this.playerX, ev.y - this.playerY);
      if (dist <= ev.radius + 35) {
        if (!ev.isActive) {
          ev.isActive = true;
          this.activeLandmarkEvent = ev;
          sound.playCurseEscalate(2);
          this.addFloatingText(ev.x, ev.y - 40, `TRIAL STARTED: ${ev.name}`, '#f59e0b');

          if (ev.type === 'GRAVEYARD_HAUNT') {
            this.spawnTombRevenant(ev.x, ev.y);
          } else if (ev.type === 'SHRINE_TRIAL') {
            for (let i = 0; i < 3; i++) {
              this.spawnRandomEnemy('BAT');
            }
          }

          if (this.callbacks.onLandmarkEventStart) {
            this.callbacks.onLandmarkEventStart(ev);
          }
          return true;
        }
      }
    }
    return false;
  }

  private spawnTombRevenant(x: number, y: number) {
    const isCrypt = this.currentBiomeIndex === 1;
    const hp = isCrypt ? 350 : 220;
    const revenant: Enemy = {
      id: GameEngine.idCounter++,
      type: 'STALKER',
      x: x + 40,
      y: y + 40,
      vx: 0,
      vy: 0,
      radius: 30,
      hp,
      maxHp: hp,
      speed: 150,
      damage: 18,
      xpValue: 45,
      crystalDropChance: 1.0,
      color: isCrypt ? '#f43f5e' : '#c084fc',
      glowColor: isCrypt ? 'rgba(244, 63, 94, 0.8)' : 'rgba(192, 132, 252, 0.8)',
      isBoss: false,
      isElite: true,
      state: 'CHASE',
      stateTimer: 0,
      targetAngle: 0,
      attackCooldown: 1.5,
      hitFlashTimer: 0,
      arcaneShield: 60,
      isEnraged: false,
      burnTimer: 0,
      freezeTimer: 0,
    };
    this.enemies.push(revenant);
    const ev = this.landmarkEvents.get('FORGOTTEN_GRAVEYARD');
    if (ev) {
      ev.guardianEnemyId = revenant.id;
    }
    sound.playBossRoar();
    this.addFloatingText(x, y - 20, isCrypt ? 'MAGMA REVENANT AWAKENED!' : 'TOMB REVENANT AWAKENED!', '#f43f5e');
  }

  private spawnWorldChests(count: number) {
    // 1. Guaranteed Landmark Discoveries (Safely offset from center obstacles)
    // Ancient Shrine Relic Chest (altar at 2350, 850)
    this.chests.push({
      id: GameEngine.idCounter++,
      x: 2395,
      y: 895,
      opened: false,
      relicChest: true,
      radius: 26,
    });
    // Forgotten Graveyard Relic Chest (crypt at 850, 2350)
    this.chests.push({
      id: GameEngine.idCounter++,
      x: 850,
      y: 2415,
      opened: false,
      relicChest: true,
      radius: 26,
    });
    // Corrupted Grove Crystal Chest (elder willow at 850, 850)
    this.chests.push({
      id: GameEngine.idCounter++,
      x: 920,
      y: 850,
      opened: false,
      relicChest: false,
      radius: 26,
    });
    // Ruined Watchtower Crystal Cache (tower foundation at 2350, 2350)
    this.chests.push({
      id: GameEngine.idCounter++,
      x: 2350,
      y: 2418,
      opened: false,
      relicChest: false,
      radius: 26,
    });

    // 2. Exploration Wilderness Chests placed safely without obstacle collision
    for (let i = 0; i < count; i++) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 25) {
        attempts++;
        const angle = Math.random() * Math.PI * 2;
        const dist = 320 + Math.random() * 1150;
        const cx = Math.max(120, Math.min(this.WORLD_WIDTH - 120, this.playerX + Math.cos(angle) * dist));
        const cy = Math.max(120, Math.min(this.WORLD_HEIGHT - 120, this.playerY + Math.sin(angle) * dist));

        if (!this.environment.isBlocked(cx, cy, 26)) {
          this.chests.push({
            id: GameEngine.idCounter++,
            x: cx,
            y: cy,
            opened: false,
            relicChest: i % 4 === 0,
            radius: 26,
          });
          placed = true;
        }
      }
    }
  }

  public start() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  public pause() {
    this.isPaused = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.lastTime = performance.now();
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
      }
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public destroy() {
    this.stop();
    this.clearInputs();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResize);
    }
  }

  // --------------------------------------------------------------------------
  // INPUT DISPATCHERS
  // --------------------------------------------------------------------------
  public setKey(code: string, isDown: boolean) {
    this.keys[code] = isDown;
    if (isDown) {
      if (code === 'Space') {
        this.triggerDash();
      } else if (code === 'KeyQ') {
        this.triggerNova();
      } else if (code === 'KeyE') {
        this.triggerLandmarkInteraction();
      }
    }
  }

  public clearInputs() {
    for (const k in this.keys) {
      this.keys[k] = false;
    }
    this.isMouseDown = false;
    this.joystickVector = { x: 0, y: 0 };
  }

  public setMousePos(x: number, y: number) {
    this.mouseX = x;
    this.mouseY = y;
  }

  public getWorldMousePos(): { x: number; y: number } {
    return {
      x: this.mouseX + this.cameraX,
      y: this.mouseY + this.cameraY,
    };
  }

  public setMouseDown(isDown: boolean) {
    this.isMouseDown = isDown;
    if (isDown) {
      this.triggerSlash();
    }
  }

  public setJoystick(x: number, y: number) {
    this.joystickVector = { x, y };
  }

  public triggerDash() {
    if (!this.player) return;
    if (this.dashCooldownTimer <= 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashTimer = this.player.dashDuration;
      this.dashCooldownTimer = this.player.dashCooldown;
      sound.playDash();
      this.adaptiveDashCounter++;

      for (let i = 0; i < 14; i++) {
        this.particles.push({
          x: this.playerX,
          y: this.playerY,
          vx: (Math.random() - 0.5) * 120,
          vy: (Math.random() - 0.5) * 120,
          radius: 4 + Math.random() * 4,
          color: '#38bdf8',
          alpha: 0.9,
          life: 0.25,
          maxLife: 0.25,
        });
      }

      if (this.adaptiveDashCounter >= 8 && !this.activeAffixes.includes('BLINK_HUNTERS')) {
        this.activeAffixes.push('BLINK_HUNTERS');
        this.addFloatingText(this.playerX, this.playerY - 40, "CURSE MUTATION: BLINK HUNTERS", "#a855f7");
      }
    }
  }

  public triggerNova() {
    if (!this.player) return;
    if (this.novaCooldownTimer <= 0) {
      this.novaCooldownTimer = this.player.novaCooldown;
      sound.playNova();
      this.screenShake = 16;

      for (let i = 0; i < 40; i++) {
        const ang = (i / 40) * Math.PI * 2;
        this.particles.push({
          x: this.playerX,
          y: this.playerY,
          vx: Math.cos(ang) * 350,
          vy: Math.sin(ang) * 350,
          radius: 5 + Math.random() * 4,
          color: '#c084fc',
          alpha: 1,
          life: 0.45,
          maxLife: 0.45,
        });
      }

      this.enemies.forEach(e => {
        const dx = e.x - this.playerX;
        const dy = e.y - this.playerY;
        const dist = Math.hypot(dx, dy);
        if (dist <= this.player.novaRadius) {
          this.applyDamageToEnemy(e, this.player.novaDamage, true, 30);
        }
      });

      if (this.activeLandmarkEvent?.targetObjectives) {
        for (const obj of this.activeLandmarkEvent.targetObjectives) {
          if (!obj.destroyed) {
            const dist = Math.hypot(obj.x - this.playerX, obj.y - this.playerY);
            if (dist <= this.player.novaRadius) {
              this.damageTargetObjective(obj, this.player.novaDamage);
            }
          }
        }
      }
    }
  }

  public triggerSlash() {
    if (!this.player) return;
    if (this.slashCooldownTimer <= 0) {
      this.slashCooldownTimer = this.player.slashCooldown;
      this.slashAnimTimer = 0.16;
      this.slashArcFacing = this.playerAngle;
      sound.playSlash();

      const arcAngle = Math.PI * 0.75;
      const reach = this.player.slashArcRadius;

      let hitAny = false;
      this.enemies.forEach(e => {
        const dx = e.x - this.playerX;
        const dy = e.y - this.playerY;
        const dist = Math.hypot(dx, dy);
        if (dist <= reach + e.radius) {
          const angleToEnemy = Math.atan2(dy, dx);
          let diff = angleToEnemy - this.slashArcFacing;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;

          if (Math.abs(diff) <= arcAngle / 2) {
            hitAny = true;
            const isCrit = Math.random() < this.player.critChance;
            const dmg = this.player.slashDamage * (isCrit ? this.player.critDamageMult : 1);
            this.applyDamageToEnemy(e, dmg, isCrit, this.player.slashKnockback);

            if (this.player.lifeStealPercent > 0) {
              const heal = Math.max(1, Math.round(dmg * this.player.lifeStealPercent));
              this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
            }
          }
        }
      });

      if (this.activeLandmarkEvent?.targetObjectives) {
        for (const obj of this.activeLandmarkEvent.targetObjectives) {
          if (!obj.destroyed) {
            const dx = obj.x - this.playerX;
            const dy = obj.y - this.playerY;
            const dist = Math.hypot(dx, dy);
            if (dist <= reach + obj.radius) {
              const angleToObj = Math.atan2(dy, dx);
              let diff = angleToObj - this.slashArcFacing;
              while (diff < -Math.PI) diff += Math.PI * 2;
              while (diff > Math.PI) diff -= Math.PI * 2;
              if (Math.abs(diff) <= arcAngle / 2) {
                this.damageTargetObjective(obj, this.player.slashDamage);
                hitAny = true;
              }
            }
          }
        }
      }

      if (hitAny) {
        this.hitstopTimer = 0.04;
      }
    }
  }

  private damageTargetObjective(obj: LandmarkTargetObjective, damage: number) {
    if (obj.destroyed) return;
    obj.hp -= damage;
    sound.playEnemyHit(false);
    this.addFloatingText(obj.x, obj.y - 15, `${Math.round(damage)}`, '#34d399');

    for (let p = 0; p < 4; p++) {
      this.particles.push({
        x: obj.x,
        y: obj.y,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        radius: 3,
        color: '#34d399',
        alpha: 0.9,
        life: 0.2,
        maxLife: 0.2,
      });
    }

    if (obj.hp <= 0) {
      obj.destroyed = true;
      sound.playChestOpen();
      this.addFloatingText(obj.x, obj.y - 30, `${obj.name} SEVERED!`, '#10b981');
      for (let p = 0; p < 16; p++) {
        this.particles.push({
          x: obj.x,
          y: obj.y,
          vx: (Math.random() - 0.5) * 140,
          vy: (Math.random() - 0.5) * 140,
          radius: 4,
          color: '#10b981',
          alpha: 1,
          life: 0.35,
          maxLife: 0.35,
        });
      }
    }
  }

  // --------------------------------------------------------------------------
  // GAME LOOP
  // --------------------------------------------------------------------------
  private loop = (now: number) => {
    if (!this.isRunning || this.isPaused) {
      this.rafId = null;
      return;
    }

    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05);

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
    } else {
      this.update(dt);
    }

    // Only render and schedule next frame if update didn't pause or stop the game loop
    if (this.isRunning && !this.isPaused) {
      this.totalElapsedTime += dt;
      this.render();
      this.rafId = requestAnimationFrame(this.loop);
    } else {
      this.rafId = null;
    }
  };

  // --------------------------------------------------------------------------
  // SIMULATION UPDATE
  // --------------------------------------------------------------------------
  private update(dt: number) {
    if (!this.player) return;

    // 1. Sector Timer & Living Curse Escalation
    this.sectorTimer += dt;
    this.updateCurseEscalation(dt);

    // 2. Cooldowns
    if (this.slashCooldownTimer > 0) this.slashCooldownTimer -= dt;
    if (this.slashAnimTimer > 0) this.slashAnimTimer -= dt;
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;
    if (this.novaCooldownTimer > 0) this.novaCooldownTimer -= dt;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;

    // 3. Movement
    let moveX = 0;
    let moveY = 0;

    if (this.keys.KeyW || this.keys.ArrowUp) moveY -= 1;
    if (this.keys.KeyS || this.keys.ArrowDown) moveY += 1;
    if (this.keys.KeyA || this.keys.ArrowLeft) moveX -= 1;
    if (this.keys.KeyD || this.keys.ArrowRight) moveX += 1;

    if (Math.abs(this.joystickVector.x) > 0.1 || Math.abs(this.joystickVector.y) > 0.1) {
      moveX = this.joystickVector.x;
      moveY = this.joystickVector.y;
    }

    const moveLen = Math.hypot(moveX, moveY);
    if (moveLen > 0.05) {
      moveX /= Math.max(1, moveLen);
      moveY /= Math.max(1, moveLen);
    }

    let speed = this.player.moveSpeed;
    if (this.isDashing) {
      this.dashTimer -= dt;
      speed *= this.player.dashSpeedMult;

      if (this.player.flameTrail && Math.random() < 0.4) {
        this.hazards.push({
          id: GameEngine.idCounter++,
          x: this.playerX,
          y: this.playerY,
          radius: 28,
          type: 'FIRE_PATCH',
          duration: 3.5,
          damageTickRate: 0.25,
          damageTimer: 0,
          damage: 18,
          telegraphTimer: 0,
        });
      }

      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }

    const targetX = Math.max(40, Math.min(this.WORLD_WIDTH - 40, this.playerX + this.playerVx * dt));
    const targetY = Math.max(40, Math.min(this.WORLD_HEIGHT - 40, this.playerY + this.playerVy * dt));

    const playerRadius = this.isDashing ? 12 : 18;
    const resolved = this.environment.resolveCollision(targetX, targetY, playerRadius);
    this.playerX = resolved.x;
    this.playerY = resolved.y;

    // Player aim angle
    if (moveLen > 0.1 && (Math.abs(this.joystickVector.x) > 0.1 || Math.abs(this.joystickVector.y) > 0.1)) {
      this.playerAngle = Math.atan2(moveY, moveX);
    } else {
      const worldMouse = this.getWorldMousePos();
      this.playerAngle = Math.atan2(worldMouse.y - this.playerY, worldMouse.x - this.playerX);
    }

    if (this.isMouseDown) {
      this.triggerSlash();
    }

    // 4. Orbiting Orbs
    this.orbBaseAngle += this.player.orbSpeed * dt;
    this.updateOrbitingOrbs();

    // 5. Update Atmosphere
    this.environment.updateAtmosphere(
      dt,
      this.curseLevel,
      this.cameraX,
      this.cameraY,
      this.canvas.width,
      this.canvas.height
    );

    // 6. Update Entities
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateHazards(dt);
    this.updateParticles(dt);
    this.updateLoot(dt);
    this.updateWorldInteractions(dt);
    this.updateLandmarkEvents(dt);

    // 7. Camera Tracking
    const targetCamX = this.playerX - this.canvas.width / 2;
    const targetCamY = this.playerY - this.canvas.height / 2;
    this.cameraX += (targetCamX - this.cameraX) * 0.1;
    this.cameraY += (targetCamY - this.cameraY) * 0.1;

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 30);
    }

    // 8. Notify UI
    this.callbacks.onStatsUpdate({
      hp: Math.ceil(this.player.hp),
      maxHp: this.player.maxHp,
      level: this.player.level,
      xp: Math.floor(this.player.xp),
      xpToNext: this.player.xpToNext,
      crystals: this.player.soulCrystals,
      relics: this.player.relicsFound,
      curseLevel: this.curseLevel,
      curseTimer: this.sectorTimer,
      activeAffixes: this.activeAffixes,
      bossHp: this.bossEntity ? Math.max(0, Math.ceil(this.bossEntity.hp)) : undefined,
      bossMaxHp: this.bossEntity ? this.bossEntity.maxHp : undefined,
      bossName: this.bossEntity ? this.currentBiome.bossName : undefined,
      dashCdRatio: Math.max(0, this.dashCooldownTimer / this.player.dashCooldown),
      novaCdRatio: Math.max(0, this.novaCooldownTimer / this.player.novaCooldown),
      activeLandmarkEvent: this.activeLandmarkEvent,
      nearbyLandmark: this.nearbyLandmark,
      sectorIndex: this.currentBiomeIndex + 1,
      sectorName: this.currentBiome.name,
      rewardMultiplier: this.sectorRewardMultiplier,
      bossWarningTimer: this.bossWarningTimer > 0 ? Math.ceil(this.bossWarningTimer) : undefined,
    });
  }

  // --------------------------------------------------------------------------
  // LIVING CURSE SYSTEM
  // --------------------------------------------------------------------------
  private updateCurseEscalation(dt: number) {
    const elapsed = this.sectorTimer;

    // Boss warning banner in the 30 seconds preceding boss spawn (270s to 300s)
    if (elapsed >= 270 && elapsed < 300) {
      this.bossWarningTimer = Math.max(0, 300 - elapsed);
      if (Math.floor(elapsed) === 270 && !this.bossSpawned) {
        sound.playCurseEscalate(3);
        this.screenShake = 16;
        this.addFloatingText(this.playerX, this.playerY - 70, "WARNING: SECTOR TITAN AWAKENS IN 30s!", "#ef4444");
      }
    } else {
      this.bossWarningTimer = 0;
    }

    if (elapsed >= 300 && this.curseLevel < 3) {
      this.curseLevel = 3;
      sound.playCurseEscalate(3);
      this.screenShake = 24;
      const titanTitle = this.currentBiomeIndex === 1 ? "NIGHTMARE: IGNIS THE OBSIDIAN OVERLORD" : "NIGHTMARE: MALAKOR THE GROVE TITAN";
      this.addFloatingText(this.playerX, this.playerY - 60, titanTitle, "#ef4444");
      sound.updateCurseAmbience(3);
      this.spawnSectorBoss();
    } else if (elapsed >= 90 && this.curseLevel < 2) {
      this.curseLevel = 2;
      sound.playCurseEscalate(2);
      this.screenShake = 14;
      this.addFloatingText(this.playerX, this.playerY - 60, "CURSE LEVEL 2: CORRUPTION", "#a855f7");
      sound.updateCurseAmbience(2);

      if (!this.activeAffixes.includes('VOID_FISSURES')) {
        this.activeAffixes.push('VOID_FISSURES');
      }
    }

    if (this.curseLevel >= 2 && Math.random() < dt * 0.35) {
      this.spawnRandomHazard();
    }

    this.nextEnemySpawnTimer -= dt;
    if (this.nextEnemySpawnTimer <= 0) {
      // Gentle early-game curve to eliminate cheap early deaths
      const maxEnemies = elapsed < 60 ? 10 : this.curseLevel === 1 ? 18 : this.curseLevel === 2 ? 35 : 55;
      if (this.enemies.length < maxEnemies) {
        this.spawnWave();
      }
      const baseInterval = elapsed < 60 ? 4.0 : this.curseLevel === 1 ? 3.0 : 2.0;
      this.nextEnemySpawnTimer = Math.max(1.5, baseInterval - this.sectorTimer * 0.003);
    }

    if (this.chestSightTimer > 0) {
      this.chestSightTimer -= dt;
    }
  }

  private spawnWave() {
    const elapsed = this.sectorTimer;
    // In first 45 seconds: only 1 bat spawned, far from player
    const count = elapsed < 45 ? 1 : elapsed < 90 ? 2 : 2 + Math.floor(elapsed / 90);
    for (let i = 0; i < count; i++) {
      const roll = Math.random();
      if (this.curseLevel === 1) {
        if (elapsed < 45 || roll < 0.8) this.spawnRandomEnemy('BAT');
        else this.spawnRandomEnemy('WOLF');
      } else if (this.curseLevel === 2) {
        if (roll < 0.35) this.spawnRandomEnemy('BAT');
        else if (roll < 0.65) this.spawnRandomEnemy('WOLF');
        else if (roll < 0.85) this.spawnRandomEnemy('SPITTER');
        else this.spawnRandomEnemy('STALKER');
      } else {
        if (roll < 0.25) this.spawnRandomEnemy('WOLF');
        else if (roll < 0.55) this.spawnRandomEnemy('SPITTER');
        else this.spawnRandomEnemy('STALKER');
      }
    }
  }

  private spawnRandomEnemy(type: Enemy['type'], isElite: boolean = false) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 550 + Math.random() * 250;
    let x = Math.max(60, Math.min(this.WORLD_WIDTH - 60, this.playerX + Math.cos(angle) * dist));
    let y = Math.max(60, Math.min(this.WORLD_HEIGHT - 60, this.playerY + Math.sin(angle) * dist));

    if (this.environment.isBlocked(x, y, 20)) {
      const resolved = this.environment.resolveCollision(x, y, 20);
      x = resolved.x;
      y = resolved.y;
    }

    let hp = 30;
    let speed = 120;
    let radius = 16;
    let damage = 10;
    let xp = 4;
    let color = '#94a3b8';
    let glowColor = 'rgba(148, 163, 184, 0.4)';

    if (type === 'BAT') {
      const isEarly = this.sectorTimer < 90;
      hp = 20 + Math.floor(this.sectorTimer * 0.06);
      speed = 160 + Math.floor(this.sectorTimer * 0.08);
      radius = 14;
      damage = isEarly ? 5 : 8;
      xp = 3;
      color = '#e2e8f0';
      glowColor = 'rgba(226, 232, 240, 0.5)';
    } else if (type === 'WOLF') {
      hp = 48 + Math.floor(this.sectorTimer * 0.15);
      speed = 135;
      radius = 20;
      damage = 14;
      xp = 7;
      color = '#f87171';
      glowColor = 'rgba(248, 113, 113, 0.5)';
    } else if (type === 'SPITTER') {
      hp = 55 + Math.floor(this.sectorTimer * 0.12);
      speed = 95;
      radius = 18;
      damage = 12;
      xp = 10;
      color = '#34d399';
      glowColor = 'rgba(52, 211, 153, 0.5)';
    } else if (type === 'STALKER') {
      hp = 140 + Math.floor(this.sectorTimer * 0.25);
      speed = 160;
      radius = 26;
      damage = 24;
      xp = 22;
      color = '#c084fc';
      glowColor = 'rgba(192, 132, 252, 0.6)';
      isElite = true;
    }

    const hasArcaneShield = this.activeAffixes.includes('ARCANE_WARD') || (this.adaptiveOrbHitCounter > 15 && Math.random() < 0.4);

    this.enemies.push({
      id: GameEngine.idCounter++,
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: isElite ? radius * 1.25 : radius,
      hp: isElite ? hp * 1.8 : hp,
      maxHp: isElite ? hp * 1.8 : hp,
      speed,
      damage,
      xpValue: isElite ? xp * 2 : xp,
      crystalDropChance: isElite ? 0.7 : 0.15,
      color,
      glowColor,
      isBoss: false,
      isElite,
      state: 'CHASE',
      stateTimer: 0,
      targetAngle: 0,
      attackCooldown: 1.0 + Math.random(),
      hitFlashTimer: 0,
      arcaneShield: hasArcaneShield ? 35 : 0,
      isEnraged: false,
      burnTimer: 0,
      freezeTimer: 0,
    });
  }

  private spawnSectorBoss() {
    if (this.bossSpawned) return;
    this.bossSpawned = true;
    sound.playBossRoar();

    const angle = Math.random() * Math.PI * 2;
    const dist = 450;
    let x = Math.max(200, Math.min(this.WORLD_WIDTH - 200, this.playerX + Math.cos(angle) * dist));
    let y = Math.max(200, Math.min(this.WORLD_HEIGHT - 200, this.playerY + Math.sin(angle) * dist));

    if (this.environment.isBlocked(x, y, 46)) {
      const resolved = this.environment.resolveCollision(x, y, 46);
      x = resolved.x;
      y = resolved.y;
    }

    const isCrypt = this.currentBiomeIndex === 1;
    const bossType: Enemy['type'] = isCrypt ? 'CRYPT_LORD' : 'GROVE_TITAN';
    const bossHp = isCrypt ? 1400 : 950;

    const boss: Enemy = {
      id: GameEngine.idCounter++,
      type: bossType,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 46,
      hp: bossHp,
      maxHp: bossHp,
      speed: 105,
      damage: 28,
      xpValue: 120,
      crystalDropChance: 1.0,
      color: isCrypt ? '#f43f5e' : '#10b981',
      glowColor: isCrypt ? 'rgba(244, 63, 94, 0.8)' : 'rgba(16, 185, 129, 0.8)',
      isBoss: true,
      isElite: true,
      state: 'CHASE',
      stateTimer: 0,
      targetAngle: 0,
      attackCooldown: 2.0,
      hitFlashTimer: 0,
      arcaneShield: 100,
      isEnraged: false,
      burnTimer: 0,
      freezeTimer: 0,
    };

    this.enemies.push(boss);
    this.bossEntity = boss;
  }

  private spawnRandomHazard() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 100 + Math.random() * 400;
    this.hazards.push({
      id: GameEngine.idCounter++,
      x: this.playerX + Math.cos(angle) * dist,
      y: this.playerY + Math.sin(angle) * dist,
      radius: 55,
      type: 'VOID_FISSURE',
      duration: 6.0,
      damageTickRate: 0.35,
      damageTimer: 0,
      damage: 14,
      telegraphTimer: 1.2,
    });
  }

  private updateOrbitingOrbs() {
    if (!this.player) return;
    const count = this.player.orbCount;
    const distance = 80;

    for (let i = 0; i < count; i++) {
      const angle = this.orbBaseAngle + (i / count) * Math.PI * 2;
      const orbX = this.playerX + Math.cos(angle) * distance;
      const orbY = this.playerY + Math.sin(angle) * distance;

      this.enemies.forEach(e => {
        const dist = Math.hypot(e.x - orbX, e.y - orbY);
        if (dist <= this.player.orbRadius + e.radius) {
          this.applyDamageToEnemy(e, this.player.orbDamage, false, 8);
          sound.playOrbHit();
          this.adaptiveOrbHitCounter++;

          if (this.adaptiveOrbHitCounter >= 25 && !this.activeAffixes.includes('ARCANE_WARD')) {
            this.activeAffixes.push('ARCANE_WARD');
            this.addFloatingText(this.playerX, this.playerY - 40, "CURSE MUTATION: ARCANE WARD", "#38bdf8");
          }

          for (let p = 0; p < 4; p++) {
            this.particles.push({
              x: orbX,
              y: orbY,
              vx: (Math.random() - 0.5) * 80,
              vy: (Math.random() - 0.5) * 80,
              radius: 2 + Math.random() * 2,
              color: '#38bdf8',
              alpha: 0.8,
              life: 0.2,
              maxLife: 0.2,
            });
          }
        }
      });

      if (this.activeLandmarkEvent?.targetObjectives) {
        for (const obj of this.activeLandmarkEvent.targetObjectives) {
          if (!obj.destroyed) {
            const dist = Math.hypot(obj.x - orbX, obj.y - orbY);
            if (dist <= this.player.orbRadius + obj.radius) {
              this.damageTargetObjective(obj, this.player.orbDamage);
            }
          }
        }
      }
    }
  }

  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      if (e.hitFlashTimer > 0) e.hitFlashTimer -= dt;

      if (e.burnTimer > 0) {
        e.burnTimer -= dt;
        e.hp -= 12 * dt;
        if (Math.random() < 0.2) {
          this.addFloatingText(e.x, e.y, "6", "#f97316");
        }
      }

      let speedMult = 1.0;
      if (e.freezeTimer > 0) {
        e.freezeTimer -= dt;
        speedMult = 0.6;
      }

      if (e.hp <= 0) {
        this.killEnemy(e);
        this.enemies.splice(i, 1);
        continue;
      }

      const dx = this.playerX - e.x;
      const dy = this.playerY - e.y;
      const distToPlayer = Math.hypot(dx, dy);

      e.attackCooldown -= dt;

      if (e.type === 'WOLF') {
        if (distToPlayer < 180 && e.state === 'CHASE' && e.attackCooldown <= 0) {
          e.state = 'TELEGRAPH';
          e.stateTimer = 0.45;
          e.targetAngle = Math.atan2(dy, dx);
        }

        if (e.state === 'TELEGRAPH') {
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.state = 'ATTACK';
            e.stateTimer = 0.3;
            e.vx = Math.cos(e.targetAngle) * 320;
            e.vy = Math.sin(e.targetAngle) * 320;
            e.attackCooldown = 2.0;
          }
        } else if (e.state === 'ATTACK') {
          e.stateTimer -= dt;
          e.x += e.vx * dt;
          e.y += e.vy * dt;
          if (e.stateTimer <= 0) {
            e.state = 'CHASE';
          }
        } else {
          const angle = Math.atan2(dy, dx);
          e.vx = Math.cos(angle) * e.speed * speedMult;
          e.vy = Math.sin(angle) * e.speed * speedMult;
          e.x += e.vx * dt;
          e.y += e.vy * dt;
        }
      } else if (e.type === 'SPITTER') {
        const desiredDist = 260;
        const angle = Math.atan2(dy, dx);

        if (distToPlayer < desiredDist - 40) {
          e.vx = -Math.cos(angle) * e.speed * speedMult;
          e.vy = -Math.sin(angle) * e.speed * speedMult;
        } else if (distToPlayer > desiredDist + 60) {
          e.vx = Math.cos(angle) * e.speed * speedMult;
          e.vy = Math.sin(angle) * e.speed * speedMult;
        } else {
          e.vx = 0;
          e.vy = 0;
        }

        e.x += e.vx * dt;
        e.y += e.vy * dt;

        if (e.attackCooldown <= 0 && distToPlayer < 400) {
          e.attackCooldown = 2.2;
          this.shootEnemyNeedle(e.x, e.y, angle);
        }
      } else if (e.type === 'STALKER') {
        const angle = Math.atan2(dy, dx);
        e.vx = Math.cos(angle) * e.speed * speedMult;
        e.vy = Math.sin(angle) * e.speed * speedMult;
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        if (this.activeAffixes.includes('BLINK_HUNTERS') && distToPlayer > 200 && e.attackCooldown <= 0) {
          e.attackCooldown = 4.0;
          e.x = this.playerX + (Math.random() - 0.5) * 120;
          e.y = this.playerY + (Math.random() - 0.5) * 120;
          sound.playDash();
          for (let p = 0; p < 12; p++) {
            this.particles.push({
              x: e.x,
              y: e.y,
              vx: (Math.random() - 0.5) * 100,
              vy: (Math.random() - 0.5) * 100,
              radius: 4,
              color: '#a855f7',
              alpha: 0.9,
              life: 0.3,
              maxLife: 0.3,
            });
          }
        }
      } else if (e.isBoss) {
        const angle = Math.atan2(dy, dx);
        e.vx = Math.cos(angle) * e.speed * speedMult;
        e.vy = Math.sin(angle) * e.speed * speedMult;
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        if (e.attackCooldown <= 0) {
          e.attackCooldown = 3.5;
          const attackRoll = Math.random();
          if (attackRoll < 0.5) {
            this.triggerBossStomp(e.x, e.y);
          } else {
            this.spawnRandomEnemy('BAT');
            this.spawnRandomEnemy('BAT');
          }
        }
      } else {
        const angle = Math.atan2(dy, dx);
        e.vx = Math.cos(angle) * e.speed * speedMult;
        e.vy = Math.sin(angle) * e.speed * speedMult;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      }

      // Smooth obstacle collision sliding for regular monsters and bosses
      const resolved = this.environment.resolveCollision(e.x, e.y, e.radius * 0.75);
      e.x = resolved.x;
      e.y = resolved.y;

      if (distToPlayer <= e.radius + 18) {
        this.hitPlayer(e.damage);
      }
    }
  }

  private shootEnemyNeedle(x: number, y: number, angle: number) {
    this.projectiles.push({
      id: GameEngine.idCounter++,
      x,
      y,
      vx: Math.cos(angle) * 220,
      vy: Math.sin(angle) * 220,
      radius: 6,
      damage: 14,
      duration: 3.0,
      isPlayer: false,
      color: '#34d399',
      glowColor: 'rgba(52, 211, 153, 0.7)',
      penetrate: 1,
      type: 'NEEDLE',
    });
  }

  private triggerBossStomp(x: number, y: number) {
    sound.playBossRoar();
    this.screenShake = 18;
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      this.projectiles.push({
        id: GameEngine.idCounter++,
        x,
        y,
        vx: Math.cos(ang) * 160,
        vy: Math.sin(ang) * 160,
        radius: 9,
        damage: 22,
        duration: 2.2,
        isPlayer: false,
        color: this.currentBiomeIndex === 1 ? '#f43f5e' : '#10b981',
        glowColor: 'rgba(244, 63, 94, 0.8)',
        penetrate: 1,
        type: 'BOSS_BEAM',
      });
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.duration -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.duration <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (!p.isPlayer) {
        const dist = Math.hypot(p.x - this.playerX, p.y - this.playerY);
        if (dist <= p.radius + 18) {
          this.hitPlayer(p.damage);
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  private updateHazards(dt: number) {
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];

      if (h.telegraphTimer > 0) {
        h.telegraphTimer -= dt;
      } else {
        h.duration -= dt;
        h.damageTimer -= dt;

        if (h.damageTimer <= 0) {
          h.damageTimer = h.damageTickRate;
          const distToPlayer = Math.hypot(h.x - this.playerX, h.y - this.playerY);
          if (distToPlayer <= h.radius + 14) {
            this.hitPlayer(h.damage);
          }

          if (h.type === 'FIRE_PATCH') {
            this.enemies.forEach(e => {
              if (Math.hypot(e.x - h.x, e.y - h.y) <= h.radius + e.radius) {
                this.applyDamageToEnemy(e, h.damage, false, 0);
              }
            });
          }
        }
      }

      if (h.duration <= 0) {
        this.hazards.splice(i, 1);
      }
    }
  }

  public applyDamageToEnemy(e: Enemy, rawDamage: number, isCrit: boolean, knockback: number) {
    let finalDmg = rawDamage;

    if (e.arcaneShield > 0) {
      if (e.arcaneShield >= finalDmg) {
        e.arcaneShield -= finalDmg;
        this.addFloatingText(e.x, e.y - 15, "BLOCKED", "#38bdf8");
        sound.playEnemyHit(false);
        return;
      } else {
        finalDmg -= e.arcaneShield;
        e.arcaneShield = 0;
      }
    }

    e.hp -= finalDmg;
    e.hitFlashTimer = 0.12;
    sound.playEnemyHit(isCrit);

    if (knockback > 0 && !e.isBoss) {
      const angle = Math.atan2(e.y - this.playerY, e.x - this.playerX);
      e.x += Math.cos(angle) * knockback;
      e.y += Math.sin(angle) * knockback;
    }

    if (this.player.glacialFreeze) {
      e.freezeTimer = 2.0;
    }

    if (this.player.lightningChain && isCrit) {
      this.triggerChainLightning(e);
    }

    const textStr = isCrit ? `${Math.round(finalDmg)}! CRIT` : `${Math.round(finalDmg)}`;
    this.addFloatingText(e.x, e.y - 20, textStr, isCrit ? '#f59e0b' : '#ffffff', isCrit);

    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: e.x,
        y: e.y,
        vx: (Math.random() - 0.5) * 90,
        vy: (Math.random() - 0.5) * 90,
        radius: 2 + Math.random() * 3,
        color: e.color,
        alpha: 0.9,
        life: 0.2,
        maxLife: 0.2,
      });
    }
  }

  private triggerChainLightning(startEnemy: Enemy) {
    let count = 0;
    let prevX = startEnemy.x;
    let prevY = startEnemy.y;

    this.enemies.forEach(other => {
      if (other.id !== startEnemy.id && count < 3) {
        const dist = Math.hypot(other.x - prevX, other.y - prevY);
        if (dist <= 180) {
          count++;
          this.applyDamageToEnemy(other, this.player.slashDamage * 0.7, false, 4);

          for (let p = 0; p < 6; p++) {
            const lerp = p / 6;
            this.particles.push({
              x: prevX + (other.x - prevX) * lerp + (Math.random() - 0.5) * 10,
              y: prevY + (other.y - prevY) * lerp + (Math.random() - 0.5) * 10,
              vx: 0,
              vy: 0,
              radius: 2.5,
              color: '#38bdf8',
              alpha: 1,
              life: 0.18,
              maxLife: 0.18,
            });
          }
          prevX = other.x;
          prevY = other.y;
        }
      }
    });
  }

  private killEnemy(e: Enemy) {
    this.runEnemiesKilled++;

    this.lootDrops.push({
      id: GameEngine.idCounter++,
      x: e.x,
      y: e.y,
      type: 'XP_GEM',
      value: e.xpValue,
      radius: 9,
      color: '#38bdf8',
    });

    if (Math.random() < e.crystalDropChance) {
      const baseAmount = e.isBoss ? 25 : e.isElite ? 5 : 1;
      const crystalAmount = Math.round(baseAmount * this.sectorRewardMultiplier);
      this.lootDrops.push({
        id: GameEngine.idCounter++,
        x: e.x + (Math.random() - 0.5) * 20,
        y: e.y + (Math.random() - 0.5) * 20,
        type: 'CRYSTAL',
        value: crystalAmount,
        radius: 11,
        color: '#a855f7',
      });
    }

    if (Math.random() < 0.08 && this.player.hp < this.player.maxHp) {
      this.lootDrops.push({
        id: GameEngine.idCounter++,
        x: e.x,
        y: e.y,
        type: 'HEALTH_POTION',
        value: 30,
        radius: 10,
        color: '#10b981',
      });
    }

    // Check if this enemy was a Tomb Revenant from the Graveyard Haunt
    const graveEv = this.landmarkEvents.get('FORGOTTEN_GRAVEYARD');
    if (graveEv && graveEv.guardianEnemyId === e.id) {
      graveEv.isCompleted = true;
      graveEv.isActive = false;
      graveEv.progress = 1.0;
      if (this.activeLandmarkEvent?.id === graveEv.id) this.activeLandmarkEvent = null;
      sound.playChestOpen();
      const relicsReward = Math.round(1 * this.sectorRewardMultiplier);
      const crystalsReward = Math.round(25 * this.sectorRewardMultiplier);
      this.player.relicsFound += relicsReward;
      this.totalRelicsEarned += relicsReward;
      this.player.soulCrystals += crystalsReward;
      this.totalCrystalsEarned += crystalsReward;
      this.player.critChance = Math.min(0.75, this.player.critChance + 0.10);
      this.addFloatingText(e.x, e.y - 50, "TOMB REVENANT VANQUISHED!", "#f59e0b");
      this.addFloatingText(this.playerX, this.playerY - 40, `+${relicsReward} Relic, +${crystalsReward} Crystals, +10% Crit!`, "#a855f7");
      if (this.callbacks.onLandmarkEventComplete) this.callbacks.onLandmarkEventComplete(graveEv);
    }

    if (e.isBoss) {
      this.bossDefeated = true;
      this.bossEntity = null;
      this.screenShake = 24;
      sound.playPortalActive();

      const relicAmount = Math.round(1 * this.sectorRewardMultiplier);
      this.lootDrops.push({
        id: GameEngine.idCounter++,
        x: e.x,
        y: e.y,
        type: 'RELIC',
        value: relicAmount,
        radius: 15,
        color: '#f59e0b',
      });

      this.portal.x = e.x;
      this.portal.y = e.y;
      this.portal.active = true;
      const portalEv = this.landmarkEvents.get('SEALED_PORTAL_CLEARING');
      if (portalEv) {
        portalEv.isCompleted = true;
        portalEv.progress = 1.0;
      }
      this.callbacks.onExtractionPortalReady();
      this.addFloatingText(e.x, e.y - 50, "PLANAR PORTAL OPENED!", "#f59e0b");
    }
  }

  public hitPlayer(damage: number) {
    if (!this.player) return;
    if (this.invincibleTimer > 0 || (this.isDashing && this.player.dashInvulnerable)) {
      return;
    }

    const reduced = damage * (1 - this.player.armor);
    this.player.hp -= Math.max(1, Math.round(reduced));
    this.invincibleTimer = 0.4;
    this.screenShake = 12;
    sound.playPlayerHurt();

    this.addFloatingText(this.playerX, this.playerY - 30, `-${Math.round(reduced)}`, '#ef4444');

    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.triggerGameOver();
    }
  }

  private triggerGameOver() {
    this.stop();
    sound.playGameOver();
    this.callbacks.onGameOver({
      timeSurvived: Math.floor(this.sectorTimer),
      kills: this.runEnemiesKilled,
      crystalsEarned: this.player ? this.player.soulCrystals : 0,
      relicsEarned: this.player ? this.player.relicsFound : 0,
      bossDefeated: this.bossDefeated,
    });
  }

  private updateLoot(dt: number) {
    if (!this.player) return;
    const magnetDist = this.player.pickupMagnetRadius;

    for (let i = this.lootDrops.length - 1; i >= 0; i--) {
      const drop = this.lootDrops[i];
      const dx = this.playerX - drop.x;
      const dy = this.playerY - drop.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= magnetDist) {
        const pullSpeed = 480;
        drop.x += (dx / dist) * pullSpeed * dt;
        drop.y += (dy / dist) * pullSpeed * dt;
      }

      if (dist <= drop.radius + 18) {
        if (drop.type === 'XP_GEM') {
          sound.playGemCollect();
          this.player.xp += drop.value;
          this.checkLevelUp();
        } else if (drop.type === 'CRYSTAL') {
          sound.playCrystalCollect();
          this.player.soulCrystals += drop.value;
          this.totalCrystalsEarned += drop.value;
          this.addFloatingText(this.playerX, this.playerY - 25, `+${drop.value} Crystals`, '#a855f7');
        } else if (drop.type === 'RELIC') {
          sound.playChestOpen();
          this.player.relicsFound += drop.value;
          this.totalRelicsEarned += drop.value;
          this.addFloatingText(this.playerX, this.playerY - 25, `ANCIENT RELIC ACQUIRED!`, '#f59e0b');
        } else if (drop.type === 'HEALTH_POTION') {
          sound.playGemCollect();
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + drop.value);
          this.addFloatingText(this.playerX, this.playerY - 25, `+${drop.value} HP`, '#10b981');
        }

        this.lootDrops.splice(i, 1);
      }
    }
  }

  private checkLevelUp() {
    if (!this.player) return;
    if (this.player.xp >= this.player.xpToNext) {
      this.player.xp -= this.player.xpToNext;
      this.player.level++;
      this.player.xpToNext = Math.round(this.player.xpToNext * 1.35 + 15);
      sound.playLevelUp();
      this.addFloatingText(this.playerX, this.playerY - 45, "LEVEL UP!", "#38bdf8");
      this.pause();
      this.callbacks.onLevelUp();
    }
  }

  private updateWorldInteractions(dt: number) {
    if (!this.player) return;

    this.chests.forEach(chest => {
      if (!chest.opened) {
        const dist = Math.hypot(chest.x - this.playerX, chest.y - this.playerY);
        if (dist <= chest.radius + 20) {
          chest.opened = true;
          sound.playChestOpen();

          const baseCrystals = chest.relicChest ? 12 : 5;
          const crystalReward = Math.round(baseCrystals * this.sectorRewardMultiplier);
          this.player.soulCrystals += crystalReward;
          this.totalCrystalsEarned += crystalReward;
          if (chest.relicChest) {
            const relicReward = Math.round(1 * this.sectorRewardMultiplier);
            this.player.relicsFound += relicReward;
            this.totalRelicsEarned += relicReward;
            this.addFloatingText(chest.x, chest.y - 50, relicReward > 1 ? `ANCIENT RELICS x${relicReward} ACQUIRED!` : "ANCIENT RELIC ACQUIRED!", "#f59e0b");
          }
          this.player.xp += 18;
          this.checkLevelUp();

          this.addFloatingText(chest.x, chest.y - 30, `+${crystalReward} Crystals!`, '#f59e0b');

          for (let p = 0; p < 16; p++) {
            this.particles.push({
              x: chest.x,
              y: chest.y,
              vx: (Math.random() - 0.5) * 140,
              vy: (Math.random() - 0.5) * 140,
              radius: 4,
              color: '#f59e0b',
              alpha: 1,
              life: 0.4,
              maxLife: 0.4,
            });
          }
        }
      }
    });

    if (this.portal.active) {
      this.portal.pulseTimer += dt;
      const dist = Math.hypot(this.portal.x - this.playerX, this.portal.y - this.playerY);
      if (dist <= this.portal.radius + 15) {
        this.pause();
        this.callbacks.onStepOnPortal();
      }
    }
  }

  public updateLandmarkEvents(dt: number) {
    if (!this.player) return;

    // 1. Proximity check for nearby landmark HUD cues
    this.nearbyLandmark = null;
    for (const [, ev] of this.landmarkEvents) {
      const dist = Math.hypot(ev.x - this.playerX, ev.y - this.playerY);
      if (dist <= ev.radius + 40) {
        this.nearbyLandmark = {
          id: ev.id,
          name: ev.name,
          description: ev.description,
          canInteract: !ev.isActive && !ev.isCompleted,
          isCompleted: ev.isCompleted,
        };

        // Proximity auto-activate for Ruined Watchtower beacon channeling:
        if (ev.type === 'WATCHTOWER_BEACON' && !ev.isCompleted && !ev.isActive) {
          ev.isActive = true;
          this.activeLandmarkEvent = ev;
        }

        // Proximity auto-activate for Corrupted Grove roots:
        if (ev.type === 'CORRUPTED_PURGE' && !ev.isCompleted && !ev.isActive) {
          ev.isActive = true;
          this.activeLandmarkEvent = ev;
        }
        break;
      }
    }

    // 2. Update active trial logic
    for (const [, ev] of this.landmarkEvents) {
      if (!ev.isActive || ev.isCompleted) continue;

      if (ev.type === 'SHRINE_TRIAL') {
        ev.timer = (ev.timer ?? 12) - dt;
        ev.progress = Math.max(0, Math.min(1, 1 - (ev.timer / (ev.duration ?? 12))));

        // Spawn periodic shadow bat waves around shrine
        if (Math.random() < dt * 0.8 && this.enemies.length < 28) {
          this.spawnRandomEnemy('BAT');
        }

        if (ev.timer <= 0) {
          ev.isCompleted = true;
          ev.isActive = false;
          if (this.activeLandmarkEvent?.id === ev.id) this.activeLandmarkEvent = null;
          sound.playLevelUp();
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 40);
          this.player.maxHp += 15;
          this.player.slashDamage = Math.round(this.player.slashDamage * 1.2);
          const crystalsReward = Math.round(15 * this.sectorRewardMultiplier);
          this.player.soulCrystals += crystalsReward;
          this.totalCrystalsEarned += crystalsReward;
          this.addFloatingText(ev.x, ev.y - 50, "SANCTUARY CONSECRATED!", "#10b981");
          this.addFloatingText(this.playerX, this.playerY - 40, `+${crystalsReward} Crystals & Blessed Boon!`, "#f59e0b");
          if (this.callbacks.onLandmarkEventComplete) this.callbacks.onLandmarkEventComplete(ev);
        }
      } else if (ev.type === 'GRAVEYARD_HAUNT') {
        if (ev.guardianEnemyId) {
          const isAlive = this.enemies.some(e => e.id === ev.guardianEnemyId);
          if (!isAlive) {
            ev.isCompleted = true;
            ev.isActive = false;
            ev.progress = 1.0;
            if (this.activeLandmarkEvent?.id === ev.id) this.activeLandmarkEvent = null;
            sound.playChestOpen();
            const relicsReward = Math.round(1 * this.sectorRewardMultiplier);
            const crystalsReward = Math.round(25 * this.sectorRewardMultiplier);
            this.player.relicsFound += relicsReward;
            this.totalRelicsEarned += relicsReward;
            this.player.soulCrystals += crystalsReward;
            this.totalCrystalsEarned += crystalsReward;
            this.player.critChance = Math.min(0.75, this.player.critChance + 0.10);
            this.addFloatingText(ev.x, ev.y - 50, "TOMB REVENANT VANQUISHED!", "#f59e0b");
            this.addFloatingText(this.playerX, this.playerY - 40, `+${relicsReward} Relic, +${crystalsReward} Crystals, +10% Crit!`, "#a855f7");
            if (this.callbacks.onLandmarkEventComplete) this.callbacks.onLandmarkEventComplete(ev);
          }
        }
      } else if (ev.type === 'CORRUPTED_PURGE') {
        if (ev.targetObjectives) {
          const destroyedCount = ev.targetObjectives.filter(o => o.destroyed).length;
          ev.progress = destroyedCount / ev.targetObjectives.length;
          if (destroyedCount === ev.targetObjectives.length) {
            ev.isCompleted = true;
            ev.isActive = false;
            if (this.activeLandmarkEvent?.id === ev.id) this.activeLandmarkEvent = null;
            sound.playLevelUp();
            this.player.moveSpeed = Math.round(this.player.moveSpeed * 1.15);
            this.player.flameTrail = true;
            const crystalsReward = Math.round(20 * this.sectorRewardMultiplier);
            this.player.soulCrystals += crystalsReward;
            this.totalCrystalsEarned += crystalsReward;
            for (let i = 0; i < 5; i++) {
              this.lootDrops.push({
                id: GameEngine.idCounter++,
                x: ev.x + (Math.random() - 0.5) * 80,
                y: ev.y + (Math.random() - 0.5) * 80,
                type: 'XP_GEM',
                value: 25,
                radius: 12,
                color: '#34d399',
              });
            }
            this.addFloatingText(ev.x, ev.y - 50, "GROVE BLIGHT PURGED!", "#10b981");
            this.addFloatingText(this.playerX, this.playerY - 40, `+${crystalsReward} Crystals & Bramble Trail!`, "#34d399");
            if (this.callbacks.onLandmarkEventComplete) this.callbacks.onLandmarkEventComplete(ev);
          }
        }
      } else if (ev.type === 'WATCHTOWER_BEACON') {
        const dist = Math.hypot(ev.x - this.playerX, ev.y - this.playerY);
        if (dist <= ev.radius) {
          ev.progress = Math.min(1, (ev.progress ?? 0) + dt / 4.0);
          for (let p = 0; p < 2; p++) {
            this.particles.push({
              x: ev.x + (Math.random() - 0.5) * 40,
              y: ev.y + (Math.random() - 0.5) * 40,
              vx: (Math.random() - 0.5) * 20,
              vy: -60 - Math.random() * 40,
              radius: 3,
              color: '#f59e0b',
              alpha: 0.9,
              life: 0.3,
              maxLife: 0.3,
            });
          }
        } else {
          ev.progress = Math.max(0, (ev.progress ?? 0) - dt * 0.2);
        }

        if (ev.progress >= 1.0) {
          ev.isCompleted = true;
          ev.isActive = false;
          if (this.activeLandmarkEvent?.id === ev.id) this.activeLandmarkEvent = null;
          sound.playLevelUp();
          this.chestSightTimer = 180; // 3 min chest beacon sight
          this.player.moveSpeed = Math.round(this.player.moveSpeed * 1.15);
          const crystalsReward = Math.round(15 * this.sectorRewardMultiplier);
          this.player.soulCrystals += crystalsReward;
          this.totalCrystalsEarned += crystalsReward;
          this.addFloatingText(ev.x, ev.y - 50, "BASTION BEACON REKINDLED!", "#f59e0b");
          this.addFloatingText(this.playerX, this.playerY - 40, "CHEST SIGHT ACTIVATED & +15% SPEED!", "#38bdf8");
          if (this.callbacks.onLandmarkEventComplete) this.callbacks.onLandmarkEventComplete(ev);
        }
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const f = this.floatingTexts[i];
      f.y += f.vy * dt;
      f.alpha -= dt * 0.9;
      if (f.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public addFloatingText(x: number, y: number, text: string, color: string, isCrit: boolean = false) {
    this.floatingTexts.push({
      id: GameEngine.idCounter++,
      x,
      y,
      text,
      color,
      alpha: 1.0,
      scale: isCrit ? 1.4 : 1.0,
      vy: -35,
      isCrit,
    });
  }

  // --------------------------------------------------------------------------
  // RENDERING PIPELINE
  // --------------------------------------------------------------------------
  private render() {
    if (!this.player) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const shakeOffsetX = (Math.random() - 0.5) * this.screenShake;
    const shakeOffsetY = (Math.random() - 0.5) * this.screenShake;

    ctx.save();
    ctx.translate(shakeOffsetX - this.cameraX, shakeOffsetY - this.cameraY);

    // Viewport Culling Bounds
    const pad = 120;
    const minX = this.cameraX - pad;
    const maxX = this.cameraX + w + pad;
    const minY = this.cameraY - pad;
    const maxY = this.cameraY + h + pad;

    // 1. Procedural Terrain Tiles (Culled internally)
    const isCrypt = this.currentBiomeIndex === 1;
    this.environment.renderGround(ctx, this.cameraX, this.cameraY, w, h, this.curseLevel, isCrypt);

    // 2. Scenery Objects (Culled internally & Depth Sorted)
    this.environment.renderScenery(ctx, this.cameraX, this.cameraY, w, h, this.curseLevel, this.totalElapsedTime);

    // 2.5 Landmark Events (Visual Glyphs, Consecration Rings, Hearth Flames)
    this.renderLandmarkEvents(ctx, minX, maxX, minY, maxY);

    // 3. Chests (Viewport Culled)
    this.renderChests(ctx, minX, maxX, minY, maxY);

    // 4. Ground Hazards (Viewport Culled)
    this.renderHazards(ctx, minX, maxX, minY, maxY);

    // 5. Extraction Portal (Viewport Culled)
    if (this.portal.active) {
      if (this.portal.x + this.portal.radius >= minX && this.portal.x - this.portal.radius <= maxX &&
          this.portal.y + this.portal.radius >= minY && this.portal.y - this.portal.radius <= maxY) {
        this.renderPortal(ctx);
      }
    }

    // 6. Loot Drops (Viewport Culled)
    this.renderLoot(ctx, minX, maxX, minY, maxY);

    // 7. Enemies (Viewport Culled)
    this.enemies.forEach(e => {
      if (e.x + e.radius >= minX && e.x - e.radius <= maxX && e.y + e.radius >= minY && e.y - e.radius <= maxY) {
        EntityRenderer.renderEnemy(ctx, e, this.totalElapsedTime);
      }
    });

    // 8. Player (Arcane Spellblade Sprite & Spectral Blade)
    EntityRenderer.renderPlayer(
      ctx,
      this.player,
      this.playerX,
      this.playerY,
      this.playerAngle,
      this.playerVx,
      this.playerVy,
      this.isDashing,
      this.slashAnimTimer,
      this.invincibleTimer,
      this.totalElapsedTime
    );

    // 9. Orbiting Orbs
    this.renderOrbs(ctx);

    // 10. Projectiles (Viewport Culled)
    this.renderProjectiles(ctx, minX, maxX, minY, maxY);

    // 11. Particles & Atmosphere
    this.environment.renderAmbientMist(ctx, this.cameraX, this.cameraY, this.curseLevel);
    this.renderParticles(ctx);

    // 12. Floating Damage Numbers (Viewport Culled)
    this.renderFloatingText(ctx, minX, maxX, minY, maxY);

    ctx.restore();

    // 13. Screen Vignette & Curse Mist
    this.renderVignette(ctx, w, h);
  }

  private renderChests(ctx: CanvasRenderingContext2D, minX: number, maxX: number, minY: number, maxY: number) {
    this.chests.forEach(c => {
      if (c.x < minX || c.x > maxX || c.y < minY || c.y > maxY) return;
      ctx.save();
      ctx.translate(c.x, c.y);

      if (c.opened) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(-16, -10, 32, 20);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-16, -10, 32, 20);
      } else {
        ctx.fillStyle = c.relicChest ? '#d97706' : '#0284c7';
        ctx.shadowColor = c.relicChest ? '#f59e0b' : '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.fillRect(-16, -12, 32, 24);

        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.strokeRect(-16, -12, 32, 24);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  private renderLandmarkEvents(ctx: CanvasRenderingContext2D, minX: number, maxX: number, minY: number, maxY: number) {
    const isCrypt = this.currentBiomeIndex === 1;

    for (const [, ev] of this.landmarkEvents) {
      if (ev.x < minX - ev.radius || ev.x > maxX + ev.radius || ev.y < minY - ev.radius || ev.y > maxY + ev.radius) {
        continue;
      }

      ctx.save();
      ctx.translate(ev.x, ev.y);

      if (ev.type === 'SHRINE_TRIAL') {
        const auraColor = isCrypt ? 'rgba(244, 63, 94, 0.22)' : 'rgba(56, 189, 248, 0.22)';
        const strokeColor = isCrypt ? '#f43f5e' : '#38bdf8';

        ctx.fillStyle = auraColor;
        ctx.beginPath();
        ctx.arc(0, 0, ev.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, ev.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        if (ev.isActive && ev.timer !== undefined) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(0, 0, ev.radius - 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ev.progress);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 15px "Cinzel", serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 6;
          ctx.fillText(`CONSECRATING: ${Math.ceil(ev.timer)}s`, 0, -ev.radius - 14);
        } else if (!ev.isCompleted) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`[E] ${ev.name}`, 0, -ev.radius - 12);
        }
      } else if (ev.type === 'GRAVEYARD_HAUNT') {
        const auraColor = isCrypt ? 'rgba(244, 63, 94, 0.15)' : 'rgba(168, 85, 247, 0.15)';
        ctx.fillStyle = auraColor;
        ctx.beginPath();
        ctx.arc(0, 0, ev.radius, 0, Math.PI * 2);
        ctx.fill();

        if (ev.isActive) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.arc(0, 0, ev.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 14px "Cinzel", serif';
          ctx.textAlign = 'center';
          ctx.fillText("SLAY THE TOMB REVENANT", 0, -ev.radius - 14);
        } else if (!ev.isCompleted) {
          ctx.fillStyle = '#c084fc';
          ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`[E] ${ev.name}`, 0, -ev.radius - 12);
        }
      } else if (ev.type === 'CORRUPTED_PURGE') {
        if (ev.targetObjectives) {
          for (const obj of ev.targetObjectives) {
            const ox = obj.x - ev.x;
            const oy = obj.y - ev.y;
            if (!obj.destroyed) {
              ctx.save();
              ctx.translate(ox, oy);

              ctx.fillStyle = isCrypt ? '#f43f5e' : '#10b981';
              ctx.shadowColor = ctx.fillStyle;
              ctx.shadowBlur = 10;
              ctx.beginPath();
              ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = isCrypt ? '#fda4af' : '#6ee7b7';
              for (let s = 0; s < 4; s++) {
                const sang = (s / 4) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(Math.cos(sang) * (obj.radius + 4), Math.sin(sang) * (obj.radius + 4), 3, 0, Math.PI * 2);
                ctx.fill();
              }

              const barW = 34;
              const barH = 5;
              const hpPct = Math.max(0, obj.hp / obj.maxHp);
              ctx.fillStyle = 'rgba(0,0,0,0.6)';
              ctx.fillRect(-barW / 2, -obj.radius - 10, barW, barH);
              ctx.fillStyle = isCrypt ? '#f43f5e' : '#10b981';
              ctx.fillRect(-barW / 2, -obj.radius - 10, barW * hpPct, barH);

              ctx.restore();
            }
          }
        }
      } else if (ev.type === 'WATCHTOWER_BEACON') {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.beginPath();
        ctx.arc(0, 0, ev.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = ev.isCompleted ? '#f59e0b' : '#78716c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, ev.radius, 0, Math.PI * 2);
        ctx.stroke();

        if (ev.isActive && !ev.isCompleted) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(0, 0, ev.radius - 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (ev.progress ?? 0));
          ctx.stroke();

          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 14px "Cinzel", serif';
          ctx.textAlign = 'center';
          ctx.fillText(`IGNITING BEACON: ${Math.round((ev.progress ?? 0) * 100)}%`, 0, -ev.radius - 14);
        } else if (ev.isCompleted) {
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(0, -10, 16, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    // Chest sight beacon pillars
    if (this.chestSightTimer > 0) {
      this.chests.forEach(chest => {
        if (!chest.opened) {
          ctx.save();
          ctx.translate(chest.x, chest.y);
          ctx.fillStyle = chest.relicChest ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.3)';
          ctx.fillRect(-4, -140, 8, 140);
          ctx.fillStyle = chest.relicChest ? '#f59e0b' : '#38bdf8';
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, -140, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
    }
  }

  private renderHazards(ctx: CanvasRenderingContext2D, minX: number, maxX: number, minY: number, maxY: number) {
    this.hazards.forEach(h => {
      if (h.x + h.radius < minX || h.x - h.radius > maxX || h.y + h.radius < minY || h.y - h.radius > maxY) return;
      ctx.save();
      ctx.translate(h.x, h.y);

      if (h.telegraphTimer > 0) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.beginPath();
        ctx.arc(0, 0, h.radius * (1 - h.telegraphTimer / 1.2), 0, Math.PI * 2);
        ctx.fill();
      } else {
        const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, h.radius);
        if (h.type === 'FIRE_PATCH') {
          grad.addColorStop(0, 'rgba(249, 115, 22, 0.85)');
          grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        } else {
          grad.addColorStop(0, 'rgba(168, 85, 247, 0.75)');
          grad.addColorStop(1, 'rgba(88, 28, 135, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  private renderPortal(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.portal.x, this.portal.y);

    const pulse = 1 + Math.sin(this.portal.pulseTimer * 4) * 0.15;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 24;

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.portal.radius * pulse, 0, Math.PI * 2);
    ctx.stroke();

    const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, this.portal.radius);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
    grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.55)');
    grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.portal.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText("EXTRACTION PORTAL", 0, -this.portal.radius - 12);

    ctx.restore();
  }

  private renderLoot(ctx: CanvasRenderingContext2D, minX: number, maxX: number, minY: number, maxY: number) {
    this.lootDrops.forEach(drop => {
      if (drop.x < minX || drop.x > maxX || drop.y < minY || drop.y > maxY) return;
      ctx.save();
      ctx.translate(drop.x, drop.y);
      ctx.fillStyle = drop.color;
      ctx.shadowColor = drop.color;
      ctx.shadowBlur = 10;

      if (drop.type === 'XP_GEM') {
        ctx.beginPath();
        ctx.moveTo(0, -drop.radius);
        ctx.lineTo(drop.radius, 0);
        ctx.lineTo(0, drop.radius);
        ctx.lineTo(-drop.radius, 0);
        ctx.closePath();
        ctx.fill();
      } else if (drop.type === 'CRYSTAL') {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const px = Math.cos(ang) * drop.radius;
          const py = Math.sin(ang) * drop.radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, drop.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  private renderOrbs(ctx: CanvasRenderingContext2D) {
    if (!this.player) return;
    const count = this.player.orbCount;
    const distance = 80;

    for (let i = 0; i < count; i++) {
      const angle = this.orbBaseAngle + (i / count) * Math.PI * 2;
      const orbX = this.playerX + Math.cos(angle) * distance;
      const orbY = this.playerY + Math.sin(angle) * distance;

      ctx.save();
      ctx.translate(orbX, orbY);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;

      ctx.beginPath();
      ctx.arc(0, 0, this.player.orbRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.player.orbRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D, minX: number, maxX: number, minY: number, maxY: number) {
    this.projectiles.forEach(p => {
      if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) return;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.glowColor;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  private renderFloatingText(ctx: CanvasRenderingContext2D, minX: number, maxX: number, minY: number, maxY: number) {
    this.floatingTexts.forEach(f => {
      if (f.x < minX - 60 || f.x > maxX + 60 || f.y < minY - 60 || f.y > maxY + 60) return;
      ctx.save();
      ctx.globalAlpha = f.alpha;
      ctx.fillStyle = f.color;
      ctx.font = f.isCrit ? 'bold 18px Cinzel, serif' : 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    });
  }

  private renderVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(5, 7, 12, 0.7)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    if (this.curseLevel === 3) {
      const redGrad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.8);
      redGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
      redGrad.addColorStop(1, 'rgba(239, 68, 68, 0.16)');
      ctx.fillStyle = redGrad;
      ctx.fillRect(0, 0, w, h);
    }
  }
}
