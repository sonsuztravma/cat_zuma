import {
  Flame,
  Snowflake,
  Zap,
  Sparkles,
  Heart,
  Pause,
  Volume2,
  VolumeX,
  RefreshCw,
  Lock,
  Maximize2,
  Minimize2,
  Ratio,
} from 'lucide-react';
import {
  ABILITIES,
  AbilityId,
  BALL_COLORS,
  DIFFICULTIES,
  HudSnapshot,
} from '../game/types';

export type AspectMode = 'auto' | '16:9' | '4:3' | 'fill';

export const ASPECT_MODE_LABELS: Record<AspectMode, string> = {
  auto: 'Oto',
  '16:9': '16:9',
  '4:3': '4:3',
  fill: 'Doldur',
};

export const ASPECT_MODE_ORDER: AspectMode[] = ['auto', '16:9', '4:3', 'fill'];

interface GameTopStripProps {
  hud: HudSnapshot;
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function GameTopStrip({ hud }: GameTopStripProps) {
  const bossWeakDef = hud.boss ? BALL_COLORS[hud.boss.weaknessColor] : null;
  const diffLabel = DIFFICULTIES[hud.difficulty].label;

  return (
    <header className="w-full px-3 py-1.5 bg-[#101e19]/95 border border-emerald-900/70 rounded-xl flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2 text-xs min-w-0">
        <span className="font-mono-num font-semibold text-amber-400 whitespace-nowrap shrink-0">
          Bölüm {hud.level}/{hud.totalLevels}
        </span>
        <span aria-hidden="true" className="text-emerald-200/40">
          ·
        </span>
        <span className="text-emerald-100/85 font-medium truncate">
          {hud.levelName}
        </span>
        <span aria-hidden="true" className="hidden sm:inline text-emerald-200/40">
          ·
        </span>
        <span className="hidden sm:inline text-emerald-200/65 whitespace-nowrap shrink-0">
          {diffLabel}
        </span>
        <span aria-hidden="true" className="text-emerald-200/40">
          ·
        </span>
        <span
          aria-label="Bölüm Süresi"
          className="font-mono-num text-emerald-100/85 whitespace-nowrap shrink-0"
        >
          {formatDuration(hud.elapsedSeconds)}
        </span>
      </div>

      {/* Progress / Boss Health Bar */}
      <div className="flex items-center gap-2.5 flex-1 max-w-[380px] min-w-[150px]">
        <div className="shrink-0 text-right">
          {hud.boss ? (
            <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap">
              <span className="font-semibold text-rose-300">{hud.boss.name}</span>
              <span className="font-mono-num text-rose-200/80">
                {hud.boss.hp}/{hud.boss.maxHp}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap">
              <span className="font-mono-num text-emerald-200/75 hidden md:inline">
                Dalga {hud.currentWave}/{hud.totalWaves}
              </span>
              <span className="font-mono-num font-semibold text-amber-300">
                %{hud.progress}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 h-2 rounded-full bg-[#07100d] overflow-hidden border border-emerald-900/70">
          {hud.boss ? (
            <div
              className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-[width] duration-150"
              style={{
                width: `${Math.max(0, Math.min(100, (hud.boss.hp / hud.boss.maxHp) * 100))}%`,
              }}
            />
          ) : (
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-[width] duration-150"
              style={{ width: `${hud.progress}%` }}
            />
          )}
        </div>

        {hud.boss && bossWeakDef ? (
          <span className="text-[11px] font-semibold text-amber-300 whitespace-nowrap shrink-0">
            2x {bossWeakDef.label}
          </span>
        ) : hud.combo >= 2 ? (
          <span className="font-mono-num text-[11px] font-bold text-amber-400 whitespace-nowrap shrink-0">
            x{hud.combo}
          </span>
        ) : hud.dangerRatio > 0.72 ? (
          <span className="text-[11px] font-semibold text-rose-400 whitespace-nowrap shrink-0">
            Tehlike!
          </span>
        ) : null}
      </div>
    </header>
  );
}

interface GameLeftRailProps {
  hud: HudSnapshot;
  onSwapBalls: () => void;
}

export function GameLeftRail({ hud, onSwapBalls }: GameLeftRailProps) {
  const currentDef = BALL_COLORS[hud.currentBallColor];
  const nextDef = BALL_COLORS[hud.nextBallColor];

  return (
    <aside
      aria-label="Skor, Can ve Pati Enerjisi"
      className="w-[80px] sm:w-[96px] lg:w-[112px] shrink-0 h-full bg-[#0e1b16]/95 border-r border-emerald-900/70 px-2 py-2.5 flex flex-col items-center justify-between gap-2.5"
    >
      {/* Score, High Score & Lives */}
      <div className="w-full flex flex-col items-center gap-2 text-center">
        <div className="w-full">
          <p className="text-[10px] text-emerald-200/60 leading-none">Skor</p>
          <p className="font-mono-num text-xs sm:text-sm font-bold text-[#f4f1ea] mt-0.5 truncate">
            {hud.score.toLocaleString('tr-TR')}
          </p>
        </div>

        <div className="w-full">
          <p className="text-[10px] text-emerald-200/55 leading-none">Rekor</p>
          <p className="font-mono-num text-[11px] font-semibold text-amber-400 mt-0.5 truncate">
            {hud.highScore.toLocaleString('tr-TR')}
          </p>
        </div>

        {/* Lives */}
        <div
          className="w-full pt-1.5 border-t border-emerald-900/60 flex flex-col items-center gap-1"
          aria-label={`Kalan Can: ${hud.lives} / ${hud.maxLives}`}
        >
          <div className="flex flex-wrap items-center justify-center gap-0.5">
            {Array.from({ length: hud.maxLives }).map((_, idx) => (
              <Heart
                key={idx}
                className={`w-3.5 h-3.5 ${
                  idx < hud.lives
                    ? 'text-rose-500 fill-rose-500'
                    : 'text-emerald-950'
                }`}
              />
            ))}
          </div>
          <span className="font-mono-num text-[10px] text-emerald-200/70">
            Can {hud.lives}/{hud.maxLives}
          </span>
        </div>
      </div>

      {/* Vertical Pati Enerjisi Gauge */}
      <div className="flex-1 w-full min-h-[72px] max-h-[240px] flex flex-col items-center justify-center gap-1.5 py-1">
        <span className="text-[10px] font-medium text-emerald-100/80 text-center leading-tight">
          Pati Enerjisi
        </span>
        <div className="flex-1 w-5 sm:w-6 rounded-full bg-[#07100d] border border-emerald-900/80 p-0.5 flex flex-col justify-end overflow-hidden">
          <div
            className="w-full rounded-full bg-gradient-to-t from-amber-600 via-amber-400 to-yellow-200 transition-[height] duration-150"
            style={{ height: `${Math.max(4, hud.energy)}%` }}
          />
        </div>
        <span className="font-mono-num text-xs font-bold text-amber-400 leading-none">
          {hud.energy}
        </span>
      </div>

      {/* Tactile Ball Swap Button */}
      <button
        type="button"
        onClick={onSwapBalls}
        title="Aktif ve sıradaki topu değiştir (Sağ Tık veya Boşluk)"
        className="w-full min-h-[54px] px-1.5 py-2 rounded-xl bg-[#182a23] hover:bg-[#21382f] active:scale-95 border border-emerald-800/70 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <div className="flex items-center justify-center gap-1">
          <span
            className="w-4 h-4 rounded-full border border-white/60 shrink-0"
            style={{ backgroundColor: currentDef.main }}
          />
          <RefreshCw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span
            className="w-3 h-3 rounded-full border border-white/40 shrink-0"
            style={{ backgroundColor: nextDef.main }}
          />
        </div>
        <span className="text-[10px] font-semibold text-emerald-100 whitespace-nowrap">
          Değiştir
        </span>
      </button>
    </aside>
  );
}

interface GameRightRailProps {
  hud: HudSnapshot;
  aspectMode: AspectMode;
  isFullscreen: boolean;
  onActivateAbility: (id: AbilityId) => void;
  onCycleAspect: () => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  onPause: () => void;
}

function AbilityBtnIcon({ id, locked }: { id: AbilityId; locked: boolean }) {
  if (locked) return <Lock className="w-4 h-4 text-emerald-200/35 shrink-0" />;
  switch (id) {
    case 'paw_bomb':
      return <Flame className="w-4 h-4 text-orange-400 shrink-0" />;
    case 'purr_freeze':
      return <Snowflake className="w-4 h-4 text-sky-400 shrink-0" />;
    case 'laser_paw':
      return <Zap className="w-4 h-4 text-amber-300 shrink-0" />;
    case 'rainbow_yarn':
      return <Sparkles className="w-4 h-4 text-fuchsia-400 shrink-0" />;
  }
}

export function GameRightRail({
  hud,
  aspectMode,
  isFullscreen,
  onActivateAbility,
  onCycleAspect,
  onToggleFullscreen,
  onToggleMute,
  onPause,
}: GameRightRailProps) {
  return (
    <aside
      aria-label="Kedi Yetenekleri ve Ekran Kontrolleri"
      className="w-[86px] sm:w-[104px] lg:w-[122px] shrink-0 h-full bg-[#0e1b16]/95 border-l border-emerald-900/70 px-2 py-2.5 flex flex-col items-center justify-between gap-2"
    >
      {/* Top Compact Utility Controls: Pause & Mute */}
      <div className="w-full grid grid-cols-2 gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onPause}
          aria-label="Oyunu Duraklat"
          title="Duraklat (P)"
          className="h-9 rounded-lg bg-[#182a23] hover:bg-[#223b31] text-emerald-100 border border-emerald-800/60 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <Pause className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={hud.muted ? 'Sesi Aç' : 'Sesi Kapat'}
          title={hud.muted ? 'Sesi Aç (M)' : 'Sesi Kapat (M)'}
          className="h-9 rounded-lg bg-[#182a23] hover:bg-[#223b31] text-emerald-100 border border-emerald-800/60 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          {hud.muted ? (
            <VolumeX className="w-4 h-4 text-emerald-200/60" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* 4 Cat Abilities Stacked Along Right Edge */}
      <div className="flex-1 w-full flex flex-col justify-center gap-1.5 min-h-0">
        {ABILITIES.map((ab) => {
          const locked = hud.level < ab.unlockLevel;
          const cd = hud.cooldowns[ab.id];
          const isArmed = hud.armedAbility === ab.id;
          const canUse = !locked && cd <= 0.05 && hud.energy >= ab.cost;

          return (
            <button
              key={ab.id}
              type="button"
              disabled={locked || (!canUse && !isArmed)}
              onClick={() => onActivateAbility(ab.id)}
              title={`${ab.name} (${ab.cost} Enerji): ${ab.description}`}
              className={`w-full min-h-[44px] flex-1 max-h-[68px] px-2 py-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                isArmed
                  ? 'bg-amber-500/20 border-amber-400 text-amber-100 cursor-pointer'
                  : canUse
                    ? 'bg-[#182a23] hover:bg-[#223b31] active:scale-95 border-emerald-700/70 text-[#f4f1ea] cursor-pointer'
                    : 'bg-[#0b1511] border-emerald-950 text-emerald-200/40 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <AbilityBtnIcon id={ab.id} locked={locked} />
                <span className="text-[11px] font-semibold whitespace-nowrap">
                  {ab.shortName}
                </span>
              </div>
              <span className="font-mono-num text-[10px] opacity-80 whitespace-nowrap leading-none">
                {locked
                  ? `Bölüm ${ab.unlockLevel}`
                  : cd > 0.05
                    ? `${Math.ceil(cd)} sn`
                    : isArmed
                      ? 'Hazır'
                      : `${ab.cost} Enj · [${ab.keybind}]`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Display Controls: Aspect Ratio & Fullscreen */}
      <div className="w-full flex flex-col gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onCycleAspect}
          title="Görüntü oranını değiştir (Oto / 16:9 / 4:3 / Tam Doldur)"
          className="w-full h-9 px-2 rounded-lg bg-[#182a23] hover:bg-[#223b31] text-emerald-100 border border-emerald-800/60 flex items-center justify-center gap-1.5 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <Ratio className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-mono-num">{ASPECT_MODE_LABELS[aspectMode]}</span>
        </button>

        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
          title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
          className="w-full h-9 px-2 rounded-lg bg-[#182a23] hover:bg-[#223b31] text-emerald-100 border border-emerald-800/60 flex items-center justify-center gap-1.5 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}
          <span>{isFullscreen ? 'Çık' : 'Tam Ekran'}</span>
        </button>
      </div>
    </aside>
  );
}
