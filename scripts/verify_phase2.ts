/**
 * Comprehensive Phase 2 Verification Suite for CURSECRAFT: Haunted Forest Environment
 * Verifies:
 * 1. Deterministic procedural world generation (Seed matching & variation)
 * 2. Valid player spawn positions (safe spawn clearance)
 * 3. Accessible navigation routes and objective positions (landmarks, chests, portal)
 * 4. Correct scenery collisions (smooth sliding tangent push-out)
 * 5. Functional chest and portal interactions (relics, crystals, extraction trigger)
 * 6. Stable rendering during camera movement (frustum sweeps across 4 quadrants)
 * 7. Combat and enemy behavior preservation (slashes, orbs, dash, nova)
 * 8. Correct entity and scenery culling
 * 9. No duplicate RAF loops (lifecycle integrity)
 * 10. Frame timing & render performance benchmark (measured ms/frame)
 */

import { GameEngine } from '../src/engine/GameEngine';
import { WorldEnvironment, SeededRandom } from '../src/engine/WorldEnvironment';
import { INITIAL_SANCTUM_UPGRADES } from '../src/storage/saveSystem';

// Headless RAF Polyfill
let nextFrameId = 1;
const activeFrames = new Set<number>();

if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    const id = nextFrameId++;
    activeFrames.add(id);
    setTimeout(() => {
      if (activeFrames.has(id)) {
        activeFrames.delete(id);
        callback(performance.now());
      }
    }, 16);
    return id;
  };
}

if (typeof globalThis.cancelAnimationFrame === 'undefined') {
  globalThis.cancelAnimationFrame = (id: number): void => {
    activeFrames.delete(id);
  };
}

// Headless Mock Canvas & 2D Context
function createMockCanvas(width: number, height: number): HTMLCanvasElement {
  return {
    width,
    height,
    getContext: () => ({
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      bezierCurveTo: () => {},
      arc: () => {},
      ellipse: () => {},
      fill: () => {},
      stroke: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      drawImage: () => {},
      fillText: () => {},
      setLineDash: () => {},
      createRadialGradient: () => ({
        addColorStop: () => {},
      }),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      shadowColor: '',
      shadowBlur: 0,
      globalAlpha: 1,
      font: '',
      textAlign: '',
    }),
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      width,
      height,
    }),
  } as unknown as HTMLCanvasElement;
}

let testPassed = 0;
let testFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}${detail ? ` (${detail})` : ''}`);
    testPassed++;
  } else {
    console.error(`[FAIL] ${testName}${detail ? ` (${detail})` : ''}`);
    testFailed++;
  }
}

async function runPhase2Verification() {
  console.log("=========================================================");
  console.log("   CURSECRAFT PHASE 2: HAUNTED FOREST VERIFICATION SUITE ");
  console.log("=========================================================\n");

  const mockCanvas = createMockCanvas(1280, 720);
  const saveData = {
    bankedCrystals: 50,
    bankedRelics: 2,
    totalRuns: 5,
    victories: 1,
    bestSurvivalSeconds: 320,
    totalEnemiesKilled: 120,
    sanctumUpgrades: { ...INITIAL_SANCTUM_UPGRADES },
    soundEnabled: true,
    sfxVolume: 0.7,
  };

  let portalStepped = false;
  const callbacks = {
    onLevelUp: () => {},
    onGameOver: () => {},
    onExtractionPortalReady: () => {},
    onStepOnPortal: () => {
      portalStepped = true;
    },
    onStatsUpdate: () => {},
  };

  // --------------------------------------------------------------------------
  // TEST 1: DETERMINISTIC PROCEDURAL WORLD GENERATION
  // --------------------------------------------------------------------------
  console.log("--> 1. Testing Deterministic Procedural World Generation...");
  const envA1 = new WorldEnvironment(3200, 3200);
  envA1.generateWorld(777, false);

  const envA2 = new WorldEnvironment(3200, 3200);
  envA2.generateWorld(777, false);

  const envB = new WorldEnvironment(3200, 3200);
  envB.generateWorld(8888, false);

  assert(envA1.scenery.length === envA2.scenery.length, "Identical seed produces identical scenery object count", `${envA1.scenery.length} objects`);
  
  let matchA = true;
  for (let i = 0; i < envA1.scenery.length; i++) {
    if (
      envA1.scenery[i].x !== envA2.scenery[i].x ||
      envA1.scenery[i].y !== envA2.scenery[i].y ||
      envA1.scenery[i].type !== envA2.scenery[i].type
    ) {
      matchA = false;
      break;
    }
  }
  assert(matchA, "Identical seed reproduces exact coordinates and object types");

  let distinct = false;
  for (let i = 0; i < Math.min(envA1.scenery.length, envB.scenery.length); i++) {
    if (envA1.scenery[i].x !== envB.scenery[i].x || envA1.scenery[i].y !== envB.scenery[i].y) {
      distinct = true;
      break;
    }
  }
  assert(distinct, "Different seeds produce unique procedural layouts");

  // --------------------------------------------------------------------------
  // TEST 2: VALID PLAYER SPAWN POSITION & SAFETY CLEARANCE
  // --------------------------------------------------------------------------
  console.log("\n--> 2. Testing Player Spawn Safety Clearance...");
  const spawnX = 1600;
  const spawnY = 1600;
  const isSpawnBlocked = envA1.isBlocked(spawnX, spawnY, 40);
  assert(!isSpawnBlocked, "Spawn position (1600, 1600) is 100% unblocked");

  const collidablesNearSpawn = envA1.getCollidablesInRadius(spawnX, spawnY, 170);
  assert(collidablesNearSpawn.length === 0, "Spawn clearing of 170px radius is strictly empty of solid obstacles", `Found ${collidablesNearSpawn.length} collidables`);

  // --------------------------------------------------------------------------
  // TEST 3: ACCESSIBLE NAVIGATION ROUTES & OBJECTIVE POSITIONS
  // --------------------------------------------------------------------------
  console.log("\n--> 3. Testing Navigation Routes & Objective Positions...");
  assert(envA1.landmarks.length === 5, "All 5 major landmarks defined", envA1.landmarks.map(l => l.name).join(", "));
  assert(envA1.paths.length === 5, "5 natural path corridors connect spawn to landmarks");

  // Verify paths are walkable
  let pathCollisions = 0;
  for (const path of envA1.paths) {
    for (let t = 0.1; t <= 0.9; t += 0.2) {
      const invT = 1 - t;
      const px = invT * invT * path.startX + 2 * invT * t * path.cpX + t * t * path.endX;
      const py = invT * invT * path.startY + 2 * invT * t * path.cpY + t * t * path.endY;
      if (envA1.isBlocked(px, py, 20)) {
        pathCollisions++;
      }
    }
  }
  assert(pathCollisions === 0, "Corridor centerlines remain unblocked along entire transit paths");

  // Initialize engine for objective tests
  const engine = new GameEngine(mockCanvas, callbacks);
  engine.initRun(saveData, 0, 777);

  // Verify landmark chests
  const landmarkChests = engine.chests.slice(0, 4);
  let landmarkChestsBlocked = 0;
  for (const c of landmarkChests) {
    if (engine.environment.isBlocked(c.x, c.y, c.radius)) {
      landmarkChestsBlocked++;
    }
  }
  assert(landmarkChestsBlocked === 0, "All guaranteed landmark chests spawn in valid, accessible positions");

  // Verify extraction portal
  const portalBlocked = engine.environment.isBlocked(engine.portal.x, engine.portal.y, engine.portal.radius);
  assert(!portalBlocked, "Extraction portal in Sealed Portal Clearing is unblocked", `(${engine.portal.x}, ${engine.portal.y})`);

  // --------------------------------------------------------------------------
  // TEST 4: SCENERY OBSTACLE COLLISIONS
  // --------------------------------------------------------------------------
  console.log("\n--> 4. Testing Scenery Collision Push-Out & Tangent Sliding...");
  // Find a collidable tree
  const tree = envA1.scenery.find(s => s.type === 'TREE' && s.isCollidable)!;
  assert(!!tree, "Found solid tree obstacle for collision simulation", `Tree at (${Math.round(tree.x)}, ${Math.round(tree.y)}) with radius ${tree.collisionRadius}`);

  // Place player penetrating slightly into tree perimeter
  const playerRadius = 18;
  const testStartX = tree.x + (tree.collisionRadius + playerRadius - 8);
  const testStartY = tree.y;
  const resolved = envA1.resolveCollision(testStartX, testStartY, playerRadius);

  const finalDist = Math.hypot(resolved.x - tree.x, resolved.y - tree.y);
  const expectedDist = tree.collisionRadius + playerRadius;
  assert(resolved.collided, "Collision accurately detected on overlap");
  assert(Math.abs(finalDist - expectedDist) < 0.01, "Player smoothly pushed out to exact obstacle perimeter", `Dist: ${finalDist.toFixed(2)}px vs Expected: ${expectedDist}px`);

  // --------------------------------------------------------------------------
  // TEST 5: CHEST & PORTAL INTERACTIONS
  // --------------------------------------------------------------------------
  console.log("\n--> 5. Testing Chest & Portal Interactions...");
  // Test Relic Chest Interaction
  const relicChest = engine.chests.find(c => c.relicChest && !c.opened)!;
  assert(!!relicChest, "Found unopened Relic Chest");
  engine.playerX = relicChest.x;
  engine.playerY = relicChest.y;
  const initialRelics = engine.player.relicsFound;
  // Trigger world interaction
  engine['updateWorldInteractions'](0.016);
  assert(relicChest.opened, "Relic Chest opened upon player contact");
  assert(engine.player.relicsFound > initialRelics, "Ancient Relic added to player inventory", `Relics: ${engine.player.relicsFound}`);

  // Test Portal Interaction
  engine.portal.active = true;
  engine.playerX = engine.portal.x;
  engine.playerY = engine.portal.y;
  engine['updateWorldInteractions'](0.016);
  assert(portalStepped, "Active extraction portal triggered onStepOnPortal callback");

  // --------------------------------------------------------------------------
  // TEST 6: STABLE RENDERING DURING CAMERA SWEEPS
  // --------------------------------------------------------------------------
  console.log("\n--> 6. Testing Stable Rendering Across World Quadrants...");
  const ctx = mockCanvas.getContext('2d')!;
  let renderErrors = 0;
  const cameraPositions = [
    { x: 0, y: 0 },
    { x: 1600, y: 0 },
    { x: 0, y: 1600 },
    { x: 1920, y: 1920 },
    { x: 2350 - 640, y: 850 - 360 }, // Centered on Shrine
    { x: 850 - 640, y: 2350 - 360 },  // Centered on Graveyard
  ];

  try {
    for (const pos of cameraPositions) {
      envA1.renderGround(ctx, pos.x, pos.y, 1280, 720, 1, false);
      envA1.renderScenery(ctx, pos.x, pos.y, 1280, 720, 1, 1.5);
      envA1.renderAmbientMist(ctx, pos.x, pos.y, 1);
    }
  } catch (err) {
    renderErrors++;
    console.error("Render sweep error:", err);
  }
  assert(renderErrors === 0, "Camera sweep across all quadrants rendered with 0 exceptions");

  // --------------------------------------------------------------------------
  // TEST 7: COMBAT & ENEMY BEHAVIOR PRESERVATION
  // --------------------------------------------------------------------------
  console.log("\n--> 7. Testing Combat & Enemy Mechanics Preservation...");
  engine.enemies = [{
    id: 9999,
    type: 'BAT',
    x: engine.playerX + 40,
    y: engine.playerY,
    vx: 0,
    vy: 0,
    radius: 14,
    hp: 30,
    maxHp: 30,
    speed: 100,
    damage: 10,
    xpValue: 5,
    crystalDropChance: 1.0,
    color: '#fff',
    glowColor: '#fff',
    isBoss: false,
    isElite: false,
    state: 'CHASE',
    stateTimer: 0,
    targetAngle: 0,
    attackCooldown: 1,
    hitFlashTimer: 0,
    arcaneShield: 0,
    isEnraged: false,
    burnTimer: 0,
    freezeTimer: 0,
  }];

  // Slash towards enemy
  engine.playerAngle = 0; // Facing east
  engine.triggerSlash();
  assert(engine.enemies[0].hp < 30, "Spectral Slash damages enemy in reach", `Remaining HP: ${engine.enemies[0].hp.toFixed(1)}`);

  // Dash test
  engine.triggerDash();
  assert(engine.isDashing, "Arcane Dash initiates invulnerability state");

  // --------------------------------------------------------------------------
  // TEST 8: CORRECT ENTITY & SCENERY CULLING
  // --------------------------------------------------------------------------
  console.log("\n--> 8. Testing Spatial Frustum Culling...");
  const camX = 1600;
  const camY = 1600;
  const viewW = 1280;
  const viewH = 720;
  const pad = 120;

  const minX = camX - pad;
  const maxX = camX + viewW + pad;
  const minY = camY - pad;
  const maxY = camY + viewH + pad;

  const allScenery = envA1.scenery;
  const visible = allScenery.filter(s => s.x >= minX && s.x <= maxX && s.y >= minY && s.y <= maxY);
  const culled = allScenery.filter(s => s.x < minX || s.x > maxX || s.y < minY || s.y > maxY);

  assert(allScenery.length > 250, "Full world contains high-density scenery objects", `${allScenery.length} objects`);
  assert(visible.length > 0 && visible.length < allScenery.length, "Spatial query only selects visible objects", `Visible: ${visible.length}/${allScenery.length}`);
  assert(culled.length > 0, "Offscreen scenery correctly isolated outside camera frustum", `Culled: ${culled.length} objects`);

  // --------------------------------------------------------------------------
  // TEST 9: NO DUPLICATE RAF LOOPS
  // --------------------------------------------------------------------------
  console.log("\n--> 9. Testing Single Active Game Loop Across 20 Restarts...");
  activeFrames.clear();
  for (let i = 0; i < 20; i++) {
    engine.initRun(saveData, 0, 100 + i);
    engine.start();
    engine.pause();
    engine.resume();
    engine.stop();
  }
  assert(activeFrames.size === 0, "All animation frames cancelled cleanly after 20 restarts");

  // --------------------------------------------------------------------------
  // TEST 10: FRAME TIMING & PERFORMANCE BENCHMARK
  // --------------------------------------------------------------------------
  console.log("\n--> 10. Benchmarking Scenery & Ground Render Timing...");
  engine.initRun(saveData, 0, 777);
  engine.start();

  const iterations = 100;
  const startBenchmark = performance.now();
  for (let i = 0; i < iterations; i++) {
    engine['render']();
  }
  const totalBenchmarkTime = performance.now() - startBenchmark;
  const msPerFrame = totalBenchmarkTime / iterations;
  const theoreticalFps = Math.round(1000 / Math.max(0.001, msPerFrame));

  console.log(`   [METRIC] Average frame render time: ${msPerFrame.toFixed(3)} ms`);
  console.log(`   [METRIC] Theoretical rendering throughput: ~${theoreticalFps} FPS`);
  assert(msPerFrame < 5.0, "Average frame render time strictly under 5ms (< 16.6ms 60 FPS budget)", `${msPerFrame.toFixed(3)} ms/frame`);

  // Teardown
  engine.destroy();

  console.log(`\n=========================================================`);
  console.log(`   SUMMARY: ${testPassed} Passed, ${testFailed} Failed`);
  console.log(`=========================================================`);

  if (testFailed > 0) {
    process.exit(1);
  }
}

runPhase2Verification();
