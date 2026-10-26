import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, SaveData, UpgradeCard, CurseLevel, CurseAffix, SanctumUpgrades, LandmarkEventState } from './types/game';
import { loadSave, saveGame, getUpgradeCost } from './storage/saveSystem';
import { sound } from './audio/soundEngine';
import { GameEngine } from './engine/GameEngine';
import { getRandomUpgrades } from './engine/upgradeDeck';

import { TitleScreen } from './components/TitleScreen';
import { SanctumAltar } from './components/SanctumAltar';
import { GameHUD } from './components/GameHUD';
import { LevelUpModal } from './components/LevelUpModal';
import { ExtractionChoiceModal } from './components/ExtractionChoiceModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { MobileControls } from './components/MobileControls';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [saveData, setSaveData] = useState<SaveData>(loadSave);
  const [draftCards, setDraftCards] = useState<UpgradeCard[]>([]);

  // HUD stats state
  const [hudStats, setHudStats] = useState<{
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
  }>({
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    xpToNext: 20,
    crystals: 0,
    relics: 0,
    curseLevel: 1,
    curseTimer: 0,
    activeAffixes: [],
    dashCdRatio: 0,
    novaCdRatio: 0,
    activeLandmarkEvent: null,
    nearbyLandmark: null,
    sectorIndex: 1,
    sectorName: "The Haunted Forest",
    rewardMultiplier: 1.0,
  });

  // End run outcome state
  const [endStats, setEndStats] = useState<{
    isVictory: boolean;
    timeSurvived: number;
    kills: number;
    crystalsEarned: number;
    relicsEarned: number;
    bossDefeated: boolean;
  }>({
    isVictory: false,
    timeSurvived: 0,
    kills: 0,
    crystalsEarned: 0,
    relicsEarned: 0,
    bossDefeated: false,
  });

  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Check touch capabilities
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
  }, []);

  // Destroy engine on unmount to prevent leaks or duplicate RAF loops
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  // Update save data and sync sound engine
  useEffect(() => {
    sound.setMute(!saveData.soundEnabled);
    sound.setVolume(saveData.sfxVolume);
  }, [saveData.soundEnabled, saveData.sfxVolume]);

  const handleToggleSound = useCallback(() => {
    sound.ensureAudio();
    setSaveData((prev) => {
      const updated = { ...prev, soundEnabled: !prev.soundEnabled };
      saveGame(updated);
      return updated;
    });
  }, []);

  // --------------------------------------------------------------------------
  // GAME ENGINE CALLBACKS
  // --------------------------------------------------------------------------
  const handleLevelUp = useCallback(() => {
    const cards = getRandomUpgrades(3);
    setDraftCards(cards);
    setGameState('LEVEL_UP');
  }, []);

  const handleSelectUpgradeCard = useCallback((card: UpgradeCard) => {
    sound.ensureAudio();
    if (engineRef.current) {
      card.apply(engineRef.current.player);
      engineRef.current.resume();
    }
    setGameState('PLAYING');
  }, []);

  const handleGameOver = useCallback((stats: {
    timeSurvived: number;
    kills: number;
    crystalsEarned: number;
    relicsEarned: number;
    bossDefeated: boolean;
  }) => {
    setEndStats({
      isVictory: false,
      ...stats,
    });

    // Bank crystals even upon fall
    setSaveData((prev) => {
      const updated: SaveData = {
        ...prev,
        bankedCrystals: prev.bankedCrystals + stats.crystalsEarned,
        totalRuns: prev.totalRuns + 1,
        totalEnemiesKilled: prev.totalEnemiesKilled + stats.kills,
        bestSurvivalSeconds: Math.max(prev.bestSurvivalSeconds, stats.timeSurvived),
      };
      saveGame(updated);
      return updated;
    });

    setGameState('GAME_OVER');
  }, []);

  const handleStepOnPortal = useCallback(() => {
    setGameState('EXTRACTION_CHOICE');
  }, []);

  const handleExtractSafe = useCallback(() => {
    if (!engineRef.current) return;
    const engine = engineRef.current;

    const timeSurvived = Math.floor(engine.sectorTimer);
    const kills = engine.runEnemiesKilled;
    const crystals = engine.player.soulCrystals;
    const relics = engine.player.relicsFound;

    setEndStats({
      isVictory: true,
      timeSurvived,
      kills,
      crystalsEarned: crystals,
      relicsEarned: relics,
      bossDefeated: true,
    });

    // Bank 100% rewards
    setSaveData((prev) => {
      const updated: SaveData = {
        ...prev,
        bankedCrystals: prev.bankedCrystals + crystals,
        bankedRelics: prev.bankedRelics + relics,
        victories: prev.victories + 1,
        totalRuns: prev.totalRuns + 1,
        totalEnemiesKilled: prev.totalEnemiesKilled + kills,
        bestSurvivalSeconds: Math.max(prev.bestSurvivalSeconds, timeSurvived),
      };
      saveGame(updated);
      return updated;
    });

    engine.stop();
    setGameState('VICTORY');
  }, []);

  const handlePushDeeper = useCallback(() => {
    if (!engineRef.current) return;
    // Enter Sector 2: The Sunken Crypt with 2x deeper-sector multiplier, preserving full character progression!
    engineRef.current.advanceToSector(1);
    engineRef.current.resume();
    setGameState('PLAYING');
  }, []);

  const handleInteract = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerLandmarkInteraction();
    }
  }, []);

  const handleStatsUpdate = useCallback((stats: typeof hudStats) => {
    setHudStats(stats);
  }, []);

  // --------------------------------------------------------------------------
  // INITIALIZE / START GAME
  // --------------------------------------------------------------------------
  const startNewRun = useCallback((sectorIndex: number = 0) => {
    sound.ensureAudio();
    if (!canvasRef.current) return;

    if (!engineRef.current) {
      engineRef.current = new GameEngine(canvasRef.current, {
        onLevelUp: handleLevelUp,
        onGameOver: handleGameOver,
        onExtractionPortalReady: () => {},
        onStepOnPortal: handleStepOnPortal,
        onStatsUpdate: handleStatsUpdate,
      });
    } else {
      engineRef.current.stop();
    }

    engineRef.current.resizeCanvas();
    engineRef.current.initRun(saveData, sectorIndex);
    engineRef.current.start();
    setGameState('PLAYING');
  }, [saveData, handleLevelUp, handleGameOver, handleStepOnPortal, handleStatsUpdate]);

  // Pause / Resume handler
  const handlePause = useCallback(() => {
    if (gameState === 'PLAYING' && engineRef.current) {
      engineRef.current.pause();
      setGameState('PAUSED');
    }
  }, [gameState]);

  const handleResume = useCallback(() => {
    if (gameState === 'PAUSED' && engineRef.current) {
      engineRef.current.resume();
      setGameState('PLAYING');
    }
  }, [gameState]);

  const handleAbandon = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
    setGameState('SANCTUM');
  }, []);

  // Sanctum purchase handler
  const handlePurchaseUpgrade = useCallback((key: keyof SanctumUpgrades) => {
    setSaveData((prev) => {
      const currentRank = prev.sanctumUpgrades[key];
      const cost = getUpgradeCost(key, currentRank);
      if (prev.bankedCrystals >= cost) {
        const updated: SaveData = {
          ...prev,
          bankedCrystals: prev.bankedCrystals - cost,
          sanctumUpgrades: {
            ...prev.sanctumUpgrades,
            [key]: currentRank + 1,
          },
        };
        saveGame(updated);
        return updated;
      }
      return prev;
    });
  }, []);

  // --------------------------------------------------------------------------
  // GLOBAL KEYBOARD & MOUSE DISPATCHERS
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (gameState === 'PLAYING') {
          handlePause();
        } else if (gameState === 'PAUSED') {
          handleResume();
        }
        return;
      }

      if (gameState === 'PLAYING' && engineRef.current) {
        engineRef.current.setKey(e.code, true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState === 'PLAYING' && engineRef.current) {
        engineRef.current.setKey(e.code, false);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (engineRef.current && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / (rect.width || 1);
        const scaleY = canvasRef.current.height / (rect.height || 1);
        engineRef.current.setMousePos((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (gameState === 'PLAYING' && engineRef.current) {
        if (e.button === 0) {
          engineRef.current.setMouseDown(true);
        } else if (e.button === 2) {
          // Right click dash
          e.preventDefault();
          engineRef.current.triggerDash();
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (engineRef.current && e.button === 0) {
        engineRef.current.setMouseDown(false);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (gameState === 'PLAYING') {
        e.preventDefault();
      }
    };

    const handleBlur = () => {
      if (engineRef.current) {
        engineRef.current.clearInputs();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, handlePause, handleResume]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07090e] select-none text-slate-100">
      {/* 60 FPS HTML5 Canvas Simulation Container */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-crosshair z-0"
      />

      {/* Title Screen View */}
      {gameState === 'TITLE' && (
        <TitleScreen
          saveData={saveData}
          onStartGame={() => startNewRun(0)}
          onOpenSanctum={() => setGameState('SANCTUM')}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* Sanctum Altar View */}
      {gameState === 'SANCTUM' && (
        <SanctumAltar
          saveData={saveData}
          onUpgrade={handlePurchaseUpgrade}
          onBack={() => setGameState('TITLE')}
          onStartRun={() => startNewRun(0)}
        />
      )}

      {/* Active Game HUD (Low-occlusion overlay) */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'LEVEL_UP' || gameState === 'EXTRACTION_CHOICE') && (
        <GameHUD
          {...hudStats}
          soundEnabled={saveData.soundEnabled}
          onToggleSound={handleToggleSound}
          onPause={handlePause}
          onInteract={handleInteract}
        />
      )}

      {/* Mobile Touch Controls Overlay */}
      {gameState === 'PLAYING' && isTouchDevice && (
        <MobileControls
          onMove={(vec) => engineRef.current?.setJoystick(vec.x, vec.y)}
          onSlash={() => engineRef.current?.triggerSlash()}
          onDash={() => engineRef.current?.triggerDash()}
          onNova={() => engineRef.current?.triggerNova()}
          dashCdRatio={hudStats.dashCdRatio}
          novaCdRatio={hudStats.novaCdRatio}
        />
      )}

      {/* Level Up Draft Modal */}
      {gameState === 'LEVEL_UP' && (
        <LevelUpModal
          cards={draftCards}
          onSelectCard={handleSelectUpgradeCard}
        />
      )}

      {/* Extraction Portal Decision Modal (Escape or Push) */}
      {gameState === 'EXTRACTION_CHOICE' && (
        <ExtractionChoiceModal
          crystalsEarned={hudStats.crystals}
          relicsEarned={hudStats.relics}
          onExtractSafe={handleExtractSafe}
          onPushDeeper={handlePushDeeper}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          soundEnabled={saveData.soundEnabled}
          onToggleSound={handleToggleSound}
          onResume={handleResume}
          onAbandon={handleAbandon}
        />
      )}

      {/* Victory or Game Over Modal */}
      {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && (
        <GameOverModal
          isVictory={endStats.isVictory}
          timeSurvived={endStats.timeSurvived}
          kills={endStats.kills}
          crystalsEarned={endStats.crystalsEarned}
          relicsEarned={endStats.relicsEarned}
          bossDefeated={endStats.bossDefeated}
          onPlayAgain={() => startNewRun(0)}
          onOpenSanctum={() => setGameState('SANCTUM')}
        />
      )}
    </div>
  );
}
