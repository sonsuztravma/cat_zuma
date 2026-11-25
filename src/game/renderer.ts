import { ARENA_HEIGHT, ARENA_WIDTH } from './levels';
import { SplineTrack } from './track';
import {
  AbilityId,
  BALL_COLORS,
  BallColor,
  BossEntity,
  BossProjectile,
  ChainBall,
  FloatingText,
  LaserBeamEffect,
  LevelPhase,
  Particle,
  ShotBall,
  SpiritBolt,
} from './types';

export interface RenderState {
  time: number;
  track: SplineTrack;
  shooterPos: { x: number; y: number };
  aimAngle: number;
  aimTarget: { x: number; y: number; hit: boolean };
  catRecoil: number;
  catStunTimer: number;
  currentBallColor: BallColor;
  nextBallColor: BallColor;
  armedAbility: AbilityId | null;
  freezeTimer: number;
  dangerRatio: number;
  phase: LevelPhase;
  bossIntroTimer: number;
  chain: ChainBall[];
  shots: ShotBall[];
  boss: BossEntity | null;
  bossProjectiles: BossProjectile[];
  spiritBolts: SpiritBolt[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  laserBeams: LaserBeamEffect[];
  shakeX: number;
  shakeY: number;
  floorImage: HTMLImageElement | null;
}

function drawBallSymbol(
  ctx: CanvasRenderingContext2D,
  symbol: 'diamond' | 'leaf' | 'droplet' | 'star' | 'moon' | 'paw',
  r: number
): void {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.84)';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.lineWidth = 1.2;

  const s = r * 0.42;
  ctx.beginPath();
  if (symbol === 'diamond') {
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.82, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.82, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (symbol === 'leaf') {
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 0.95, -s * 0.1, 0, s);
    ctx.quadraticCurveTo(-s * 0.95, -s * 0.1, 0, -s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (symbol === 'droplet') {
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.9, 0, s * 0.75, s, 0, s);
    ctx.bezierCurveTo(-s * 0.75, s, -s * 0.9, 0, 0, -s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (symbol === 'star') {
    for (let i = 0; i < 5; i++) {
      const a1 = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      const a2 = a1 + Math.PI / 5;
      const x1 = Math.cos(a1) * s;
      const y1 = Math.sin(a1) * s;
      const x2 = Math.cos(a2) * (s * 0.46);
      const y2 = Math.sin(a2) * (s * 0.46);
      if (i === 0) ctx.moveTo(x1, y1);
      else ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (symbol === 'moon') {
    ctx.arc(0, 0, s * 0.85, 0.35 * Math.PI, 1.65 * Math.PI);
    ctx.arc(s * 0.38, 0, s * 0.68, 1.48 * Math.PI, 0.52 * Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // paw
    ctx.arc(0, s * 0.25, s * 0.45, 0, Math.PI * 2);
    ctx.fill();
    const toes = [
      { x: -s * 0.52, y: -s * 0.32 },
      { x: 0, y: -s * 0.54 },
      { x: s * 0.52, y: -s * 0.32 },
    ];
    for (const toe of toes) {
      ctx.beginPath();
      ctx.arc(toe.x, toe.y, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawGemBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: BallColor,
  opts?: {
    armor?: number;
    special?: 'none' | 'energy';
    kind?: 'normal' | 'bomb' | 'rainbow';
    frozen?: boolean;
    hitFlash?: number;
    time?: number;
    angle?: number;
  }
): void {
  const time = opts?.time ?? 0;
  const kind = opts?.kind ?? 'normal';
  const def = BALL_COLORS[color];

  ctx.save();
  ctx.translate(x, y);

  // Drop shadow
  ctx.beginPath();
  ctx.arc(2, 4, radius * 0.98, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.fill();

  if (kind === 'bomb') {
    // Paw Bomb
    const grad = ctx.createRadialGradient(
      -radius * 0.3,
      -radius * 0.3,
      radius * 0.1,
      0,
      0,
      radius
    );
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.35, '#f97316');
    grad.addColorStop(0.8, '#991b1b');
    grad.addColorStop(1, '#3b0a0a');
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Pulsing glow ring
    ctx.strokeStyle = `rgba(253, 224, 71, ${0.65 + Math.sin(time * 12) * 0.3})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Claw scratch icon
    ctx.strokeStyle = '#fffbeb';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5 - 3, -6);
      ctx.lineTo(i * 5 + 3, 7);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (kind === 'rainbow') {
    const hue = (time * 180) % 360;
    const grad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 2, 0, 0, radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, `hsl(${hue}, 92%, 66%)`);
    grad.addColorStop(0.7, `hsl(${(hue + 120) % 360}, 85%, 52%)`);
    grad.addColorStop(1, `hsl(${(hue + 240) % 360}, 80%, 34%)`);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawBallSymbol(ctx, 'star', radius * 1.1);
    ctx.restore();
    return;
  }

  // Standard gemstone marble
  const grad = ctx.createRadialGradient(
    -radius * 0.34,
    -radius * 0.34,
    radius * 0.12,
    0,
    0,
    radius
  );
  grad.addColorStop(0, def.light);
  grad.addColorStop(0.45, def.main);
  grad.addColorStop(1, def.dark);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtle dark rim for crisp separation between neighbors
  ctx.strokeStyle = 'rgba(10, 18, 15, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner emblem (rotates gently with track angle)
  ctx.save();
  if (opts?.angle) {
    ctx.rotate(opts.angle * 0.25);
  }
  drawBallSymbol(ctx, def.symbol, radius);
  ctx.restore();

  // Gloss specular highlight
  ctx.beginPath();
  ctx.ellipse(-radius * 0.32, -radius * 0.38, radius * 0.28, radius * 0.16, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
  ctx.fill();

  // Energy orb halo
  if (opts?.special === 'energy') {
    const pulse = 0.65 + Math.sin(time * 7) * 0.35;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 2.5, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(250, 204, 21, ${pulse})`;
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }

  // Armored bronze-steel casing
  if ((opts?.armor ?? 0) > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, radius - 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3.2;
    ctx.stroke();

    // Rivet notches
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (radius - 2), Math.sin(a) * (radius - 2), 2.1, 0, Math.PI * 2);
      ctx.fillStyle = '#475569';
      ctx.fill();
    }
  }

  // Frozen crystal rim
  if (opts?.frozen) {
    ctx.beginPath();
    ctx.arc(0, 0, radius + 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.8)';
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }

  // Hit flash
  if ((opts?.hitFlash ?? 0) > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fill();
  }

  ctx.restore();
}

function drawTrack(ctx: CanvasRenderingContext2D, state: RenderState): void {
  const { track, dangerRatio, time } = state;
  const pts = track.samples;
  if (pts.length < 2) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Outer recessed drop shadow
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y + 4);
  for (let i = 2; i < pts.length; i += 2) {
    ctx.lineTo(pts[i].x, pts[i].y + 4);
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y + 4);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.lineWidth = 48;
  ctx.stroke();

  // Carved temple stone lip
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 2; i < pts.length; i += 2) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.strokeStyle = '#2d4037';
  ctx.lineWidth = 44;
  ctx.stroke();

  // Inner carved channel
  ctx.strokeStyle = '#0c1814';
  ctx.lineWidth = 34;
  ctx.stroke();

  // Subtle brass guideline in groove center
  ctx.strokeStyle = dangerRatio > 0.72
    ? `rgba(239, 68, 68, ${0.26 + Math.sin(time * 9) * 0.14})`
    : 'rgba(217, 178, 92, 0.16)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 12]);
  ctx.lineDashOffset = -time * 24;
  ctx.stroke();
  ctx.setLineDash([]);

  // Entrance archway at start
  const start = pts[0];
  ctx.save();
  ctx.translate(start.x, start.y);
  ctx.rotate(start.angle);
  ctx.fillStyle = '#1b2c25';
  ctx.strokeStyle = '#4c675a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-14, -26, 28, 52, 6);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Danger Portal (Ancient Cat Skull / Dark Vortex) at track end
  const end = pts[pts.length - 1];
  ctx.save();
  ctx.translate(end.x, end.y);

  const isDanger = dangerRatio > 0.72;
  const pulse = 1 + Math.sin(time * (isDanger ? 10 : 3.5)) * (isDanger ? 0.14 : 0.05);

  if (isDanger) {
    ctx.beginPath();
    ctx.arc(0, 0, 36 * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Outer golden stone frame
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, Math.PI * 2);
  ctx.fillStyle = '#1e2c26';
  ctx.fill();
  ctx.strokeStyle = isDanger ? '#ef4444' : '#ca8a04';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Swirling vortex interior
  const vortexGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
  vortexGrad.addColorStop(0, '#050807');
  vortexGrad.addColorStop(0.65, isDanger ? '#7f1d1d' : '#1e1b4b');
  vortexGrad.addColorStop(1, '#090d0c');
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fillStyle = vortexGrad;
  ctx.fill();

  // Rotating vortex arcs
  ctx.save();
  ctx.rotate(-time * (isDanger ? 4.5 : 2));
  ctx.strokeStyle = isDanger ? 'rgba(252, 165, 165, 0.7)' : 'rgba(250, 204, 21, 0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.rotate((Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, 1.3);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
  ctx.restore();
}

function drawAimGuide(ctx: CanvasRenderingContext2D, state: RenderState): void {
  const { shooterPos, aimAngle, aimTarget, currentBallColor, armedAbility, time } = state;

  const startX = shooterPos.x + Math.cos(aimAngle) * 44;
  const startY = shooterPos.y + Math.sin(aimAngle) * 44;
  const dx = aimTarget.x - startX;
  const dy = aimTarget.y - startY;
  const dist = Math.hypot(dx, dy);
  if (dist < 10) return;

  ctx.save();
  let guideColor = BALL_COLORS[currentBallColor].light;
  if (armedAbility === 'paw_bomb') guideColor = '#fb923c';
  else if (armedAbility === 'laser_paw') guideColor = '#fde047';
  else if (armedAbility === 'rainbow_yarn') guideColor = `hsl(${(time * 220) % 360}, 95%, 72%)`;

  if (armedAbility === 'laser_paw') {
    // Crisp solid laser preview line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(aimTarget.x, aimTarget.y);
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.5)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    // Dotted trajectory line
    const step = 18;
    const count = Math.floor(dist / step);
    for (let i = 1; i <= count; i++) {
      const t = (i * step) / dist;
      const px = startX + dx * t;
      const py = startY + dy * t;
      const alpha = Math.max(0.16, 0.72 * (1 - t * 0.65));
      ctx.beginPath();
      ctx.arc(px, py, i % 2 === 0 ? 3.2 : 2.3, 0, Math.PI * 2);
      ctx.fillStyle = guideColor;
      ctx.globalAlpha = alpha;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Impact reticle
  if (aimTarget.hit) {
    ctx.beginPath();
    ctx.arc(aimTarget.x, aimTarget.y, armedAbility === 'paw_bomb' ? 16 : 9, 0, Math.PI * 2);
    ctx.strokeStyle = guideColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

function drawCatShooter(ctx: CanvasRenderingContext2D, state: RenderState): void {
  const {
    shooterPos,
    aimAngle,
    catRecoil,
    catStunTimer,
    currentBallColor,
    nextBallColor,
    armedAbility,
    time,
  } = state;

  ctx.save();
  ctx.translate(shooterPos.x, shooterPos.y);

  // Carved stone temple pedestal
  ctx.beginPath();
  ctx.arc(0, 4, 48, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fill();

  const pedGrad = ctx.createRadialGradient(-10, -10, 6, 0, 0, 46);
  pedGrad.addColorStop(0, '#364d42');
  pedGrad.addColorStop(0.75, '#1f3028');
  pedGrad.addColorStop(1, '#121d18');
  ctx.beginPath();
  ctx.arc(0, 0, 45, 0, Math.PI * 2);
  ctx.fillStyle = pedGrad;
  ctx.fill();
  ctx.strokeStyle = armedAbility ? '#f59e0b' : '#4a6457';
  ctx.lineWidth = armedAbility ? 3 : 2;
  ctx.stroke();

  // Armed ability rotating aura ring
  if (armedAbility) {
    ctx.save();
    ctx.rotate(time * 2.4);
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, Math.PI * 2);
    ctx.strokeStyle =
      armedAbility === 'paw_bomb'
        ? '#fb923c'
        : armedAbility === 'laser_paw'
          ? '#fde047'
          : '#e879f9';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Rotate cat toward aim angle (cat faces +X in local space)
  ctx.save();
  ctx.rotate(aimAngle);
  const kick = -catRecoil * 9;
  ctx.translate(kick, 0);

  // Swaying tabby tail behind cat
  const tailSway = Math.sin(time * 4.5) * 9;
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.bezierCurveTo(-44, tailSway * 0.7, -50, tailSway * 1.4, -38, tailSway * 1.8);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Cat body (plush orange tabby oval)
  const bodyGrad = ctx.createRadialGradient(-4, -5, 4, -2, 0, 32);
  bodyGrad.addColorStop(0, '#fbbf24');
  bodyGrad.addColorStop(0.6, '#ea8a1e');
  bodyGrad.addColorStop(1, '#9a3412');
  ctx.beginPath();
  ctx.ellipse(-4, 0, 29, 25, 0, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = '#5c230c';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tabby back stripes
  ctx.strokeStyle = 'rgba(124, 45, 18, 0.55)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const sx of [-18, -10, -2]) {
    ctx.beginPath();
    ctx.moveTo(sx, -14);
    ctx.quadraticCurveTo(sx - 3, 0, sx, 14);
    ctx.stroke();
  }

  // Next preview ball sitting neatly on the cat's back amulet holder
  drawGemBall(ctx, -18, 0, 10, nextBallColor, { time });

  // Front paws holding the active marble
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(23, side * 14, 11, 7.5, side * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#fde68a';
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  // Active marble held in front of cat's paws
  const activeKind =
    armedAbility === 'paw_bomb'
      ? 'bomb'
      : armedAbility === 'rainbow_yarn'
        ? 'rainbow'
        : 'normal';
  drawGemBall(ctx, 34, 0, 15.5, currentBallColor, {
    kind: activeKind,
    time,
  });

  // Cat Head
  const headGrad = ctx.createRadialGradient(8, -4, 3, 6, 0, 20);
  headGrad.addColorStop(0, '#fcd34d');
  headGrad.addColorStop(0.65, '#f59e0b');
  headGrad.addColorStop(1, '#b45309');

  // Pointed Cat Ears
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(2, side * 11);
    ctx.lineTo(-9, side * 24);
    ctx.lineTo(13, side * 18);
    ctx.closePath();
    ctx.fillStyle = '#ea8a1e';
    ctx.fill();
    ctx.strokeStyle = '#5c230c';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Inner pink ear
    ctx.beginPath();
    ctx.moveTo(2, side * 13);
    ctx.lineTo(-4, side * 20);
    ctx.lineTo(9, side * 16.5);
    ctx.closePath();
    ctx.fillStyle = '#fda4af';
    ctx.fill();
  }

  ctx.beginPath();
  ctx.ellipse(7, 0, 17, 16, 0, 0, Math.PI * 2);
  ctx.fillStyle = headGrad;
  ctx.fill();
  ctx.strokeStyle = '#5c230c';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Golden temple gem on forehead
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(6, -3.5);
  ctx.lineTo(2, 0);
  ctx.lineTo(6, 3.5);
  ctx.closePath();
  ctx.fillStyle = armedAbility === 'laser_paw' ? '#fef08a' : '#34d399';
  ctx.fill();

  // Expressive cat eyes looking ahead
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(15.5, side * 6.5, 3.8, 4.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = catStunTimer > 0 ? '#e2e8f0' : '#fef9c3';
    ctx.fill();

    // Pupil
    ctx.beginPath();
    ctx.ellipse(17, side * 6.5, 1.8, 2.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
  }

  // Cute pink nose
  ctx.beginPath();
  ctx.arc(22.5, 0, 2.3, 0, Math.PI * 2);
  ctx.fillStyle = '#fb7185';
  ctx.fill();

  // Whiskers
  ctx.strokeStyle = 'rgba(255, 251, 235, 0.72)';
  ctx.lineWidth = 1.1;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(18, side * 7);
    ctx.lineTo(24, side * 17);
    ctx.moveTo(16, side * 9);
    ctx.lineTo(18, side * 20);
    ctx.stroke();
  }

  ctx.restore();

  // Stunned orbiting stars
  if (catStunTimer > 0) {
    for (let i = 0; i < 3; i++) {
      const a = time * 6 + (i * Math.PI * 2) / 3;
      const sx = Math.cos(a) * 28;
      const sy = -36 + Math.sin(a) * 9;
      ctx.beginPath();
      ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fde047';
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawBoss(ctx: CanvasRenderingContext2D, boss: BossEntity, time: number): void {
  const { x, y, radius, config, weaknessColor, hitFlash, stunTimer, chargeAnim } = boss;
  const weakDef = BALL_COLORS[weaknessColor];

  ctx.save();
  ctx.translate(x, y + Math.sin(time * 3.2) * 5);

  // Telegraph ring when preparing to attack
  if (chargeAnim > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, radius + 12 + (1 - chargeAnim) * 24, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(239, 68, 68, ${0.25 + chargeAnim * 0.65})`;
    ctx.lineWidth = 3.5;
    ctx.stroke();
  }

  // Shadow underneath
  ctx.beginPath();
  ctx.ellipse(0, radius + 12, radius * 0.85, 11, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.fill();

  // Boss body art by visual type
  if (config.visualType === 'yarn_golem') {
    // Giant tangled Yarn Monster with crown
    const grad = ctx.createRadialGradient(-12, -12, 8, 0, 0, radius);
    grad.addColorStop(0, '#c084fc');
    grad.addColorStop(0.55, '#7e22ce');
    grad.addColorStop(1, '#3b0764');
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Tangled yarn wraps
    ctx.strokeStyle = 'rgba(233, 213, 255, 0.35)';
    ctx.lineWidth = 4;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc(0, i * 8, radius * 0.88, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    // Golden Crown
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-22, -radius + 6);
    ctx.lineTo(-26, -radius - 14);
    ctx.lineTo(-10, -radius - 4);
    ctx.lineTo(0, -radius - 18);
    ctx.lineTo(10, -radius - 4);
    ctx.lineTo(26, -radius - 14);
    ctx.lineTo(22, -radius + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (config.visualType === 'iron_hound') {
    // Armored Iron Hound
    const grad = ctx.createRadialGradient(-10, -10, 6, 0, 0, radius);
    grad.addColorStop(0, '#94a3b8');
    grad.addColorStop(0.6, '#475569');
    grad.addColorStop(1, '#1e293b');
    ctx.beginPath();
    ctx.roundRect(-radius, -radius * 0.85, radius * 2, radius * 1.7, 22);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Iron ears
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 22, -radius * 0.7);
      ctx.lineTo(s * 42, -radius * 1.15);
      ctx.lineTo(s * 36, -radius * 0.3);
      ctx.closePath();
      ctx.fillStyle = '#334155';
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.stroke();
    }
  } else if (config.visualType === 'vacuum_dragon') {
    // Swirling Brass Cyclone Automaton
    ctx.save();
    ctx.rotate(time * 2.2);
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(radius * 0.6, 0);
      ctx.lineTo(radius + 14, -10);
      ctx.lineTo(radius + 8, 12);
      ctx.closePath();
      ctx.fillStyle = '#b45309';
      ctx.fill();
    }
    ctx.restore();

    const grad = ctx.createRadialGradient(-10, -10, 8, 0, 0, radius);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(0.5, '#0f766e');
    grad.addColorStop(1, '#134e4a');
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3.5;
    ctx.stroke();
  } else if (config.visualType === 'shadow_raven') {
    // Winged Shadow Raven Lord
    const flap = Math.sin(time * 6) * 14;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 20, -6);
      ctx.quadraticCurveTo(s * (radius + 32), -26 + flap, s * (radius + 26), 14 + flap * 0.6);
      ctx.quadraticCurveTo(s * (radius * 0.9), 20, s * 16, 12);
      ctx.closePath();
      ctx.fillStyle = '#1e1b4b';
      ctx.fill();
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    const grad = ctx.createRadialGradient(0, -10, 6, 0, 0, radius);
    grad.addColorStop(0, '#4338ca');
    grad.addColorStop(0.65, '#1e1b4b');
    grad.addColorStop(1, '#09071a');
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#a5b4fc';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  } else {
    // Ancient Sand Sphinx
    const grad = ctx.createRadialGradient(-8, -12, 8, 0, 0, radius);
    grad.addColorStop(0, '#fde68a');
    grad.addColorStop(0.55, '#d97706');
    grad.addColorStop(1, '#78350f');
    // Nemes headdress
    ctx.beginPath();
    ctx.moveTo(-radius * 1.15, 22);
    ctx.lineTo(-radius * 0.85, -radius * 0.95);
    ctx.lineTo(radius * 0.85, -radius * 0.95);
    ctx.lineTo(radius * 1.15, 22);
    ctx.closePath();
    ctx.fillStyle = '#1e3a8a';
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Glowing angry Boss Eyes
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * 14, -6, 7, 5, s * -0.2, 0, Math.PI * 2);
    ctx.fillStyle = stunTimer > 0 ? '#cbd5e1' : '#fef08a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 14, -5, 2.8, 0, Math.PI * 2);
    ctx.fillStyle = '#991b1b';
    ctx.fill();
  }

  // Weakness Color Gem Emblem on Boss Core (2x Crit target!)
  ctx.save();
  ctx.translate(0, 17);
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#0c1713';
  ctx.fill();
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawGemBall(ctx, 0, 0, 11.5, weaknessColor, { time });
  ctx.restore();

  // Hit flash overlay
  if (hitFlash > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fill();
  }

  // Stunned indicator
  if (stunTimer > 0) {
    for (let i = 0; i < 3; i++) {
      const a = time * 5.5 + (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 30, -radius - 10 + Math.sin(a) * 7, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fde047';
      ctx.fill();
    }
  }

  // Diegetic compact HP bar directly above Boss
  const barW = 112;
  const barH = 8;
  const barY = -radius - 26;
  const hpRatio = Math.max(0, boss.hp / boss.maxHp);

  ctx.fillStyle = 'rgba(9, 17, 14, 0.85)';
  ctx.beginPath();
  ctx.roundRect(-barW / 2 - 2, barY - 2, barW + 4, barH + 4, 4);
  ctx.fill();

  ctx.fillStyle = hpRatio > 0.35 ? '#ef4444' : '#f97316';
  ctx.beginPath();
  ctx.roundRect(-barW / 2, barY, barW * hpRatio, barH, 3);
  ctx.fill();

  // Weakness label hint right below boss
  ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4f1ea';
  ctx.fillText(`2x Zayıf: ${weakDef.label}`, 0, radius + 24);

  ctx.restore();
}

export function renderGameCanvas(
  ctx: CanvasRenderingContext2D,
  state: RenderState
): void {
  ctx.save();
  ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
  ctx.translate(state.shakeX, state.shakeY);

  // 1. Temple Stone Floor Background
  if (state.floorImage && state.floorImage.complete && state.floorImage.naturalWidth > 0) {
    ctx.drawImage(state.floorImage, 0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    // Subtle dark emerald tint to ensure bright gemstone balls have max contrast
    ctx.fillStyle = 'rgba(10, 22, 18, 0.32)';
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
  } else {
    const bgGrad = ctx.createRadialGradient(
      ARENA_WIDTH / 2,
      ARENA_HEIGHT / 2,
      80,
      ARENA_WIDTH / 2,
      ARENA_HEIGHT / 2,
      ARENA_WIDTH * 0.72
    );
    bgGrad.addColorStop(0, '#183028');
    bgGrad.addColorStop(1, '#0b1612');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
  }

  // Soft golden lantern glow around cat pedestal
  const lantern = ctx.createRadialGradient(
    state.shooterPos.x,
    state.shooterPos.y,
    20,
    state.shooterPos.x,
    state.shooterPos.y,
    240
  );
  lantern.addColorStop(0, 'rgba(245, 158, 11, 0.12)');
  lantern.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = lantern;
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

  // Freeze tint veil when Purr Freeze is active
  if (state.freezeTimer > 0) {
    ctx.fillStyle = `rgba(56, 189, 248, ${Math.min(0.14, state.freezeTimer * 0.04)})`;
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
  }

  // 2. Carved Stone Track
  drawTrack(ctx, state);

  // 3. Aim Guide
  drawAimGuide(ctx, state);

  // 4. Chain Balls
  for (const ball of state.chain) {
    if (ball.dist < -24) continue;
    const pt = state.track.getPointAt(ball.dist);
    const scale = ball.insertAnim < 1 ? 0.5 + 0.5 * ball.insertAnim : 1;
    drawGemBall(ctx, pt.x, pt.y, ball.radius * scale, ball.color, {
      armor: ball.armor,
      special: ball.special,
      frozen: state.freezeTimer > 0,
      hitFlash: ball.hitFlash,
      time: state.time,
      angle: pt.angle,
    });
  }

  // 5. Boss Entity
  if (state.boss) {
    drawBoss(ctx, state.boss, state.time);
  }

  // 6. Cat Shooter Pedestal & Character
  drawCatShooter(ctx, state);

  // 7. Active Shot Projectiles
  for (const shot of state.shots) {
    // Motion trail
    for (let i = 0; i < shot.trail.length; i++) {
      const tr = shot.trail[i];
      const alpha = ((i + 1) / shot.trail.length) * 0.35;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, shot.radius * (0.4 + 0.4 * (i / shot.trail.length)), 0, Math.PI * 2);
      ctx.fillStyle =
        shot.kind === 'bomb'
          ? `rgba(251, 146, 60, ${alpha})`
          : shot.kind === 'rainbow'
            ? `rgba(244, 114, 182, ${alpha})`
            : BALL_COLORS[shot.color].glow;
      ctx.fill();
    }
    drawGemBall(ctx, shot.x, shot.y, shot.radius, shot.color, {
      kind: shot.kind,
      time: state.time,
    });
  }

  // 8. Homing Pati Spirit Bolts (from matches during Boss fight)
  for (const bolt of state.spiritBolts) {
    for (let i = 0; i < bolt.trail.length; i++) {
      const tr = bolt.trail[i];
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, 4 + i * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(253, 224, 71, ${((i + 1) / bolt.trail.length) * 0.55})`;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(bolt.x, bolt.y, 8.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 9. Boss Dark Projectiles (shootable!)
  for (const proj of state.bossProjectiles) {
    ctx.save();
    ctx.translate(proj.x, proj.y);
    ctx.rotate(proj.angle);
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, proj.radius);
    g.addColorStop(0, '#fda4af');
    g.addColorStop(0.5, '#9f1239');
    g.addColorStop(1, '#1e1b4b');
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Spinning dark spikes
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(proj.radius - 2, -4);
      ctx.lineTo(proj.radius + 7, 0);
      ctx.lineTo(proj.radius - 2, 4);
      ctx.closePath();
      ctx.fillStyle = '#f43f5e';
      ctx.fill();
    }
    ctx.restore();
  }

  // 10. Laser Paw Beams
  for (const beam of state.laserBeams) {
    const ratio = beam.life / beam.maxLife;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y1);
    ctx.lineTo(beam.x2, beam.y2);
    ctx.strokeStyle = `rgba(250, 204, 21, ${ratio * 0.45})`;
    ctx.lineWidth = 30 * ratio;
    ctx.stroke();

    ctx.strokeStyle = `rgba(254, 240, 138, ${ratio * 0.85})`;
    ctx.lineWidth = 14 * ratio;
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${ratio})`;
    ctx.lineWidth = 5 * ratio;
    ctx.stroke();
    ctx.restore();
  }

  // 11. Particles & Shockwave Rings
  for (const p of state.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    if (p.ring) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3.5;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.restore();
  }

  // 12. Floating Score / Combo / Crit Text
  for (const ft of state.floatingTexts) {
    const progress = 1 - ft.life / ft.maxLife;
    const alpha = progress < 0.7 ? 1 : (1 - progress) / 0.3;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = `700 ${Math.round(16 * ft.scale)}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(10, 18, 15, 0.9)';
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  // 13. Boss Intro Banner Overlay on Canvas
  if (state.phase === 'BOSS_INTRO' && state.boss) {
    ctx.save();
    const fade = Math.min(1, state.bossIntroTimer * 2, (2.1 - state.bossIntroTimer) * 2.5);
    ctx.globalAlpha = Math.max(0, Math.min(1, fade));
    ctx.fillStyle = 'rgba(8, 15, 12, 0.84)';
    ctx.fillRect(0, ARENA_HEIGHT / 2 - 72, ARENA_WIDTH, 144);

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, ARENA_HEIGHT / 2 - 72);
    ctx.lineTo(ARENA_WIDTH, ARENA_HEIGHT / 2 - 72);
    ctx.moveTo(0, ARENA_HEIGHT / 2 + 72);
    ctx.lineTo(ARENA_WIDTH, ARENA_HEIGHT / 2 + 72);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('BÖLÜM SONU BOSS SAVAŞI', ARENA_WIDTH / 2, ARENA_HEIGHT / 2 - 32);

    ctx.fillStyle = '#f4f1ea';
    ctx.font = '700 34px "Fraunces", Georgia, serif';
    ctx.fillText(state.boss.config.name, ARENA_WIDTH / 2, ARENA_HEIGHT / 2 + 8);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `${state.boss.config.title} · Zayıf renk taşıyla vurarak 2x hasar ver, 3’lü eşleşmelerle ruh fırlat!`,
      ARENA_WIDTH / 2,
      ARENA_HEIGHT / 2 + 42
    );
    ctx.restore();
  }

  ctx.restore();
}
