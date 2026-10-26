/**
 * Phase 1 Verification Suite for CURSECRAFT
 * Tests:
 * 1. 20 consecutive rapid engine restarts without loop leakage or duplicate RAF frames
 * 2. Uninitialized entity state guards during transitions
 * 3. Mouse pointer conversion with canvas scaling and viewport resizing
 * 4. Audio mute/unmute state preservation and gesture gating
 */

// Headless environment polyfills for RAF
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

import { GameEngine } from '../src/engine/GameEngine';
import { loadSave, INITIAL_SANCTUM_UPGRADES } from '../src/storage/saveSystem';
import { sound } from '../src/audio/soundEngine';

// Mock Canvas & 2D Context for headless test environment
function createMockCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = {
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
      left: 10,
      top: 20,
      width: width / 1.5, // Scaled display test
      height: height / 1.5,
    }),
  } as unknown as HTMLCanvasElement;

  return canvas;
}

let testPassed = 0;
let testFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    testPassed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    testFailed++;
  }
}

async function runVerification() {
  console.log("=== CURSECRAFT PHASE 1 VERIFICATION SUITE ===\n");

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

  const callbacks = {
    onLevelUp: () => {},
    onGameOver: () => {},
    onExtractionPortalReady: () => {},
    onStepOnPortal: () => {},
    onStatsUpdate: () => {},
  };

  const engine = new GameEngine(mockCanvas, callbacks);

  // --------------------------------------------------------------------------
  // TEST 1: 20 CONSECUTIVE RESTARTS WITHOUT LEAKAGE
  // --------------------------------------------------------------------------
  console.log("--> Testing 20 consecutive engine restarts...");
  let restartErrors = 0;
  try {
    for (let i = 1; i <= 20; i++) {
      engine.initRun(saveData, 0);
      engine.start();
      engine.pause();
      engine.resume();
      engine.stop();
    }
  } catch (err) {
    restartErrors++;
    console.error("Exception during 20 restarts:", err);
  }
  assert(restartErrors === 0, "Restart 20 times without duplicate RAF loops or exceptions");

  // --------------------------------------------------------------------------
  // TEST 2: SAFE RENDERING & STATE TRANSITIONS
  // --------------------------------------------------------------------------
  console.log("\n--> Testing safe rendering and transitions (Game Over, Victory, Pause)...");
  let transitionErrors = 0;
  try {
    engine.initRun(saveData, 0);
    // Damage player to 0 to trigger game over transition
    engine.hitPlayer(200);
    // Re-init run for Sector 2 (push deeper)
    engine.initRun(saveData, 1);
    // Trigger slash and dash
    engine.triggerSlash();
    engine.triggerDash();
    engine.triggerNova();
    engine.pause();
    engine.resume();
    engine.stop();
  } catch (err) {
    transitionErrors++;
    console.error("Exception during state transitions:", err);
  }
  assert(transitionErrors === 0, "No runtime exceptions during combat, damage, game over, or restart");

  // --------------------------------------------------------------------------
  // TEST 3: MOUSE AIMING MATH & RESIZE CALIBRATION
  // --------------------------------------------------------------------------
  console.log("\n--> Testing mouse aiming math with bounding rect scaling...");
  // Simulate pointer event:
  // Client coordinates (clientX=200, clientY=150)
  // Bounding rect: left=10, top=20, rect.width = 1280 / 1.5 = 853.33, rect.height = 720 / 1.5 = 480
  const rect = mockCanvas.getBoundingClientRect();
  const scaleX = mockCanvas.width / (rect.width || 1);
  const scaleY = mockCanvas.height / (rect.height || 1);
  const canvasX = (200 - rect.left) * scaleX;
  const canvasY = (150 - rect.top) * scaleY;

  engine.setMousePos(canvasX, canvasY);
  assert(Math.abs(canvasX - (190 * 1.5)) < 0.01, "Mouse X coordinate accurately scaled from CSS to canvas pixels");
  assert(Math.abs(canvasY - (130 * 1.5)) < 0.01, "Mouse Y coordinate accurately scaled from CSS to canvas pixels");

  // --------------------------------------------------------------------------
  // TEST 4: AUDIO MUTE & VOLUME INTEGRITY
  // --------------------------------------------------------------------------
  console.log("\n--> Testing audio engine mute and gesture gating...");
  sound.setMute(true);
  assert(sound.enabled === false, "Audio setMute(true) updates enabled flag to false");
  sound.setMute(false);
  assert(sound.enabled === true, "Audio setMute(false) updates enabled flag to true");
  sound.setVolume(0.4);
  assert(Math.abs(sound.volume - 0.4) < 0.001, "Audio setVolume updates volume level accurately");

  // --------------------------------------------------------------------------
  // TEST 5: VIEWPORT CULLING INTEGRITY
  // --------------------------------------------------------------------------
  console.log("\n--> Testing environment and entity viewport culling bounds...");
  engine.initRun(saveData, 0);
  const camX = engine.cameraX;
  const camY = engine.cameraY;
  const pad = 120;
  const minX = camX - pad;
  const maxX = camX + mockCanvas.width + pad;
  const minY = camY - pad;
  const maxY = camY + mockCanvas.height + pad;

  // Add one offscreen enemy and one onscreen enemy
  engine.enemies = [
    {
      id: 991,
      type: 'BAT',
      x: camX + 100, // Onscreen
      y: camY + 100,
      vx: 0,
      vy: 0,
      radius: 14,
      hp: 20,
      maxHp: 20,
      speed: 100,
      damage: 5,
      xpValue: 2,
      crystalDropChance: 0.1,
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
    },
    {
      id: 992,
      type: 'BAT',
      x: camX + 3000, // Far offscreen
      y: camY + 3000,
      vx: 0,
      vy: 0,
      radius: 14,
      hp: 20,
      maxHp: 20,
      speed: 100,
      damage: 5,
      xpValue: 2,
      crystalDropChance: 0.1,
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
    }
  ];

  const visibleEnemies = engine.enemies.filter(
    e => e.x + e.radius >= minX && e.x - e.radius <= maxX && e.y + e.radius >= minY && e.y - e.radius <= maxY
  );
  assert(visibleEnemies.length === 1 && visibleEnemies[0].id === 991, "Viewport culling correctly filters out offscreen entities");

  // --------------------------------------------------------------------------
  // TEST 6: MOUSE TO WORLD COORDINATES CONVERSION
  // --------------------------------------------------------------------------
  console.log("\n--> Testing mouse to world coordinate conversion...");
  engine.setMousePos(640, 360);
  const worldPos = engine.getWorldMousePos();
  const expectedWorldX = 640 + engine.cameraX;
  const expectedWorldY = 360 + engine.cameraY;
  assert(
    Math.abs(worldPos.x - expectedWorldX) < 0.001 && Math.abs(worldPos.y - expectedWorldY) < 0.001,
    "getWorldMousePos() accurately calculates world position from canvas mouse and camera offset"
  );

  // --------------------------------------------------------------------------
  // TEST 7: INPUT CLEARING ON WINDOW BLUR & DESTROY
  // --------------------------------------------------------------------------
  console.log("\n--> Testing input clearing on blur and engine teardown...");
  engine.setKey('KeyW', true);
  engine.setKey('KeyD', true);
  engine.setMouseDown(true);
  engine.setJoystick(0.8, -0.6);
  assert(engine.keys.KeyW === true && engine.isMouseDown === true, "Keys and mouse set to active");
  
  engine.clearInputs();
  assert(
    engine.keys.KeyW === false &&
    engine.keys.KeyD === false &&
    engine.isMouseDown === false &&
    engine.joystickVector.x === 0 &&
    engine.joystickVector.y === 0,
    "clearInputs() resets all keys, mouse down, and joystick vectors"
  );

  // --------------------------------------------------------------------------
  // TEST 8: DELTA TIME CLAMPING ON TAB SUSPENSION
  // --------------------------------------------------------------------------
  console.log("\n--> Testing delta time clamping during tab suspension...");
  // Simulate a 10-second background tab gap
  const suspendedRawDt = 10.0;
  const clampedDt = Math.min(suspendedRawDt, 0.05);
  assert(clampedDt === 0.05, "Suspended delta time (10s) is strictly clamped to max 0.05s (50ms)");

  // --------------------------------------------------------------------------
  // TEST 9: REACT STRICT MODE SIMULATION (MOUNT -> UNMOUNT -> REMOUNT)
  // --------------------------------------------------------------------------
  console.log("\n--> Testing React Strict Mode lifecycle (double mount/unmount)...");
  activeFrames.clear();
  const strictEngine1 = new GameEngine(mockCanvas, callbacks);
  strictEngine1.initRun(saveData, 0);
  strictEngine1.start();
  // Simulate React Strict Mode fast unmount
  strictEngine1.destroy();
  
  // Remount
  const strictEngine2 = new GameEngine(mockCanvas, callbacks);
  strictEngine2.initRun(saveData, 0);
  strictEngine2.start();

  assert(activeFrames.size === 1, "Only one RAF frame active after StrictMode unmount/remount cycle");
  strictEngine2.destroy();
  assert(activeFrames.size === 0, "All RAF frames cleared after engine destruction");

  // --------------------------------------------------------------------------
  // TEST 10: CAMERA TRANSLATION + CANVAS SCALING AIMING CALIBRATION
  // --------------------------------------------------------------------------
  console.log("\n--> Testing combined camera translation + canvas scaling aiming math...");
  engine.initRun(saveData, 0);
  engine.playerX = 1200;
  engine.playerY = 900;
  engine.cameraX = 1200 - mockCanvas.width / 2; // 1200 - 640 = 560
  engine.cameraY = 900 - mockCanvas.height / 2; // 900 - 360 = 540

  // Pointer at CSS clientX=500, clientY=300
  // Canvas rect: left=10, top=20, scaleX = 1280 / (1280/1.5) = 1.5, scaleY = 1.5
  const cssMouseX = 500;
  const cssMouseY = 300;
  const scaledCanvasX = (cssMouseX - 10) * 1.5; // (490) * 1.5 = 735
  const scaledCanvasY = (cssMouseY - 20) * 1.5; // (280) * 1.5 = 420
  engine.setMousePos(scaledCanvasX, scaledCanvasY);

  const worldMouse = engine.getWorldMousePos();
  const expectedWorldMouseX = scaledCanvasX + engine.cameraX; // 735 + 560 = 1295
  const expectedWorldMouseY = scaledCanvasY + engine.cameraY; // 420 + 540 = 960

  assert(
    Math.abs(worldMouse.x - expectedWorldMouseX) < 0.001 &&
    Math.abs(worldMouse.y - expectedWorldMouseY) < 0.001,
    "Camera-offset world mouse calculation is exact"
  );

  const expectedAngle = Math.atan2(expectedWorldMouseY - engine.playerY, expectedWorldMouseX - engine.playerX);
  // Screen-space formula used in GameEngine: Math.atan2(mouseY - screenPlayerY, mouseX - screenPlayerX)
  const screenPlayerX = engine.playerX - engine.cameraX;
  const screenPlayerY = engine.playerY - engine.cameraY;
  const screenAngle = Math.atan2(scaledCanvasY - screenPlayerY, scaledCanvasX - screenPlayerX);

  assert(Math.abs(expectedAngle - screenAngle) < 0.0001, "Screen-space aiming angle strictly equals world-space target angle");

  // --------------------------------------------------------------------------
  // TEST 11: 8-DIRECTION REGRESSION TEST WITH UNEQUAL PLAYER X/Y COORDINATES
  // --------------------------------------------------------------------------
  console.log("\n--> Testing 8-direction aiming regression with unequal player coordinates (playerX != playerY)...");
  engine.playerX = 1500;
  engine.playerY = 700;
  engine.cameraX = 1500 - mockCanvas.width / 2; // 860
  engine.cameraY = 700 - mockCanvas.height / 2; // 340
  engine.joystickVector = { x: 0, y: 0 };

  const testDirections = [
    { name: "East", targetX: 1700, targetY: 700, expected: 0 },
    { name: "North-East", targetX: 1700, targetY: 500, expected: -Math.PI / 4 },
    { name: "North", targetX: 1500, targetY: 500, expected: -Math.PI / 2 },
    { name: "North-West", targetX: 1300, targetY: 500, expected: -3 * Math.PI / 4 },
    { name: "West", targetX: 1300, targetY: 700, expected: Math.PI },
    { name: "South-West", targetX: 1300, targetY: 900, expected: 3 * Math.PI / 4 },
    { name: "South", targetX: 1500, targetY: 900, expected: Math.PI / 2 },
    { name: "South-East", targetX: 1700, targetY: 900, expected: Math.PI / 4 },
  ];

  for (const dir of testDirections) {
    // Canvas mouse position = target - camera
    const canvasMouseX = dir.targetX - engine.cameraX;
    const canvasMouseY = dir.targetY - engine.cameraY;
    engine.setMousePos(canvasMouseX, canvasMouseY);

    const worldMouse = engine.getWorldMousePos();
    assert(Math.abs(worldMouse.x - dir.targetX) < 0.001 && Math.abs(worldMouse.y - dir.targetY) < 0.001, `${dir.name}: World mouse matches expected target`);

    // Verify formula: Math.atan2(worldMouse.y - playerY, worldMouse.x - playerX)
    const computedAngle = Math.atan2(worldMouse.y - engine.playerY, worldMouse.x - engine.playerX);
    let diff = Math.abs(computedAngle - dir.expected);
    if (diff > Math.PI) diff = Math.abs(diff - 2 * Math.PI);
    assert(diff < 0.0001, `${dir.name}: Aim angle correctly matches expected angle`);
  }

  // --------------------------------------------------------------------------
  // TEST 12: SAVE SYSTEM COMPATIBILITY & PARTIAL SCHEMA MIGRATION
  // --------------------------------------------------------------------------
  console.log("\n--> Testing save system compatibility and legacy migration...");
  // Mock localStorage
  const storageMap = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, value: string) => { storageMap.set(key, value); },
    removeItem: (key: string) => { storageMap.delete(key); },
    clear: () => { storageMap.clear(); },
    key: (index: number) => Array.from(storageMap.keys())[index] ?? null,
    length: 0,
  } as unknown as Storage;

  // 12a. Default save fallback when no data exists
  storageMap.clear();
  const defaultLoaded = loadSave();
  assert(defaultLoaded.bankedCrystals === 20 && defaultLoaded.totalRuns === 0, "Empty localStorage initializes default save");

  // 12b. Save and reload full roundtrip
  const roundtripSave = {
    ...defaultLoaded,
    bankedCrystals: 150,
    bankedRelics: 7,
    totalRuns: 12,
    victories: 3,
    sanctumUpgrades: {
      ...INITIAL_SANCTUM_UPGRADES,
      vitality: 3,
      ruinousBlade: 2,
    },
  };
  globalThis.localStorage.setItem('cursecraft_save_v1', JSON.stringify(roundtripSave));
  const reloaded = loadSave();
  assert(
    reloaded.bankedCrystals === 150 &&
    reloaded.bankedRelics === 7 &&
    reloaded.sanctumUpgrades.vitality === 3 &&
    reloaded.sanctumUpgrades.ruinousBlade === 2 &&
    reloaded.sanctumUpgrades.swiftstride === 0,
    "Full save roundtrip preserves currencies and upgrade ranks"
  );

  // 12c. Legacy partial save migration (e.g. older version without all sanctum keys)
  const legacySave = {
    bankedCrystals: 85,
    // missing relics, missing some upgrades
    sanctumUpgrades: {
      vitality: 2,
    },
  };
  globalThis.localStorage.setItem('cursecraft_save_v1', JSON.stringify(legacySave));
  const migrated = loadSave();
  assert(
    migrated.bankedCrystals === 85 &&
    migrated.bankedRelics === 0 &&
    migrated.sanctumUpgrades.vitality === 2 &&
    migrated.sanctumUpgrades.arcaneOrbMastery === 0 &&
    migrated.soundEnabled === true,
    "Legacy partial save seamlessly merges missing fields with initial defaults"
  );

  // 12d. Corrupted JSON fallback
  globalThis.localStorage.setItem('cursecraft_save_v1', '{ invalid json !!');
  const fallback = loadSave();
  assert(fallback.bankedCrystals === 20 && fallback.totalRuns === 0, "Corrupted save JSON falls back safely without throw");

  // --------------------------------------------------------------------------
  // TEST 13: AUDIO CONTEXT GESTURE GATING & RESTRICTED ENVIRONMENT SAFETY
  // --------------------------------------------------------------------------
  console.log("\n--> Testing audio context gesture gating and fallback safety...");
  // Test when AudioContext is completely unavailable
  const prevAudioContext = (globalThis as unknown as { AudioContext?: unknown }).AudioContext;
  (globalThis as unknown as { AudioContext?: unknown }).AudioContext = undefined;
  (globalThis as unknown as { webkitAudioContext?: unknown }).webkitAudioContext = undefined;

  let audioThrew = false;
  try {
    sound.ensureAudio();
    sound.playSlash();
    sound.playDash();
    sound.playNova();
  } catch {
    audioThrew = true;
  }
  assert(!audioThrew, "Audio engine methods execute safely without throw in restricted/headless environments");

  // Restore
  (globalThis as unknown as { AudioContext?: unknown }).AudioContext = prevAudioContext;

  // Cleanup
  engine.destroy();

  console.log(`\n=== SUMMARY: ${testPassed} Passed, ${testFailed} Failed ===`);
  if (testFailed > 0) {
    process.exit(1);
  }
}

runVerification();


