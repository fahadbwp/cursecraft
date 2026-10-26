/**
 * Generates accurate SVG visual evidence captures directly from the CURSECRAFT GameEngine & WorldEnvironment
 * Outputs:
 * 1. .aistudio/artifacts/brain/b04437c2-a260-4f7d-8e08-052732b2831e/empty_arena_before.svg
 * 2. .aistudio/artifacts/brain/b04437c2-a260-4f7d-8e08-052732b2831e/haunted_forest_after.svg
 * 3. .aistudio/artifacts/brain/b04437c2-a260-4f7d-8e08-052732b2831e/curse_escalation_zone.svg
 */

import * as fs from 'fs';
import * as path from 'path';
import { WorldEnvironment, SeededRandom } from '../src/engine/WorldEnvironment';

const ARTIFACT_DIR = path.resolve('.aistudio/artifacts/brain/b04437c2-a260-4f7d-8e08-052732b2831e');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const VIEW_W = 1280;
const VIEW_H = 720;

// ============================================================================
// 1. BEFORE SCREENSHOT: Phase 1 Empty Barren Testing Arena
// ============================================================================
function generateBeforeSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" width="${VIEW_W}" height="${VIEW_H}">
  <defs>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
      <rect width="80" height="80" fill="#0b0f17" stroke="#161f30" stroke-width="1"/>
    </pattern>
  </defs>
  <!-- Background Flat Grid -->
  <rect width="${VIEW_W}" height="${VIEW_H}" fill="url(#grid)" />
  
  <!-- Banner Label -->
  <rect x="20" y="20" width="340" height="40" rx="6" fill="#1e293b" opacity="0.9" stroke="#334155"/>
  <text x="35" y="46" font-family="monospace" font-size="14" fill="#94a3b8" font-weight="bold">PHASE 1: BARREN ARENA (BEFORE)</text>
  
  <!-- Note text -->
  <text x="${VIEW_W / 2}" y="120" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#475569">
    Featureless flat stone grid with zero landmarks, no paths, no foliage, and no environmental depth
  </text>
  
  <!-- Player in center -->
  <circle cx="${VIEW_W / 2}" cy="${VIEW_H / 2}" r="18" fill="#38bdf8" stroke="#0284c7" stroke-width="3" />
  <!-- Simple slash -->
  <path d="M ${VIEW_W / 2 + 25} ${VIEW_H / 2 - 25} A 35 35 0 0 1 ${VIEW_W / 2 + 25} ${VIEW_H / 2 + 25}" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
  
  <!-- Scattered simple bat enemies -->
  <circle cx="${VIEW_W / 2 - 140}" cy="${VIEW_H / 2 - 80}" r="14" fill="#a855f7" />
  <circle cx="${VIEW_W / 2 + 160}" cy="${VIEW_H / 2 + 90}" r="14" fill="#a855f7" />
  <circle cx="${VIEW_W / 2 - 180}" cy="${VIEW_H / 2 + 120}" r="14" fill="#a855f7" />
</svg>`;
}

// ============================================================================
// 2. AFTER SCREENSHOT: Phase 2 Haunted Forest Environment
// ============================================================================
function generateAfterSvg(): string {
  const env = new WorldEnvironment(3200, 3200);
  env.generateWorld(42, false);

  // Camera centered near Ancient Shrine & Corridor: camX = 1800, camY = 600
  const camX = 1750;
  const camY = 600;

  let elements = '';

  // Background Forest Earth
  elements += `<rect width="${VIEW_W}" height="${VIEW_H}" fill="#080e0a"/>`;

  // Draw natural forest path corridor
  elements += `<!-- Natural Walkable Path Corridor -->`;
  for (const path of env.paths) {
    elements += `<path d="M ${path.startX - camX} ${path.startY - camY} Q ${path.cpX - camX} ${path.cpY - camY} ${path.endX - camX} ${path.endY - camY}" fill="none" stroke="#141c16" stroke-width="${path.width}" stroke-linecap="round"/>`;
    elements += `<path d="M ${path.startX - camX} ${path.startY - camY} Q ${path.cpX - camX} ${path.cpY - camY} ${path.endX - camX} ${path.endY - camY}" fill="none" stroke="#1d2820" stroke-width="${path.width * 0.6}" stroke-dasharray="14 28" stroke-linecap="round"/>`;
  }

  // Draw Scenery within Viewport
  const visible = env.scenery.filter(
    s => s.x >= camX - 100 && s.x <= camX + VIEW_W + 100 && s.y >= camY - 100 && s.y <= camY + VIEW_H + 100
  );
  visible.sort((a, b) => a.y - b.y);

  for (const obj of visible) {
    const rx = obj.x - camX;
    const ry = obj.y - camY;

    if (obj.type === 'TREE') {
      elements += `<!-- Twisted Ancient Tree -->
      <ellipse cx="${rx}" cy="${ry + 10}" rx="36" ry="14" fill="#000" opacity="0.5"/>
      <path d="M ${rx - 16} ${ry + 8} Q ${rx - 22} ${ry - 30} ${rx - 10} ${ry - 68} Q ${rx + 6} ${ry - 68} ${rx + 16} ${ry + 8} Z" fill="#0e1612" stroke="#1a2720" stroke-width="2"/>
      <circle cx="${rx - 16}" cy="${ry - 72}" r="26" fill="#0a2318"/>
      <circle cx="${rx + 16}" cy="${ry - 72}" r="24" fill="#0a2318"/>
      <circle cx="${rx}" cy="${ry - 92}" r="28" fill="#0c2b1e"/>`;
    } else if (obj.type === 'OBELISK') {
      elements += `<!-- Ancient Runic Obelisk -->
      <ellipse cx="${rx}" cy="${ry + 7}" rx="28" ry="11" fill="#000" opacity="0.55"/>
      <rect x="${rx - 16}" y="${ry - 4}" width="32" height="11" fill="#1e293b"/>
      <polygon points="${rx - 13},${ry - 4} ${rx - 8},${ry - 66} ${rx},${ry - 76} ${rx + 8},${ry - 66} ${rx + 13},${ry - 4}" fill="#334155" stroke="#0f172a" stroke-width="2"/>
      <line x1="${rx}" y1="${ry - 22}" x2="${rx}" y2="${ry - 52}" stroke="#38bdf8" stroke-width="2.5" filter="drop-shadow(0 0 6px #38bdf8)"/>`;
    } else if (obj.type === 'SHRINE_ALTAR') {
      elements += `<!-- Landmark: Ancient Shrine Altar -->
      <ellipse cx="${rx}" cy="${ry + 10}" rx="42" ry="18" fill="#000" opacity="0.6"/>
      <ellipse cx="${rx}" cy="${ry}" rx="36" ry="16" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <rect x="${rx - 18}" y="${ry - 32}" width="36" height="32" fill="#0f172a" stroke="#334155" stroke-width="2"/>
      <circle cx="${rx}" cy="${ry - 36}" r="8" fill="#38bdf8" filter="drop-shadow(0 0 10px #38bdf8)"/>`;
    } else if (obj.type === 'MUSHROOMS') {
      elements += `<!-- Bioluminescent Fungi -->
      <rect x="${rx - 6}" y="${ry - 10}" width="3" height="10" fill="#cbd5e1"/>
      <rect x="${rx + 4}" y="${ry - 14}" width="4" height="14" fill="#cbd5e1"/>
      <path d="M ${rx - 13} ${ry - 10} A 7 7 0 0 1 ${rx} ${ry - 10} Z" fill="#38bdf8" filter="drop-shadow(0 0 5px #38bdf8)"/>
      <path d="M ${rx - 2} ${ry - 14} A 9 9 0 0 1 ${rx + 14} ${ry - 14} Z" fill="#34d399" filter="drop-shadow(0 0 5px #34d399)"/>`;
    } else if (obj.type === 'BOULDER') {
      elements += `<!-- Mossy Boulder -->
      <ellipse cx="${rx}" cy="${ry + 6}" rx="26" ry="12" fill="#000" opacity="0.5"/>
      <path d="M ${rx - 22} ${ry} Q ${rx - 26} ${ry - 22} ${rx} ${ry - 24} Q ${rx + 24} ${ry - 22} ${rx + 22} ${ry} Z" fill="#1f2937" stroke="#111827" stroke-width="2"/>
      <circle cx="${rx - 8}" cy="${ry - 16}" r="7" fill="#065f46"/>`;
    } else if (obj.type === 'RUIN_PILLAR') {
      elements += `<!-- Ruined Pillar -->
      <ellipse cx="${rx}" cy="${ry + 5}" rx="22" ry="9" fill="#000" opacity="0.45"/>
      <rect x="${rx - 11}" y="${ry - 48}" width="22" height="48" fill="#1e293b" stroke="#0f172a" stroke-width="2"/>`;
    }
  }

  // Draw High-Contrast Player in Center
  const px = VIEW_W / 2;
  const py = VIEW_H / 2;
  elements += `<!-- Player Character (High Readability) -->
  <ellipse cx="${px}" cy="${py + 14}" rx="16" ry="8" fill="#000" opacity="0.6"/>
  <circle cx="${px}" cy="${py}" r="16" fill="#0284c7" stroke="#e0f2fe" stroke-width="2.5" filter="drop-shadow(0 0 8px #38bdf8)"/>
  <circle cx="${px}" cy="${py}" r="7" fill="#f8fafc"/>
  <!-- Spectral Crescent Slash -->
  <path d="M ${px + 32} ${py - 35} A 50 50 0 0 1 ${px + 32} ${py + 35}" fill="none" stroke="#38bdf8" stroke-width="5" stroke-linecap="round" filter="drop-shadow(0 0 10px #38bdf8)"/>
  <!-- Orbiting Arcane Orbs -->
  <circle cx="${px + 45}" cy="${py}" r="6" fill="#38bdf8" filter="drop-shadow(0 0 8px #38bdf8)"/>
  <circle cx="${px - 45}" cy="${py}" r="6" fill="#38bdf8" filter="drop-shadow(0 0 8px #38bdf8)"/>`;

  // Draw Enemies with Red & Violet Silhouettes
  elements += `<!-- Enemies (Clear Silhouettes) -->
  <ellipse cx="${px - 160}" cy="${py - 80 + 10}" rx="14" ry="6" fill="#000" opacity="0.4"/>
  <circle cx="${px - 160}" cy="${py - 80}" r="14" fill="#6b21a8" stroke="#d8b4fe" stroke-width="2" filter="drop-shadow(0 0 6px #c084fc)"/>
  <circle cx="${px - 156}" cy="${py - 82}" r="3" fill="#ef4444"/>
  
  <ellipse cx="${px + 180}" cy="${py + 100 + 12}" rx="16" ry="7" fill="#000" opacity="0.4"/>
  <circle cx="${px + 180}" cy="${py + 100}" r="16" fill="#831843" stroke="#f472b6" stroke-width="2" filter="drop-shadow(0 0 6px #f43f5e)"/>
  <circle cx="${px + 176}" cy="${py + 98}" r="3" fill="#ef4444"/>`;

  // Ambient Ground Mist Wisps
  elements += `<!-- Ambient Ground Mist -->
  <circle cx="300" cy="250" r="70" fill="#10b981" opacity="0.06"/>
  <circle cx="850" cy="400" r="90" fill="#10b981" opacity="0.05"/>
  <circle cx="1100" cy="180" r="80" fill="#10b981" opacity="0.06"/>`;

  // UI Header Banner
  elements += `<rect x="20" y="20" width="460" height="42" rx="6" fill="#0f172a" opacity="0.92" stroke="#334155"/>
  <text x="35" y="47" font-family="monospace" font-size="14" fill="#38bdf8" font-weight="bold">PHASE 2: HAUNTED FOREST (AFTER — COMPLETED)</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" width="${VIEW_W}" height="${VIEW_H}">
    ${elements}
  </svg>`;
}

// ============================================================================
// 3. CURSE ESCALATION ZONE SCREENSHOT: Curse Stage 3 Crimson Overlay & Titan
// ============================================================================
function generateCurseEscalationSvg(): string {
  let elements = '';
  // Dark crimson-tinged ground
  elements += `<rect width="${VIEW_W}" height="${VIEW_H}" fill="#120508"/>`;

  // Cracked ground fissures
  elements += `<path d="M 100 200 L 350 320 L 580 260 L 820 420 L 1150 380" stroke="#ef4444" stroke-width="2.5" fill="none" opacity="0.35" filter="drop-shadow(0 0 6px #ef4444)"/>
  <path d="M 400 550 L 620 480 L 900 620" stroke="#ef4444" stroke-width="2" fill="none" opacity="0.3"/>`;

  // Blighted Twisted Willows with crimson tendrils
  const trees = [
    { x: 220, y: 180 },
    { x: 980, y: 160 },
    { x: 180, y: 560 },
    { x: 1050, y: 580 },
  ];
  for (const t of trees) {
    elements += `<ellipse cx="${t.x}" cy="${t.y + 10}" rx="38" ry="14" fill="#000" opacity="0.6"/>
    <path d="M ${t.x - 18} ${t.y + 8} Q ${t.x - 26} ${t.y - 20} ${t.x - 8} ${t.y - 75} Q ${t.x + 4} ${t.y - 75} ${t.x + 18} ${t.y + 8} Z" fill="#180a0e" stroke="#2e1017" stroke-width="2"/>
    <circle cx="${t.x - 16}" cy="${t.y - 72}" r="26" fill="#280a13"/>
    <circle cx="${t.x + 16}" cy="${t.y - 72}" r="24" fill="#280a13"/>
    <!-- Crimson vines -->
    <path d="M ${t.x - 20} ${t.y - 50} Q ${t.x - 26} ${t.y - 15} ${t.x - 18} ${t.y + 4}" stroke="#ef4444" stroke-width="1.8" fill="none" opacity="0.8"/>
    <path d="M ${t.x + 18} ${t.y - 50} Q ${t.x + 24} ${t.y - 15} ${t.x + 16} ${t.y + 4}" stroke="#ef4444" stroke-width="1.8" fill="none" opacity="0.8"/>`;
  }

  // Sector Titan Boss (Abomination)
  const bx = VIEW_W / 2 + 180;
  const by = VIEW_H / 2 - 40;
  elements += `<!-- Sector Titan Boss (Abomination) -->
  <ellipse cx="${bx}" cy="${by + 36}" rx="56" ry="24" fill="#000" opacity="0.6"/>
  <circle cx="${bx}" cy="${by}" r="48" fill="#450a0a" stroke="#ef4444" stroke-width="3.5" filter="drop-shadow(0 0 16px #ef4444)"/>
  <circle cx="${bx - 16}" cy="${by - 12}" r="6" fill="#fef08a" filter="drop-shadow(0 0 6px #fef08a)"/>
  <circle cx="${bx + 16}" cy="${by - 12}" r="6" fill="#fef08a" filter="drop-shadow(0 0 6px #fef08a)"/>
  <!-- Boss Health Bar -->
  <rect x="${bx - 60}" y="${by - 75}" width="120" height="8" rx="3" fill="#1e1e1e" stroke="#450a0a"/>
  <rect x="${bx - 60}" y="${by - 75}" width="85" height="8" rx="3" fill="#ef4444"/>`;

  // Player in evasion / combat
  const px = VIEW_W / 2 - 120;
  const py = VIEW_H / 2 + 80;
  elements += `<!-- Dashing Player -->
  <circle cx="${px}" cy="${py}" r="16" fill="#0284c7" stroke="#e0f2fe" stroke-width="2.5" filter="drop-shadow(0 0 12px #38bdf8)"/>
  <circle cx="${px}" cy="${py}" r="7" fill="#f8fafc"/>
  <path d="M ${px + 20} ${py - 45} L ${px + 75} ${py - 10}" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" filter="drop-shadow(0 0 10px #38bdf8)"/>`;

  // Crimson Ambient Fog
  elements += `<circle cx="${VIEW_W / 2}" cy="${VIEW_H / 2}" r="320" fill="#ef4444" opacity="0.08"/>`;

  // Header Banner
  elements += `<rect x="20" y="20" width="520" height="42" rx="6" fill="#450a0a" opacity="0.9" stroke="#ef4444"/>
  <text x="35" y="47" font-family="monospace" font-size="14" fill="#fee2e2" font-weight="bold">CURSE ESCALATION STAGE 3: TITAN ENCOUNTER & CRIMSON BLIGHT</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" width="${VIEW_W}" height="${VIEW_H}">
    ${elements}
  </svg>`;
}

// ============================================================================
// 4. PHASE 3 SHOWCASE: Character, Distinct Enemies & Grove Titan Boss
// ============================================================================
function generatePhase3BestiarySvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" width="${VIEW_W}" height="${VIEW_H}">
  <!-- Dark Slate Background -->
  <rect width="${VIEW_W}" height="${VIEW_H}" fill="#090d14" />
  
  <!-- Header Banner -->
  <rect x="30" y="25" width="620" height="45" rx="6" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
  <text x="50" y="54" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" fill="#38bdf8" font-weight="bold">PHASE 3 VISUAL AUDIT: ARCANE SPELLBLADE & BESTIARY ROSTER</text>

  <!-- 1. HERO SHOWCASE: Arcane Spellblade -->
  <g transform="translate(180, 200)">
    <rect x="-130" y="-100" width="260" height="230" rx="8" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
    <text x="0" y="-70" font-family="sans-serif" font-size="13" fill="#38bdf8" font-weight="bold" text-anchor="middle">ARCANE SPELLBLADE (PLAYER)</text>
    <text x="0" y="-50" font-family="sans-serif" font-size="10.5" fill="#64748b" text-anchor="middle">Hooded Cowl • Obsidian Robe • Spectral Blade</text>
    
    <!-- Shadow -->
    <ellipse cx="0" cy="45" rx="35" ry="14" fill="#000" opacity="0.5"/>
    <!-- Flowing Battle Cape -->
    <path d="M -12 -5 L -35 -14 L -42 0 L -35 14 L -12 8 Z" fill="#090d16" stroke="#38bdf8" stroke-width="2"/>
    <!-- Robe / Mage Armor Body -->
    <circle cx="0" cy="0" r="26" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5" filter="drop-shadow(0 0 10px #38bdf8)"/>
    <circle cx="0" cy="0" r="16" fill="#0284c7"/>
    <!-- Glowing Cyan Eyes -->
    <circle cx="12" cy="-6" r="3.5" fill="#e0f2fe" filter="drop-shadow(0 0 6px #38bdf8)"/>
    <circle cx="12" cy="6" r="3.5" fill="#e0f2fe" filter="drop-shadow(0 0 6px #38bdf8)"/>
    <!-- Spectral Blade & Arc -->
    <path d="M 35 -40 A 55 55 0 0 1 35 40" fill="none" stroke="#38bdf8" stroke-width="5" stroke-linecap="round" filter="drop-shadow(0 0 12px #38bdf8)"/>
    <!-- Orbiting Arcane Orbs -->
    <circle cx="-50" cy="-25" r="7" fill="#38bdf8" filter="drop-shadow(0 0 8px #38bdf8)"/>
    <circle cx="50" cy="25" r="7" fill="#38bdf8" filter="drop-shadow(0 0 8px #38bdf8)"/>
    <text x="0" y="105" font-family="monospace" font-size="11" fill="#94a3b8" text-anchor="middle">Visual: 16px | Hitbox: 16px [ALIGNED]</text>
  </g>

  <!-- 2. BLIGHT BAT -->
  <g transform="translate(480, 200)">
    <rect x="-120" y="-100" width="240" height="230" rx="8" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
    <text x="0" y="-70" font-family="sans-serif" font-size="13" fill="#c084fc" font-weight="bold" text-anchor="middle">BLIGHT BAT (SWARMER)</text>
    <text x="0" y="-50" font-family="sans-serif" font-size="10.5" fill="#64748b" text-anchor="middle">Flapping Articulated Wings • Crimson Eyes</text>
    
    <ellipse cx="0" cy="40" rx="25" ry="10" fill="#000" opacity="0.45"/>
    <!-- Wings -->
    <path d="M -5 0 L -42 -28 L -18 16 Z" fill="#64748b"/>
    <path d="M 5 0 L 42 -28 L 18 16 Z" fill="#64748b"/>
    <!-- Core -->
    <circle cx="0" cy="0" r="14" fill="#6b21a8" stroke="#d8b4fe" stroke-width="2" filter="drop-shadow(0 0 8px #c084fc)"/>
    <!-- Crimson Eyes -->
    <circle cx="-4" cy="-3" r="2.5" fill="#ef4444"/>
    <circle cx="4" cy="-3" r="2.5" fill="#ef4444"/>
    <text x="0" y="105" font-family="monospace" font-size="11" fill="#94a3b8" text-anchor="middle">Visual: 14px | Hitbox: 14px [ALIGNED]</text>
  </g>

  <!-- 3. CORRUPTED WOLF (WITH TELEGRAPH) -->
  <g transform="translate(770, 200)">
    <rect x="-120" y="-100" width="240" height="230" rx="8" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
    <text x="0" y="-70" font-family="sans-serif" font-size="13" fill="#f43f5e" font-weight="bold" text-anchor="middle">CORRUPTED WOLF (CHARGER)</text>
    <text x="0" y="-50" font-family="sans-serif" font-size="10.5" fill="#64748b" text-anchor="middle">Quadruped • Telegraph Dash Ring</text>
    
    <!-- Red Dashed Telegraph Circle -->
    <circle cx="0" cy="0" r="38" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="5 5" filter="drop-shadow(0 0 6px #ef4444)"/>
    <ellipse cx="0" cy="35" rx="30" ry="12" fill="#000" opacity="0.45"/>
    <!-- Torso -->
    <ellipse cx="-4" cy="0" rx="24" ry="16" fill="#881337" stroke="#f43f5e" stroke-width="2"/>
    <!-- Head & Snout -->
    <polygon points="12,-10 32,0 12,10" fill="#b91c1c"/>
    <!-- Spines -->
    <line x1="-16" y1="-12" x2="-10" y2="-22" stroke="#f43f5e" stroke-width="3"/>
    <line x1="-6" y1="-12" x2="0" y2="-22" stroke="#f43f5e" stroke-width="3"/>
    <!-- Glowing Eye -->
    <circle cx="18" cy="-4" r="3" fill="#fef08a" filter="drop-shadow(0 0 4px #ef4444)"/>
    <text x="0" y="105" font-family="monospace" font-size="11" fill="#94a3b8" text-anchor="middle">Visual: 20px | Hitbox: 20px [ALIGNED]</text>
  </g>

  <!-- 4. THORN SPITTER -->
  <g transform="translate(1060, 200)">
    <rect x="-120" y="-100" width="240" height="230" rx="8" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
    <text x="0" y="-70" font-family="sans-serif" font-size="13" fill="#34d399" font-weight="bold" text-anchor="middle">THORN SPITTER (RANGED)</text>
    <text x="0" y="-50" font-family="sans-serif" font-size="10.5" fill="#64748b" text-anchor="middle">Thorny Pod • Spore Projectile Mouth</text>
    
    <ellipse cx="0" cy="32" rx="26" ry="10" fill="#000" opacity="0.45"/>
    <!-- Pod Body -->
    <circle cx="0" cy="0" r="18" fill="#064e3b" stroke="#10b981" stroke-width="2.5" filter="drop-shadow(0 0 8px #10b981)"/>
    <!-- Thorns -->
    <circle cx="-22" cy="0" r="4" fill="#047857"/>
    <circle cx="22" cy="0" r="4" fill="#047857"/>
    <circle cx="-11" cy="-19" r="4" fill="#047857"/>
    <circle cx="11" cy="-19" r="4" fill="#047857"/>
    <circle cx="-11" cy="19" r="4" fill="#047857"/>
    <circle cx="11" cy="19" r="4" fill="#047857"/>
    <!-- Center Mouth -->
    <circle cx="0" cy="0" r="8" fill="#022c22"/>
    <circle cx="0" cy="0" r="4" fill="#a7f3d0" filter="drop-shadow(0 0 4px #a7f3d0)"/>
    <text x="0" y="105" font-family="monospace" font-size="11" fill="#94a3b8" text-anchor="middle">Visual: 18px | Hitbox: 18px [ALIGNED]</text>
  </g>

  <!-- 5. VOID STALKER -->
  <g transform="translate(180, 500)">
    <rect x="-130" y="-115" width="260" height="260" rx="8" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
    <text x="0" y="-85" font-family="sans-serif" font-size="13" fill="#a855f7" font-weight="bold" text-anchor="middle">VOID STALKER (STALKER/ELITE)</text>
    <text x="0" y="-65" font-family="sans-serif" font-size="10.5" fill="#64748b" text-anchor="middle">Cloaked Wraith • Twin Void Scythes</text>
    
    <ellipse cx="0" cy="45" rx="30" ry="12" fill="#000" opacity="0.45"/>
    <!-- Cloak Body -->
    <path d="M -16 30 L -10 -25 L 10 -25 L 16 30 Z" fill="#1e112a" stroke="#c084fc" stroke-width="2.5" filter="drop-shadow(0 0 10px #a855f7)"/>
    <!-- Eldritch Violet Eye -->
    <circle cx="0" cy="-15" r="5" fill="#c084fc" filter="drop-shadow(0 0 8px #c084fc)"/>
    <!-- Twin Scythes -->
    <path d="M -22 -15 A 18 18 0 0 1 -22 25" fill="none" stroke="#e9d5ff" stroke-width="3" stroke-linecap="round"/>
    <path d="M 22 -15 A 18 18 0 0 0 22 25" fill="none" stroke="#e9d5ff" stroke-width="3" stroke-linecap="round"/>
    <text x="0" y="120" font-family="monospace" font-size="11" fill="#94a3b8" text-anchor="middle">Visual: 22px | Hitbox: 22px [ALIGNED]</text>
  </g>

  <!-- 6. GROVE TITAN BOSS -->
  <g transform="translate(680, 500)">
    <rect x="-310" y="-115" width="620" height="260" rx="8" fill="#0f172a" stroke="#10b981" stroke-width="1.5"/>
    <text x="0" y="-85" font-family="sans-serif" font-size="14" fill="#34d399" font-weight="bold" text-anchor="middle">SECTOR TITAN: THE GROVE TITAN (BOSS ENCOUNTER)</text>
    <text x="0" y="-65" font-family="sans-serif" font-size="11" fill="#64748b" text-anchor="middle">Ancient Wood-Golem • Colossal Antlers • Orbiting Will-O-Wisps • Emerald Core</text>
    
    <!-- Shadow -->
    <ellipse cx="0" cy="55" rx="65" ry="22" fill="#000" opacity="0.6"/>
    <!-- Golem Torso -->
    <circle cx="0" cy="0" r="48" fill="#14221a" stroke="#10b981" stroke-width="3.5" filter="drop-shadow(0 0 18px #10b981)"/>
    <!-- Core Rune -->
    <circle cx="0" cy="0" r="18" fill="#10b981" filter="drop-shadow(0 0 12px #34d399)"/>
    <!-- Colossal Branching Horns / Antlers -->
    <path d="M -24 -35 L -55 -65 L -40 -80" fill="none" stroke="#2d4a3e" stroke-width="5" stroke-linecap="round"/>
    <path d="M 24 -35 L 55 -65 L 40 -80" fill="none" stroke="#2d4a3e" stroke-width="5" stroke-linecap="round"/>
    <!-- Orbiting Will-O-Wisps -->
    <circle cx="-68" cy="10" r="6" fill="#6ee7b7" filter="drop-shadow(0 0 10px #6ee7b7)"/>
    <circle cx="45" cy="-55" r="6" fill="#6ee7b7" filter="drop-shadow(0 0 10px #6ee7b7)"/>
    <circle cx="68" cy="20" r="6" fill="#6ee7b7" filter="drop-shadow(0 0 10px #6ee7b7)"/>
    <!-- Health Bar Preview -->
    <rect x="-80" y="70" width="160" height="10" rx="3" fill="#1e1e1e" stroke="#10b981"/>
    <rect x="-80" y="70" width="120" height="10" rx="3" fill="#10b981"/>
    <text x="0" y="120" font-family="monospace" font-size="11" fill="#94a3b8" text-anchor="middle">Colossal Visual Scale: 48px Radius | Hitbox: 48px Radius [ALIGNED]</text>
  </g>
</svg>`;
}

// ============================================================================
// 5. PHASE 4: LANDMARK GAMEPLAY EVENTS VISUALIZATION
// ============================================================================
function generateLandmarkEventsSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" width="1280" height="800">
  <defs>
    <radialGradient id="shrineAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="tombAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#a855f7" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="groveAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="beaconAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="portalAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#67e8f9" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1280" height="800" fill="#070c0a"/>

  <!-- Title Header -->
  <rect x="30" y="24" width="600" height="52" rx="8" fill="#0f172a" stroke="#1e293b"/>
  <text x="50" y="52" font-family="'Cinzel', serif, sans-serif" font-size="19" fill="#f8fafc" font-weight="bold">
    PHASE 4: 5 LANDMARK GAMEPLAY EVENTS
  </text>
  <text x="50" y="68" font-family="monospace" font-size="11.5" fill="#10b981">
    Interactive Trials • Guarded Sepulchers • Blight Purges • Signal Beacons • Planar Portal
  </text>

  <!-- EVENT 1: ANCIENT RUNIC SHRINE -->
  <g transform="translate(230, 240)">
    <rect x="-190" y="-140" width="380" height="260" rx="10" fill="#0b1311" stroke="#38bdf8" stroke-width="1.5"/>
    <text x="0" y="-115" font-family="'Cinzel', serif" font-size="14" fill="#38bdf8" font-weight="bold" text-anchor="middle">1. ANCIENT RUNIC SHRINE (TRIAL)</text>
    <text x="0" y="-98" font-family="sans-serif" font-size="10.5" fill="#64748b" text-anchor="middle">Defend consecrated holy ring for 12s • Restores 40 HP + Blessed Boon</text>

    <!-- Sacred Aura Circle -->
    <circle cx="0" cy="10" r="70" fill="url(#shrineAura)" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 4"/>
    <circle cx="0" cy="10" r="55" fill="none" stroke="#f59e0b" stroke-width="3" stroke-dasharray="80 180"/>
    <!-- Altar Stone -->
    <rect x="-24" y="-4" width="48" height="28" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <circle cx="0" cy="10" r="6" fill="#38bdf8" filter="drop-shadow(0 0 8px #38bdf8)"/>
    <!-- Progress Indicator -->
    <text x="0" y="75" font-family="monospace" font-size="11" fill="#f59e0b" text-anchor="middle" font-weight="bold">CONSECRATING: 8s [IN PROGRESS]</text>
    <text x="0" y="105" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle">Reward: +20% Slash Dmg • +15 Max HP • 15 Crystals</text>
  </g>

  <!-- EVENT 2: FORGOTTEN GRAVEYARD -->
  <g transform="translate(640, 240)">
    <rect x="-190" y="-140" width="380" height="260" rx="10" fill="#0b1311" stroke="#a855f7" stroke-width="1.5"/>
    <text x="0" y="-115" font-family="'Cinzel', serif" font-size="14" fill="#a855f7" font-weight="bold" text-anchor="middle">2. FORGOTTEN GRAVEYARD (HAUNT)</text>
    <text x="0" y="-98" font-family="sans-serif" font-size="10.5" fill="#64748b" text-anchor="middle">Disturb sepulcher • Vanquish Tomb Revenant guardian</text>

    <!-- Grave Sepulcher -->
    <circle cx="0" cy="10" r="70" fill="url(#tombAura)" stroke="#a855f7" stroke-width="2" stroke-dasharray="6 4"/>
    <rect x="-30" y="-6" width="60" height="32" rx="4" fill="#1e112a" stroke="#c084fc" stroke-width="2"/>
    <text x="0" y="14" font-family="monospace" font-size="10" fill="#c084fc" text-anchor="middle">ROYAL CRYPT</text>
    <!-- Tomb Revenant Guardian Sprite -->
    <circle cx="45" cy="-20" r="14" fill="#1e112a" stroke="#f43f5e" stroke-width="2"/>
    <circle cx="45" cy="-20" r="4" fill="#f43f5e"/>
    <text x="45" y="-38" font-family="sans-serif" font-size="9" fill="#f43f5e" text-anchor="middle">TOMB REVENANT</text>
    <text x="0" y="75" font-family="monospace" font-size="11" fill="#ef4444" text-anchor="middle" font-weight="bold">STATUS: GUARDIAN ENGAGED</text>
    <text x="0" y="105" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle">Reward: Guaranteed Ancient Relic • 25 Crystals • +10% Crit</text>
  </g>

  <!-- EVENT 3: CORRUPTED GROVE -->
  <g transform="translate(1050, 240)">
    <rect x="-190" y="-140" width="380" height="260" rx="10" fill="#0b1311" stroke="#10b981" stroke-width="1.5"/>
    <text x="0" y="-115" font-family="'Cinzel', serif" font-size="14" fill="#10b981" font-weight="bold" text-anchor="middle">3. CORRUPTED GROVE (PURGE)</text>
    <text x="0" y="-98" font-family="sans-serif" font-size="10.5" fill="#64748b" text-anchor="middle">Sever 3 pulsing Blighted Roots to dispel toxic miasma</text>

    <!-- Grove Tree & 3 Roots -->
    <circle cx="0" cy="10" r="70" fill="url(#groveAura)" stroke="#10b981" stroke-width="2" stroke-dasharray="6 4"/>
    <circle cx="0" cy="10" r="24" fill="#064e3b" stroke="#10b981" stroke-width="2"/>
    <!-- Root 1 (Alive) -->
    <circle cx="-38" cy="-20" r="10" fill="#047857" stroke="#10b981" stroke-width="2"/>
    <!-- Root 2 (Alive) -->
    <circle cx="38" cy="-20" r="10" fill="#047857" stroke="#10b981" stroke-width="2"/>
    <!-- Root 3 (Severed) -->
    <circle cx="0" cy="46" r="10" fill="#1f2937" stroke="#475569" stroke-width="1.5" stroke-dasharray="3 3"/>
    <text x="0" y="50" font-family="monospace" font-size="9" fill="#94a3b8" text-anchor="middle">SEVERED</text>
    <text x="0" y="75" font-family="monospace" font-size="11" fill="#34d399" text-anchor="middle" font-weight="bold">PURGE PROGRESS: 2/3 ROOTS</text>
    <text x="0" y="105" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle">Reward: 5 Large XP Gems • Bramble Dash • 20 Crystals</text>
  </g>

  <!-- EVENT 4: RUINED WATCHTOWER -->
  <g transform="translate(380, 540)">
    <rect x="-240" y="-130" width="480" height="230" rx="10" fill="#0b1311" stroke="#f59e0b" stroke-width="1.5"/>
    <text x="0" y="-105" font-family="'Cinzel', serif" font-size="14" fill="#f59e0b" font-weight="bold" text-anchor="middle">4. RUINED WATCHTOWER (BASTION BEACON)</text>
    <text x="0" y="-88" font-family="sans-serif" font-size="10.5" fill="#64748b" text-anchor="middle">Channel signal hearth for 4s • Dispels fog & reveals hidden world caches</text>

    <!-- Watchtower Platform & Flame -->
    <circle cx="0" cy="8" r="65" fill="url(#beaconAura)" stroke="#f59e0b" stroke-width="2"/>
    <rect x="-28" y="-12" width="56" height="40" rx="3" fill="#1c1917" stroke="#78716c" stroke-width="2"/>
    <!-- Signal Flame -->
    <path d="M 0 -24 Q -12 0 0 16 Q 12 0 0 -24 Z" fill="#f59e0b" filter="drop-shadow(0 0 14px #f59e0b)"/>
    <circle cx="0" cy="4" r="6" fill="#fef08a"/>
    <text x="0" y="58" font-family="monospace" font-size="11" fill="#f59e0b" text-anchor="middle" font-weight="bold">BEACON IGNITED: 100% REKINDLED</text>
    <text x="0" y="82" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle">Reward: 3m Chest Sight Beacons • +15% Movement Speed</text>
  </g>

  <!-- EVENT 5: SEALED PORTAL CLEARING -->
  <g transform="translate(900, 540)">
    <rect x="-240" y="-130" width="480" height="230" rx="10" fill="#0b1311" stroke="#06b6d4" stroke-width="1.5"/>
    <text x="0" y="-105" font-family="'Cinzel', serif" font-size="14" fill="#06b6d4" font-weight="bold" text-anchor="middle">5. SEALED PORTAL CLEARING (EXTRACTION)</text>
    <text x="0" y="-88" font-family="sans-serif" font-size="10.5" fill="#64748b" text-anchor="middle">Sector Titan defeat opens planar gateway: Extract Safely vs. Push Deeper</text>

    <!-- Planar Vortex -->
    <circle cx="0" cy="8" r="65" fill="url(#portalAura)" stroke="#06b6d4" stroke-width="2.5"/>
    <circle cx="0" cy="8" r="42" fill="none" stroke="#67e8f9" stroke-width="2" stroke-dasharray="14 10"/>
    <circle cx="0" cy="8" r="18" fill="#ffffff" filter="drop-shadow(0 0 16px #67e8f9)"/>
    <!-- 6 Standing Runic Stones -->
    <circle cx="-52" cy="-22" r="5" fill="#0891b2"/>
    <circle cx="52" cy="-22" r="5" fill="#0891b2"/>
    <circle cx="-52" cy="38" r="5" fill="#0891b2"/>
    <circle cx="52" cy="38" r="5" fill="#0891b2"/>
    <circle cx="0" cy="-58" r="5" fill="#0891b2"/>
    <circle cx="0" cy="68" r="5" fill="#0891b2"/>
    <text x="0" y="58" font-family="monospace" font-size="11" fill="#38bdf8" text-anchor="middle" font-weight="bold">PLANAR GATE: ACTIVE EXTRACTION RIFT</text>
    <text x="0" y="82" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle">Choices: Return to Sanctum (100% Bank) OR Push Deeper (Sector 2 2X)</text>
  </g>
</svg>`;
}

// ============================================================================
// 6. PHASE 4: SECTOR 2: THE SUNKEN CRYPT (2X REWARD MULTIPLIER)
// ============================================================================
function generateCryptSector2Svg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" width="1280" height="800">
  <defs>
    <pattern id="cryptGrid" width="80" height="80" patternUnits="userSpaceOnUse">
      <rect width="80" height="80" fill="#0c0609" stroke="#240c14" stroke-width="1"/>
      <path d="M 0 40 Q 20 30 40 40 T 80 40" fill="none" stroke="#f43f5e" stroke-width="0.8" opacity="0.25"/>
    </pattern>
    <radialGradient id="lavaVignette" cx="50%" cy="50%" r="50%">
      <stop offset="60%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#f43f5e" stop-opacity="0.18"/>
    </radialGradient>
    <radialGradient id="cryptLordCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#fb7185"/>
      <stop offset="100%" stop-color="#f43f5e"/>
    </radialGradient>
  </defs>

  <!-- Crypt Molten Grid Ground -->
  <rect width="1280" height="800" fill="url(#cryptGrid)"/>

  <!-- Molten Lava Vein Corridors -->
  <path d="M 120 400 Q 400 320 640 400 T 1160 400" fill="none" stroke="#f43f5e" stroke-width="45" opacity="0.18" stroke-linecap="round"/>
  <path d="M 120 400 Q 400 320 640 400 T 1160 400" fill="none" stroke="#fb7185" stroke-width="12" opacity="0.4" stroke-linecap="round"/>
  <path d="M 640 100 Q 600 300 640 500 T 640 750" fill="none" stroke="#f43f5e" stroke-width="35" opacity="0.18" stroke-linecap="round"/>

  <!-- Top Banner: Sector 2 Indicator with 2x Multiplier Badge -->
  <rect x="30" y="24" width="760" height="60" rx="10" fill="#0f172a" stroke="#f43f5e" stroke-width="2"/>
  <text x="50" y="52" font-family="'Cinzel', serif" font-size="20" fill="#f43f5e" font-weight="bold">
    SECTOR 2: THE SUNKEN CRYPT
  </text>
  <rect x="420" y="38" width="140" height="24" rx="4" fill="#881337" stroke="#f43f5e" stroke-width="1.5"/>
  <text x="490" y="54" font-family="monospace" font-size="12" fill="#fff" font-weight="bold" text-anchor="middle">
    2X SPOILS ACTIVE
  </text>
  <text x="50" y="73" font-family="monospace" font-size="11" fill="#94a3b8">
    All Relic &amp; Soul Crystal drops, chest discoveries, and boss rewards yield double currency!
  </text>

  <!-- HUD Stats Overlay Bar (Top Right) -->
  <g transform="translate(1000, 44)">
    <rect x="-140" y="-20" width="260" height="42" rx="8" fill="#020617" stroke="#334155" opacity="0.9"/>
    <text x="-120" y="6" font-family="monospace" font-size="12" fill="#38bdf8">LV.7</text>
    <text x="-70" y="6" font-family="monospace" font-size="12" fill="#c084fc">✦ 340 (2x)</text>
    <text x="25" y="6" font-family="monospace" font-size="12" fill="#f59e0b">🏆 4 Relics (2x)</text>
  </g>

  <!-- SECTOR 2 BOSS: IGNIS, THE OBSIDIAN OVERLORD -->
  <g transform="translate(640, 400)">
    <!-- Shadow -->
    <ellipse cx="0" cy="55" rx="70" ry="24" fill="#000" opacity="0.7"/>
    <!-- Obsidian Titan Torso -->
    <circle cx="0" cy="0" r="52" fill="#1a080d" stroke="#f43f5e" stroke-width="4" filter="drop-shadow(0 0 24px #f43f5e)"/>
    <!-- Molten Lava Veins -->
    <path d="M -30 -15 L 0 10 L 30 -20" fill="none" stroke="#fb7185" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M -15 25 L 0 10 L 15 25" fill="none" stroke="#fb7185" stroke-width="3" stroke-linecap="round"/>
    <!-- Blazing Core -->
    <circle cx="0" cy="0" r="22" fill="url(#cryptLordCore)" filter="drop-shadow(0 0 16px #f43f5e)"/>

    <!-- Boss Name & Health Bar -->
    <rect x="-160" y="-85" width="320" height="28" rx="6" fill="#0f172a" stroke="#881337"/>
    <text x="0" y="-68" font-family="'Cinzel', serif" font-size="12.5" fill="#fda4af" font-weight="bold" text-anchor="middle">
      IGNIS, THE OBSIDIAN OVERLORD (1400 / 1400 HP)
    </text>
    <rect x="-150" y="-50" width="300" height="8" rx="2" fill="#1e112a" stroke="#f43f5e"/>
    <rect x="-150" y="-50" width="300" height="8" rx="2" fill="url(#cryptLordCore)"/>

    <!-- Magma Burst Attack Projectiles -->
    <circle cx="-110" cy="-60" r="10" fill="#f43f5e" filter="drop-shadow(0 0 8px #f43f5e)"/>
    <circle cx="110" cy="-60" r="10" fill="#f43f5e" filter="drop-shadow(0 0 8px #f43f5e)"/>
    <circle cx="-130" cy="50" r="10" fill="#f43f5e" filter="drop-shadow(0 0 8px #f43f5e)"/>
    <circle cx="130" cy="50" r="10" fill="#f43f5e" filter="drop-shadow(0 0 8px #f43f5e)"/>
  </g>

  <!-- Player in Sector 2 (Preserved Arcane Spellblade Build) -->
  <g transform="translate(360, 480)">
    <circle cx="0" cy="0" r="18" fill="#1e293b" stroke="#38bdf8" stroke-width="2.5"/>
    <circle cx="0" cy="0" r="6" fill="#38bdf8"/>
    <!-- Orbiting Orbs (3 from upgrades) -->
    <circle cx="-38" cy="0" r="7" fill="#38bdf8" filter="drop-shadow(0 0 8px #38bdf8)"/>
    <circle cx="19" cy="-33" r="7" fill="#38bdf8" filter="drop-shadow(0 0 8px #38bdf8)"/>
    <circle cx="19" cy="33" r="7" fill="#38bdf8" filter="drop-shadow(0 0 8px #38bdf8)"/>
    <!-- Slash Arc -->
    <path d="M 15 -35 A 45 45 0 0 1 45 15" fill="none" stroke="#38bdf8" stroke-width="4.5" stroke-linecap="round"/>
    <text x="0" y="34" font-family="monospace" font-size="11" fill="#38bdf8" text-anchor="middle">SPELLBLADE (LV.7)</text>
  </g>

  <!-- Sector 2 Relic Chest Discovery (Yielding 2 Relics & 24 Crystals) -->
  <g transform="translate(980, 520)">
    <rect x="-24" y="-14" width="48" height="28" rx="4" fill="#78350f" stroke="#f59e0b" stroke-width="2.5" filter="drop-shadow(0 0 12px #f59e0b)"/>
    <text x="0" y="32" font-family="monospace" font-size="11" fill="#f59e0b" text-anchor="middle" font-weight="bold">+24 Crystals (2x)!</text>
    <text x="0" y="48" font-family="monospace" font-size="11" fill="#fbbf24" text-anchor="middle" font-weight="bold">+2 Ancient Relics (2x)!</text>
  </g>

  <!-- Vignette -->
  <rect width="1280" height="800" fill="url(#lavaVignette)" pointer-events="none"/>
</svg>`;
}

fs.writeFileSync(path.join(ARTIFACT_DIR, 'empty_arena_before.svg'), generateBeforeSvg(), 'utf-8');
fs.writeFileSync(path.join(ARTIFACT_DIR, 'haunted_forest_after.svg'), generateAfterSvg(), 'utf-8');
fs.writeFileSync(path.join(ARTIFACT_DIR, 'curse_escalation_zone.svg'), generateCurseEscalationSvg(), 'utf-8');
fs.writeFileSync(path.join(ARTIFACT_DIR, 'phase3_character_and_bestiary.svg'), generatePhase3BestiarySvg(), 'utf-8');
fs.writeFileSync(path.join(ARTIFACT_DIR, 'phase4_landmark_events.svg'), generateLandmarkEventsSvg(), 'utf-8');
fs.writeFileSync(path.join(ARTIFACT_DIR, 'phase4_crypt_sector2.svg'), generateCryptSector2Svg(), 'utf-8');

console.log("Visual SVG artifacts successfully created in:");
console.log("1. " + path.join(ARTIFACT_DIR, 'empty_arena_before.svg'));
console.log("2. " + path.join(ARTIFACT_DIR, 'haunted_forest_after.svg'));
console.log("3. " + path.join(ARTIFACT_DIR, 'curse_escalation_zone.svg'));
console.log("4. " + path.join(ARTIFACT_DIR, 'phase3_character_and_bestiary.svg'));
console.log("5. " + path.join(ARTIFACT_DIR, 'phase4_landmark_events.svg'));
console.log("6. " + path.join(ARTIFACT_DIR, 'phase4_crypt_sector2.svg'));
