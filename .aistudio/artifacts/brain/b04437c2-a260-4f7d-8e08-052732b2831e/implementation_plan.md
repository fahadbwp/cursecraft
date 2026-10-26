# CURSECRAFT: Living Curse Roguelite

CURSECRAFT is a high-octane 2D dark fantasy action roguelite combining exploration, horde survival, and the dynamic "Living Curse System." Players explore procedural cursed biomes, battle escalating monster waves, loot ancient chests, adapt to responsive world mutations, conquer colossal sector bosses, and decide whether to extract safely with banked relics or push deeper into nightmare sectors.

## User Review & Critical Decisions

> [!IMPORTANT]
> The foundational design decisions confirmed during Phase 1 have been integrated into this architecture:

- **Art Style & Atmosphere**: Dark Fantasy Pixel Art with glowing spell FX, dark slate-violet vignette palettes, atmospheric lighting, and particle bloom.
- **Starting Character Archetype**: The **Arcane Spellblade** — a hybrid warrior wielding melee spectral blade slashes, orbiting homing arcane orbs, a phase dash, and a radial Arcane Nova.
- **Run Pacing & Escalation**: Fast **5 to 7 minute** runs with aggressive curse escalation, transitioning rapidly from Awakening (peaceful exploration) to Corruption (environmental hazards & elite stalkers) to Nightmare (Sector Boss & Living Curse mutations).
- **Core Dilemma (Escape vs. Push)**: When the sector boss is defeated, an Extraction Portal manifests. Players can bank 100% of collected Soul Crystals and Ancient Relics in the Sanctum, or plunge into the next biome for double rewards with heightened curse penalties.

---

## 1. Overview & Core Concept

- **What It Does**: A top-down 2D action survival game rendered on a dedicated high-performance HTML5 `<canvas>` simulation running at 60 FPS. Features smooth directional movement, dual-stick/mouse combat, responsive dash physics, dynamic camera tracking with screen shake, procedural hazard generation, a 3-tier Living Curse escalation engine, run-time upgrade draft cards, and persistent meta-progression saved locally via IndexedDB/localStorage.
- **Target Audience**: Fans of *Vampire Survivors*, *Hades*, *Enter the Gungeon*, and dark fantasy roguelites looking for quick, intense 5–7 minute sessions playable immediately in any desktop or mobile browser.
- **Key Value**: Unlike passive survival auto-battlers, CURSECRAFT rewards active tactical combat, spatial exploration across biome landmarks (runic shrines, treasure vaults, hazard vents), deterministic curse adaptation, and high-stakes extraction decisions.

---

## 2. User Experience & Visual Design

### Key User Flows

```
[Title Screen / Live World Pan]
       │
       ▼ (Enter / Space / Tap to Start)
[Character & Loadout Sanctum] ─── (Permanent Upgrades & Relic Altar)
       │
       ▼ (Start Run)
[Sector 1: The Haunted Forest]
  ├── Minute 0-2: Curse Level 1 (Awakening) — Scout chests, battle Corrupted Wolves & Blight Bats
  ├── Minute 2-4: Level Up Drafts (Arcane Nova, Frost Shards, Flaming Dash, Soul Leech)
  ├── Minute 4-5: Curse Level 2 (Corruption) — Cursed storm, thorn hazards, Void Stalkers
  ├── Minute 5-7: Curse Level 3 (Nightmare) — Malakor the Cursed Grove Titan awakens!
  └── Boss Defeated: [Extraction Portal Appears]
       ├── OPTION A: Extract to Sanctum (100% Banked Progression & Victory Score)
       └── OPTION B: Plunge into Sector 2: The Sunken Crypt (Double Relics & Heightened Curse)
       │
       ▼ (Death or Extraction)
[Run Summary & Altar Progression]
```

### Visual Identity & Theme
- **Aesthetic Direction**: Grimdark Retro Pixel Fantasy with crisp modern post-processing: deep slate night skies (`#0B0F19`), bioluminescent cyan spell trails (`#38BDF8`), cursed eldritch violet mists (`#A855F7`), and radiant amber loot glints (`#F59E0B`).
- **Typography & Hierarchy**:
  - *Display / Titles*: `Cinzel` / `MedievalSharp` styled high-contrast serif display for game branding, sector announcements, and boss titles.
  - *Body Prose & Cards*: `Plus Jakarta Sans` for upgrade draft cards and stats.
  - *HUD & Telemetry*: `font-mono tabular-nums` for health readouts, curse timer, enemy count, and DPS meters.
- **Viewport & Low-Occlusion HUD**:
  - 85%+ unobstructed canvas viewport.
  - Top-left: Player Health Bar, XP Gem bar with level counter, and banked Crystals.
  - Top-center: The **Living Curse Dial** displaying current Curse Level (Awakening -> Corruption -> Nightmare) with a pulsing circular doom timer and active world affixes.
  - Bottom-right / Corners: Minimap radar with extraction portal, chests, and boss markers.
  - Mobile: Non-intrusive translucent floating virtual joystick (left thumb) + action buttons (Dash, Slash, Nova) with tactile touch response.

---

## 3. Key Product Decisions & Trade-Offs

- **Dedicated 60 FPS Canvas Game Engine (No React Virtual DOM Overhead)**:
  - *Decision*: Decouple the game simulation loop (`requestAnimationFrame`) inside a native `<canvas>` container with isolated state, physics, entity pooling, and particle systems.
  - *Why*: React state updates on every frame cause garbage collection stutter and frame drops. By keeping the core simulation inside a typed engine loop with sub-millisecond deltas and only syncing major events (level-up modal, pause, game-over) to UI overlays, gameplay stays locked at 60 FPS even with 150+ enemies and particle bursts.
- **Living Curse System (Dynamic Environmental & Monster Mutation)**:
  - *Decision*: Deterministic adaptive curse logic rather than static timer waves.
  - *Mechanic*: If the player relies heavily on ranged magic orbs, monsters gain Arcane Ward shields; if the player kites continuously, Void Stalkers gain blink-dash charges. The game gives clear visual telegraphs (runic ground circles, warning sound chimes) so players can adapt their tactical approach.
- **Synthesized Web Audio API (Zero External Asset Dependency)**:
  - *Decision*: Procedurally generate all sound effects (slashes, magic orbs, explosion hits, level-up fanfares, boss groans, ambient cursed wind drones) using Web Audio oscillators, white noise buffers, and biquad filters.
  - *Why*: Eliminates broken audio links, large MP3 network payloads, and latency, guaranteeing instantaneous punchy sound feedback on both desktop and mobile.
- **Robust Local Persistence via IndexedDB / LocalStorage**:
  - *Decision*: Save player level, unlocked relics, permanent sanctum attributes, high scores, and sector completion in local storage with automatic fallback.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CURSECRAFT ENGINE                             │
├────────────────────────────────────────────────────────────────────────┤
│  Input Handler (Keyboard WASD, Mouse Aim, Touch Joystick & Virtual Pad)│
│                                    │                                   │
│  Game Loop (60 FPS Fixed-Step, dt Clamping, Coyote Time, Pause States) │
│                                    │                                   │
│  ┌─────────────────────────┬─────────────────────────┬───────────────┐ │
│  │     Player Controller   │     Enemy AI Pool       │  Curse Engine │ │
│  │  - Health, Mana, Dash   │  - Wolves, Bats, Stalker│  - Escalation │ │
│  │  - Arcane Blade Melee   │  - Grove Titan Boss     │  - Mutations  │ │
│  │  - Orbiting Spell Orbs  │  - Threat Scaling       │  - Hazards    │ │
│  └─────────────────────────┴─────────────────────────┴───────────────┘ │
│                                    │                                   │
│  ┌─────────────────────────┬─────────────────────────┬───────────────┐ │
│  │    World & Biomes       │   Particle & FX System  │  Loot & XP    │ │
│  │  - Sector 1: Forest     │  - Blade Trails, Shakes │  - Gems, Orbs │ │
│  │  - Sector 2: Crypt      │  - Blood/Eldritch Sparks│  - Chests     │ │
│  │  - Runic Extraction Ptl │  - Telegraph Decals     │  - Relics     │ │
│  └─────────────────────────┴─────────────────────────┴───────────────┘ │
│                                    │                                   │
│  Render Pipeline: Background Tiles ➔ Ground Hazards ➔ Decals           │
│                   ➔ Entities ➔ Spell FX ➔ Floating Damage ➔ Vignette   │
├────────────────────────────────────────────────────────────────────────┤
│  Web Audio Procedural Sound Engine (Biquad Filter, Oscillator Synth)   │
│  Meta-Progression & Sanctum Storage (IndexedDB / LocalStorage)         │
│  React UI Layer: Title Screen, Draft Level-Up Modal, Altar, Game Over │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Entities & Mechanics
1. **Player (Arcane Spellblade)**:
   - Stats: HP, Max HP, Move Speed, Slash Damage, Attack Speed, Dash Cooldown, Armor, Crit Chance.
   - Primary: Melee Spectral Blade Slash (wide arc, knockback, hits multiple targets).
   - Secondary: Orbiting Arcane Orbs (automatically seek and penetrate enemies).
   - Dash: Arcane Phase Blink (invulnerability frames, phase through enemies).
   - Special: Arcane Nova (clears swarm in a 360-degree shockwave).
2. **Enemy Archetypes**:
   - *Blight Bats*: Fast, low HP swarmers.
   - *Corrupted Wolves*: Medium HP, lunging charge attacks.
   - *Thorn Spitter*: Ranged projectile shooters telegraphing incoming needle volleys.
   - *Void Stalker (Elite)*: High HP, shadow-blinks behind player with crushing cleave.
   - *Malakor the Cursed Grove Titan (Boss)*: Multi-phase boss with Ground Slam shockwaves, summoning roots, and sweeping laser barrage.
3. **Draft Upgrade Pool (Run Powers)**:
   - 12+ synergistic abilities (e.g., *Lightning Conduit*, *Glacial Spike*, *Brimstone Path*, *Life Siphon*, *Orbital Resonance*, *Blade Mastery*, *Soul Magnet*).
4. **Sanctum Meta-Progression**:
   - Permanent unlocks purchased with extracted Soul Crystals: Vitality Infusion (+Max HP), Swiftstride (+Movement Speed), Ruinous Blade (+Damage), Arcane Ward (+Damage Reduction), Fortune's Favor (+Chest Quality).
