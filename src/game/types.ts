export type GameState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_CLEAR'
  | 'GAME_OVER'
  | 'VICTORY';

export type LevelPhase = 'CHAIN' | 'BOSS_INTRO' | 'BOSS';

export type BallColor =
  | 'ruby'
  | 'emerald'
  | 'sapphire'
  | 'amber'
  | 'amethyst'
  | 'coral';

export type AbilityId =
  | 'paw_bomb'
  | 'purr_freeze'
  | 'laser_paw'
  | 'rainbow_yarn';

export type BossVisualType =
  | 'yarn_golem'
  | 'iron_hound'
  | 'vacuum_dragon'
  | 'shadow_raven'
  | 'sand_sphinx';

export interface BallColorDef {
  id: BallColor;
  label: string;
  main: string;
  light: string;
  dark: string;
  glow: string;
  symbol: 'diamond' | 'leaf' | 'droplet' | 'star' | 'moon' | 'paw';
}

export const BALL_COLORS: Record<BallColor, BallColorDef> = {
  ruby: {
    id: 'ruby',
    label: 'Yakut',
    main: '#dc2626',
    light: '#fca5a5',
    dark: '#7f1d1d',
    glow: 'rgba(239, 68, 68, 0.55)',
    symbol: 'diamond',
  },
  emerald: {
    id: 'emerald',
    label: 'Zümrüt',
    main: '#10b981',
    light: '#a7f3d0',
    dark: '#065f46',
    glow: 'rgba(16, 185, 129, 0.55)',
    symbol: 'leaf',
  },
  sapphire: {
    id: 'sapphire',
    label: 'Safir',
    main: '#2563eb',
    light: '#93c5fd',
    dark: '#1e3a8a',
    glow: 'rgba(59, 130, 246, 0.55)',
    symbol: 'droplet',
  },
  amber: {
    id: 'amber',
    label: 'Kehribar',
    main: '#f59e0b',
    light: '#fde68a',
    dark: '#92400e',
    glow: 'rgba(245, 158, 11, 0.55)',
    symbol: 'star',
  },
  amethyst: {
    id: 'amethyst',
    label: 'Ametist',
    main: '#9333ea',
    light: '#e9d5ff',
    dark: '#581c87',
    glow: 'rgba(168, 85, 247, 0.55)',
    symbol: 'moon',
  },
  coral: {
    id: 'coral',
    label: 'Mercan',
    main: '#ec4899',
    light: '#fbcfe8',
    dark: '#831843',
    glow: 'rgba(236, 72, 153, 0.55)',
    symbol: 'paw',
  },
};

export const COLOR_ORDER: BallColor[] = [
  'ruby',
  'emerald',
  'sapphire',
  'amber',
  'amethyst',
  'coral',
];

export interface AbilityConfig {
  id: AbilityId;
  name: string;
  shortName: string;
  keybind: string;
  cost: number;
  cooldown: number; // seconds
  unlockLevel: number;
  description: string;
  instant: boolean;
}

export const ABILITIES: AbilityConfig[] = [
  {
    id: 'paw_bomb',
    name: 'Tırmık Bombası',
    shortName: 'Bomba',
    keybind: '1',
    cost: 30,
    cooldown: 6,
    unlockLevel: 1,
    description: 'Patlayıcı top fırlatarak geniş bir alandaki topları yok eder ve bossa yüksek hasar verir.',
    instant: false,
  },
  {
    id: 'purr_freeze',
    name: 'Mırıldanma Dondurması',
    shortName: 'Dondur',
    keybind: '2',
    cost: 35,
    cooldown: 9,
    unlockLevel: 1,
    description: 'Tüm zinciri geriye iter, 5 saniye boyunca topları ve boss saldırılarını yavaşlatır.',
    instant: true,
  },
  {
    id: 'laser_paw',
    name: 'Lazer Pati',
    shortName: 'Lazer',
    keybind: '3',
    cost: 45,
    cooldown: 11,
    unlockLevel: 2,
    description: 'Nişan hattı boyunca delici altın lazer gönderir, yolundaki tüm topları ve kalkanları yarar.',
    instant: false,
  },
  {
    id: 'rainbow_yarn',
    name: 'Gökkuşağı Yumağı',
    shortName: 'Gökkuşağı',
    keybind: '4',
    cost: 40,
    cooldown: 10,
    unlockLevel: 3,
    description: 'Her renkle eşleşen özel yumak atar; bossa isabet ederse kritik hasar verip sersemletir.',
    instant: false,
  },
];

export interface BossConfig {
  name: string;
  title: string;
  maxHp: number;
  visualType: BossVisualType;
  attackInterval: number; // seconds between dark orb attacks
  minionInterval: number; // seconds between spawning track orbs
  minionCount: number;
  bonusScore: number;
  patrolCenter: { x: number; y: number };
  patrolRadiusX: number;
  patrolRadiusY: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  colorsCount: number;
  baseSpeed: number;
  spawnTarget: number;
  armorChance: number;
  energyOrbChance: number;
  shooterPos: { x: number; y: number };
  controlPoints: Array<{ x: number; y: number }>;
  boss: BossConfig;
  unlockAbility?: AbilityId;
}

export interface ChainBall {
  id: number;
  color: BallColor;
  dist: number;
  radius: number;
  armor: number; // 0 = normal, 1 = armored
  special: 'none' | 'energy';
  insertAnim: number; // 0 -> 1
  hitFlash: number; // seconds remaining
  pullingBack: boolean;
}

export interface ShotBall {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: BallColor;
  kind: 'normal' | 'bomb' | 'rainbow';
  radius: number;
  trail: Array<{ x: number; y: number }>;
}

export interface BossEntity {
  config: BossConfig;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  weaknessColor: BallColor;
  weaknessTimer: number;
  attackTimer: number;
  minionTimer: number;
  patrolTime: number;
  hitFlash: number;
  stunTimer: number;
  chargeAnim: number; // 0..1 when telegraphing attack
}

export interface BossProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  angle: number;
}

export interface SpiritBolt {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: BallColor;
  damage: number;
  trail: Array<{ x: number; y: number }>;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  ring?: boolean;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  scale: number;
  life: number;
  maxLife: number;
}

export interface LaserBeamEffect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
  maxLife: number;
}

export interface HighScoreEntry {
  id: string;
  playerName: string;
  score: number;
  levelReached: number;
  maxCombo: number;
  bossesDefeated: number;
  date: string;
}

export interface LevelClearSummary {
  levelId: number;
  levelName: string;
  bossName: string;
  bossBonus: number;
  levelScore: number;
  totalScore: number;
  maxCombo: number;
  unlockedAbility?: AbilityId;
  isFinalCampaignLevel: boolean;
}

export interface HudSnapshot {
  score: number;
  highScore: number;
  level: number;
  levelName: string;
  levelSubtitle: string;
  phase: LevelPhase;
  progress: number; // 0-100
  energy: number; // 0-100
  combo: number;
  maxCombo: number;
  lives: number;
  maxLives: number;
  bossesDefeated: number;
  currentBallColor: BallColor;
  nextBallColor: BallColor;
  armedAbility: AbilityId | null;
  cooldowns: Record<AbilityId, number>;
  freezeTimer: number;
  catStunTimer: number;
  dangerRatio: number; // 0..1 proximity of head ball to portal
  boss: {
    name: string;
    title: string;
    hp: number;
    maxHp: number;
    weaknessColor: BallColor;
    stunned: boolean;
  } | null;
  muted: boolean;
}
