import { BossVisualType, LevelConfig, TOTAL_LEVELS } from './types';

export const ARENA_WIDTH = 1040;
export const ARENA_HEIGHT = 640;

interface TrackBlueprint {
  shooterPos: { x: number; y: number };
  controlPoints: Array<{ x: number; y: number }>;
  patrolCenter: { x: number; y: number };
  patrolRadiusX: number;
  patrolRadiusY: number;
}

const TRACK_BLUEPRINTS: TrackBlueprint[] = [
  // 0: Klasik Spiral (Avlu)
  {
    shooterPos: { x: 520, y: 330 },
    controlPoints: [
      { x: -30, y: 110 },
      { x: 140, y: 95 },
      { x: 420, y: 78 },
      { x: 740, y: 88 },
      { x: 930, y: 165 },
      { x: 955, y: 340 },
      { x: 880, y: 510 },
      { x: 640, y: 565 },
      { x: 320, y: 558 },
      { x: 120, y: 470 },
      { x: 95, y: 300 },
      { x: 205, y: 185 },
      { x: 460, y: 165 },
      { x: 740, y: 195 },
      { x: 825, y: 335 },
      { x: 745, y: 460 },
      { x: 515, y: 482 },
      { x: 315, y: 445 },
      { x: 245, y: 330 },
    ],
    patrolCenter: { x: 520, y: 135 },
    patrolRadiusX: 250,
    patrolRadiusY: 36,
  },
  // 1: Kıvrımlı Kanyon (Alt Nişancı)
  {
    shooterPos: { x: 520, y: 505 },
    controlPoints: [
      { x: -30, y: 115 },
      { x: 180, y: 105 },
      { x: 520, y: 92 },
      { x: 840, y: 105 },
      { x: 945, y: 180 },
      { x: 855, y: 248 },
      { x: 560, y: 245 },
      { x: 230, y: 240 },
      { x: 105, y: 312 },
      { x: 215, y: 382 },
      { x: 540, y: 378 },
      { x: 855, y: 382 },
      { x: 940, y: 472 },
      { x: 830, y: 558 },
      { x: 705, y: 545 },
    ],
    patrolCenter: { x: 520, y: 175 },
    patrolRadiusX: 290,
    patrolRadiusY: 48,
  },
  // 2: İkiz Nehir (Kum Saati)
  {
    shooterPos: { x: 520, y: 325 },
    controlPoints: [
      { x: 520, y: -30 },
      { x: 350, y: 78 },
      { x: 145, y: 120 },
      { x: 82, y: 270 },
      { x: 135, y: 470 },
      { x: 290, y: 552 },
      { x: 460, y: 515 },
      { x: 585, y: 520 },
      { x: 775, y: 552 },
      { x: 930, y: 455 },
      { x: 952, y: 255 },
      { x: 865, y: 112 },
      { x: 675, y: 98 },
      { x: 625, y: 185 },
      { x: 765, y: 225 },
      { x: 825, y: 355 },
      { x: 725, y: 455 },
      { x: 520, y: 458 },
      { x: 310, y: 445 },
      { x: 220, y: 325 },
      { x: 275, y: 205 },
      { x: 410, y: 188 },
    ],
    patrolCenter: { x: 520, y: 135 },
    patrolRadiusX: 270,
    patrolRadiusY: 44,
  },
  // 3: Altın Labirent (Üst Nişancı)
  {
    shooterPos: { x: 520, y: 255 },
    controlPoints: [
      { x: 1070, y: 105 },
      { x: 880, y: 88 },
      { x: 540, y: 78 },
      { x: 175, y: 92 },
      { x: 88, y: 195 },
      { x: 95, y: 430 },
      { x: 190, y: 555 },
      { x: 520, y: 565 },
      { x: 860, y: 552 },
      { x: 945, y: 435 },
      { x: 920, y: 275 },
      { x: 790, y: 215 },
      { x: 775, y: 375 },
      { x: 670, y: 468 },
      { x: 375, y: 468 },
      { x: 245, y: 390 },
      { x: 245, y: 235 },
      { x: 345, y: 165 },
      { x: 380, y: 360 },
      { x: 555, y: 382 },
    ],
    patrolCenter: { x: 520, y: 465 },
    patrolRadiusX: 280,
    patrolRadiusY: 46,
  },
  // 4: Kutsal Çift Spiral
  {
    shooterPos: { x: 520, y: 330 },
    controlPoints: [
      { x: -30, y: 560 },
      { x: 165, y: 565 },
      { x: 520, y: 572 },
      { x: 865, y: 555 },
      { x: 958, y: 435 },
      { x: 952, y: 205 },
      { x: 840, y: 88 },
      { x: 520, y: 78 },
      { x: 185, y: 92 },
      { x: 85, y: 215 },
      { x: 112, y: 420 },
      { x: 255, y: 492 },
      { x: 540, y: 495 },
      { x: 805, y: 468 },
      { x: 862, y: 320 },
      { x: 785, y: 175 },
      { x: 515, y: 158 },
      { x: 255, y: 188 },
      { x: 198, y: 335 },
      { x: 295, y: 422 },
      { x: 525, y: 425 },
      { x: 715, y: 392 },
      { x: 735, y: 270 },
    ],
    patrolCenter: { x: 520, y: 132 },
    patrolRadiusX: 295,
    patrolRadiusY: 42,
  },
  // 5: Hilal Bahçesi (Sol Merkez Nişancı)
  {
    shooterPos: { x: 350, y: 330 },
    controlPoints: [
      { x: 1070, y: 120 },
      { x: 860, y: 95 },
      { x: 520, y: 85 },
      { x: 210, y: 115 },
      { x: 92, y: 250 },
      { x: 95, y: 430 },
      { x: 215, y: 548 },
      { x: 520, y: 565 },
      { x: 825, y: 535 },
      { x: 940, y: 405 },
      { x: 915, y: 235 },
      { x: 750, y: 185 },
      { x: 575, y: 235 },
      { x: 645, y: 355 },
      { x: 790, y: 395 },
      { x: 700, y: 478 },
      { x: 475, y: 468 },
      { x: 455, y: 315 },
    ],
    patrolCenter: { x: 720, y: 320 },
    patrolRadiusX: 165,
    patrolRadiusY: 145,
  },
  // 6: Tapınak Dalgaları (Üst Merkez Nişancı)
  {
    shooterPos: { x: 520, y: 165 },
    controlPoints: [
      { x: -30, y: 540 },
      { x: 145, y: 552 },
      { x: 310, y: 455 },
      { x: 495, y: 548 },
      { x: 705, y: 545 },
      { x: 895, y: 470 },
      { x: 948, y: 310 },
      { x: 830, y: 225 },
      { x: 700, y: 345 },
      { x: 520, y: 385 },
      { x: 340, y: 345 },
      { x: 210, y: 235 },
      { x: 105, y: 320 },
      { x: 165, y: 435 },
      { x: 340, y: 410 },
      { x: 520, y: 465 },
      { x: 735, y: 455 },
      { x: 835, y: 355 },
    ],
    patrolCenter: { x: 520, y: 470 },
    patrolRadiusX: 290,
    patrolRadiusY: 45,
  },
  // 7: Zümrüt Çember (Sağ Merkez Nişancı)
  {
    shooterPos: { x: 690, y: 330 },
    controlPoints: [
      { x: -30, y: 120 },
      { x: 185, y: 92 },
      { x: 520, y: 84 },
      { x: 830, y: 112 },
      { x: 948, y: 250 },
      { x: 944, y: 430 },
      { x: 825, y: 548 },
      { x: 520, y: 565 },
      { x: 215, y: 535 },
      { x: 100, y: 405 },
      { x: 125, y: 235 },
      { x: 290, y: 185 },
      { x: 465, y: 235 },
      { x: 395, y: 355 },
      { x: 250, y: 395 },
      { x: 340, y: 478 },
      { x: 565, y: 468 },
      { x: 585, y: 315 },
    ],
    patrolCenter: { x: 320, y: 320 },
    patrolRadiusX: 165,
    patrolRadiusY: 145,
  },
  // 8: İkili Kavis (Merkez Nişancı)
  {
    shooterPos: { x: 520, y: 320 },
    controlPoints: [
      { x: 1070, y: 545 },
      { x: 880, y: 558 },
      { x: 520, y: 565 },
      { x: 165, y: 545 },
      { x: 85, y: 410 },
      { x: 110, y: 190 },
      { x: 260, y: 88 },
      { x: 520, y: 82 },
      { x: 780, y: 92 },
      { x: 940, y: 195 },
      { x: 925, y: 395 },
      { x: 785, y: 478 },
      { x: 520, y: 472 },
      { x: 255, y: 468 },
      { x: 185, y: 320 },
      { x: 250, y: 178 },
      { x: 520, y: 168 },
      { x: 790, y: 182 },
      { x: 830, y: 330 },
      { x: 715, y: 412 },
    ],
    patrolCenter: { x: 520, y: 138 },
    patrolRadiusX: 280,
    patrolRadiusY: 38,
  },
  // 9: Kraliyet Yolu (Alt Orta Nişancı)
  {
    shooterPos: { x: 520, y: 490 },
    controlPoints: [
      { x: 1070, y: 110 },
      { x: 855, y: 95 },
      { x: 520, y: 88 },
      { x: 185, y: 100 },
      { x: 92, y: 185 },
      { x: 185, y: 255 },
      { x: 520, y: 248 },
      { x: 855, y: 255 },
      { x: 945, y: 330 },
      { x: 835, y: 395 },
      { x: 520, y: 385 },
      { x: 185, y: 395 },
      { x: 95, y: 485 },
      { x: 215, y: 562 },
      { x: 350, y: 545 },
    ],
    patrolCenter: { x: 520, y: 172 },
    patrolRadiusX: 285,
    patrolRadiusY: 46,
  },
];

export interface ChapterMeta {
  index: number; // 1..10
  startLevel: number;
  endLevel: number;
  name: string;
  bossName: string;
  bossTitle: string;
  bossVisual: BossVisualType;
  colorsCount: number;
}

export const CAMPAIGN_CHAPTERS: ChapterMeta[] = [
  {
    index: 1,
    startLevel: 1,
    endLevel: 10,
    name: 'Yosunlu Avlu',
    bossName: 'Kral Yün Canavarı',
    bossTitle: 'Düğüm Bekçisi',
    bossVisual: 'yarn_golem',
    colorsCount: 4,
  },
  {
    index: 2,
    startLevel: 11,
    endLevel: 20,
    name: 'Güneş Sütunları',
    bossName: 'Demir Tazı',
    bossTitle: 'Bronz Muhafız',
    bossVisual: 'iron_hound',
    colorsCount: 5,
  },
  {
    index: 3,
    startLevel: 21,
    endLevel: 30,
    name: 'İkiz Nehir',
    bossName: 'Süpürge Ejderi',
    bossTitle: 'Girdap Otomatı',
    bossVisual: 'vacuum_dragon',
    colorsCount: 5,
  },
  {
    index: 4,
    startLevel: 31,
    endLevel: 40,
    name: 'Altın Labirent',
    bossName: 'Gölge Karga Lordu',
    bossTitle: 'Gece Kanadı',
    bossVisual: 'shadow_raven',
    colorsCount: 5,
  },
  {
    index: 5,
    startLevel: 41,
    endLevel: 50,
    name: 'Hilal Bahçesi',
    bossName: 'Antik Kum Sfenksi',
    bossTitle: 'Tapınağın Hükümdarı',
    bossVisual: 'sand_sphinx',
    colorsCount: 6,
  },
  {
    index: 6,
    startLevel: 51,
    endLevel: 60,
    name: 'Zümrüt Geçit',
    bossName: 'Kızıl Yumak Devi',
    bossTitle: 'Örgü Efendisi',
    bossVisual: 'yarn_golem',
    colorsCount: 6,
  },
  {
    index: 7,
    startLevel: 61,
    endLevel: 70,
    name: 'Obsidyen Köprü',
    bossName: 'Çelik Çene Tazı',
    bossTitle: 'Karanlık Koruyucu',
    bossVisual: 'iron_hound',
    colorsCount: 6,
  },
  {
    index: 8,
    startLevel: 71,
    endLevel: 80,
    name: 'Fırtına Galerisi',
    bossName: 'Kasırga Ejderi',
    bossTitle: 'Rüzgar Yutucu',
    bossVisual: 'vacuum_dragon',
    colorsCount: 6,
  },
  {
    index: 9,
    startLevel: 81,
    endLevel: 90,
    name: 'Gece Kubbesi',
    bossName: 'Ay Tutulması Kargası',
    bossTitle: 'Karanlık Tüy',
    bossVisual: 'shadow_raven',
    colorsCount: 6,
  },
  {
    index: 10,
    startLevel: 91,
    endLevel: 100,
    name: 'Bastet’in Ebedi Tahtı',
    bossName: 'Yüce Firavun Sfenksi',
    bossTitle: '100. Bölüm Efsanesi',
    bossVisual: 'sand_sphinx',
    colorsCount: 6,
  },
];

const ROMAN_SUB = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function mirrorBlueprint(bp: TrackBlueprint): TrackBlueprint {
  return {
    shooterPos: { x: ARENA_WIDTH - bp.shooterPos.x, y: bp.shooterPos.y },
    controlPoints: bp.controlPoints.map((p) => ({ x: ARENA_WIDTH - p.x, y: p.y })),
    patrolCenter: { x: ARENA_WIDTH - bp.patrolCenter.x, y: bp.patrolCenter.y },
    patrolRadiusX: bp.patrolRadiusX,
    patrolRadiusY: bp.patrolRadiusY,
  };
}

export function getLevelConfig(levelNumber: number): LevelConfig {
  const clamped = Math.max(1, Math.min(TOTAL_LEVELS, levelNumber));
  const chapterIdx = Math.floor((clamped - 1) / 10); // 0..9
  const subStage = (clamped - 1) % 10; // 0..9
  const chapter = CAMPAIGN_CHAPTERS[chapterIdx];
  const isChapterFinale = subStage === 9;

  // Pick one of 10 unique tracks and mirror on alternate chapters for 20 distinct layouts
  const rawBlueprint = TRACK_BLUEPRINTS[(clamped - 1) % TRACK_BLUEPRINTS.length];
  const blueprint = chapterIdx % 2 === 1 ? mirrorBlueprint(rawBlueprint) : rawBlueprint;

  // Smooth progressive difficulty across 1..100 with standard Zuma-length sessions (>= 3 min shortest)
  const t = (clamped - 1) / (TOTAL_LEVELS - 1); // 0..1
  const colorsCount = clamped <= 8 ? 4 : clamped <= 32 ? 5 : 6;
  const baseSpeed = Math.round(52 + Math.pow(t, 0.78) * 66 + (isChapterFinale ? 5 : 0));
  const spawnTarget = Math.round(270 + t * 205 + (isChapterFinale ? 35 : 0));
  const minChainSeconds = Math.round(172 + t * 68 + (isChapterFinale ? 18 : 0));
  const waveCount = 3 + Math.min(2, Math.floor(t * 3));
  const armorChance =
    clamped < 3 ? 0 : Math.min(0.28, Number((0.03 + t * 0.24).toFixed(2)));
  const energyOrbChance = Math.max(0.11, Number((0.15 - t * 0.03).toFixed(2)));

  // Boss scaling across 1..100 (~25-60s+ thrilling two-phase boss battle)
  const bossMaxHp = Math.round(
    (1120 + clamped * 32 + Math.pow(clamped, 1.32) * 2.8) *
      (isChapterFinale ? 1.25 : 1)
  );
  const attackInterval = Math.max(
    2.2,
    Number((5.2 - t * 2.6 - (isChapterFinale ? 0.25 : 0)).toFixed(2))
  );
  const minionInterval = Math.max(
    2.7,
    Number((4.9 - t * 1.9).toFixed(2))
  );
  const minionCount = Math.min(8, 5 + Math.floor(chapterIdx / 3));
  const bonusScore = Math.round((1500 + clamped * 220) * (isChapterFinale ? 1.5 : 1));

  const bossDisplayName = isChapterFinale
    ? `Ulu ${chapter.bossName}`
    : `${chapter.bossName} ${ROMAN_SUB[subStage]}`;

  return {
    id: clamped,
    name: `${chapter.name} ${ROMAN_SUB[subStage]}`,
    subtitle: `${colorsCount} Renk · Bölüm ${clamped}/${TOTAL_LEVELS}${
      isChapterFinale ? ' · Bölge Finali' : ''
    }`,
    colorsCount,
    baseSpeed,
    spawnTarget,
    minChainSeconds,
    waveCount,
    armorChance,
    energyOrbChance,
    shooterPos: blueprint.shooterPos,
    controlPoints: blueprint.controlPoints,
    unlockAbility:
      clamped === 1 ? 'laser_paw' : clamped === 2 ? 'rainbow_yarn' : undefined,
    boss: {
      name: bossDisplayName,
      title: isChapterFinale ? `${chapter.name} Hükümdarı` : chapter.bossTitle,
      maxHp: bossMaxHp,
      visualType: chapter.bossVisual,
      attackInterval,
      minionInterval,
      minionCount,
      bonusScore,
      patrolCenter: blueprint.patrolCenter,
      patrolRadiusX: blueprint.patrolRadiusX,
      patrolRadiusY: blueprint.patrolRadiusY,
    },
  };
}
