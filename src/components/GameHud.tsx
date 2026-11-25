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
} from 'lucide-react';
import { ABILITIES, AbilityId, BALL_COLORS, HudSnapshot } from '../game/types';

interface GameHudTopProps {
  hud: HudSnapshot;
  onPause: () => void;
  onToggleMute: () => void;
}

export function GameHudTop({ hud, onPause, onToggleMute }: GameHudTopProps) {
  const bossWeakDef = hud.boss ? BALL_COLORS[hud.boss.weaknessColor] : null;

  return (
    <header className="w-full max-w-[1040px] mx-auto px-4 py-2.5 bg-[#12201b] border border-emerald-900/70 rounded-xl flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
      {/* Left: Level & Phase Progress or Boss HP */}
      <div className="flex items-center gap-4 min-w-[240px] flex-1">
        <div className="shrink-0">
          <div className="flex items-center gap-2 text-xs text-emerald-200/70">
            <span className="font-semibold text-amber-400">Bölüm {hud.level}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate max-w-[150px]">{hud.levelName}</span>
          </div>

          {hud.boss ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-rose-300 whitespace-nowrap">
                {hud.boss.name}
              </span>
              <span className="font-mono-num text-[11px] text-rose-200/80 whitespace-nowrap">
                {hud.boss.hp}/{hud.boss.maxHp}
              </span>
              {bossWeakDef && (
                <span className="text-[11px] text-amber-300 whitespace-nowrap">
                  · 2x {bossWeakDef.label}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-emerald-200/75 whitespace-nowrap">
                Boss İlerlemesi
              </span>
              <span className="font-mono-num text-[11px] font-semibold text-amber-300">
                %{hud.progress}
              </span>
              {hud.combo >= 2 && (
                <span className="font-mono-num text-[11px] font-bold text-amber-400">
                  · Kombo x{hud.combo}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Progress / Boss Health Bar */}
        <div className="flex-1 min-w-[100px] max-w-[230px]">
          <div className="h-2.5 w-full rounded-full bg-[#09120f] overflow-hidden border border-emerald-900/70">
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
          {hud.dangerRatio > 0.72 && (
            <p className="text-[11px] font-semibold text-rose-400 mt-0.5">
              Dikkat: Zincir geçide yaklaştı!
            </p>
          )}
        </div>
      </div>

      {/* Center: Score & High Score */}
      <div className="flex items-center gap-5 shrink-0">
        <div>
          <p className="text-[11px] text-emerald-200/60">Skor</p>
          <p className="font-mono-num text-base font-bold text-[#f4f1ea] leading-tight">
            {hud.score.toLocaleString('tr-TR')}
          </p>
        </div>
        <div className="h-7 w-px bg-emerald-900/70" aria-hidden="true" />
        <div>
          <p className="text-[11px] text-emerald-200/60">En Yüksek</p>
          <p className="font-mono-num text-base font-semibold text-amber-400 leading-tight">
            {hud.highScore.toLocaleString('tr-TR')}
          </p>
        </div>
      </div>

      {/* Right: Lives & Utility Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="flex items-center gap-1"
          aria-label={`Kalan Can: ${hud.lives} / ${hud.maxLives}`}
        >
          {Array.from({ length: hud.maxLives }).map((_, idx) => (
            <Heart
              key={idx}
              className={`w-4 h-4 ${
                idx < hud.lives
                  ? 'text-rose-500 fill-rose-500'
                  : 'text-emerald-900/90'
              }`}
            />
          ))}
          <span className="font-mono-num text-xs text-emerald-100/80 ml-1">
            {hud.lives}/{hud.maxLives}
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={hud.muted ? 'Sesi Aç' : 'Sesi Kapat'}
          className="p-2 rounded-lg bg-[#192b24] hover:bg-[#233c32] text-emerald-100 border border-emerald-800/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          {hud.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onPause}
          aria-label="Oyunu Duraklat"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#192b24] hover:bg-[#233c32] text-emerald-100 border border-emerald-800/60 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <Pause className="w-3.5 h-3.5" />
          <span>Duraklat</span>
        </button>
      </div>
    </header>
  );
}

interface GameHudBottomProps {
  hud: HudSnapshot;
  onActivateAbility: (id: AbilityId) => void;
  onSwapBalls: () => void;
}

function AbilityBtnIcon({ id, locked }: { id: AbilityId; locked: boolean }) {
  if (locked) return <Lock className="w-4 h-4 text-emerald-200/40 shrink-0" />;
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

export function GameHudBottom({
  hud,
  onActivateAbility,
  onSwapBalls,
}: GameHudBottomProps) {
  const currentDef = BALL_COLORS[hud.currentBallColor];
  const nextDef = BALL_COLORS[hud.nextBallColor];

  return (
    <footer className="w-full max-w-[1040px] mx-auto px-4 py-2.5 bg-[#12201b] border border-emerald-900/70 rounded-xl flex flex-wrap items-center justify-between gap-4">
      {/* Cat Energy Meter */}
      <div className="flex flex-col gap-1 min-w-[165px]">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-emerald-100/85">Pati Enerjisi</span>
          <span className="font-mono-num font-semibold text-amber-400">
            {hud.energy}/100
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-[#09120f] overflow-hidden border border-emerald-900/70">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-300 transition-[width] duration-150"
            style={{ width: `${hud.energy}%` }}
          />
        </div>
      </div>

      {/* 4 Cat Abilities */}
      <div className="flex flex-wrap items-center gap-2 flex-1 justify-center">
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
              title={`${ab.name}: ${ab.description}`}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                isArmed
                  ? 'bg-amber-500/20 border-amber-400 text-amber-100 cursor-pointer'
                  : canUse
                    ? 'bg-[#192c25] hover:bg-[#223b32] border-emerald-700/70 text-[#f4f1ea] cursor-pointer'
                    : 'bg-[#0e1915] border-emerald-950 text-emerald-200/40 cursor-not-allowed'
              }`}
            >
              <AbilityBtnIcon id={ab.id} locked={locked} />
              <div className="leading-tight">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span>{ab.shortName}</span>
                  <span className="font-mono-num text-[10px] opacity-75">
                    [{ab.keybind}]
                  </span>
                </div>
                <div className="font-mono-num text-[10px] opacity-75">
                  {locked
                    ? `Bölüm ${ab.unlockLevel}`
                    : cd > 0.05
                      ? `${Math.ceil(cd)} sn`
                      : isArmed
                        ? 'Hazır · Tıkla'
                        : `${ab.cost} Enj`}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active & Next Ball Swap Control */}
      <button
        type="button"
        onClick={onSwapBalls}
        className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#192b24] hover:bg-[#233c32] border border-emerald-800/60 text-xs text-emerald-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/50 shrink-0"
            style={{ backgroundColor: currentDef.main }}
          />
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span
            className="w-2.5 h-2.5 rounded-full border border-white/40 shrink-0"
            style={{ backgroundColor: nextDef.main }}
          />
        </div>
        <span className="font-medium">Değiştir (Boşluk)</span>
      </button>
    </footer>
  );
}
