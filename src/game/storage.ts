import { HighScoreEntry, TOTAL_LEVELS } from './types';

const STORAGE_KEY = 'pati_zuma_highscores_v1';
const UNLOCK_KEY = 'pati_zuma_max_level_v1';
const MAX_ENTRIES = 10;

export function loadHighScores(): HighScoreEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is HighScoreEntry =>
          item &&
          typeof item.score === 'number' &&
          typeof item.playerName === 'string'
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function getBestScore(): number {
  const scores = loadHighScores();
  return scores.length > 0 ? scores[0].score : 0;
}

export function saveHighScore(entry: Omit<HighScoreEntry, 'id' | 'date'>): HighScoreEntry[] {
  const cleanName = entry.playerName.trim().slice(0, 20) || 'Pati Ustası';
  const existing = loadHighScores();
  const nextEntry: HighScoreEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    playerName: cleanName,
    score: Math.max(0, Math.round(entry.score)),
    levelReached: entry.levelReached,
    maxCombo: entry.maxCombo,
    bossesDefeated: entry.bossesDefeated,
    difficulty: entry.difficulty ?? 'normal',
    date: new Date().toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  };

  const updated = [...existing, nextEntry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }

  return updated;
}

export function clearHighScores(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function loadMaxUnlockedLevel(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const raw = window.localStorage.getItem(UNLOCK_KEY);
    const parsed = raw ? parseInt(raw, 10) : 1;
    if (Number.isNaN(parsed)) return 1;
    return Math.max(1, Math.min(TOTAL_LEVELS, parsed));
  } catch {
    return 1;
  }
}

export function saveMaxUnlockedLevel(level: number): number {
  const current = loadMaxUnlockedLevel();
  const next = Math.max(current, Math.min(TOTAL_LEVELS, level));
  try {
    window.localStorage.setItem(UNLOCK_KEY, String(next));
  } catch {
    // Ignore storage errors
  }
  return next;
}
