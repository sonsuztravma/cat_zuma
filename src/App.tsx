import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHudBottom, GameHudTop } from './components/GameHud';
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
  saveHighScore,
} from './game/storage';
import {
  AbilityId,
  GameState,
  HighScoreEntry,
  HudSnapshot,
  LevelClearSummary,
} from './game/types';

const INITIAL_HUD: HudSnapshot = {
  score: 0,
  highScore: 0,
  level: 1,
  levelName: 'Yosunlu Avlu',
  levelSubtitle: '',
  phase: 'CHAIN',
  progress: 0,
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

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
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
  const engineRef = useRef<PatiZumaEngine | null>(null);
  const pendingStartLevelRef = useRef<number | null>(null);

  const bestScore = highScores.length > 0 ? highScores[0].score : 0;

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
      // Configure crisp high-DPI canvas scaling
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = ARENA_WIDTH * dpr;
      canvas.height = ARENA_HEIGHT * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const engine = new PatiZumaEngine(canvas, {
        onHudUpdate: (snapshot) => {
          setHud(snapshot);
        },
        onLevelClear: (summary) => {
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

      const startLevel = pendingStartLevelRef.current ?? 1;
      pendingStartLevelRef.current = null;
      engine.startNewGame(startLevel);
    }
  }, [gameState]);

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
        } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
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

  const handleStartGame = useCallback((startLevel = 1) => {
    setLevelClearSummary(null);
    setEndStats(null);
    setScoreSaved(false);
    pendingStartLevelRef.current = startLevel;
    if (engineRef.current) {
      engineRef.current.startNewGame(startLevel);
    }
    setGameState('PLAYING');
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
      });
      setHighScores(updated);
      setScoreSaved(true);
    },
    [endStats]
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
        <TitleScreen
          bestScore={bestScore}
          highScores={highScores}
          onStartGame={handleStartGame}
          onOpenScores={() => setShowScoresModal(true)}
        />
      ) : (
        <div className="min-h-screen w-full flex flex-col items-center justify-center gap-2.5 px-3 py-3 select-none">
          {/* Top HUD */}
          <GameHudTop
            hud={hud}
            onPause={handlePause}
            onToggleMute={handleToggleMute}
          />

          {/* Main Responsive Arena Canvas */}
          <div className="w-full max-w-[1040px] relative rounded-2xl overflow-hidden border border-emerald-800/70 shadow-2xl shadow-black/60 bg-[#0b1612]">
            <canvas
              ref={canvasRef}
              onPointerMove={(e) => {
                engineRef.current?.updatePointer(e.clientX, e.clientY);
              }}
              onPointerDown={(e) => {
                if (e.button === 2) {
                  e.preventDefault();
                  engineRef.current?.swapBalls();
                  return;
                }
                engineRef.current?.updatePointer(e.clientX, e.clientY);
                engineRef.current?.fire();
              }}
              onContextMenu={(e) => {
                e.preventDefault();
              }}
              style={{ aspectRatio: `${ARENA_WIDTH} / ${ARENA_HEIGHT}` }}
              className="block w-full h-auto cursor-crosshair touch-none"
            />
          </div>

          {/* Bottom Cat Abilities & Swap Dock */}
          <GameHudBottom
            hud={hud}
            onActivateAbility={handleActivateAbility}
            onSwapBalls={handleSwapBalls}
          />
        </div>
      )}

      {/* Overlays */}
      {gameState === 'PAUSED' && (
        <PauseModal
          level={hud.level}
          levelName={hud.levelName}
          score={hud.score}
          onResume={handleResume}
          onRestart={() => handleStartGame(1)}
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
          scoreSaved={scoreSaved}
          onSaveScore={handleSaveScore}
          onPlayAgain={() => handleStartGame(1)}
          onOpenScores={() => setShowScoresModal(true)}
          onMainMenu={handleMainMenu}
        />
      )}

      {showScoresModal && (
        <HighScoresModal
          scores={highScores}
          onClose={() => setShowScoresModal(false)}
          onClearScores={handleClearScores}
        />
      )}
    </div>
  );
}
