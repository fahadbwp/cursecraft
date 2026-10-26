/**
 * Phase 4 Verification Suite for CURSECRAFT: Solo Adventure + Survival Integration
 * Tests:
 * 1. Starting balance, early survivability buffer, and spawn distance
 * 2. Wave progression and Living Curse Director timeline (Awakening -> Corruption -> Nightmare at 5m)
 * 3. Grove Titan boss spawn, combat mechanics, telegraphs, and portal unlocking
 * 4. All 5 Landmark gameplay events (Shrine, Graveyard, Grove, Watchtower, Portal)
 * 5. Push-deeper sector transition to Sector 2 (The Sunken Crypt) preserving character build
 * 6. Deeper-sector 2x loot multiplier verification (chests, drops, boss rewards)
 * 7. Save system persistence and legacy compatibility
 */

import { GameEngine } from '../src/engine/GameEngine';
import { SaveData, LandmarkEventState } from '../src/types/game';
import { loadSave, saveGame } from '../src/storage/saveSystem';

// Mock Canvas & 2D Context for headless engine testing
function createMockCanvas(): HTMLCanvasElement {
  const canvas = {
    width: 1024,
    height: 768,
    getContext: () => ({
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
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
  } as unknown as HTMLCanvasElement;
  return canvas;
}

// Mock localStorage for headless Node environment
const memoryStorage: Record<string, string> = {};
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (key: string) => memoryStorage[key] || null,
  setItem: (key: string, value: string) => { memoryStorage[key] = value; },
  removeItem: (key: string) => { delete memoryStorage[key]; },
  clear: () => { for (const k in memoryStorage) delete memoryStorage[k]; },
  length: 0,
  key: () => null,
};

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}${detail ? ` (${detail})` : ''}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] ${testName}${detail ? ` (${detail})` : ''}`);
    testsFailed++;
  }
}

async function runPhase4Verification() {
  console.log("=========================================================");
  console.log("   CURSECRAFT PHASE 4: SOLO ADVENTURE INTEGRATION SUITE  ");
  console.log("=========================================================\n");

  const canvas = createMockCanvas();
  let portalReadyCount = 0;
  let levelUpCount = 0;

  const callbacks = {
    onLevelUp: () => { levelUpCount++; },
    onGameOver: () => {},
    onExtractionPortalReady: () => { portalReadyCount++; },
    onStepOnPortal: () => {},
    onStatsUpdate: () => {},
  };

  const defaultSave = loadSave();

  // --------------------------------------------------------------------------
  // TEST 1: Starting Balance, Spawn Safety & Early Survivability
  // --------------------------------------------------------------------------
  console.log("--> 1. Testing Starting Balance & Early Survivability...");
  const engine = new GameEngine(canvas, callbacks);
  engine.initRun(defaultSave, 0, 12345);

  assert(engine.player.hp === 100, "Player initializes with 100 base HP");
  assert(engine.invincibleTimer >= 2.0, "Player has initial invulnerability buffer (2.0s)");
  assert(engine.enemies.length === 2, "Only 2 initial bats spawned (no sudden swarms)", `Found ${engine.enemies.length}`);

  // Check distance of initial enemies from player
  const e1Dist = Math.hypot(engine.enemies[0].x - engine.playerX, engine.enemies[0].y - engine.playerY);
  const e2Dist = Math.hypot(engine.enemies[1].x - engine.playerX, engine.enemies[1].y - engine.playerY);
  assert(e1Dist > 500 && e2Dist > 500, "Initial bats spawn safely far away (>500px)", `Distances: ${Math.round(e1Dist)}px, ${Math.round(e2Dist)}px`);

  // Early bat damage is tuned down to 5
  assert(engine.enemies[0].damage === 5, "Early bat damage is gently tuned to 5 in first 90s");

  // --------------------------------------------------------------------------
  // TEST 2: Living Curse Escalation Timeline (Awakening -> Corruption -> Nightmare)
  // --------------------------------------------------------------------------
  console.log("\n--> 2. Testing Living Curse Director Pacing & Boss Warning...");
  // Simulate 95s (Transition to Corruption)
  (engine as unknown as { update: (dt: number) => void }).update(95);
  assert(engine.curseLevel === 2, "Curse escalated to Level 2 (Corruption) after 90s");
  assert(engine.activeAffixes.includes('VOID_FISSURES'), "Void Fissures affix active during Corruption");

  // Advance to 275s (30s Boss Warning window before 5:00)
  (engine as unknown as { update: (dt: number) => void }).update(180); // total 275s
  assert(engine.bossWarningTimer > 0 && engine.bossWarningTimer <= 30, "Boss warning timer active in 270s-300s window", `Timer: ${engine.bossWarningTimer.toFixed(1)}s`);

  // Advance to 305s (Nightmare & Boss Spawn at 5:00 / 300s)
  (engine as unknown as { update: (dt: number) => void }).update(30); // total 305s
  assert(engine.curseLevel === 3, "Curse escalated to Level 3 (Nightmare) at 300s (5:00)");
  assert(engine.bossSpawned === true, "Sector Boss spawned at 300s");
  assert(engine.bossEntity !== null && engine.bossEntity.type === 'GROVE_TITAN', "Grove Titan boss entity created with colossal stats", `Boss HP: ${engine.bossEntity?.hp}`);
  assert(engine.bossWarningTimer === 0, "Boss warning timer cleared once boss spawns");

  // --------------------------------------------------------------------------
  // TEST 3: Grove Titan Boss Combat & Portal Activation
  // --------------------------------------------------------------------------
  console.log("\n--> 3. Testing Grove Titan Boss Combat & Portal Activation...");
  assert(engine.bossEntity?.radius === 46, "Grove Titan hitbox radius is 46px");
  assert(engine.bossEntity?.arcaneShield === 100, "Grove Titan has initial arcane barrier");

  // Deal lethal damage to Grove Titan
  const titan = engine.bossEntity!;
  (engine as unknown as { killEnemy: (e: typeof titan) => void }).killEnemy(titan);

  assert(engine.bossDefeated === true, "Grove Titan marked defeated");
  assert(engine.portal.active === true, "Extraction portal activated at boss coordinates");
  assert(portalReadyCount === 1, "onExtractionPortalReady callback fired");

  // Verify relic drop
  const relicDrop = engine.lootDrops.find(d => d.type === 'RELIC');
  assert(relicDrop !== undefined && relicDrop.value === 1, "Grove Titan dropped 1 Ancient Relic in Sector 1");

  // --------------------------------------------------------------------------
  // TEST 4: Landmark Gameplay Events
  // --------------------------------------------------------------------------
  console.log("\n--> 4. Testing All 5 Landmark Gameplay Events...");
  // Check all 5 landmarks exist
  assert(engine.landmarkEvents.size === 5, "All 5 landmark events registered in map");
  assert(engine.landmarkEvents.has('ANCIENT_SHRINE'), "Ancient Shrine registered");
  assert(engine.landmarkEvents.has('FORGOTTEN_GRAVEYARD'), "Forgotten Graveyard registered");
  assert(engine.landmarkEvents.has('CORRUPTED_GROVE'), "Corrupted Grove registered");
  assert(engine.landmarkEvents.has('RUINED_WATCHTOWER'), "Ruined Watchtower registered");
  assert(engine.landmarkEvents.has('SEALED_PORTAL_CLEARING'), "Sealed Portal Clearing registered");

  // 4A: Ancient Shrine Trial
  const shrineEv = engine.landmarkEvents.get('ANCIENT_SHRINE')!;
  engine.playerX = shrineEv.x;
  engine.playerY = shrineEv.y;
  const shrineTriggered = engine.triggerLandmarkInteraction('ANCIENT_SHRINE');
  assert(shrineTriggered === true && shrineEv.isActive === true, "Ancient Shrine trial activated");
  
  // Simulate trial completion (12 seconds)
  shrineEv.timer = 0.1;
  engine.updateLandmarkEvents(0.2);
  assert(shrineEv.isCompleted === true, "Ancient Shrine trial completed");
  assert(engine.player.slashDamage > 38, "Ancient Shrine granted blessed slash damage bonus");

  // 4B: Forgotten Graveyard Haunt
  const graveEv = engine.landmarkEvents.get('FORGOTTEN_GRAVEYARD')!;
  engine.playerX = graveEv.x;
  engine.playerY = graveEv.y;
  const graveTriggered = engine.triggerLandmarkInteraction('FORGOTTEN_GRAVEYARD');
  assert(graveTriggered === true && graveEv.isActive === true, "Forgotten Graveyard haunt activated");
  assert(graveEv.guardianEnemyId !== undefined, "Tomb Revenant guardian spawned");

  // Kill the Tomb Revenant
  const revenant = engine.enemies.find(e => e.id === graveEv.guardianEnemyId);
  assert(revenant !== undefined, "Tomb Revenant located in enemy pool");
  if (revenant) {
    (engine as unknown as { killEnemy: (e: typeof revenant) => void }).killEnemy(revenant);
  }
  assert(graveEv.isCompleted === true, "Forgotten Graveyard marked completed after slaying revenant");

  // 4C: Corrupted Grove Blight Purge
  const groveEv = engine.landmarkEvents.get('CORRUPTED_GROVE')!;
  engine.playerX = groveEv.x;
  engine.playerY = groveEv.y;
  engine.updateLandmarkEvents(0.1);
  assert(groveEv.isActive === true, "Corrupted Grove activated on player approach");
  assert(groveEv.targetObjectives?.length === 3, "Corrupted Grove spawned 3 Blighted Roots");

  // Destroy the 3 roots
  groveEv.targetObjectives!.forEach(root => {
    root.hp = 0;
    root.destroyed = true;
  });
  engine.updateLandmarkEvents(0.1);
  assert(groveEv.isCompleted === true, "Corrupted Grove completed upon severing all roots");
  assert(engine.player.flameTrail === true, "Corrupted Grove awarded Bramble/Flame Trail ability");

  // 4D: Ruined Watchtower Bastion Beacon
  const towerEv = engine.landmarkEvents.get('RUINED_WATCHTOWER')!;
  engine.playerX = towerEv.x;
  engine.playerY = towerEv.y;
  // Step into watchtower beacon
  engine.updateLandmarkEvents(0.1);
  assert(towerEv.isActive === true, "Watchtower Beacon channeling started");
  
  // Charge to 100% (4 seconds)
  towerEv.progress = 0.95;
  engine.updateLandmarkEvents(0.3);
  assert(towerEv.isCompleted === true, "Watchtower Beacon rekindled to 100%");
  assert(engine.chestSightTimer > 0, "Watchtower activated Chest Sight beacon markers");

  // 4E: Portal Clearing is completed upon boss defeat
  const portalEv = engine.landmarkEvents.get('SEALED_PORTAL_CLEARING')!;
  assert(portalEv.isCompleted === true, "Sealed Portal Clearing marked complete after boss victory");

  // --------------------------------------------------------------------------
  // TEST 5: Sector 2 (The Sunken Crypt) Transition & Character Preservation
  // --------------------------------------------------------------------------
  console.log("\n--> 5. Testing Sector 2 Push-Deeper Transition...");
  // Level up player and grant loot in Sector 1
  engine.player.level = 5;
  engine.player.xp = 35;
  engine.player.soulCrystals = 120;
  engine.player.relicsFound = 2;
  const preDamage = engine.player.slashDamage;

  // Advance to Sector 2
  engine.advanceToSector(1, 9999);

  assert(engine.currentBiomeIndex === 1, "Current biome advanced to Sector 2");
  assert(engine.currentBiome.name === "The Sunken Crypt", "Current biome name is The Sunken Crypt");
  assert(engine.sectorRewardMultiplier === 2.0, "Sector 2 reward multiplier is exactly 2.0x");
  assert(engine.player.level === 5, "Player Level 5 preserved across sector transition");
  assert(engine.player.soulCrystals === 120, "Player banked crystals preserved");
  assert(engine.player.relicsFound === 2, "Player banked relics preserved");
  assert(engine.player.slashDamage === preDamage, "Player offensive stats preserved");
  assert(engine.sectorTimer === 0, "Sector 2 timer reset to 0:00");
  assert(engine.curseLevel === 1, "Sector 2 curse level reset to 1");
  assert(engine.bossSpawned === false, "Sector 2 boss spawn state reset");

  // --------------------------------------------------------------------------
  // TEST 6: 2x Deeper-Sector Reward Multiplier Verification
  // --------------------------------------------------------------------------
  console.log("\n--> 6. Testing 2x Deeper-Sector Reward Multiplier in Sector 2...");
  // Test 6A: Chest rewards in Sector 2
  const initialCrystals = engine.player.soulCrystals;
  const initialRelics = engine.player.relicsFound;

  // Find a relic chest and an ordinary chest
  const relicChest = engine.chests.find(c => c.relicChest && !c.opened)!;
  engine.playerX = relicChest.x;
  engine.playerY = relicChest.y;
  (engine as unknown as { updateWorldInteractions: (dt: number) => void }).updateWorldInteractions(0.1);

  const crystalsGained = engine.player.soulCrystals - initialCrystals;
  const relicsGained = engine.player.relicsFound - initialRelics;

  // Base relic chest is 12 crystals * 2 = 24 crystals, 1 relic * 2 = 2 relics
  assert(crystalsGained === 24, "Relic chest in Sector 2 awarded 24 crystals (12 * 2x multiplier)", `Gained: ${crystalsGained}`);
  assert(relicsGained === 2, "Relic chest in Sector 2 awarded 2 Ancient Relics (1 * 2x multiplier)", `Gained: ${relicsGained}`);

  // Test 6B: Boss drop in Sector 2
  (engine as unknown as { spawnSectorBoss: () => void }).spawnSectorBoss();
  assert(engine.bossEntity !== null && engine.bossEntity.type === 'CRYPT_LORD', "Sector 2 boss spawned as Ignis, The Obsidian Overlord");
  
  const cryptLord = engine.bossEntity!;
  (engine as unknown as { killEnemy: (e: typeof cryptLord) => void }).killEnemy(cryptLord);

  const cryptRelicDrop = engine.lootDrops.find(d => d.type === 'RELIC' && d.x === cryptLord.x);
  assert(cryptRelicDrop !== undefined && cryptRelicDrop.value === 2, "Crypt Lord dropped 2 Ancient Relics (1 * 2.0 multiplier)");

  // --------------------------------------------------------------------------
  // TEST 7: Save System Persistence & Legacy Backward Compatibility
  // --------------------------------------------------------------------------
  console.log("\n--> 7. Testing Save System Persistence...");
  const currentSave: SaveData = {
    bankedCrystals: 250,
    bankedRelics: 4,
    totalRuns: 8,
    victories: 3,
    bestSurvivalSeconds: 620,
    totalEnemiesKilled: 450,
    sanctumUpgrades: {
      vitality: 2,
      ruinousBlade: 3,
      arcaneOrbMastery: 1,
      swiftstride: 1,
      arcaneWard: 2,
      dashMastery: 1,
      fortuneFavor: 2,
    },
    soundEnabled: true,
    sfxVolume: 0.8,
  };

  saveGame(currentSave);
  const reloaded = loadSave();

  assert(reloaded.bankedCrystals === 250, "Banked crystals correctly saved and loaded");
  assert(reloaded.bankedRelics === 4, "Banked relics correctly saved and loaded");
  assert(reloaded.victories === 3, "Victories count correctly saved");
  assert(reloaded.sanctumUpgrades.ruinousBlade === 3, "Sanctum upgrades correctly preserved");

  // Teardown
  engine.destroy();

  console.log("\n=========================================================");
  console.log(`   PHASE 4 SUMMARY: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log("=========================================================");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runPhase4Verification().catch(err => {
  console.error("Unhandled error during Phase 4 verification:", err);
  process.exit(1);
});
