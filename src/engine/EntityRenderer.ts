/**
 * Entity Renderer for CURSECRAFT
 * Handles stylized pixel/sprite rendering of Arcane Spellblade, distinct enemy silhouettes,
 * boss presentation, and telegraph animations
 */

import { PlayerStats, Enemy, Projectile, FloatingText, LootDrop, Chest, ExtractionPortal, HazardZone } from '../types/game';

export class EntityRenderer {
  // --------------------------------------------------------------------------
  // PLAYER: ARCANE SPELLBLADE
  // --------------------------------------------------------------------------
  public static renderPlayer(
    ctx: CanvasRenderingContext2D,
    player: PlayerStats,
    x: number,
    y: number,
    angle: number,
    vx: number,
    vy: number,
    isDashing: boolean,
    slashAnimTimer: number,
    invincibleTimer: number,
    time: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Invulnerability flicker
    if (invincibleTimer > 0 && Math.floor(time * 20) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Walking animation bob
    const isMoving = Math.hypot(vx, vy) > 10;
    const walkBob = isMoving ? Math.sin(time * 12) * 2.5 : Math.sin(time * 2) * 1;

    // 1. Soft Dynamic Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 10, isDashing ? 26 : 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Dash Ghosts (Afterimages)
    if (isDashing) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.arc(-vx * 0.04, -vy * 0.04 + walkBob, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rotate towards aim/movement direction
    ctx.rotate(angle);

    // 3. Flowing Battle Cape (Trails opposite to movement)
    const capeTilt = isMoving ? Math.sin(time * 10) * 0.15 : 0;
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(-10, -6);
    ctx.lineTo(-24 + capeTilt * 6, -12);
    ctx.lineTo(-28 + capeTilt * 8, 0);
    ctx.lineTo(-24 + capeTilt * 6, 12);
    ctx.lineTo(-10, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 4. Obsidian Robe & Mage Armor
    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, walkBob, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Runic Chestplate Inscription
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, walkBob, 10, -Math.PI * 0.3, Math.PI * 0.3);
    ctx.stroke();

    // 5. Hooded Cowl
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(2, walkBob, 11, 0, Math.PI * 2);
    ctx.fill();

    // 6. Glowing Cyan Eyes
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(9, walkBob - 3.5, 2.2, 0, Math.PI * 2);
    ctx.arc(9, walkBob + 3.5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // 7. Floating Spectral Blade (Hovers by shoulder and slashes)
    this.renderSpectralBlade(ctx, player, slashAnimTimer, walkBob);

    ctx.restore();
  }

  private static renderSpectralBlade(
    ctx: CanvasRenderingContext2D,
    player: PlayerStats,
    slashTimer: number,
    walkBob: number
  ) {
    if (slashTimer > 0) {
      // Slashing Active Arc
      const progress = 1 - slashTimer / 0.16;
      const startAngle = -Math.PI * 0.45 + progress * 0.3;
      const endAngle = Math.PI * 0.45 + progress * 0.3;

      // Radiant energy slash trail
      ctx.save();
      const grad = ctx.createRadialGradient(0, 0, 20, 0, 0, player.slashArcRadius);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.45)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.9)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, player.slashArcRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();

      // Sharp blade edge stroke
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, player.slashArcRadius, startAngle, endAngle);
      ctx.stroke();

      ctx.restore();
    } else {
      // Idle Floating Blade
      ctx.save();
      ctx.translate(14, 14 + walkBob);
      ctx.rotate(Math.PI * 0.3);

      // Blade Grip & Guard
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-2, -2, 4, 6);
      ctx.fillRect(-6, 4, 12, 3);

      // Glowing Spectral Blade
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-3, 7);
      ctx.lineTo(0, 28);
      ctx.lineTo(3, 7);
      ctx.closePath();
      ctx.fill();

      // Blade fuller highlight
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-0.75, 9, 1.5, 14);

      ctx.restore();
    }
  }

  // --------------------------------------------------------------------------
  // ENEMIES: DISTINCT SILHOUETTES & TELEGRAPHS
  // --------------------------------------------------------------------------
  public static renderEnemy(ctx: CanvasRenderingContext2D, e: Enemy, time: number) {
    ctx.save();
    ctx.translate(e.x, e.y);

    // Hit flash override
    const isFlashing = e.hitFlashTimer > 0;
    const bodyColor = isFlashing ? '#ffffff' : e.color;

    ctx.shadowColor = e.glowColor;
    ctx.shadowBlur = e.isBoss ? 24 : 10;

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, e.radius * 0.7, e.radius * 1.1, e.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    switch (e.type) {
      case 'BAT':
        this.drawBlightBat(ctx, e, bodyColor, isFlashing, time);
        break;
      case 'WOLF':
        this.drawCorruptedWolf(ctx, e, bodyColor, isFlashing, time);
        break;
      case 'SPITTER':
        this.drawThornSpitter(ctx, e, bodyColor, isFlashing, time);
        break;
      case 'STALKER':
        this.drawVoidStalker(ctx, e, bodyColor, isFlashing, time);
        break;
      case 'GROVE_TITAN':
        this.drawGroveTitanBoss(ctx, e, bodyColor, isFlashing, time);
        break;
      case 'CRYPT_LORD':
        this.drawCryptLordBoss(ctx, e, bodyColor, isFlashing, time);
        break;
    }

    // Arcane Ward Shield Bubble
    if (e.arcaneShield > 0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Status Health Bar for wounded/elite monsters
    if (e.hp < e.maxHp && !e.isBoss) {
      const barW = Math.max(30, e.radius * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(-barW / 2, -e.radius - 12, barW, 4.5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-barW / 2, -e.radius - 12, barW * (e.hp / e.maxHp), 4.5);
    }

    ctx.restore();
  }

  private static drawBlightBat(
    ctx: CanvasRenderingContext2D,
    e: Enemy,
    color: string,
    isFlashing: boolean,
    time: number
  ) {
    const flap = Math.sin(time * 22 + e.id) * 0.45;

    // Articulated Wings
    ctx.fillStyle = isFlashing ? '#ffffff' : '#475569';
    ctx.beginPath();
    // Left Wing
    ctx.moveTo(-3, 0);
    ctx.lineTo(-e.radius * 1.8, -e.radius * flap * 2.2);
    ctx.lineTo(-e.radius * 0.8, e.radius * 0.8);
    // Right Wing
    ctx.moveTo(3, 0);
    ctx.lineTo(e.radius * 1.8, -e.radius * flap * 2.2);
    ctx.lineTo(e.radius * 0.8, e.radius * 0.8);
    ctx.fill();

    // Body Core
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Crimson Eyes
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-2.5, -2, 1.8, 0, Math.PI * 2);
    ctx.arc(2.5, -2, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  private static drawCorruptedWolf(
    ctx: CanvasRenderingContext2D,
    e: Enemy,
    color: string,
    isFlashing: boolean,
    time: number
  ) {
    const isTelegraph = e.state === 'TELEGRAPH';
    const angle = e.state === 'ATTACK' || isTelegraph ? e.targetAngle : Math.atan2(e.vy, e.vx);

    ctx.rotate(angle);

    // Visible red telegraph warning circle on wolf when crouching
    if (isTelegraph) {
      ctx.strokeStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, e.radius * 1.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Quadruped Torso & Mane
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, e.radius * 1.2, e.radius * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wolf Head & Snout
    ctx.fillStyle = isFlashing ? '#ffffff' : '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(e.radius * 0.6, -e.radius * 0.5);
    ctx.lineTo(e.radius * 1.5, 0);
    ctx.lineTo(e.radius * 0.6, e.radius * 0.5);
    ctx.closePath();
    ctx.fill();

    // Spiky Back Bristles
    ctx.strokeStyle = isFlashing ? '#ffffff' : '#7f1d1d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-e.radius * 0.8, -e.radius * 0.6);
    ctx.lineTo(-e.radius * 0.5, -e.radius * 1.1);
    ctx.moveTo(-e.radius * 0.3, -e.radius * 0.6);
    ctx.lineTo(0, -e.radius * 1.1);
    ctx.stroke();

    // Glowing Eyes
    ctx.fillStyle = isTelegraph ? '#ffffff' : '#fef08a';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(e.radius * 0.9, -e.radius * 0.25, 2.2, 0, Math.PI * 2);
    ctx.arc(e.radius * 0.9, e.radius * 0.25, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  private static drawThornSpitter(
    ctx: CanvasRenderingContext2D,
    e: Enemy,
    color: string,
    isFlashing: boolean,
    time: number
  ) {
    const pulse = Math.sin(time * 6 + e.id) * 2;

    // Bulbous Thorny Pod
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + pulse, 0, Math.PI * 2);
    ctx.fill();

    // Sharp Bramble Thorns Around Perimeter
    ctx.fillStyle = isFlashing ? '#ffffff' : '#047857';
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const tx = Math.cos(ang) * (e.radius + 6);
      const ty = Math.sin(ang) * (e.radius + 6);
      ctx.beginPath();
      ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central Spitting Mouth
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Glowing toxic spore core
    ctx.fillStyle = '#a7f3d0';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  private static drawVoidStalker(
    ctx: CanvasRenderingContext2D,
    e: Enemy,
    color: string,
    isFlashing: boolean,
    time: number
  ) {
    const hoverBob = Math.sin(time * 8) * 3;

    // Trailing Void Mist Particles
    ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
    ctx.beginPath();
    ctx.arc(0, hoverBob + 12, 10, 0, Math.PI * 2);
    ctx.fill();

    // Tall Cloaked Shadow Body
    ctx.fillStyle = isFlashing ? '#ffffff' : '#1e112a';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(-14, hoverBob + 18);
    ctx.lineTo(-8, hoverBob - 22);
    ctx.lineTo(8, hoverBob - 22);
    ctx.lineTo(14, hoverBob + 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hood with Pulsing Eldritch Violet Eye
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, hoverBob - 14, 4, 0, Math.PI * 2);
    ctx.fill();

    // Floating Twin Void Scythes
    ctx.strokeStyle = '#e9d5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-16, hoverBob, 12, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.arc(16, hoverBob, 12, Math.PI * 0.5, -Math.PI * 0.5);
    ctx.stroke();
  }

  private static drawGroveTitanBoss(
    ctx: CanvasRenderingContext2D,
    e: Enemy,
    color: string,
    isFlashing: boolean,
    time: number
  ) {
    const stompBob = Math.sin(time * 4) * 2;

    // Colossal Ancient Wood-Golem Body
    ctx.fillStyle = isFlashing ? '#ffffff' : '#14221a';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, stompBob, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing Central Core Rune
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, stompBob, e.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Colossal Branching Horns / Antlers
    ctx.strokeStyle = '#2d4a3e';
    ctx.lineWidth = 5;
    ctx.beginPath();
    // Left Horn
    ctx.moveTo(-e.radius * 0.5, stompBob - e.radius * 0.7);
    ctx.lineTo(-e.radius * 1.1, stompBob - e.radius * 1.3);
    ctx.lineTo(-e.radius * 0.8, stompBob - e.radius * 1.6);
    // Right Horn
    ctx.moveTo(e.radius * 0.5, stompBob - e.radius * 0.7);
    ctx.lineTo(e.radius * 1.1, stompBob - e.radius * 1.3);
    ctx.lineTo(e.radius * 0.8, stompBob - e.radius * 1.6);
    ctx.stroke();

    // Floating Will-O-Wisps orbiting titan's crown
    for (let i = 0; i < 3; i++) {
      const ang = time * 2 + (i / 3) * Math.PI * 2;
      const wx = Math.cos(ang) * (e.radius + 18);
      const wy = stompBob + Math.sin(ang) * (e.radius + 18);
      ctx.fillStyle = '#6ee7b7';
      ctx.shadowColor = '#6ee7b7';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(wx, wy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private static drawCryptLordBoss(
    ctx: CanvasRenderingContext2D,
    e: Enemy,
    color: string,
    isFlashing: boolean,
    time: number
  ) {
    const pulse = Math.sin(time * 5) * 2.5;

    // Molten Obsidian Titan
    ctx.fillStyle = isFlashing ? '#ffffff' : '#1a080d';
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Fiery Lava Veins
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-e.radius * 0.6, -e.radius * 0.3);
    ctx.lineTo(0, e.radius * 0.2);
    ctx.lineTo(e.radius * 0.6, -e.radius * 0.4);
    ctx.stroke();

    // Blazing Core
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}
