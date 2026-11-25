import { useState } from 'react';
import {
  Play,
  RotateCcw,
  Home,
  Trophy,
  Sparkles,
  Award,
  Trash2,
  X,
} from 'lucide-react';
import {
  ABILITIES,
  HighScoreEntry,
  LevelClearSummary,
} from '../game/types';

interface PauseModalProps {
  level: number;
  levelName: string;
  score: number;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export function PauseModal({
  level,
  levelName,
  score,
  onResume,
  onRestart,
  onMainMenu,
}: PauseModalProps) {
  return (
    <div className="fixed inset-0 z-40 bg-[#070e0b]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#13221c] border border-emerald-800/70 p-6 flex flex-col gap-6 shadow-2xl">
        <div>
          <p className="text-xs font-medium text-amber-400">
            Bölüm {level} · {levelName}
          </p>
          <h2 className="font-display text-2xl font-bold text-[#f4f1ea] mt-1">
            Oyun Duraklatıldı
          </h2>
          <p className="text-sm text-emerald-200/70 mt-1">
            Mevcut Skor:{' '}
            <span className="font-mono-num font-semibold text-amber-300">
              {score.toLocaleString('tr-TR')}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#111916] font-semibold text-sm transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Devam Et</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1b3028] hover:bg-[#233d33] text-[#f4f1ea] border border-emerald-800/60 font-medium text-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Baştan Başla</span>
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-transparent hover:bg-emerald-950/60 text-emerald-200/80 font-medium text-sm transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Ana Menüye Dön</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface LevelClearModalProps {
  summary: LevelClearSummary;
  onNextLevel: () => void;
  onFinishVictory?: () => void;
}

export function LevelClearModal({
  summary,
  onNextLevel,
  onFinishVictory,
}: LevelClearModalProps) {
  const unlockedConfig = summary.unlockedAbility
    ? ABILITIES.find((a) => a.id === summary.unlockedAbility)
    : null;

  return (
    <div className="fixed inset-0 z-40 bg-[#070e0b]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#13221c] border border-amber-500/40 p-6 flex flex-col gap-5 shadow-2xl">
        <div>
          <p className="text-xs font-semibold text-amber-400">
            {summary.isFinalCampaignLevel
              ? 'Tüm Tapınak Bölümleri Tamamlandı'
              : `Bölüm ${summary.levelId} Tamamlandı`}
          </p>
          <h2 className="font-display text-3xl font-bold text-[#f4f1ea] mt-1">
            {summary.bossName} Yenildi!
          </h2>
          <p className="text-sm text-emerald-200/75 mt-1">
            {summary.levelName} kurtarıldı. Bir sonraki aşamada hız ve zorluk artacak.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 py-4 border-y border-emerald-900/70">
          <div>
            <p className="text-xs text-emerald-200/60">Boss Bonusu</p>
            <p className="font-mono-num text-lg font-bold text-amber-400 mt-0.5">
              +{summary.bossBonus.toLocaleString('tr-TR')}
            </p>
          </div>
          <div>
            <p className="text-xs text-emerald-200/60">En Yüksek Kombo</p>
            <p className="font-mono-num text-lg font-bold text-emerald-300 mt-0.5">
              x{Math.max(1, summary.maxCombo)}
            </p>
          </div>
          <div>
            <p className="text-xs text-emerald-200/60">Toplam Skor</p>
            <p className="font-mono-num text-lg font-bold text-[#f4f1ea] mt-0.5">
              {summary.totalScore.toLocaleString('tr-TR')}
            </p>
          </div>
        </div>

        {unlockedConfig && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/35 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-300">
                Yeni Kedi Yeteneği Açıldı · Tuş {unlockedConfig.keybind}
              </p>
              <p className="text-sm font-bold text-[#f4f1ea] mt-0.5">
                {unlockedConfig.name}
              </p>
              <p className="text-xs text-emerald-100/75 mt-1">
                {unlockedConfig.description}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onNextLevel}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#111916] font-semibold text-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {summary.isFinalCampaignLevel
                ? 'Sonsuz Modda Devam Et'
                : `Bölüm ${summary.levelId + 1}’e Geç`}
            </span>
          </button>

          {summary.isFinalCampaignLevel && onFinishVictory && (
            <button
              type="button"
              onClick={onFinishVictory}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1b3028] hover:bg-[#233d33] text-[#f4f1ea] border border-emerald-800/60 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Skoru Kaydet</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface EndRunModalProps {
  isVictory: boolean;
  score: number;
  levelReached: number;
  maxCombo: number;
  bossesDefeated: number;
  scoreSaved: boolean;
  onSaveScore: (name: string) => void;
  onPlayAgain: () => void;
  onOpenScores: () => void;
  onMainMenu: () => void;
}

export function EndRunModal({
  isVictory,
  score,
  levelReached,
  maxCombo,
  bossesDefeated,
  scoreSaved,
  onSaveScore,
  onPlayAgain,
  onOpenScores,
  onMainMenu,
}: EndRunModalProps) {
  const [playerName, setPlayerName] = useState('Pati Ustası');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scoreSaved) return;
    onSaveScore(playerName);
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#070e0b]/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#13221c] border border-emerald-800/70 p-6 flex flex-col gap-5 shadow-2xl">
        <div>
          <p
            className={`text-xs font-semibold ${
              isVictory ? 'text-amber-400' : 'text-rose-400'
            }`}
          >
            {isVictory ? 'Büyük Zafer' : 'Oyun Bitti'}
          </p>
          <h2 className="font-display text-3xl font-bold text-[#f4f1ea] mt-1">
            {isVictory ? 'Tapınağın Koruyucusu!' : 'Taşlar Geçide Ulaştı'}
          </h2>
          <p className="text-sm text-emerald-200/70 mt-1">
            {isVictory
              ? 'Tüm antik bossları yenerek Kedi Tapınağı’na barış getirdin.'
              : 'Harika bir mücadeleydi. Skorunu kaydedip rekoru kırmayı tekrar dene.'}
          </p>
        </div>

        {/* Summary Numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-y border-emerald-900/70">
          <div>
            <p className="text-xs text-emerald-200/60">Final Skoru</p>
            <p className="font-mono-num text-xl font-bold text-amber-400 mt-0.5">
              {score.toLocaleString('tr-TR')}
            </p>
          </div>
          <div>
            <p className="text-xs text-emerald-200/60">Ulaşılan Bölüm</p>
            <p className="font-mono-num text-xl font-bold text-[#f4f1ea] mt-0.5">
              {levelReached}
            </p>
          </div>
          <div>
            <p className="text-xs text-emerald-200/60">Yenilen Boss</p>
            <p className="font-mono-num text-xl font-bold text-emerald-300 mt-0.5">
              {bossesDefeated}
            </p>
          </div>
          <div>
            <p className="text-xs text-emerald-200/60">En İyi Kombo</p>
            <p className="font-mono-num text-xl font-bold text-sky-300 mt-0.5">
              x{Math.max(1, maxCombo)}
            </p>
          </div>
        </div>

        {/* Save High Score Form */}
        {!scoreSaved ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <label
              htmlFor="player-name-input"
              className="text-xs font-medium text-emerald-100/80"
            >
              Skor Tablosuna Kaydet
            </label>
            <div className="flex items-center gap-2">
              <input
                id="player-name-input"
                type="text"
                maxLength={20}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Adını yaz..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0b1511] border border-emerald-800/70 text-sm text-[#f4f1ea] placeholder:text-emerald-200/35 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#111916] font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Kaydet
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-3 py-2.5 px-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60">
            <span className="text-xs font-medium text-emerald-300">
              Skorun başarıyla kaydedildi!
            </span>
            <button
              type="button"
              onClick={onOpenScores}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer whitespace-nowrap"
            >
              Tabloyu Gör
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#111916] font-semibold text-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Tekrar Oyna</span>
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1b3028] hover:bg-[#233d33] text-[#f4f1ea] border border-emerald-800/60 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Ana Menü</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface HighScoresModalProps {
  scores: HighScoreEntry[];
  onClose: () => void;
  onClearScores: () => void;
}

export function HighScoresModal({
  scores,
  onClose,
  onClearScores,
}: HighScoresModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-[#070e0b]/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[#13221c] border border-emerald-800/70 p-6 flex flex-col gap-5 shadow-2xl max-h-[88vh]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-display text-2xl font-bold text-[#f4f1ea]">
              Yüksek Skor Tablosu
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="p-2 rounded-lg bg-[#192c25] hover:bg-[#233d33] text-emerald-100 border border-emerald-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {scores.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-xl bg-[#0d1814] border border-emerald-950">
              <p className="text-sm font-medium text-emerald-100/80">
                Henüz kayıtlı bir skor yok.
              </p>
              <p className="text-xs text-emerald-200/55 mt-1">
                İlk oyunu tamamla ve Tapınak rekorunu sen belirle!
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-emerald-900/70 text-xs text-emerald-200/60">
                  <th className="py-2.5 pr-3 font-medium">Sıra</th>
                  <th className="py-2.5 px-3 font-medium">Oyuncu</th>
                  <th className="py-2.5 px-3 font-medium text-right">Skor</th>
                  <th className="py-2.5 px-3 font-medium text-right">Bölüm</th>
                  <th className="py-2.5 px-3 font-medium text-right">Boss</th>
                  <th className="py-2.5 pl-3 font-medium text-right hidden sm:table-cell">
                    Tarih
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/50 text-sm">
                {scores.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className={idx === 0 ? 'bg-amber-500/5' : undefined}
                  >
                    <td className="py-3 pr-3 font-mono-num text-xs font-semibold text-amber-400">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-3 font-medium text-[#f4f1ea]">
                      {entry.playerName}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num font-bold text-amber-300">
                      {entry.score.toLocaleString('tr-TR')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-emerald-100/80">
                      {entry.levelReached}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-emerald-300">
                      {entry.bossesDefeated}
                    </td>
                    <td className="py-3 pl-3 text-right text-xs text-emerald-200/55 hidden sm:table-cell">
                      {entry.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 pt-3 border-t border-emerald-900/70">
          {scores.length > 0 ? (
            <button
              type="button"
              onClick={onClearScores}
              className="inline-flex items-center gap-1.5 text-xs text-rose-300/80 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Tabloyu Temizle</span>
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#111916] font-semibold text-sm transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
