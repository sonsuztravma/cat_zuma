import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ASPECT_MODE_ORDER,
  AspectMode,
  GameLeftRail,
  GameRightRail,
  GameTopStrip,
} from './components/GameHud';
import {
  EndRunModal,
  HighScoresModal,
  LevelClearModal,
  PauseModal,
} from './components/Modals';
import { TitleScreen } from './components/TitleScreen';
import { PatiZumaEngine } from './game/engine';
import { ARENA_HEIGHT, ARENA_WIDTH } from './game/levels';
import {
  clearHighScores,
  getBestScore,
  loadHighScores,
  loadMaxUnlockedLevel,
  saveHighScore,
  saveMaxUnlockedLevel,
} from './game/storage';
import {
  AbilityId,
  DifficultyId,
  GameState,
  HighScoreEntry,
  HudSnapshot,
  LevelClearSummary,
  TOTAL_LEVELS,
} from './game/types';

const INITIAL_HUD: HudSnapshot = {
  score: 0,
  highScore: 0,
  level: 1,
  totalLevels: TOTAL_LEVELS,
  difficulty: 'normal',
  levelName: 'Yosunlu Avlu I',
  levelSubtitle: '',
  phase: 'CHAIN',
  progress: 0,
  currentWave: 1,
  totalWaves: 3,
  elapsedSeconds: 0,
  energy: 40,
  combo: 0,
  maxCombo: 0,
  lives: 3,
  maxLives: 3,
  bossesDefeated: 0,
  currentBallColor: 'ruby',
  nextBallColor: 'emerald',
  armedAbility: null,
  cooldowns: {
    paw_bomb: 0,
    purr_freeze: 0,
    laser_paw: 0,
    rainbow_yarn: 0,
  },
  freezeTimer: 0,
  catStunTimer: 0,
  dangerRatio: 0,
  boss: null,
  muted: false,
};

function detectTouchMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const maxDim = Math.max(window.innerWidth, window.innerHeight);
  return (coarse || 'ontouchstart' in window) && maxDim <= 1024;
}

async function requestFullscreenAndLandscape(isMobile: boolean): Promise<void> {
  if (typeof document === 'undefined') return;
  try {
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      }
    }
  } catch {
    // Some browsers or embedded iframes block fullscreen; continue cleanly
  }

  if (isMobile) {
    try {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (orientation: string) => Promise<void>;
      };
      if (orientation?.lock) {
        await orientation.lock('landscape');
      }
    } catch {
      // Orientation lock unsupported (e.g. iOS Safari) — CSS 90deg landscape fallback takes over
    }
  }
}

async function exitFullscreenSafely(): Promise<void> {
  if (typeof document === 'undefined') return;
  try {
    const orientation = screen.orientation as ScreenOrientation & {
      unlock?: () => void;
    };
    orientation?.unlock?.();
  } catch {
    // Ignore
  }
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } catch {
    // Ignore
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [difficulty, setDifficulty] = useState<DifficultyId>('normal');
  const [aspectMode, setAspectMode] = useState<AspectMode>('auto');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
    isMobile: detectTouchMobile(),
  }));
  const [stageBounds, setStageBounds] = useState({ width: 960, height: 590 });

  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(() =>
    loadMaxUnlockedLevel()
  );
  const [hud, setHud] = useState<HudSnapshot>(() => ({
    ...INITIAL_HUD,
    highScore: getBestScore(),
  }));
  const [highScores, setHighScores] = useState<HighScoreEntry[]>(() =>
    loadHighScores()
  );
  const [showScoresModal, setShowScoresModal] = useState(false);
  const [levelClearSummary, setLevelClearSummary] =
    useState<LevelClearSummary | null>(null);
  const [endStats, setEndStats] = useState<{
    score: number;
    levelReached: number;
    maxCombo: number;
    bossesDefeated: number;
  } | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<PatiZumaEngine | null>(null);
  const pendingStartRef = useRef<{ level: number; difficulty: DifficultyId } | null>(
    null
  );

  const bestScore = highScores.length > 0 ? highScores[0].score : 0;

  // If on mobile & held in portrait during gameplay, automatically rotate shell 90deg to landscape
  const forceLandscapeRotate =
    gameState !== 'TITLE_MENU' &&
    viewport.isMobile &&
    viewport.height > viewport.width;

  // Sync viewport dimensions and fullscreen status
  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: detectTouchMobile(),
      });
    };
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      updateViewport();
    };

    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  // Measure center arena container dynamically so canvas adapts to any desktop/mobile resolution
  useEffect(() => {
    if (gameState === 'TITLE_MENU') return;
    const container = stageContainerRef.current;
    if (!container) return;

    const measure = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        setStageBounds({ width: w, height: h });
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [gameState, forceLandscapeRotate]);

  // Compute exact fitted canvas dimensions from stageBounds + aspectMode
  const computeCanvasSize = (): { width: number; height: number } => {
    const availW = Math.max(120, stageBounds.width);
    const availH = Math.max(120, stageBounds.height);

    if (aspectMode === 'fill') {
      return { width: Math.floor(availW), height: Math.floor(availH) };
    }

    const targetRatio =
      aspectMode === '16:9'
        ? 16 / 9
        : aspectMode === '4:3'
          ? 4 / 3
          : ARENA_WIDTH / ARENA_HEIGHT;

    if (availW / availH > targetRatio) {
      const height = Math.floor(availH);
      const width = Math.floor(height * targetRatio);
      return { width, height };
    } else {
      const width = Math.floor(availW);
      const height = Math.floor(width / targetRatio);
      return { width, height };
    }
  };

  const canvasSize = computeCanvasSize();

  // Keep canvas backing store sharp at current DPR whenever canvasSize changes
  useEffect(() => {
    if (gameState === 'TITLE_MENU') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.max(1, Math.round(canvasSize.width * dpr));
    const targetH = Math.max(1, Math.round(canvasSize.height * dpr));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
  }, [gameState, canvasSize.width, canvasSize.height]);

  // Mount & configure engine whenever entering the active play canvas
  useEffect(() => {
    if (gameState === 'TITLE_MENU') {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!engineRef.current) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvasSize.width * dpr));
      canvas.height = Math.max(1, Math.round(canvasSize.height * dpr));

      const engine = new PatiZumaEngine(canvas, {
        onHudUpdate: (snapshot) => {
          setHud(snapshot);
        },
        onLevelClear: (summary) => {
          if (summary.levelId < TOTAL_LEVELS) {
            const updatedMax = saveMaxUnlockedLevel(summary.levelId + 1);
            setMaxUnlockedLevel(updatedMax);
          }
          setLevelClearSummary(summary);
          setGameState('LEVEL_CLEAR');
        },
        onGameOver: (stats) => {
          setEndStats(stats);
          setScoreSaved(false);
          setGameState('GAME_OVER');
        },
      });
      engineRef.current = engine;

      const startCfg = pendingStartRef.current ?? { level: 1, difficulty };
      pendingStartRef.current = null;
      engine.startNewGame(startCfg.level, startCfg.difficulty);
    }
  }, [gameState, difficulty, canvasSize.width, canvasSize.height]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  // Global keyboard controls during gameplay
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showScoresModal) {
        if (e.key === 'Escape') setShowScoresModal(false);
        return;
      }

      if (gameState === 'PLAYING') {
        if (e.code === 'Space') {
          e.preventDefault();
          engineRef.current?.swapBalls();
        } else if (e.key === '1') {
          engineRef.current?.activateAbility('paw_bomb');
        } else if (e.key === '2') {
          engineRef.current?.activateAbility('purr_freeze');
        } else if (e.key === '3') {
          engineRef.current?.activateAbility('laser_paw');
        } else if (e.key === '4') {
          engineRef.current?.activateAbility('rainbow_yarn');
        } else if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          engineRef.current?.setPaused(true);
          setGameState('PAUSED');
        } else if (e.key === 'm' || e.key === 'M') {
          engineRef.current?.toggleMute();
        }
      } else if (gameState === 'PAUSED') {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          e.preventDefault();
          engineRef.current?.setPaused(false);
          setGameState('PLAYING');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, showScoresModal]);

  const handleStartGame = useCallback(
    (startLevel = 1, selectedDiff?: DifficultyId) => {
      const targetDiff = selectedDiff ?? difficulty;
      setDifficulty(targetDiff);
      setLevelClearSummary(null);
      setEndStats(null);
      setScoreSaved(false);
      pendingStartRef.current = { level: startLevel, difficulty: targetDiff };

      // Trigger fullscreen (desktop & mobile) and landscape orientation lock (mobile) on user gesture
      void requestFullscreenAndLandscape(detectTouchMobile());

      if (engineRef.current) {
        engineRef.current.startNewGame(startLevel, targetDiff);
      }
      setGameState('PLAYING');
    },
    [difficulty]
  );

  const handleCycleAspect = useCallback(() => {
    setAspectMode((prev) => {
      const idx = ASPECT_MODE_ORDER.indexOf(prev);
      return ASPECT_MODE_ORDER[(idx + 1) % ASPECT_MODE_ORDER.length];
    });
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void exitFullscreenSafely();
    } else {
      void requestFullscreenAndLandscape(detectTouchMobile());
    }
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.setPaused(true);
    setGameState('PAUSED');
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.setPaused(false);
    setGameState('PLAYING');
  }, []);

  const handleNextLevel = useCallback(() => {
    setLevelClearSummary(null);
    setGameState('PLAYING');
    engineRef.current?.loadNextLevel();
  }, []);

  const handleFinishVictory = useCallback(() => {
    if (!levelClearSummary) return;
    setEndStats({
      score: levelClearSummary.totalScore,
      levelReached: levelClearSummary.levelId,
      maxCombo: levelClearSummary.maxCombo,
      bossesDefeated: hud.bossesDefeated,
    });
    setScoreSaved(false);
    setLevelClearSummary(null);
    setGameState('VICTORY');
  }, [levelClearSummary, hud.bossesDefeated]);

  const handleMainMenu = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setLevelClearSummary(null);
    setEndStats(null);
    setGameState('TITLE_MENU');
    void exitFullscreenSafely();
  }, []);

  const handleSaveScore = useCallback(
    (name: string) => {
      if (!endStats) return;
      const updated = saveHighScore({
        playerName: name,
        score: endStats.score,
        levelReached: endStats.levelReached,
        maxCombo: endStats.maxCombo,
        bossesDefeated: endStats.bossesDefeated,
        difficulty,
      });
      setHighScores(updated);
      setScoreSaved(true);
    },
    [endStats, difficulty]
  );

  const handleClearScores = useCallback(() => {
    clearHighScores();
    setHighScores([]);
  }, []);

  const handleActivateAbility = useCallback((id: AbilityId) => {
    engineRef.current?.activateAbility(id);
  }, []);

  const handleSwapBalls = useCallback(() => {
    engineRef.current?.swapBalls();
  }, []);

  const handleToggleMute = useCallback(() => {
    engineRef.current?.toggleMute();
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#0c1713] text-[#f4f1ea]">
      {gameState === 'TITLE_MENU' ? (
        <>
          <TitleScreen
            bestScore={bestScore}
            highScores={highScores}
            difficulty={difficulty}
            maxUnlockedLevel={maxUnlockedLevel}
            onSelectDifficulty={setDifficulty}
            onStartGame={handleStartGame}
            onOpenScores={() => setShowScoresModal(true)}
          />
          {showScoresModal && (
            <HighScoresModal
              scores={highScores}
              onClose={() => setShowScoresModal(false)}
              onClearScores={handleClearScores}
            />
          )}
        </>
      ) : (
        <div
          style={
            forceLandscapeRotate
              ? {
                  width: '100dvh',
                  height: '100dvw',
                  transform: 'translate(-50%, -50%) rotate(90deg)',
                  transformOrigin: 'center center',
                }
              : undefined
          }
          className={
            forceLandscapeRotate
              ? 'fixed top-1/2 left-1/2 bg-[#08110e] flex flex-row overflow-hidden select-none'
              : 'fixed inset-0 w-screen h-[100dvh] bg-[#08110e] flex flex-row overflow-hidden select-none'
          }
        >
          {/* Left Edge Rail: Score, Lives, Vertical Pati Enerjisi, Swap Button */}
          <GameLeftRail hud={hud} onSwapBalls={handleSwapBalls} />

          {/* Center Fullscreen Adaptive Stage */}
          <div className="flex-1 min-w-0 h-full flex flex-col items-center p-1.5 sm:p-2 gap-1.5 overflow-hidden">
            <GameTopStrip hud={hud} />

            <div
              ref={stageContainerRef}
              className="flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden"
            >
              <div
                style={{
                  width: `${canvasSize.width}px`,
                  height: `${canvasSize.height}px`,
                }}
                className="relative rounded-xl overflow-hidden border border-emerald-800/70 shadow-2xl shadow-black/70 bg-[#0b1612]"
              >
                <canvas
                  ref={canvasRef}
                  onPointerMove={(e) => {
                    engineRef.current?.updatePointer(
                      e.clientX,
                      e.clientY,
                      forceLandscapeRotate
                    );
                  }}
                  onPointerDown={(e) => {
                    if (e.button === 2) {
                      e.preventDefault();
                      engineRef.current?.swapBalls();
                      return;
                    }
                    engineRef.current?.updatePointer(
                      e.clientX,
                      e.clientY,
                      forceLandscapeRotate
                    );
                    engineRef.current?.fire();
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                  className="block cursor-crosshair touch-none"
                />
              </div>
            </div>
          </div>

          {/* Right Edge Rail: 4 Cat Abilities + Aspect Ratio, Fullscreen, Sound, Pause */}
          <GameRightRail
            hud={hud}
            aspectMode={aspectMode}
            isFullscreen={isFullscreen}
            onActivateAbility={handleActivateAbility}
            onCycleAspect={handleCycleAspect}
            onToggleFullscreen={handleToggleFullscreen}
            onToggleMute={handleToggleMute}
            onPause={handlePause}
          />

          {/* In-Game Modals rendered inside the shell so they rotate cleanly on portrait mobile */}
          {gameState === 'PAUSED' && (
            <PauseModal
              level={hud.level}
              levelName={hud.levelName}
              difficulty={hud.difficulty}
              score={hud.score}
              aspectMode={aspectMode}
              onSelectAspect={setAspectMode}
              onResume={handleResume}
              onRestart={() => handleStartGame(1, difficulty)}
              onMainMenu={handleMainMenu}
            />
          )}

          {gameState === 'LEVEL_CLEAR' && levelClearSummary && (
            <LevelClearModal
              summary={levelClearSummary}
              onNextLevel={handleNextLevel}
              onFinishVictory={handleFinishVictory}
            />
          )}

          {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && endStats && (
            <EndRunModal
              isVictory={gameState === 'VICTORY'}
              score={endStats.score}
              levelReached={endStats.levelReached}
              maxCombo={endStats.maxCombo}
              bossesDefeated={endStats.bossesDefeated}
              difficulty={difficulty}
              scoreSaved={scoreSaved}
              onSaveScore={handleSaveScore}
              onPlayAgain={() => handleStartGame(1, difficulty)}
              onOpenScores={() => setShowScoresModal(true)}
              onMainMenu={handleMainMenu}
            />
          )}

          {showScoresModal && (
            <HighScoresModal
              contained
              scores={highScores}
              onClose={() => setShowScoresModal(false)}
              onClearScores={handleClearScores}
            />
          )}
        </div>
      )}
    </div>
  );
}
