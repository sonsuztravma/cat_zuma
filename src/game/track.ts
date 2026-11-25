export interface TrackSample {
  x: number;
  y: number;
  angle: number;
  dist: number;
}

export class SplineTrack {
  public readonly samples: TrackSample[];
  public readonly totalLength: number;

  constructor(controlPoints: Array<{ x: number; y: number }>, stepPx = 2.5) {
    // Evaluate Catmull-Rom densely first
    const raw: Array<{ x: number; y: number }> = [];
    const pts = controlPoints;
    const n = pts.length;
    const segmentsPerSpan = 36;

    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(n - 1, i + 2)];

      for (let s = 0; s < segmentsPerSpan; s++) {
        const t = s / segmentsPerSpan;
        const t2 = t * t;
        const t3 = t2 * t;

        const x =
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
        const y =
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
        raw.push({ x, y });
      }
    }
    raw.push(pts[n - 1]);

    // Resample to uniform arc length
    const samples: TrackSample[] = [];
    let accumulated = 0;
    let nextTarget = 0;

    samples.push({ x: raw[0].x, y: raw[0].y, angle: 0, dist: 0 });
    nextTarget = stepPx;

    for (let i = 1; i < raw.length; i++) {
      const prev = raw[i - 1];
      const curr = raw[i];
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const segLen = Math.hypot(dx, dy);
      if (segLen < 0.0001) continue;

      while (accumulated + segLen >= nextTarget) {
        const ratio = (nextTarget - accumulated) / segLen;
        const sx = prev.x + dx * ratio;
        const sy = prev.y + dy * ratio;
        samples.push({
          x: sx,
          y: sy,
          angle: Math.atan2(dy, dx),
          dist: nextTarget,
        });
        nextTarget += stepPx;
      }
      accumulated += segLen;
    }

    const lastRaw = raw[raw.length - 1];
    const lastSample = samples[samples.length - 1];
    const rem = Math.hypot(lastRaw.x - lastSample.x, lastRaw.y - lastSample.y);
    if (rem > 0.5) {
      samples.push({
        x: lastRaw.x,
        y: lastRaw.y,
        angle: Math.atan2(lastRaw.y - lastSample.y, lastRaw.x - lastSample.x),
        dist: accumulated,
      });
    }

    // Refine tangent angles smoothly
    for (let i = 0; i < samples.length; i++) {
      const prev = samples[Math.max(0, i - 1)];
      const next = samples[Math.min(samples.length - 1, i + 1)];
      samples[i].angle = Math.atan2(next.y - prev.y, next.x - prev.x);
    }

    this.samples = samples;
    this.totalLength = samples[samples.length - 1].dist;
  }

  public getPointAt(dist: number): TrackSample {
    const samples = this.samples;
    if (dist <= 0) return samples[0];
    if (dist >= this.totalLength) return samples[samples.length - 1];

    // Binary search for fast lookup
    let lo = 0;
    let hi = samples.length - 1;
    while (lo + 1 < hi) {
      const mid = (lo + hi) >> 1;
      if (samples[mid].dist <= dist) {
        lo = mid;
      } else {
        hi = mid;
      }
    }

    const a = samples[lo];
    const b = samples[hi];
    const span = b.dist - a.dist || 1;
    const t = (dist - a.dist) / span;

    // Shortest angle interpolation
    let da = b.angle - a.angle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;

    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      angle: a.angle + da * t,
      dist,
    };
  }
}
