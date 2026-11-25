import { sound } from './audio';
import { ARENA_HEIGHT, ARENA_WIDTH, CAMPAIGN_LEVELS, getLevelConfig } from './levels';
import { renderGameCanvas } from './renderer';
import { getBestScore } from './storage';
import { SplineTrack } from './track';
import {
  ABILITIES,
  AbilityId,
  BALL_COLORS,
  BallColor,
  BossEntity,
  BossProjectile,
  ChainBall,
  COLOR_ORDER,
  FloatingText,
  HudSnapshot,
  LaserBeamEffect,
  LevelClearSummary,
  LevelConfig,
  LevelPhase,
  Particle,
  ShotBall,
  SpiritBolt,
} from './types';

const BALL_RADIUS = 17.5;
const BALL_DIAMETER = BALL_RADIUS * 2;
const SHOT_SPEED = 980;
const ROLLBACK_SPEED = 390;
const FLOOR_IMAGE_URL = '/src/assets/images/temple_stone_floor_1795594176787.jpg';

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onLevelClear: (summary: LevelClearSummary) => void;
  onGameOver: (stats: {
    score: number;
    levelReached: number;
    maxCombo: number;
    bossesDefeated: number;
  }) => void;
}

export class PatiZumaEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;
  private rafId: number | null = null;
  private lastTimestamp = 0;
  private hudEmitAccum = 0;
  private running = false;
  private paused = false;

  // Assets
  private floorImage: HTMLImageElement | null = null;

  // Persistent run state
  private score = 0;
  private levelScore = 0;
  private highScore = 0;
  private levelNumber = 1;
  private lives = 3;
  private readonly maxLives = 3;
  private combo = 0;
  private maxCombo = 0;
  private bossesDefeated = 0;
  private energy = 35;

  // Current level state
  private levelConfig: LevelConfig = getLevelConfig(1);
  private track: SplineTrack = new SplineTrack(this.levelConfig.controlPoints);
  private phase: LevelPhase = 'CHAIN';
  private bossIntroTimer = 0;
  private poppedInLevel = 0;
  private spawnedInLevel = 0;
  private introRolloutTimer = 0;
  private time = 0;

  // Cat shooter & abilities
  private pointerX = ARENA_WIDTH / 2;
  private pointerY = ARENA_HEIGHT / 2 - 140;
  private aimAngle = -Math.PI / 2;
  private catRecoil = 0;
  private catStunTimer = 0;
  private shootCooldown = 0;
  private currentBallColor: BallColor = 'ruby';
  private nextBallColor: BallColor = 'emerald';
  private armedAbility: AbilityId | null = null;
  private cooldowns: Record<AbilityId, number> = {
    paw_bomb: 0,
    purr_freeze: 0,
    laser_paw: 0,
    rainbow_yarn: 0,
  };
  private freezeTimer = 0;

  // Entities
  private nextId = 1;
  private chain: ChainBall[] = [];
  private shots: ShotBall[] = [];
  private boss: BossEntity | null = null;
  private bossProjectiles: BossProjectile[] = [];
  private spiritBolts: SpiritBolt[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private laserBeams: LaserBeamEffect[] = [];

  // Screen shake
  private shakeTimer = 0;
  private shakeIntensity = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.callbacks = callbacks;
    this.highScore = getBestScore();

    // Load arena floor texture gracefully
    const img = new Image();
    img.src = FLOOR_IMAGE_URL;
    this.floorImage = img;
  }

  public startNewGame(startLevel = 1): void {
    this.score = 0;
    this.highScore = getBestScore();
    this.lives = this.maxLives;
    this.combo = 0;
    this.maxCombo = 0;
    this.bossesDefeated = 0;
    this.energy = 40;
    this.paused = false;
    this.loadLevel(startLevel);
    this.startLoop();
  }

  public loadNextLevel(): void {
    this.paused = false;
    this.loadLevel(this.levelNumber + 1);
    this.startLoop();
  }

  public setPaused(p: boolean): void {
    this.paused = p;
    if (!p) {
      this.lastTimestamp = performance.now();
    }
    this.emitHud(true);
  }

  public destroy(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public toggleMute(): boolean {
    const muted = sound.toggleMute();
    this.emitHud(true);
    return muted;
  }

  public updatePointer(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    this.pointerX = ((clientX - rect.left) / rect.width) * ARENA_WIDTH;
    this.pointerY = ((clientY - rect.top) / rect.height) * ARENA_HEIGHT;
    this.aimAngle = Math.atan2(
      this.pointerY - this.levelConfig.shooterPos.y,
      this.pointerX - this.levelConfig.shooterPos.x
    );
  }

  public swapBalls(): void {
    if (this.paused || !this.running) return;
    if (this.armedAbility) {
      // Cancel armed ability on swap? Better: keep swap strictly swapping balls
      this.armedAbility = null;
    }
    const tmp = this.currentBallColor;
    this.currentBallColor = this.nextBallColor;
    this.nextBallColor = tmp;
    sound.playSwap();
    this.emitHud(true);
  }

  public activateAbility(abilityId: AbilityId): void {
    if (this.paused || !this.running) return;
    const cfg = ABILITIES.find((a) => a.id === abilityId);
    if (!cfg) return;
    if (this.levelNumber < cfg.unlockLevel) return;

    // Toggle off if already armed
    if (this.armedAbility === abilityId) {
      this.armedAbility = null;
      this.emitHud(true);
      return;
    }

    if (this.cooldowns[abilityId] > 0 || this.energy < cfg.cost) return;

    if (cfg.instant && abilityId === 'purr_freeze') {
      this.energy = Math.max(0, this.energy - cfg.cost);
      this.cooldowns.purr_freeze = cfg.cooldown;
      this.freezeTimer = 5.5;
      sound.playAbility('purr_freeze');
      this.triggerShake(0.25, 5);

      // Push chain backward safely
      for (const b of this.chain) {
        b.dist = Math.max(-BALL_DIAMETER * 2, b.dist - 95);
      }

      // Frost wave ring from cat
      const sp = this.levelConfig.shooterPos;
      this.particles.push({
        x: sp.x,
        y: sp.y,
        vx: 0,
        vy: 0,
        radius: 36,
        color: '#38bdf8',
        alpha: 0.9,
        life: 0.55,
        maxLife: 0.55,
        ring: true,
      });
      this.spawnFloatingText(sp.x, sp.y - 54, 'MIRILDANMA DONDURMASI!', '#7dd3fc', 1.15);
      this.emitHud(true);
      return;
    }

    this.armedAbility = abilityId;
    sound.playSwap();
    this.emitHud(true);
  }

  public fire(): void {
    if (this.paused || !this.running) return;
    if (this.phase === 'BOSS_INTRO') return;
    if (this.shootCooldown > 0 || this.catStunTimer > 0) return;

    const sp = this.levelConfig.shooterPos;

    // Laser Paw fires immediately along aim vector!
    if (this.armedAbility === 'laser_paw') {
      const cfg = ABILITIES.find((a) => a.id === 'laser_paw')!;
      if (this.energy >= cfg.cost && this.cooldowns.laser_paw <= 0) {
        this.energy -= cfg.cost;
        this.cooldowns.laser_paw = cfg.cooldown;
        this.armedAbility = null;
        this.catRecoil = 1;
        this.shootCooldown = 0.28;
        this.fireLaserPaw();
        this.emitHud(true);
        return;
      }
      this.armedAbility = null;
    }

    let kind: 'normal' | 'bomb' | 'rainbow' = 'normal';
    if (this.armedAbility === 'paw_bomb') {
      const cfg = ABILITIES.find((a) => a.id === 'paw_bomb')!;
      if (this.energy >= cfg.cost && this.cooldowns.paw_bomb <= 0) {
        this.energy -= cfg.cost;
        this.cooldowns.paw_bomb = cfg.cooldown;
        kind = 'bomb';
      }
      this.armedAbility = null;
    } else if (this.armedAbility === 'rainbow_yarn') {
      const cfg = ABILITIES.find((a) => a.id === 'rainbow_yarn')!;
      if (this.energy >= cfg.cost && this.cooldowns.rainbow_yarn <= 0) {
        this.energy -= cfg.cost;
        this.cooldowns.rainbow_yarn = cfg.cooldown;
        kind = 'rainbow';
      }
      this.armedAbility = null;
    }

    const muzzleDist = 36;
    const sx = sp.x + Math.cos(this.aimAngle) * muzzleDist;
    const sy = sp.y + Math.sin(this.aimAngle) * muzzleDist;

    this.shots.push({
      id: this.nextId++,
      x: sx,
      y: sy,
      vx: Math.cos(this.aimAngle) * SHOT_SPEED,
      vy: Math.sin(this.aimAngle) * SHOT_SPEED,
      color: this.currentBallColor,
      kind,
      radius: BALL_RADIUS,
      trail: [],
    });

    this.catRecoil = 1;
    this.shootCooldown = 0.17;
    if (kind === 'normal') {
      sound.playShoot();
      this.currentBallColor = this.nextBallColor;
      this.nextBallColor = this.pickSmartColor();
    } else {
      sound.playShoot();
    }
    this.emitHud(true);
  }

  private loadLevel(levelNum: number): void {
    this.levelNumber = levelNum;
    this.levelConfig = getLevelConfig(levelNum);
    this.track = new SplineTrack(this.levelConfig.controlPoints, 2.5);
    this.phase = 'CHAIN';
    this.bossIntroTimer = 0;
    this.poppedInLevel = 0;
    this.spawnedInLevel = 0;
    this.levelScore = 0;
    this.combo = 0;
    this.introRolloutTimer = 2.0;

    this.chain = [];
    this.shots = [];
    this.boss = null;
    this.bossProjectiles = [];
    this.spiritBolts = [];
    this.particles = [];
    this.floatingTexts = [];
    this.laserBeams = [];
    this.armedAbility = null;
    this.freezeTimer = 0;
    this.catStunTimer = 0;
    this.cooldowns = {
      paw_bomb: 0,
      purr_freeze: 0,
      laser_paw: 0,
      rainbow_yarn: 0,
    };

    // Spawn initial opening batch of 16 balls cleanly queued along entrance
    const initialCount = 16;
    let lastColor = this.pickRandomLevelColor();
    for (let i = 0; i < initialCount; i++) {
      // Cluster colors gently so openings feel rewarding
      const color = Math.random() < 0.42 ? lastColor : this.pickRandomLevelColor();
      lastColor = color;
      this.chain.push({
        id: this.nextId++,
        color,
        dist: -BALL_DIAMETER * (initialCount - i),
        radius: BALL_RADIUS,
        armor: 0,
        special: i === 6 || i === 13 ? 'energy' : 'none',
        insertAnim: 1,
        hitFlash: 0,
        pullingBack: false,
      });
      this.spawnedInLevel++;
    }

    this.currentBallColor = this.pickSmartColor();
    this.nextBallColor = this.pickSmartColor();
    this.emitHud(true);
  }

  private startLoop(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTimestamp) / 1000));
      this.lastTimestamp = now;
      if (!this.paused) {
        this.update(dt);
      }
      this.render();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private getAllowedColors(): BallColor[] {
    return COLOR_ORDER.slice(0, this.levelConfig.colorsCount);
  }

  private pickRandomLevelColor(): BallColor {
    const allowed = this.getAllowedColors();
    return allowed[Math.floor(Math.random() * allowed.length)];
  }

  private pickSmartColor(): BallColor {
    const candidates = new Set<BallColor>();
    for (const b of this.chain) {
      if (b.dist >= -BALL_DIAMETER) {
        candidates.add(b.color);
      }
    }
    if (this.boss && this.phase === 'BOSS') {
      candidates.add(this.boss.weaknessColor);
      // 35% chance to favor weakness color during boss fight
      if (Math.random() < 0.35) {
        return this.boss.weaknessColor;
      }
    }
    const list = Array.from(candidates);
    if (list.length === 0) return this.pickRandomLevelColor();
    return list[Math.floor(Math.random() * list.length)];
  }

  private ensureValidLoadedBalls(): void {
    if (this.chain.length === 0 && !this.boss) return;
    const valid = new Set<BallColor>();
    for (const b of this.chain) valid.add(b.color);
    if (this.boss) valid.add(this.boss.weaknessColor);
    if (valid.size === 0) return;

    if (!valid.has(this.currentBallColor)) {
      this.currentBallColor = this.pickSmartColor();
    }
    if (!valid.has(this.nextBallColor)) {
      this.nextBallColor = this.pickSmartColor();
    }
  }

  private update(dt: number): void {
    this.time += dt;
    this.catRecoil = Math.max(0, this.catRecoil - dt * 5.5);
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    this.catStunTimer = Math.max(0, this.catStunTimer - dt);
    this.freezeTimer = Math.max(0, this.freezeTimer - dt);
    this.introRolloutTimer = Math.max(0, this.introRolloutTimer - dt);

    for (const key of Object.keys(this.cooldowns) as AbilityId[]) {
      this.cooldowns[key] = Math.max(0, this.cooldowns[key] - dt);
    }

    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    }

    // Handle Boss Intro pause/dramatic entrance
    if (this.phase === 'BOSS_INTRO') {
      this.bossIntroTimer += dt;
      this.updateParticles(dt);
      this.updateFloatingTexts(dt);
      if (this.bossIntroTimer >= 2.05) {
        this.phase = 'BOSS';
        this.spawnBossMinionWave(this.levelConfig.boss.minionCount);
        this.emitHud(true);
      }
      return;
    }

    this.updateChain(dt);
    this.updateShots(dt);
    if (this.phase === 'BOSS' && this.boss) {
      this.updateBoss(dt);
    }
    this.updateSpiritBolts(dt);
    this.updateBossProjectiles(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.updateLaserBeams(dt);

    // Check transition to Boss Battle in CHAIN phase
    if (this.phase === 'CHAIN' && this.poppedInLevel >= this.levelConfig.spawnTarget) {
      this.beginBossPhase();
    }

    // Periodic HUD snapshot sync (~15Hz)
    this.hudEmitAccum += dt;
    if (this.hudEmitAccum >= 0.065) {
      this.hudEmitAccum = 0;
      this.emitHud(false);
    }
  }

  private updateChain(dt: number): void {
    // 1. Spawn new balls at entrance during CHAIN phase
    if (this.phase === 'CHAIN' && this.poppedInLevel < this.levelConfig.spawnTarget) {
      const tailDist = this.chain.length > 0 ? this.chain[0].dist : BALL_DIAMETER * 2;
      if (tailDist >= 0) {
        const lastColor = this.chain.length > 0 ? this.chain[0].color : this.pickRandomLevelColor();
        const color = Math.random() < 0.36 ? lastColor : this.pickRandomLevelColor();
        const armor = Math.random() < this.levelConfig.armorChance ? 1 : 0;
        const special =
          armor === 0 && Math.random() < this.levelConfig.energyOrbChance ? 'energy' : 'none';

        this.chain.unshift({
          id: this.nextId++,
          color,
          dist: tailDist - BALL_DIAMETER,
          radius: BALL_RADIUS,
          armor,
          special,
          insertAnim: 1,
          hitFlash: 0,
          pullingBack: false,
        });
        this.spawnedInLevel++;
      }
    }

    if (this.chain.length === 0) return;

    // 2. Calculate base conveyor speed
    let speed = this.levelConfig.baseSpeed;
    if (this.introRolloutTimer > 0) {
      speed *= 2.8;
    } else if (this.phase === 'BOSS') {
      speed *= 0.88; // Slight pacing balance while fighting boss
    }
    if (this.freezeTimer > 0) {
      speed *= 0.22;
    }

    // 3. Push the tail ball forward
    this.chain[0].dist += speed * dt;

    // 4. Propagate forward push & evaluate magnetic gap rollback
    for (let i = 0; i < this.chain.length; i++) {
      const b = this.chain[i];
      if (b.insertAnim < 1) {
        b.insertAnim = Math.min(1, b.insertAnim + dt * 7);
      }
      if (b.hitFlash > 0) {
        b.hitFlash = Math.max(0, b.hitFlash - dt);
      }
      b.pullingBack = false;
    }

    // Forward spacing enforcement
    for (let i = 1; i < this.chain.length; i++) {
      const prev = this.chain[i - 1];
      const curr = this.chain[i];
      const minNextDist = prev.dist + BALL_DIAMETER;
      if (curr.dist < minNextDist) {
        curr.dist = minNextDist;
      }
    }

    // Magnetic gap rollback: if a gap has matching colors on both sides, pull front segment backward!
    let mergedIndex = -1;
    for (let i = 0; i < this.chain.length - 1; i++) {
      const rear = this.chain[i];
      const front = this.chain[i + 1];
      const gap = front.dist - rear.dist;

      if (gap > BALL_DIAMETER + 1.5) {
        if (rear.color === front.color) {
          // Pull front contiguous sub-segment backward!
          const pullDelta = ROLLBACK_SPEED * dt;
          let segEnd = i + 1;
          while (
            segEnd < this.chain.length - 1 &&
            this.chain[segEnd + 1].dist - this.chain[segEnd].dist <= BALL_DIAMETER + 2
          ) {
            segEnd++;
          }

          const actualPull = Math.min(pullDelta, gap - BALL_DIAMETER);
          for (let k = i + 1; k <= segEnd; k++) {
            this.chain[k].dist -= actualPull;
            this.chain[k].pullingBack = true;
          }

          // Did the magnetic gap just close?
          if (this.chain[i + 1].dist - rear.dist <= BALL_DIAMETER + 1.5) {
            this.chain[i + 1].dist = rear.dist + BALL_DIAMETER;
            mergedIndex = i;
          }
        }
      }
    }

    if (mergedIndex !== -1) {
      sound.playInsert();
      this.checkAndResolveMatches(mergedIndex, true);
    }

    // 5. Check if head ball reached the Danger Portal
    if (this.chain.length > 0) {
      const head = this.chain[this.chain.length - 1];
      if (head.dist >= this.track.totalLength - 6) {
        this.handlePortalBreach();
      }
    }
  }

  private updateShots(dt: number): void {
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const shot = this.shots[i];
      shot.trail.push({ x: shot.x, y: shot.y });
      if (shot.trail.length > 7) shot.trail.shift();

      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;

      // Remove out-of-bounds shots
      if (
        shot.x < -50 ||
        shot.x > ARENA_WIDTH + 50 ||
        shot.y < -50 ||
        shot.y > ARENA_HEIGHT + 50
      ) {
        this.shots.splice(i, 1);
        this.combo = 0;
        continue;
      }

      // 1. Check collision with Boss Dark Projectiles (player can shoot them down!)
      let consumed = false;
      for (let p = this.bossProjectiles.length - 1; p >= 0; p--) {
        const bp = this.bossProjectiles[p];
        if (Math.hypot(shot.x - bp.x, shot.y - bp.y) < shot.radius + bp.radius + 4) {
          this.bossProjectiles.splice(p, 1);
          this.spawnExplosionParticles(bp.x, bp.y, '#fb7185', 14);
          this.addScore(80);
          this.addEnergy(12);
          this.spawnFloatingText(bp.x, bp.y - 10, 'ENGELLENDİ! +80', '#fda4af', 1.0);
          sound.playMatch(2);
          if (shot.kind === 'bomb') {
            this.detonatePawBomb(shot.x, shot.y);
          }
          this.shots.splice(i, 1);
          consumed = true;
          break;
        }
      }
      if (consumed) continue;

      // 2. Check collision with Boss directly
      if (this.boss && this.phase === 'BOSS') {
        const distToBoss = Math.hypot(shot.x - this.boss.x, shot.y - this.boss.y);
        if (distToBoss < shot.radius + this.boss.radius) {
          this.handleShotHitBoss(shot);
          this.shots.splice(i, 1);
          continue;
        }
      }

      // 3. Check collision with Chain Balls
      let hitIdx = -1;
      let bestDist = Infinity;
      for (let c = 0; c < this.chain.length; c++) {
        const cb = this.chain[c];
        if (cb.dist < 0) continue;
        const pt = this.track.getPointAt(cb.dist);
        const d = Math.hypot(shot.x - pt.x, shot.y - pt.y);
        if (d < shot.radius + cb.radius - 2 && d < bestDist) {
          bestDist = d;
          hitIdx = c;
        }
      }

      if (hitIdx !== -1) {
        if (shot.kind === 'bomb') {
          this.detonatePawBomb(shot.x, shot.y);
        } else if (shot.kind === 'rainbow') {
          this.handleRainbowInsert(shot, hitIdx);
        } else {
          this.insertShotIntoChain(shot, hitIdx);
        }
        this.shots.splice(i, 1);
      }
    }
  }

  private insertShotIntoChain(shot: ShotBall, hitIdx: number): void {
    const targetBall = this.chain[hitIdx];
    const pt = this.track.getPointAt(targetBall.dist);
    const tangentX = Math.cos(pt.angle);
    const tangentY = Math.sin(pt.angle);
    const relX = shot.x - pt.x;
    const relY = shot.y - pt.y;
    const dot = relX * tangentX + relY * tangentY;

    const insertIdx = dot >= 0 ? hitIdx + 1 : hitIdx;
    const newDist = dot >= 0 ? targetBall.dist + BALL_DIAMETER : targetBall.dist;

    const newBall: ChainBall = {
      id: this.nextId++,
      color: shot.color,
      dist: newDist,
      radius: BALL_RADIUS,
      armor: 0,
      special: 'none',
      insertAnim: 0,
      hitFlash: 0.14,
      pullingBack: false,
    };

    this.chain.splice(insertIdx, 0, newBall);

    // Push forward all balls ahead of insertIdx so nothing overlaps
    for (let k = insertIdx + 1; k < this.chain.length; k++) {
      const needed = this.chain[k - 1].dist + BALL_DIAMETER;
      if (this.chain[k].dist < needed) {
        this.chain[k].dist = needed;
      }
    }

    sound.playInsert();
    const matched = this.checkAndResolveMatches(insertIdx, false);
    if (!matched) {
      this.combo = 0;
    }
    this.ensureValidLoadedBalls();
  }

  private handleRainbowInsert(shot: ShotBall, hitIdx: number): void {
    sound.playAbility('rainbow_yarn');
    const targetColor = this.chain[hitIdx].color;
    // Pop struck ball + up to 2 neighbors on each side + all matching connected balls
    const toRemove = new Set<number>();
    toRemove.add(hitIdx);

    // Expand left and right by 2 balls regardless of color, plus same-color continuations
    for (let d = 1; d <= 2; d++) {
      if (hitIdx - d >= 0) toRemove.add(hitIdx - d);
      if (hitIdx + d < this.chain.length) toRemove.add(hitIdx + d);
    }

    let left = Math.max(0, hitIdx - 2);
    while (left > 0 && this.chain[left - 1].color === targetColor) {
      left--;
      toRemove.add(left);
    }
    let right = Math.min(this.chain.length - 1, hitIdx + 2);
    while (right < this.chain.length - 1 && this.chain[right + 1].color === targetColor) {
      right++;
      toRemove.add(right);
    }

    const indices = Array.from(toRemove).sort((a, b) => a - b);
    const pt = this.track.getPointAt(this.chain[hitIdx].dist);
    this.triggerShake(0.22, 6);
    this.particles.push({
      x: pt.x,
      y: pt.y,
      vx: 0,
      vy: 0,
      radius: 22,
      color: '#e879f9',
      alpha: 0.95,
      life: 0.45,
      maxLife: 0.45,
      ring: true,
    });
    this.destroyChainIndices(indices, true, 'GÖKKUŞAĞI!');
  }

  private checkAndResolveMatches(pivotIdx: number, isChainRollback: boolean): boolean {
    if (pivotIdx < 0 || pivotIdx >= this.chain.length) return false;
    const color = this.chain[pivotIdx].color;

    let left = pivotIdx;
    while (
      left > 0 &&
      this.chain[left - 1].color === color &&
      this.chain[left].dist - this.chain[left - 1].dist <= BALL_DIAMETER + 4
    ) {
      left--;
    }

    let right = pivotIdx;
    while (
      right < this.chain.length - 1 &&
      this.chain[right + 1].color === color &&
      this.chain[right + 1].dist - this.chain[right].dist <= BALL_DIAMETER + 4
    ) {
      right++;
    }

    const count = right - left + 1;
    if (count < 3) return false;

    this.combo = isChainRollback ? this.combo + 1 : Math.max(1, this.combo + 1);
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    const indices: number[] = [];
    for (let i = left; i <= right; i++) {
      indices.push(i);
    }

    sound.playMatch(this.combo);
    this.destroyChainIndices(
      indices,
      false,
      this.combo >= 2 ? `ZİNCİR x${this.combo}!` : undefined
    );
    return true;
  }

  private destroyChainIndices(
    indices: number[],
    pierceArmor: boolean,
    bannerText?: string
  ): void {
    const actuallyRemove: number[] = [];
    let sumX = 0;
    let sumY = 0;
    let poppedCount = 0;
    let energyGained = 0;
    let leadColor: BallColor = 'amber';

    for (const idx of indices) {
      const ball = this.chain[idx];
      if (!ball) continue;
      const pt = this.track.getPointAt(ball.dist);

      if (ball.armor > 0 && !pierceArmor) {
        // Crack armor instead of immediate removal
        ball.armor = 0;
        ball.hitFlash = 0.25;
        this.spawnExplosionParticles(pt.x, pt.y, '#cbd5e1', 7);
        this.spawnFloatingText(pt.x, pt.y - 12, 'ZIRH KIRILDI', '#e2e8f0', 0.88);
      } else {
        actuallyRemove.push(idx);
        leadColor = ball.color;
        sumX += pt.x;
        sumY += pt.y;
        poppedCount++;
        this.spawnExplosionParticles(pt.x, pt.y, BALL_COLORS[ball.color].main, 9);
        if (ball.special === 'energy') {
          energyGained += 22;
        }
      }
    }

    // Remove in reverse order
    actuallyRemove.sort((a, b) => b - a);
    for (const idx of actuallyRemove) {
      this.chain.splice(idx, 1);
    }

    if (poppedCount === 0) return;

    const cx = sumX / poppedCount;
    const cy = sumY / poppedCount;
    const comboMult = Math.max(1, this.combo);
    const points = poppedCount * 40 * comboMult + (poppedCount >= 5 ? 120 : 0);

    this.addScore(points);
    this.addEnergy(poppedCount * 3.5 + energyGained + (comboMult > 1 ? 8 : 0));

    if (this.phase === 'CHAIN') {
      this.poppedInLevel += poppedCount;
    }

    if (bannerText) {
      this.spawnFloatingText(cx, cy - 22, `${bannerText} +${points}`, '#fde047', 1.18);
    } else {
      this.spawnFloatingText(cx, cy - 12, `+${points}`, '#fef9c3', 0.98);
    }

    if (energyGained > 0) {
      this.spawnFloatingText(cx, cy + 12, `+${energyGained} ENERJİ`, '#fbbf24', 0.9);
    }

    // During Boss Battle: every match fires homing Pati Spirit Bolts at the Boss!
    if (this.phase === 'BOSS' && this.boss) {
      const boltCount = Math.min(3, Math.max(1, Math.floor(poppedCount / 2)));
      for (let b = 0; b < boltCount; b++) {
        const angle = (b / boltCount) * Math.PI * 2 + Math.random();
        this.spiritBolts.push({
          id: this.nextId++,
          x: cx,
          y: cy,
          vx: Math.cos(angle) * 240,
          vy: Math.sin(angle) * 240,
          color: leadColor,
          damage: 28 + comboMult * 10,
          trail: [],
        });
      }
    }

    this.ensureValidLoadedBalls();
  }

  private detonatePawBomb(x: number, y: number): void {
    sound.playAbility('paw_bomb');
    this.triggerShake(0.32, 9);

    const blastRadius = 112;
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 26,
      color: '#fb923c',
      alpha: 0.95,
      life: 0.42,
      maxLife: 0.42,
      ring: true,
    });
    this.spawnExplosionParticles(x, y, '#f97316', 24);
    this.spawnExplosionParticles(x, y, '#fde047', 14);

    // Destroy all chain balls inside blast radius (pierces armor!)
    const hitIndices: number[] = [];
    for (let i = 0; i < this.chain.length; i++) {
      const pt = this.track.getPointAt(this.chain[i].dist);
      if (Math.hypot(pt.x - x, pt.y - y) <= blastRadius) {
        hitIndices.push(i);
      }
    }
    if (hitIndices.length > 0) {
      this.destroyChainIndices(hitIndices, true, 'TIRMİK BOMBASI!');
    }

    // Also blast Boss if inside extended radius
    if (this.boss && this.phase === 'BOSS') {
      if (Math.hypot(this.boss.x - x, this.boss.y - y) <= blastRadius + this.boss.radius) {
        this.damageBoss(92, true, 'BOMBA! -92');
      }
    }
  }

  private fireLaserPaw(): void {
    sound.playAbility('laser_paw');
    this.triggerShake(0.28, 7);

    const sp = this.levelConfig.shooterPos;
    const dx = Math.cos(this.aimAngle);
    const dy = Math.sin(this.aimAngle);
    const len = 1280;
    const x2 = sp.x + dx * len;
    const y2 = sp.y + dy * len;

    this.laserBeams.push({
      x1: sp.x + dx * 32,
      y1: sp.y + dy * 32,
      x2,
      y2,
      life: 0.38,
      maxLife: 0.38,
    });

    // Helper: perpendicular distance from point to ray
    const rayDist = (px: number, py: number): number => {
      const rx = px - sp.x;
      const ry = py - sp.y;
      const proj = rx * dx + ry * dy;
      if (proj < 0) return Infinity;
      const cx = sp.x + dx * proj;
      const cy = sp.y + dy * proj;
      return Math.hypot(px - cx, py - cy);
    };

    const hitIndices: number[] = [];
    for (let i = 0; i < this.chain.length; i++) {
      const pt = this.track.getPointAt(this.chain[i].dist);
      if (rayDist(pt.x, pt.y) <= BALL_RADIUS + 18) {
        hitIndices.push(i);
      }
    }
    if (hitIndices.length > 0) {
      this.destroyChainIndices(hitIndices, true, 'LAZER PATİ!');
    }

    // Vaporize boss projectiles along laser
    for (let p = this.bossProjectiles.length - 1; p >= 0; p--) {
      const bp = this.bossProjectiles[p];
      if (rayDist(bp.x, bp.y) <= bp.radius + 20) {
        this.spawnExplosionParticles(bp.x, bp.y, '#fde047', 12);
        this.bossProjectiles.splice(p, 1);
      }
    }

    // Hit Boss along laser
    if (this.boss && this.phase === 'BOSS') {
      if (rayDist(this.boss.x, this.boss.y) <= this.boss.radius + 20) {
        this.damageBoss(115, true, 'LAZER! -115');
      }
    }
  }

  private beginBossPhase(): void {
    this.phase = 'BOSS_INTRO';
    this.bossIntroTimer = 0;
    sound.playBossWarning();
    this.triggerShake(0.4, 6);

    // Convert any remaining straggler balls into bonus score sparks so boss arena starts clean
    let bonus = 0;
    for (const ball of this.chain) {
      if (ball.dist >= 0) {
        const pt = this.track.getPointAt(ball.dist);
        this.spawnExplosionParticles(pt.x, pt.y, '#facc15', 5);
        bonus += 15;
      }
    }
    if (bonus > 0) {
      this.addScore(bonus);
    }
    this.chain = [];
    this.shots = [];

    const bCfg = this.levelConfig.boss;
    this.boss = {
      config: bCfg,
      x: bCfg.patrolCenter.x,
      y: bCfg.patrolCenter.y,
      radius: 46,
      hp: bCfg.maxHp,
      maxHp: bCfg.maxHp,
      weaknessColor: this.pickRandomLevelColor(),
      weaknessTimer: 6.5,
      attackTimer: bCfg.attackInterval * 0.75,
      minionTimer: bCfg.minionInterval,
      patrolTime: 0,
      hitFlash: 0,
      stunTimer: 0,
      chargeAnim: 0,
    };

    this.currentBallColor = this.boss.weaknessColor;
    this.nextBallColor = this.pickRandomLevelColor();
    this.emitHud(true);
  }

  private spawnBossMinionWave(count: number): void {
    let tailDist = this.chain.length > 0 ? this.chain[0].dist : BALL_DIAMETER * count;
    if (this.chain.length === 0) tailDist = 0;
    let lastColor = this.pickRandomLevelColor();

    for (let i = 0; i < count; i++) {
      const color = Math.random() < 0.45 ? lastColor : this.pickRandomLevelColor();
      lastColor = color;
      tailDist -= BALL_DIAMETER;
      this.chain.unshift({
        id: this.nextId++,
        color,
        dist: tailDist,
        radius: BALL_RADIUS,
        armor: Math.random() < this.levelConfig.armorChance * 0.7 ? 1 : 0,
        special: i === Math.floor(count / 2) ? 'energy' : 'none',
        insertAnim: 1,
        hitFlash: 0,
        pullingBack: false,
      });
    }
  }

  private updateBoss(dt: number): void {
    const boss = this.boss;
    if (!boss) return;

    const slowMult = this.freezeTimer > 0 ? 0.35 : 1;
    boss.hitFlash = Math.max(0, boss.hitFlash - dt);

    if (boss.stunTimer > 0) {
      boss.stunTimer = Math.max(0, boss.stunTimer - dt);
      boss.chargeAnim = 0;
      return;
    }

    // Smooth figure-8 patrol motion
    boss.patrolTime += dt * 0.82 * slowMult;
    boss.x =
      boss.config.patrolCenter.x +
      Math.sin(boss.patrolTime) * boss.config.patrolRadiusX;
    boss.y =
      boss.config.patrolCenter.y +
      Math.sin(boss.patrolTime * 2) * boss.config.patrolRadiusY;

    // Rotate weakness color periodically
    boss.weaknessTimer -= dt;
    if (boss.weaknessTimer <= 0) {
      boss.weaknessTimer = 6.8;
      const allowed = this.getAllowedColors().filter((c) => c !== boss.weaknessColor);
      boss.weaknessColor = allowed[Math.floor(Math.random() * allowed.length)] ?? 'ruby';
      this.spawnFloatingText(
        boss.x,
        boss.y - boss.radius - 32,
        `ZAYIF RENK: ${BALL_COLORS[boss.weaknessColor].label.toUpperCase()}`,
        BALL_COLORS[boss.weaknessColor].light,
        0.95
      );
    }

    // Periodic minion orb summons onto the track (keep cap so track stays fair)
    boss.minionTimer -= dt * slowMult;
    if (boss.minionTimer <= 0) {
      boss.minionTimer = boss.config.minionInterval;
      if (this.chain.length < 22) {
        this.spawnBossMinionWave(boss.config.minionCount);
      }
    }

    // Periodic dark orb projectile attack toward the cat
    boss.attackTimer -= dt * slowMult;
    if (boss.attackTimer <= 1.0 && boss.attackTimer > 0) {
      boss.chargeAnim = 1 - boss.attackTimer;
    } else {
      boss.chargeAnim = 0;
    }

    if (boss.attackTimer <= 0) {
      boss.attackTimer = boss.config.attackInterval;
      boss.chargeAnim = 0;
      const sp = this.levelConfig.shooterPos;
      const a = Math.atan2(sp.y - boss.y, sp.x - boss.x);
      const speed = 175 + this.levelNumber * 12;
      this.bossProjectiles.push({
        id: this.nextId++,
        x: boss.x,
        y: boss.y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        radius: 16,
        hp: 1,
        angle: 0,
      });
    }
  }

  private handleShotHitBoss(shot: ShotBall): void {
    if (!this.boss) return;

    if (shot.kind === 'bomb') {
      this.detonatePawBomb(shot.x, shot.y);
      return;
    }

    if (shot.kind === 'rainbow') {
      sound.playAbility('rainbow_yarn');
      this.boss.stunTimer = 3.2;
      this.damageBoss(75, true, 'SERSEMLETME! -75');
      return;
    }

    const isCrit = shot.color === this.boss.weaknessColor;
    const dmg = isCrit ? 48 : 20;
    this.damageBoss(dmg, isCrit, isCrit ? `KRİTİK! -${dmg}` : `-${dmg}`);
  }

  private damageBoss(amount: number, isCrit: boolean, label: string): void {
    if (!this.boss) return;
    this.boss.hp = Math.max(0, this.boss.hp - amount);
    this.boss.hitFlash = 0.16;
    sound.playBossHit(isCrit);
    this.addScore(isCrit ? 120 : 45);
    this.addEnergy(isCrit ? 9 : 4);

    if (isCrit) {
      this.triggerShake(0.16, 4.5);
    }

    this.spawnExplosionParticles(
      this.boss.x,
      this.boss.y,
      isCrit ? '#fde047' : '#f8fafc',
      isCrit ? 14 : 7
    );
    this.spawnFloatingText(
      this.boss.x + (Math.random() - 0.5) * 30,
      this.boss.y - this.boss.radius - 12,
      label,
      isCrit ? '#fde047' : '#e2e8f0',
      isCrit ? 1.2 : 0.95
    );

    if (this.boss.hp <= 0) {
      this.handleBossDefeated();
    }
    this.emitHud(true);
  }

  private handleBossDefeated(): void {
    if (!this.boss) return;
    const defeatedBoss = this.boss;
    this.bossesDefeated++;

    sound.playLevelClear();
    this.triggerShake(0.45, 11);

    // Big celebratory burst
    for (let i = 0; i < 4; i++) {
      this.spawnExplosionParticles(
        defeatedBoss.x + (Math.random() - 0.5) * 60,
        defeatedBoss.y + (Math.random() - 0.5) * 60,
        ['#facc15', '#34d399', '#f472b6', '#60a5fa'][i],
        18
      );
    }

    this.addScore(defeatedBoss.config.bonusScore);
    this.boss = null;
    this.bossProjectiles = [];
    this.chain = [];
    this.shots = [];
    this.paused = true;

    this.emitHud(true);
    this.callbacks.onLevelClear({
      levelId: this.levelNumber,
      levelName: this.levelConfig.name,
      bossName: defeatedBoss.config.name,
      bossBonus: defeatedBoss.config.bonusScore,
      levelScore: this.levelScore,
      totalScore: this.score,
      maxCombo: this.maxCombo,
      unlockedAbility: this.levelConfig.unlockAbility,
      isFinalCampaignLevel: this.levelNumber === CAMPAIGN_LEVELS.length,
    });
  }

  private updateSpiritBolts(dt: number): void {
    for (let i = this.spiritBolts.length - 1; i >= 0; i--) {
      const bolt = this.spiritBolts[i];
      bolt.trail.push({ x: bolt.x, y: bolt.y });
      if (bolt.trail.length > 8) bolt.trail.shift();

      if (!this.boss) {
        this.spiritBolts.splice(i, 1);
        continue;
      }

      const dx = this.boss.x - bolt.x;
      const dy = this.boss.y - bolt.y;
      const dist = Math.hypot(dx, dy);

      if (dist < this.boss.radius + 10) {
        this.damageBoss(bolt.damage, true, `PATİ RUHU! -${bolt.damage}`);
        this.spiritBolts.splice(i, 1);
        continue;
      }

      // Steer strongly toward boss
      const desiredVx = (dx / dist) * 680;
      const desiredVy = (dy / dist) * 680;
      bolt.vx += (desiredVx - bolt.vx) * Math.min(1, dt * 10);
      bolt.vy += (desiredVy - bolt.vy) * Math.min(1, dt * 10);
      bolt.x += bolt.vx * dt;
      bolt.y += bolt.vy * dt;
    }
  }

  private updateBossProjectiles(dt: number): void {
    const sp = this.levelConfig.shooterPos;
    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const bp = this.bossProjectiles[i];
      bp.x += bp.vx * dt;
      bp.y += bp.vy * dt;
      bp.angle += dt * 4.5;

      if (Math.hypot(bp.x - sp.x, bp.y - sp.y) < bp.radius + 36) {
        this.bossProjectiles.splice(i, 1);
        this.catStunTimer = 1.65;
        this.energy = Math.max(0, this.energy - 12);
        this.triggerShake(0.26, 7);
        sound.playLifeLost();
        this.spawnExplosionParticles(sp.x, sp.y, '#fb7185', 16);
        this.spawnFloatingText(sp.x, sp.y - 52, 'SERSEMLEDİN!', '#fda4af', 1.1);
        this.emitHud(true);
      }
    }
  }

  private handlePortalBreach(): void {
    this.lives--;
    sound.playLifeLost();
    this.triggerShake(0.42, 11);

    const endPt = this.track.getPointAt(this.track.totalLength);
    this.spawnExplosionParticles(endPt.x, endPt.y, '#ef4444', 24);

    if (this.lives <= 0) {
      this.paused = true;
      sound.playGameOver();
      this.emitHud(true);
      this.callbacks.onGameOver({
        score: this.score,
        levelReached: this.levelNumber,
        maxCombo: this.maxCombo,
        bossesDefeated: this.bossesDefeated,
      });
      return;
    }

    // Protective Cat Barrier pushes the chain back and clears the 5 closest balls
    const removeCount = Math.min(5, this.chain.length);
    this.chain.splice(this.chain.length - removeCount, removeCount);
    const pushBack = this.track.totalLength * 0.28;
    for (const b of this.chain) {
      b.dist = Math.max(-BALL_DIAMETER * 3, b.dist - pushBack);
    }
    this.freezeTimer = 2.5;
    this.spawnFloatingText(
      endPt.x,
      endPt.y - 26,
      `KALKAN AKTİF! (${this.lives} CAN KALDI)`,
      '#fca5a5',
      1.15
    );
    this.emitHud(true);
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      if (p.ring) {
        p.radius += dt * 360;
        p.alpha = p.life / p.maxLife;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.alpha = p.life / p.maxLife;
      }
    }
  }

  private updateFloatingTexts(dt: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= dt * 42;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private updateLaserBeams(dt: number): void {
    for (let i = this.laserBeams.length - 1; i >= 0; i--) {
      const lb = this.laserBeams[i];
      lb.life -= dt;
      if (lb.life <= 0) {
        this.laserBeams.splice(i, 1);
      }
    }
  }

  private spawnExplosionParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 65 + Math.random() * 210;
      const maxLife = 0.28 + Math.random() * 0.34;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        radius: 2.5 + Math.random() * 4,
        color,
        alpha: 1,
        life: maxLife,
        maxLife,
      });
    }
  }

  private spawnFloatingText(
    x: number,
    y: number,
    text: string,
    color: string,
    scale = 1
  ): void {
    this.floatingTexts.push({
      id: this.nextId++,
      x: Math.max(80, Math.min(ARENA_WIDTH - 80, x)),
      y: Math.max(40, Math.min(ARENA_HEIGHT - 30, y)),
      text,
      color,
      scale,
      life: 1.05,
      maxLife: 1.05,
    });
  }

  private addScore(points: number): void {
    this.score += points;
    this.levelScore += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
  }

  private addEnergy(amount: number): void {
    this.energy = Math.min(100, this.energy + amount);
  }

  private triggerShake(duration: number, intensity: number): void {
    this.shakeTimer = Math.max(this.shakeTimer, duration);
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  private computeAimTarget(): { x: number; y: number; hit: boolean } {
    const sp = this.levelConfig.shooterPos;
    const dx = Math.cos(this.aimAngle);
    const dy = Math.sin(this.aimAngle);

    let minT = 680;
    let hit = false;

    const testCircle = (cx: number, cy: number, r: number) => {
      const fx = sp.x - cx;
      const fy = sp.y - cy;
      const b = 2 * (fx * dx + fy * dy);
      const c = fx * fx + fy * fy - r * r;
      const disc = b * b - 4 * c;
      if (disc < 0) return;
      const t = (-b - Math.sqrt(disc)) / 2;
      if (t > 42 && t < minT) {
        minT = t;
        hit = true;
      }
    };

    if (this.boss && this.phase === 'BOSS') {
      testCircle(this.boss.x, this.boss.y, this.boss.radius + BALL_RADIUS * 0.5);
    }

    for (const bp of this.bossProjectiles) {
      testCircle(bp.x, bp.y, bp.radius + BALL_RADIUS * 0.6);
    }

    if (this.armedAbility !== 'laser_paw') {
      for (const ball of this.chain) {
        if (ball.dist < 0) continue;
        const pt = this.track.getPointAt(ball.dist);
        testCircle(pt.x, pt.y, ball.radius + BALL_RADIUS * 0.7);
      }
    } else {
      minT = 920;
    }

    return {
      x: sp.x + dx * minT,
      y: sp.y + dy * minT,
      hit,
    };
  }

  private getDangerRatio(): number {
    if (this.chain.length === 0) return 0;
    const head = this.chain[this.chain.length - 1];
    return Math.max(0, Math.min(1, head.dist / this.track.totalLength));
  }

  private render(): void {
    const shakeX =
      this.shakeTimer > 0 ? (Math.random() - 0.5) * 2 * this.shakeIntensity : 0;
    const shakeY =
      this.shakeTimer > 0 ? (Math.random() - 0.5) * 2 * this.shakeIntensity : 0;

    renderGameCanvas(this.ctx, {
      time: this.time,
      track: this.track,
      shooterPos: this.levelConfig.shooterPos,
      aimAngle: this.aimAngle,
      aimTarget: this.computeAimTarget(),
      catRecoil: this.catRecoil,
      catStunTimer: this.catStunTimer,
      currentBallColor: this.currentBallColor,
      nextBallColor: this.nextBallColor,
      armedAbility: this.armedAbility,
      freezeTimer: this.freezeTimer,
      dangerRatio: this.getDangerRatio(),
      phase: this.phase,
      bossIntroTimer: this.bossIntroTimer,
      chain: this.chain,
      shots: this.shots,
      boss: this.boss,
      bossProjectiles: this.bossProjectiles,
      spiritBolts: this.spiritBolts,
      particles: this.particles,
      floatingTexts: this.floatingTexts,
      laserBeams: this.laserBeams,
      shakeX,
      shakeY,
      floorImage: this.floorImage,
    });
  }

  private emitHud(force: boolean): void {
    if (!force && !this.running) return;
    const progress =
      this.phase === 'CHAIN'
        ? Math.min(100, Math.round((this.poppedInLevel / this.levelConfig.spawnTarget) * 100))
        : 100;

    this.callbacks.onHudUpdate({
      score: this.score,
      highScore: this.highScore,
      level: this.levelNumber,
      levelName: this.levelConfig.name,
      levelSubtitle: this.levelConfig.subtitle,
      phase: this.phase,
      progress,
      energy: Math.round(this.energy),
      combo: this.combo,
      maxCombo: this.maxCombo,
      lives: this.lives,
      maxLives: this.maxLives,
      bossesDefeated: this.bossesDefeated,
      currentBallColor: this.currentBallColor,
      nextBallColor: this.nextBallColor,
      armedAbility: this.armedAbility,
      cooldowns: { ...this.cooldowns },
      freezeTimer: this.freezeTimer,
      catStunTimer: this.catStunTimer,
      dangerRatio: this.getDangerRatio(),
      boss: this.boss
        ? {
            name: this.boss.config.name,
            title: this.boss.config.title,
            hp: Math.ceil(this.boss.hp),
            maxHp: this.boss.maxHp,
            weaknessColor: this.boss.weaknessColor,
            stunned: this.boss.stunTimer > 0,
          }
        : null,
      muted: sound.isMuted(),
    });
  }
}
