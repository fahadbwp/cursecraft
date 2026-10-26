/**
 * World Environment, Procedural Generation, and Scenery for CURSECRAFT: Haunted Forest
 * Features:
 * - Deterministic, seed-based procedural generation with PRNG
 * - Chunk-based spatial partitioning (8x8 chunks over 3200x3200 world)
 * - 5 Distinct Identifiable Landmarks:
 *     1. Ancient Shrine (Consecrated Relic Sanctuary)
 *     2. Forgotten Graveyard (Sepulchers & Soul Mist)
 *     3. Corrupted Grove (Blighted Willows & Crimson Thorns)
 *     4. Ruined Watchtower (Crumbling Fortress Courtyard)
 *     5. Sealed Portal Clearing (Concentric Runic Summoning Circle)
 * - Natural forest paths connecting spawn to all landmarks
 * - Strict collision separation: Collidable obstacles vs. non-blocking decorations
 * - Guaranteed unblocked routes, safe spawn zone, and objective validation
 * - Viewport culling and cached chunk rendering for 60 FPS performance
 */

export type SceneryType =
  | 'TREE'
  | 'OBELISK'
  | 'RUIN_PILLAR'
  | 'BOULDER'
  | 'CRYPT_TOMB'
  | 'SHRINE_ALTAR'
  | 'WATCHTOWER_BASE'
  | 'MUSHROOMS'
  | 'STONE_WELL'
  | 'FERNS'
  | 'GRAVE_HEADSTONE'
  | 'RUNIC_GROUND_GLYPH';

export interface SceneryObject {
  id: number;
  x: number;
  y: number;
  type: SceneryType;
  width: number;
  height: number;
  variant: number;
  isCollidable: boolean;
  collisionRadius: number;
}

export interface Landmark {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  description: string;
}

export interface WorldChunk {
  cx: number;
  cy: number;
  x: number;
  y: number;
  scenery: SceneryObject[];
  collidables: SceneryObject[];
  cachedCanvas: HTMLCanvasElement | null;
}

export interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  maxAlpha: number;
  type: 'MIST' | 'SPORE' | 'EMBER';
  color: string;
}

export interface ForestPath {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  cpX: number;
  cpY: number;
  width: number;
}

export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = (seed % 2147483647 + 2147483647) % 2147483647;
    if (this.seed === 0) this.seed = 1;
  }

  public next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
}

export class WorldEnvironment {
  public scenery: SceneryObject[] = [];
  public ambientParticles: AmbientParticle[] = [];
  public readonly WORLD_WIDTH: number;
  public readonly WORLD_HEIGHT: number;

  public readonly CHUNK_SIZE: number = 400;
  public readonly CHUNKS_X: number;
  public readonly CHUNKS_Y: number;
  public chunks: WorldChunk[] = [];

  public currentSeed: number = 42;
  public isCrypt: boolean = false;

  public readonly landmarks: Landmark[] = [
    {
      id: 'ANCIENT_SHRINE',
      name: 'Ancient Runic Shrine',
      x: 2350,
      y: 850,
      radius: 160,
      description: 'A consecrated sanctuary of elder power where relics are preserved.',
    },
    {
      id: 'FORGOTTEN_GRAVEYARD',
      name: 'Forgotten Graveyard',
      x: 850,
      y: 2350,
      radius: 170,
      description: 'Weathered stone sepulchers shrouded in resting soul wisps.',
    },
    {
      id: 'CORRUPTED_GROVE',
      name: 'Corrupted Grove',
      x: 850,
      y: 850,
      radius: 170,
      description: 'Gnarled blight willows pulsing with crimson thornroots.',
    },
    {
      id: 'RUINED_WATCHTOWER',
      name: 'Ruined Watchtower',
      x: 2350,
      y: 2350,
      radius: 160,
      description: 'Crumbling stone battlement foundations overlooking dark trails.',
    },
    {
      id: 'SEALED_PORTAL_CLEARING',
      name: 'Sealed Portal Clearing',
      x: 2000,
      y: 1600,
      radius: 140,
      description: 'Sacred stone circle inscribed with planar extraction runes.',
    },
  ];

  public paths: ForestPath[] = [];

  constructor(worldWidth: number, worldHeight: number) {
    this.WORLD_WIDTH = worldWidth;
    this.WORLD_HEIGHT = worldHeight;
    this.CHUNKS_X = Math.ceil(worldWidth / this.CHUNK_SIZE);
    this.CHUNKS_Y = Math.ceil(worldHeight / this.CHUNK_SIZE);

    this.initPaths();
    this.generateWorld(42, false);
    this.initAtmosphere();
  }

  // --------------------------------------------------------------------------
  // NATURAL PATH DEFINITIONS
  // --------------------------------------------------------------------------
  private initPaths() {
    const spawnX = this.WORLD_WIDTH / 2; // 1600
    const spawnY = this.WORLD_HEIGHT / 2; // 1600

    this.paths = [
      // Spawn to Ancient Shrine (North-East)
      {
        startX: spawnX,
        startY: spawnY,
        endX: 2350,
        endY: 850,
        cpX: 2050,
        cpY: 1300,
        width: 140,
      },
      // Spawn to Forgotten Graveyard (South-West)
      {
        startX: spawnX,
        startY: spawnY,
        endX: 850,
        endY: 2350,
        cpX: 1150,
        cpY: 1950,
        width: 140,
      },
      // Spawn to Corrupted Grove (North-West)
      {
        startX: spawnX,
        startY: spawnY,
        endX: 850,
        endY: 850,
        cpX: 1200,
        cpY: 1150,
        width: 140,
      },
      // Spawn to Ruined Watchtower (South-East)
      {
        startX: spawnX,
        startY: spawnY,
        endX: 2350,
        endY: 2350,
        cpX: 2000,
        cpY: 2050,
        width: 140,
      },
      // Spawn to Portal Clearing
      {
        startX: spawnX,
        startY: spawnY,
        endX: 2000,
        endY: 1600,
        cpX: 1800,
        cpY: 1600,
        width: 140,
      },
    ];
  }

  /**
   * Checks if a point is within a natural path clearing corridor
   */
  public isNearPath(x: number, y: number, margin: number = 60): boolean {
    for (let i = 0; i < this.paths.length; i++) {
      const p = this.paths[i];
      const maxDistSq = ((p.width / 2) + margin) ** 2;
      for (let t = 0; t <= 1; t += 0.01) {
        const invT = 1 - t;
        const px = invT * invT * p.startX + 2 * invT * t * p.cpX + t * t * p.endX;
        const py = invT * invT * p.startY + 2 * invT * t * p.cpY + t * t * p.endY;
        const distSq = (x - px) ** 2 + (y - py) ** 2;
        if (distSq < maxDistSq) {
          return true;
        }
      }
    }
    return false;
  }

  // --------------------------------------------------------------------------
  // DETERMINISTIC PROCEDURAL GENERATION
  // --------------------------------------------------------------------------
  public generateWorld(seed: number = 42, isCrypt: boolean = false) {
    this.currentSeed = seed;
    this.isCrypt = isCrypt;
    const rng = new SeededRandom(seed);

    this.scenery = [];
    this.initChunks();
    let nextId = 1;

    const spawnX = this.WORLD_WIDTH / 2;
    const spawnY = this.WORLD_HEIGHT / 2;
    const spawnClearRadius = 180;

    // 1. Generate Landmark Core Structures
    this.generateLandmarks(rng, nextId);
    nextId += 100;

    // 2. Generate Ancient Monoliths & Ruined Arches across the realm
    const monolithCount = isCrypt ? 18 : 22;
    for (let i = 0; i < monolithCount; i++) {
      const x = rng.range(200, this.WORLD_WIDTH - 200);
      const y = rng.range(200, this.WORLD_HEIGHT - 200);

      if (Math.hypot(x - spawnX, y - spawnY) < spawnClearRadius + 40) continue;
      if (this.isNearPath(x, y, 40)) continue;
      if (this.isNearAnyLandmarkCenter(x, y, 90)) continue;

      this.addSceneryObject({
        id: nextId++,
        x,
        y,
        type: 'OBELISK',
        width: 38,
        height: 74,
        variant: i % 3,
        isCollidable: true,
        collisionRadius: 20,
      });
    }

    // 3. Generate Ancient Ruined Pillars & Broken Columns
    const pillarCount = isCrypt ? 36 : 28;
    for (let i = 0; i < pillarCount; i++) {
      const x = rng.range(180, this.WORLD_WIDTH - 180);
      const y = rng.range(180, this.WORLD_HEIGHT - 180);

      if (Math.hypot(x - spawnX, y - spawnY) < spawnClearRadius + 30) continue;
      if (this.isNearPath(x, y, 35)) continue;
      if (this.isNearAnyLandmarkCenter(x, y, 80)) continue;

      this.addSceneryObject({
        id: nextId++,
        x,
        y,
        type: 'RUIN_PILLAR',
        width: 32,
        height: 56,
        variant: rng.int(0, 2),
        isCollidable: true,
        collisionRadius: 18,
      });
    }

    // 4. Generate Mossy Boulders & Elder Stone Formations
    const boulderCount = 34;
    for (let i = 0; i < boulderCount; i++) {
      const x = rng.range(150, this.WORLD_WIDTH - 150);
      const y = rng.range(150, this.WORLD_HEIGHT - 150);

      if (Math.hypot(x - spawnX, y - spawnY) < spawnClearRadius) continue;
      if (this.isNearPath(x, y, 35)) continue;
      if (this.isNearAnyLandmarkCenter(x, y, 70)) continue;

      this.addSceneryObject({
        id: nextId++,
        x,
        y,
        type: 'BOULDER',
        width: 44,
        height: 36,
        variant: rng.int(0, 3),
        isCollidable: true,
        collisionRadius: 22,
      });
    }

    // 5. Generate Dense Twisted Trees (Elder Oaks, Shadow Willows, Cursed Pines)
    const treeCount = isCrypt ? 80 : 190;
    for (let i = 0; i < treeCount; i++) {
      const x = rng.range(120, this.WORLD_WIDTH - 120);
      const y = rng.range(120, this.WORLD_HEIGHT - 120);

      // Strict clear zones: Spawn clearing, paths, and landmark centers
      if (Math.hypot(x - spawnX, y - spawnY) < spawnClearRadius) continue;
      if (this.isNearPath(x, y, 45)) continue;
      if (this.isNearAnyLandmarkCenter(x, y, 100)) continue;

      this.addSceneryObject({
        id: nextId++,
        x,
        y,
        type: 'TREE',
        width: 70,
        height: 90,
        variant: rng.int(0, 3),
        isCollidable: true,
        collisionRadius: 22,
      });
    }

    // 6. Non-Collidable Decorative Scenery: Bioluminescent Fungi Groves
    const mushroomCount = isCrypt ? 25 : 55;
    for (let i = 0; i < mushroomCount; i++) {
      const x = rng.range(100, this.WORLD_WIDTH - 100);
      const y = rng.range(100, this.WORLD_HEIGHT - 100);

      this.addSceneryObject({
        id: nextId++,
        x,
        y,
        type: 'MUSHROOMS',
        width: 28,
        height: 24,
        variant: rng.int(0, 2),
        isCollidable: false,
        collisionRadius: 0,
      });
    }

    // 7. Non-Collidable Decorative Scenery: Cursed Ferns & Brambles
    const fernCount = isCrypt ? 15 : 60;
    for (let i = 0; i < fernCount; i++) {
      const x = rng.range(80, this.WORLD_WIDTH - 80);
      const y = rng.range(80, this.WORLD_HEIGHT - 80);

      this.addSceneryObject({
        id: nextId++,
        x,
        y,
        type: 'FERNS',
        width: 24,
        height: 20,
        variant: rng.int(0, 2),
        isCollidable: false,
        collisionRadius: 0,
      });
    }

    // 8. Ancient Stone Wells
    for (let i = 0; i < 6; i++) {
      const x = rng.range(300, this.WORLD_WIDTH - 300);
      const y = rng.range(300, this.WORLD_HEIGHT - 300);

      if (Math.hypot(x - spawnX, y - spawnY) < spawnClearRadius + 20) continue;
      if (this.isNearPath(x, y, 40)) continue;
      if (this.isNearAnyLandmarkCenter(x, y, 80)) continue;

      this.addSceneryObject({
        id: nextId++,
        x,
        y,
        type: 'STONE_WELL',
        width: 44,
        height: 44,
        variant: 0,
        isCollidable: true,
        collisionRadius: 22,
      });
    }

    // 9. Pre-render chunk ground backgrounds if browser canvas is available
    this.bakeChunkCanvases();
  }

  private isNearAnyLandmarkCenter(x: number, y: number, radius: number): boolean {
    for (let i = 0; i < this.landmarks.length; i++) {
      const lm = this.landmarks[i];
      if (Math.hypot(x - lm.x, y - lm.y) < radius) {
        return true;
      }
    }
    return false;
  }

  private generateLandmarks(rng: SeededRandom, startId: number) {
    let id = startId;

    // Landmark 1: Ancient Shrine (2350, 850)
    const shrine = this.landmarks[0];
    this.addSceneryObject({
      id: id++,
      x: shrine.x,
      y: shrine.y,
      type: 'SHRINE_ALTAR',
      width: 72,
      height: 72,
      variant: 0,
      isCollidable: true,
      collisionRadius: 30,
    });
    // 4 Guardian Pillars surrounding altar with open diagonal gateways
    const offsets = [
      { dx: 0, dy: -85 },  // North
      { dx: 85, dy: 0 },   // East
      { dx: 0, dy: 85 },   // South
      { dx: -85, dy: 0 },  // West
    ];
    for (const off of offsets) {
      this.addSceneryObject({
        id: id++,
        x: shrine.x + off.dx,
        y: shrine.y + off.dy,
        type: 'OBELISK',
        width: 36,
        height: 72,
        variant: 1,
        isCollidable: true,
        collisionRadius: 18,
      });
    }
    // Decorative ground glyphs
    this.addSceneryObject({
      id: id++,
      x: shrine.x,
      y: shrine.y,
      type: 'RUNIC_GROUND_GLYPH',
      width: 140,
      height: 140,
      variant: 0,
      isCollidable: false,
      collisionRadius: 0,
    });

    // Landmark 2: Forgotten Graveyard (850, 2350)
    const grave = this.landmarks[1];
    // Central ancient crypt tomb
    this.addSceneryObject({
      id: id++,
      x: grave.x,
      y: grave.y,
      type: 'CRYPT_TOMB',
      width: 68,
      height: 48,
      variant: 0,
      isCollidable: true,
      collisionRadius: 26,
    });
    // Weathered tombstones around
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + rng.range(-0.2, 0.2);
      const dist = rng.range(55, 110);
      this.addSceneryObject({
        id: id++,
        x: grave.x + Math.cos(ang) * dist,
        y: grave.y + Math.sin(ang) * dist,
        type: 'GRAVE_HEADSTONE',
        width: 22,
        height: 28,
        variant: i % 3,
        isCollidable: false,
        collisionRadius: 0,
      });
    }

    // Landmark 3: Corrupted Grove (850, 850)
    const grove = this.landmarks[2];
    // Central Elder Blighted Willow
    this.addSceneryObject({
      id: id++,
      x: grove.x,
      y: grove.y,
      type: 'TREE',
      width: 86,
      height: 104,
      variant: 1, // Willow variant
      isCollidable: true,
      collisionRadius: 28,
    });
    // Gnarled roots and fungi
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const dist = 65 + (i % 2) * 25;
      this.addSceneryObject({
        id: id++,
        x: grove.x + Math.cos(ang) * dist,
        y: grove.y + Math.sin(ang) * dist,
        type: 'MUSHROOMS',
        width: 28,
        height: 24,
        variant: 2, // Violet corrupted mushrooms
        isCollidable: false,
        collisionRadius: 0,
      });
    }

    // Landmark 4: Ruined Watchtower (2350, 2350)
    const tower = this.landmarks[3];
    this.addSceneryObject({
      id: id++,
      x: tower.x,
      y: tower.y,
      type: 'WATCHTOWER_BASE',
      width: 80,
      height: 80,
      variant: 0,
      isCollidable: true,
      collisionRadius: 34,
    });
    // Ruined wall fragments
    this.addSceneryObject({
      id: id++,
      x: tower.x - 65,
      y: tower.y + 20,
      type: 'RUIN_PILLAR',
      width: 32,
      height: 48,
      variant: 0,
      isCollidable: true,
      collisionRadius: 16,
    });
    this.addSceneryObject({
      id: id++,
      x: tower.x + 65,
      y: tower.y - 20,
      type: 'RUIN_PILLAR',
      width: 32,
      height: 48,
      variant: 1,
      isCollidable: true,
      collisionRadius: 16,
    });

    // Landmark 5: Sealed Portal Clearing (1850, 1600)
    const portalLm = this.landmarks[4];
    this.addSceneryObject({
      id: id++,
      x: portalLm.x,
      y: portalLm.y,
      type: 'RUNIC_GROUND_GLYPH',
      width: 150,
      height: 150,
      variant: 1,
      isCollidable: false,
      collisionRadius: 0,
    });
    // 6 standing stones in circle (rotated by 30 degrees to keep path entrance wide open)
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + Math.PI / 6;
      this.addSceneryObject({
        id: id++,
        x: portalLm.x + Math.cos(ang) * 95,
        y: portalLm.y + Math.sin(ang) * 95,
        type: 'OBELISK',
        width: 30,
        height: 60,
        variant: 2,
        isCollidable: true,
        collisionRadius: 15,
      });
    }
  }

  // --------------------------------------------------------------------------
  // CHUNK SPATIAL PARTITIONING
  // --------------------------------------------------------------------------
  private initChunks() {
    this.chunks = [];
    for (let cy = 0; cy < this.CHUNKS_Y; cy++) {
      for (let cx = 0; cx < this.CHUNKS_X; cx++) {
        this.chunks.push({
          cx,
          cy,
          x: cx * this.CHUNK_SIZE,
          y: cy * this.CHUNK_SIZE,
          scenery: [],
          collidables: [],
          cachedCanvas: null,
        });
      }
    }
  }

  private getChunk(cx: number, cy: number): WorldChunk | null {
    if (cx < 0 || cx >= this.CHUNKS_X || cy < 0 || cy >= this.CHUNKS_Y) {
      return null;
    }
    return this.chunks[cy * this.CHUNKS_X + cx];
  }

  private addSceneryObject(obj: SceneryObject) {
    this.scenery.push(obj);

    const cx = Math.floor(obj.x / this.CHUNK_SIZE);
    const cy = Math.floor(obj.y / this.CHUNK_SIZE);
    const chunk = this.getChunk(cx, cy);
    if (chunk) {
      chunk.scenery.push(obj);
      if (obj.isCollidable) {
        chunk.collidables.push(obj);
      }
    }
  }

  /**
   * Pre-renders the static ground tile texture for each chunk to an offscreen canvas
   */
  private bakeChunkCanvases() {
    if (typeof document === 'undefined') return;

    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      try {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = this.CHUNK_SIZE;
        offCanvas.height = this.CHUNK_SIZE;
        const offCtx = offCanvas.getContext('2d');
        if (offCtx) {
          this.drawStaticGroundOnCanvas(offCtx, chunk.x, chunk.y, this.CHUNK_SIZE, this.CHUNK_SIZE);
          chunk.cachedCanvas = offCanvas;
        }
      } catch {
        chunk.cachedCanvas = null;
      }
    }
  }

  // --------------------------------------------------------------------------
  // COLLISION DETECTION & RESOLUTION
  // --------------------------------------------------------------------------
  public getCollidablesInRadius(x: number, y: number, radius: number): SceneryObject[] {
    const minCX = Math.max(0, Math.floor((x - radius) / this.CHUNK_SIZE));
    const maxCX = Math.min(this.CHUNKS_X - 1, Math.floor((x + radius) / this.CHUNK_SIZE));
    const minCY = Math.max(0, Math.floor((y - radius) / this.CHUNK_SIZE));
    const maxCY = Math.min(this.CHUNKS_Y - 1, Math.floor((y + radius) / this.CHUNK_SIZE));

    const results: SceneryObject[] = [];
    for (let cy = minCY; cy <= maxCY; cy++) {
      for (let cx = minCX; cx <= maxCX; cx++) {
        const chunk = this.getChunk(cx, cy);
        if (chunk) {
          for (let i = 0; i < chunk.collidables.length; i++) {
            const obj = chunk.collidables[i];
            const dist = Math.hypot(x - obj.x, y - obj.y);
            if (dist <= radius + obj.collisionRadius) {
              results.push(obj);
            }
          }
        }
      }
    }
    return results;
  }

  public isBlocked(x: number, y: number, radius: number): boolean {
    return this.getCollidablesInRadius(x, y, radius).length > 0;
  }

  public resolveCollision(
    x: number,
    y: number,
    radius: number
  ): { x: number; y: number; collided: boolean } {
    let curX = x;
    let curY = y;
    let collided = false;
    const nearby = this.getCollidablesInRadius(curX, curY, radius + 50);

    for (let i = 0; i < nearby.length; i++) {
      const obj = nearby[i];
      const dx = curX - obj.x;
      const dy = curY - obj.y;
      const dist = Math.hypot(dx, dy);
      const minDist = radius + obj.collisionRadius;

      if (dist < minDist && dist > 0.001) {
        collided = true;
        const overlap = minDist - dist;
        curX += (dx / dist) * overlap;
        curY += (dy / dist) * overlap;
      }
    }

    return { x: curX, y: curY, collided };
  }

  // --------------------------------------------------------------------------
  // ATMOSPHERE & DRIFTING MIST
  // --------------------------------------------------------------------------
  private initAtmosphere() {
    this.ambientParticles = [];
    for (let i = 0; i < 65; i++) {
      this.ambientParticles.push({
        x: Math.random() * this.WORLD_WIDTH,
        y: Math.random() * this.WORLD_HEIGHT,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.5) * 10,
        radius: 22 + Math.random() * 48,
        alpha: Math.random() * 0.12,
        maxAlpha: 0.10 + Math.random() * 0.08,
        type: 'MIST',
        color: 'rgba(30, 41, 59, 0.35)',
      });
    }
  }

  public updateAtmosphere(
    dt: number,
    curseLevel: 1 | 2 | 3,
    cameraX: number,
    cameraY: number,
    viewW: number,
    viewH: number
  ) {
    const windSpeed = curseLevel === 1 ? 14 : curseLevel === 2 ? 38 : 65;

    for (let i = 0; i < this.ambientParticles.length; i++) {
      const p = this.ambientParticles[i];
      p.x += (p.vx + windSpeed) * dt;
      p.y += p.vy * dt;

      if (p.x > cameraX + viewW + 120) p.x = cameraX - 120;
      if (p.x < cameraX - 120) p.x = cameraX + viewW + 120;
      if (p.y > cameraY + viewH + 120) p.y = cameraY - 120;
      if (p.y < cameraY - 120) p.y = cameraY + viewH + 120;
    }
  }

  // --------------------------------------------------------------------------
  // GROUND RENDERING (BATCHED / CACHED CHUNKS)
  // --------------------------------------------------------------------------
  public renderGround(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
    curseLevel: 1 | 2 | 3,
    isCrypt: boolean
  ) {
    const minCX = Math.max(0, Math.floor((camX - 50) / this.CHUNK_SIZE));
    const maxCX = Math.min(this.CHUNKS_X - 1, Math.floor((camX + viewW + 50) / this.CHUNK_SIZE));
    const minCY = Math.max(0, Math.floor((camY - 50) / this.CHUNK_SIZE));
    const maxCY = Math.min(this.CHUNKS_Y - 1, Math.floor((camY + viewH + 50) / this.CHUNK_SIZE));

    for (let cy = minCY; cy <= maxCY; cy++) {
      for (let cx = minCX; cx <= maxCX; cx++) {
        const chunk = this.getChunk(cx, cy);
        if (!chunk) continue;

        if (chunk.cachedCanvas) {
          ctx.drawImage(chunk.cachedCanvas, chunk.x, chunk.y);
        } else {
          this.drawStaticGroundOnCanvas(ctx, chunk.x, chunk.y, this.CHUNK_SIZE, this.CHUNK_SIZE);
        }
      }
    }

    // Dynamic curse overlay lines & fissures on active viewport
    if (curseLevel >= 2) {
      this.renderCurseOverlayGround(ctx, camX, camY, viewW, viewH, curseLevel);
    }
  }

  private drawStaticGroundOnCanvas(
    ctx: CanvasRenderingContext2D,
    originX: number,
    originY: number,
    width: number,
    height: number
  ) {
    const tileSize = 80;
    const isCrypt = this.isCrypt;

    for (let x = originX; x < originX + width; x += tileSize) {
      for (let y = originY; y < originY + height; y += tileSize) {
        const hash = Math.sin(x * 12.9898 + y * 78.233 + this.currentSeed) * 43758.5453;
        const seed = hash - Math.floor(hash);

        const onPath = this.isNearPath(x + tileSize / 2, y + tileSize / 2, 20);

        if (isCrypt) {
          // Crypt: Molten obsidian & stone slabs
          ctx.fillStyle = onPath ? '#1a0c10' : seed > 0.6 ? '#12070a' : '#0a0406';
          ctx.fillRect(x, y, tileSize, tileSize);

          // Subtle slab borders
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.strokeRect(x, y, tileSize, tileSize);

          // Magma crack lines
          if (seed > 0.8) {
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 20);
            ctx.lineTo(x + tileSize * 0.5, y + tileSize * 0.6);
            ctx.lineTo(x + tileSize - 10, y + tileSize - 15);
            ctx.stroke();
          }
        } else {
          // Haunted Forest Ground
          if (onPath) {
            // Walkable Forest Trail: Compacted loam & ancient cobblestone fragments
            ctx.fillStyle = seed > 0.5 ? '#141c16' : '#111713';
            ctx.fillRect(x, y, tileSize, tileSize);

            // Worn cobblestone fragment
            if (seed > 0.7) {
              ctx.fillStyle = '#1e2920';
              ctx.beginPath();
              ctx.ellipse(x + 35, y + 40, 14, 8, seed * Math.PI, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            // Dark Forest Loam & Mossy Undergrowth
            if (seed > 0.65) {
              ctx.fillStyle = '#0f1a14'; // Mossy patch
            } else if (seed > 0.35) {
              ctx.fillStyle = '#0a120e'; // Loam soil
            } else {
              ctx.fillStyle = '#060a08'; // Deep earth
            }
            ctx.fillRect(x, y, tileSize, tileSize);

            // Moss Tufts
            if (seed > 0.78) {
              ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
              ctx.beginPath();
              ctx.arc(x + 40, y + 45, 16, 0, Math.PI * 2);
              ctx.fill();
            }

            // Gnarled Tree Roots across the earth
            if (seed > 0.7 && seed < 0.78) {
              ctx.strokeStyle = 'rgba(20, 35, 26, 0.6)';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(x + 15, y + tileSize - 10);
              ctx.bezierCurveTo(x + 40, y + 60, x + 60, y + 75, x + tileSize - 15, y + 25);
              ctx.stroke();
            }
          }
        }
      }
    }
  }

  private renderCurseOverlayGround(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
    curseLevel: 1 | 2 | 3
  ) {
    if (curseLevel < 2) return;
    // Subtle pulsating corrupted veins that illuminate during higher curse levels
    const veinColor = curseLevel === 3 ? 'rgba(239, 68, 68, 0.16)' : 'rgba(168, 85, 247, 0.12)';
    ctx.strokeStyle = veinColor;
    ctx.lineWidth = 2;

    const step = 200;
    const startX = Math.floor(camX / step) * step;
    const endX = camX + viewW + step;
    const startY = Math.floor(camY / step) * step;
    const endY = camY + viewH + step;

    for (let x = startX; x < endX; x += step) {
      for (let y = startY; y < endY; y += step) {
        const hash = Math.sin(x * 43.123 + y * 91.456) * 12345.67;
        const s = hash - Math.floor(hash);
        if (s > 0.7) {
          ctx.beginPath();
          ctx.moveTo(x + 20, y + 30);
          ctx.lineTo(x + step * 0.4, y + step * 0.5);
          ctx.lineTo(x + step - 30, y + step - 20);
          ctx.stroke();
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // SCENERY RENDERING WITH VIEWPORT FRUSTUM CULLING & Y-SORTING
  // --------------------------------------------------------------------------
  public renderScenery(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
    curseLevel: 1 | 2 | 3,
    time: number = 0
  ) {
    const pad = 120;
    const minX = camX - pad;
    const maxX = camX + viewW + pad;
    const minY = camY - pad;
    const maxY = camY + viewH + pad;

    // Fast spatial query using chunk index
    const minCX = Math.max(0, Math.floor(minX / this.CHUNK_SIZE));
    const maxCX = Math.min(this.CHUNKS_X - 1, Math.floor(maxX / this.CHUNK_SIZE));
    const minCY = Math.max(0, Math.floor(minY / this.CHUNK_SIZE));
    const maxCY = Math.min(this.CHUNKS_Y - 1, Math.floor(maxY / this.CHUNK_SIZE));

    const visible: SceneryObject[] = [];
    for (let cy = minCY; cy <= maxCY; cy++) {
      for (let cx = minCX; cx <= maxCX; cx++) {
        const chunk = this.getChunk(cx, cy);
        if (!chunk) continue;
        for (let i = 0; i < chunk.scenery.length; i++) {
          const s = chunk.scenery[i];
          if (s.x >= minX && s.x <= maxX && s.y >= minY && s.y <= maxY) {
            visible.push(s);
          }
        }
      }
    }

    // Y-sorting for natural isometric 2.5D depth
    visible.sort((a, b) => a.y - b.y);

    for (let i = 0; i < visible.length; i++) {
      const obj = visible[i];
      ctx.save();
      ctx.translate(obj.x, obj.y);

      switch (obj.type) {
        case 'TREE':
          this.drawHauntedTree(ctx, obj.variant, curseLevel);
          break;
        case 'OBELISK':
          this.drawRunicObelisk(ctx, obj.variant, curseLevel, time, obj.id);
          break;
        case 'RUIN_PILLAR':
          this.drawRuinPillar(ctx, obj.variant);
          break;
        case 'BOULDER':
          this.drawMossyBoulder(ctx, obj.variant);
          break;
        case 'CRYPT_TOMB':
          this.drawCryptTomb(ctx);
          break;
        case 'SHRINE_ALTAR':
          this.drawShrineAltar(ctx, curseLevel, time);
          break;
        case 'WATCHTOWER_BASE':
          this.drawWatchtowerBase(ctx);
          break;
        case 'MUSHROOMS':
          this.drawMushroomGrove(ctx, obj.variant, time, obj.id);
          break;
        case 'STONE_WELL':
          this.drawStoneWell(ctx);
          break;
        case 'FERNS':
          this.drawFerns(ctx, obj.variant);
          break;
        case 'GRAVE_HEADSTONE':
          this.drawHeadstone(ctx, obj.variant);
          break;
        case 'RUNIC_GROUND_GLYPH':
          this.drawRunicGroundGlyph(ctx, obj.variant, curseLevel, time);
          break;
      }

      ctx.restore();
    }
  }

  public renderAmbientMist(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    curseLevel: 1 | 2 | 3
  ) {
    for (let i = 0; i < this.ambientParticles.length; i++) {
      const p = this.ambientParticles[i];
      ctx.save();
      ctx.translate(p.x, p.y);

      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, p.radius);
      if (curseLevel === 1) {
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.07)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else if (curseLevel === 2) {
        grad.addColorStop(0, 'rgba(168, 85, 247, 0.09)');
        grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      } else {
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.11)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // --------------------------------------------------------------------------
  // BESPOKE SCENERY DRAWING ROUTINES
  // --------------------------------------------------------------------------
  private drawHauntedTree(ctx: CanvasRenderingContext2D, variant: number, curseLevel: 1 | 2 | 3) {
    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 36, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk base colors
    ctx.fillStyle = '#0e1612';
    ctx.strokeStyle = '#1a2720';
    ctx.lineWidth = 2;

    if (variant === 1) {
      // Weeping Shadow Willow (drooping branch structure)
      ctx.beginPath();
      ctx.moveTo(-18, 8);
      ctx.bezierCurveTo(-26, -20, -14, -55, -8, -75);
      ctx.bezierCurveTo(4, -75, 14, -55, 18, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Drooping tendril vines
      ctx.strokeStyle = curseLevel === 3 ? '#ef4444' : curseLevel === 2 ? '#a855f7' : '#10b981';
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.5;
      for (let v = -28; v <= 28; v += 14) {
        ctx.beginPath();
        ctx.moveTo(v, -55);
        ctx.bezierCurveTo(v - 6, -30, v + 6, -10, v, 4);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
    } else {
      // Elder Twisted Oak
      ctx.beginPath();
      ctx.moveTo(-16, 8);
      ctx.bezierCurveTo(-24, -18, -12, -45, -10, -68);
      ctx.bezierCurveTo(6, -68, 14, -45, 16, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Gnarled Roots
      ctx.strokeStyle = '#0e1612';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-14, 4);
      ctx.lineTo(-30, 11);
      ctx.moveTo(14, 4);
      ctx.lineTo(28, 12);
      ctx.stroke();
    }

    // Foliage Canopy
    const foliageColor =
      curseLevel === 1 ? '#0a2318' : curseLevel === 2 ? '#1b0d28' : '#280a13';
    ctx.fillStyle = foliageColor;

    ctx.beginPath();
    ctx.arc(-16, -72, 26, 0, Math.PI * 2);
    ctx.arc(16, -72, 24, 0, Math.PI * 2);
    ctx.arc(0, -92, 28, 0, Math.PI * 2);
    ctx.fill();

    // Ambient Hollow Eye in trunk for variant 0
    if (variant === 0) {
      ctx.fillStyle = curseLevel === 3 ? '#ef4444' : '#38bdf8';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, -32, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  private drawRunicObelisk(
    ctx: CanvasRenderingContext2D,
    variant: number,
    curseLevel: 1 | 2 | 3,
    time: number,
    id: number
  ) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 7, 28, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stone Plinth
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-16, -4, 32, 11);

    // Megalith Pillar
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(-13, -4);
    ctx.lineTo(-8, -66);
    ctx.lineTo(0, -76);
    ctx.lineTo(8, -66);
    ctx.lineTo(13, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pulsing Animated Rune Glyphs
    const pulse = 0.6 + Math.sin(time * 2.5 + id) * 0.4;
    const baseColor = curseLevel === 1 ? '56, 189, 248' : curseLevel === 2 ? '168, 85, 247' : '239, 68, 68';
    const runeColor = `rgba(${baseColor}, ${pulse})`;

    ctx.strokeStyle = runeColor;
    ctx.shadowColor = runeColor;
    ctx.shadowBlur = 12 * pulse;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(0, -52);
    ctx.moveTo(-5, -42);
    ctx.lineTo(5, -32);
    ctx.moveTo(-5, -32);
    ctx.lineTo(5, -42);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  private drawRuinPillar(ctx: CanvasRenderingContext2D, variant: number) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 5, 22, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Broken Stone Column
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;

    const height = variant === 0 ? 54 : variant === 1 ? 40 : 28;
    ctx.fillRect(-11, -height, 22, height);
    ctx.strokeRect(-11, -height, 22, height);

    // Weathered Fractures
    ctx.strokeStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-4, -height + 10);
    ctx.lineTo(3, -height / 2);
    ctx.lineTo(-3, -2);
    ctx.stroke();
  }

  private drawMossyBoulder(ctx: CanvasRenderingContext2D, variant: number) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 26, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stone Body
    ctx.fillStyle = '#1f2937';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.bezierCurveTo(-26, -18, -12, -26, 0, -24);
    ctx.bezierCurveTo(14, -26, 24, -14, 22, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Moss overlay
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.arc(-8, -16, 8, 0, Math.PI * 2);
    ctx.arc(6, -18, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawCryptTomb(ctx: CanvasRenderingContext2D) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 38, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sepulcher base
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-32, -18, 64, 26);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(-32, -18, 64, 26);

    // Sarcophagus lid
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-35, -28, 70, 12);
    ctx.strokeRect(-35, -28, 70, 12);

    // Carved crest
    ctx.strokeStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(0, -18);
    ctx.moveTo(-8, -22);
    ctx.lineTo(8, -22);
    ctx.stroke();
  }

  private drawShrineAltar(ctx: CanvasRenderingContext2D, curseLevel: 1 | 2 | 3, time: number) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 42, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dais Stone Plinth
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Central Altar Block
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-18, -32, 36, 32);
    ctx.strokeRect(-18, -32, 36, 32);

    // Glowing Sacred Relic Beacon
    const pulse = 0.5 + Math.sin(time * 3) * 0.5;
    const glowColor = curseLevel === 3 ? '#ef4444' : '#38bdf8';
    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14 * pulse;
    ctx.beginPath();
    ctx.arc(0, -36, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawWatchtowerBase(ctx: CanvasRenderingContext2D) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 46, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fortress Foundation Ring
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner Courtyard Flagstone
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();

    // Broken Stone Stair Steps
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    for (let r = 8; r <= 24; r += 8) {
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
    }
  }

  private drawMushroomGrove(
    ctx: CanvasRenderingContext2D,
    variant: number,
    time: number,
    id: number
  ) {
    const colors = ['#38bdf8', '#34d399', '#c084fc'];
    const capColor = colors[variant % colors.length];
    const pulse = 0.8 + Math.sin(time * 2 + id) * 0.2;

    ctx.fillStyle = '#cbd5e1';
    // Stems
    ctx.fillRect(-8, -10, 3, 10);
    ctx.fillRect(4, -14, 4, 14);

    // Glowing Caps with soft bloom
    ctx.fillStyle = capColor;
    ctx.shadowColor = capColor;
    ctx.shadowBlur = 10 * pulse;

    ctx.beginPath();
    ctx.arc(-6.5, -11, 7, Math.PI, 0);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(6, -15, 9, Math.PI, 0);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawStoneWell(ctx: CanvasRenderingContext2D) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 28, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Round Stone Curb
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Water pool inside
    ctx.fillStyle = '#0e7490';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawFerns(ctx: CanvasRenderingContext2D, variant: number) {
    ctx.fillStyle = variant === 2 ? '#4c1d95' : '#064e3b';
    ctx.beginPath();
    ctx.ellipse(-6, -4, 10, 4, -0.4, 0, Math.PI * 2);
    ctx.ellipse(6, -4, 10, 4, 0.4, 0, Math.PI * 2);
    ctx.ellipse(0, -8, 12, 4, -Math.PI / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawHeadstone(ctx: CanvasRenderingContext2D, variant: number) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 3, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(-8, 2);
    ctx.lineTo(-8, -18);
    ctx.arc(0, -18, 8, Math.PI, 0);
    ctx.lineTo(8, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private drawRunicGroundGlyph(
    ctx: CanvasRenderingContext2D,
    variant: number,
    curseLevel: 1 | 2 | 3,
    time: number
  ) {
    const pulse = 0.6 + Math.sin(time * 2) * 0.4;
    const baseColor = curseLevel === 1 ? '56, 189, 248' : curseLevel === 2 ? '168, 85, 247' : '239, 68, 68';

    ctx.strokeStyle = `rgba(${baseColor}, ${0.35 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 55, 0, Math.PI * 2);
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.stroke();

    // Concentric glyph marks
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + time * 0.2;
      ctx.moveTo(Math.cos(a) * 42, Math.sin(a) * 42);
      ctx.lineTo(Math.cos(a) * 55, Math.sin(a) * 55);
    }
    ctx.stroke();
  }
}
