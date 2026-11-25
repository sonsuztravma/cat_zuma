import { useState } from 'react';
import {
  Flame,
  Snowflake,
  Zap,
  Sparkles,
  Trophy,
  Play,
  Shield,
  MousePointerClick,
} from 'lucide-react';
import { ABILITIES, AbilityId, HighScoreEntry } from '../game/types';
import { CAMPAIGN_LEVELS } from '../game/levels';

const HERO_IMAGE_URL = '/src/assets/images/cat_guardian_hero_1795594176189.jpg';

interface TitleScreenProps {
  bestScore: number;
  highScores: HighScoreEntry[];
  onStartGame: (startLevel: number) => void;
  onOpenScores: () => void;
}

function AbilityIcon({ id }: { id: AbilityId }) {
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

export function TitleScreen({
  bestScore,
  highScores,
  onStartGame,
  onOpenScores,
}: TitleScreenProps) {
  const [heroError, setHeroError] = useState(false);

  return (
    <div className="min-h-screen w-full bg-[#0c1713] text-[#f4f1ea] flex flex-col">
      {/* Minimal 3-Zone Top Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-8 border-b border-emerald-950/80">
        <span className="font-display text-xl font-bold tracking-tight text-amber-400 whitespace-nowrap shrink-0">
          Pati Zuma
        </span>

        <div className="hidden sm:flex items-center gap-3 text-sm text-emerald-200/70">
          <span>5 Tapınak Bölümü</span>
          <span aria-hidden="true">·</span>
          <span>4 Kedi Yeteneği</span>
          <span aria-hidden="true">·</span>
          <span>Bölüm Sonu Bossları</span>
        </div>

        <button
          type="button"
          onClick={onOpenScores}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-emerald-100 bg-[#172822] hover:bg-[#1f362e] border border-emerald-800/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Skor Tablosu</span>
          {bestScore > 0 && (
            <span className="font-mono-num text-amber-300 text-xs">
              {bestScore.toLocaleString('tr-TR')}
            </span>
          )}
        </button>
      </header>

      {/* Main Hero & Overview */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 flex flex-col gap-10">
        {/* Split Hero Stage */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Copy & Primary CTA */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6 py-2">
            <div className="flex flex-col gap-4">
              <p className="text-xs font-medium tracking-wide text-amber-400/90">
                Antik Kedi Tapınağı · Zuma Arcade
              </p>

              <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight text-[#f4f1ea] text-balance">
                Renkli taşları eşleştir, tapınağı koru.
              </h1>

              <p className="text-[15px] leading-relaxed text-emerald-100/75 max-w-prose">
                Kedi koruyucunla dönen taş zincirine nişan al; aynı renkten 3 veya daha
                fazlasını birleştirerek zincir kombolar yap. Pati enerjini biriktirip özel
                yetenekleri kullan ve her bölümün sonunda bekleyen bossları alt et.
              </p>
            </div>

            {/* Action Area */}
            <div className="flex flex-col gap-5 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onStartGame(1)}
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-[#111916] font-semibold text-base transition-all shadow-lg shadow-amber-950/40 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  <Play className="w-5 h-5 fill-current shrink-0" />
                  <span>Oyuna Başla</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenScores}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#162620] hover:bg-[#1d322a] text-emerald-100 border border-emerald-800/60 font-medium text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Yüksek Skorlar ({highScores.length})</span>
                </button>
              </div>

              {/* Clean Controls Strip (unboxed metadata) */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-emerald-200/70 pt-3 border-t border-emerald-900/60">
                <span className="inline-flex items-center gap-1.5">
                  <MousePointerClick className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sol Tık: Ateş Et</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>Sağ Tık / Boşluk: Top Değiştir</span>
                <span aria-hidden="true">·</span>
                <span>1–4: Kedi Yetenekleri</span>
                <span aria-hidden="true">·</span>
                <span>P: Duraklat</span>
              </div>
            </div>
          </div>

          {/* Right Bespoke Game Illustration */}
          <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-emerald-800/50 bg-[#14241e] min-h-[300px] lg:min-h-[380px]">
            {!heroError ? (
              <img
                src={HERO_IMAGE_URL}
                alt="Antik tapınak avlusunda renkli taş zincirini koruyan kedi karakteri"
                referrerPolicy="no-referrer"
                onError={() => setHeroError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-8 bg-gradient-to-br from-[#193027] via-[#12241d] to-[#0b1511]">
                <Shield className="w-12 h-12 text-amber-400" />
                <p className="font-display text-2xl font-bold text-amber-200">
                  Pati Zuma
                </p>
                <p className="text-sm text-emerald-200/70 text-center max-w-sm">
                  Antik Kedi Tapınağı arenası hazır.
                </p>
              </div>
            )}

            {/* Measured contrast scrim at bottom */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#09120f]/95 via-[#09120f]/55 to-transparent px-6 py-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-amber-300/90 font-medium">
                  Kampanya + Sonsuz Mod
                </p>
                <p className="text-sm text-emerald-50 font-medium mt-0.5">
                  Her bölümde artan hız, yeni taş renkleri ve benzersiz bir tapınak bossu
                </p>
              </div>
              {bestScore > 0 && (
                <div className="text-right shrink-0">
                  <p className="text-xs text-emerald-200/70">En Yüksek Skor</p>
                  <p className="font-mono-num text-lg font-bold text-amber-400">
                    {bestScore.toLocaleString('tr-TR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Cat Abilities & Boss Progression Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-emerald-950/90">
          {/* 4 Cat Abilities */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-xl font-semibold text-[#f4f1ea]">
                Kedi Yetenekleri
              </h2>
              <span className="text-xs text-emerald-200/60">
                Eşleştirmelerle Pati Enerjisi biriktir
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ABILITIES.map((ab) => (
                <div
                  key={ab.id}
                  className="p-4 rounded-xl bg-[#13221c] border border-emerald-900/60 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AbilityIcon id={ab.id} />
                      <h3 className="text-sm font-semibold text-[#f4f1ea]">
                        {ab.name}
                      </h3>
                    </div>
                    <span className="font-mono-num text-xs text-amber-300/90">
                      Tuş {ab.keybind}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-emerald-100/70">
                    {ab.description}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-emerald-200/55 pt-1">
                    <span className="font-mono-num">{ab.cost} Enerji</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {ab.unlockLevel === 1
                        ? 'Başlangıçta Açık'
                        : `Bölüm ${ab.unlockLevel}’de Açılır`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5 Bosses & Levels Preview */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-xl font-semibold text-[#f4f1ea]">
                Tapınak Bölümleri ve Bosslar
              </h2>
              <span className="text-xs text-emerald-200/60">
                Zorluk kademeli artar
              </span>
            </div>

            <div className="rounded-xl bg-[#13221c] border border-emerald-900/60 divide-y divide-emerald-900/50">
              {CAMPAIGN_LEVELS.map((lvl) => (
                <div
                  key={lvl.id}
                  className="px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#f4f1ea] truncate">
                      {lvl.id}. {lvl.name}
                    </p>
                    <p className="text-xs text-emerald-200/60 truncate">
                      Boss: {lvl.boss.name} · {lvl.colorsCount} Renk
                    </p>
                  </div>
                  <span className="font-mono-num text-xs text-amber-300/85 shrink-0">
                    {lvl.boss.maxHp} CAN
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
