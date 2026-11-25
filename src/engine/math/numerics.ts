import { Complex, cAdd, cDiv, cMul } from './complex';

export function partialDerivatives2D(
  fn: (x: number, y: number) => number,
  x: number,
  y: number,
  h = 1e-4
): { fx: number; fy: number } {
  const fx = (fn(x + h, y) - fn(x - h, y)) / (2 * h);
  const fy = (fn(x, y + h) - fn(x, y - h)) / (2 * h);
  return { fx, fy };
}

export function integrate1D(
  fn: (t: number) => number,
  a: number,
  b: number,
  intervals = 120
): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return 0;
  const n = intervals % 2 === 0 ? intervals : intervals + 1;
  const h = (b - a) / n;
  let sum = fn(a) + fn(b);
  for (let i = 1; i < n; i++) {
    const t = a + i * h;
    const val = fn(t);
    if (!Number.isFinite(val)) continue;
    sum += (i % 2 === 0 ? 2 : 4) * val;
  }
  return (h / 3) * sum;
}

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export function curvePointAndTangent(
  fx: (t: number) => number,
  fy: (t: number) => number,
  fz: (t: number) => number,
  t: number,
  h = 1e-4
): { point: Point3; tangent: Point3; speed: number } {
  const point = { x: fx(t), y: fy(t), z: fz(t) };
  const tangent = {
    x: (fx(t + h) - fx(t - h)) / (2 * h),
    y: (fy(t + h) - fy(t - h)) / (2 * h),
    z: (fz(t + h) - fz(t - h)) / (2 * h),
  };
  const speed = Math.hypot(tangent.x, tangent.y, tangent.z);
  return { point, tangent, speed };
}

export function curveLengthExact(
  fx: (t: number) => number,
  fy: (t: number) => number,
  fz: (t: number) => number,
  a: number,
  b: number,
  intervals = 240
): number {
  return integrate1D(
    (t) => curvePointAndTangent(fx, fy, fz, t).speed,
    a,
    b,
    intervals
  );
}

export function polygonalVertices(
  fx: (t: number) => number,
  fy: (t: number) => number,
  fz: (t: number) => number,
  a: number,
  b: number,
  segments: number
): Point3[] {
  const n = Math.max(1, Math.round(segments));
  const pts: Point3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = a + ((b - a) * i) / n;
    pts.push({ x: fx(t), y: fy(t), z: fz(t) });
  }
  return pts;
}

export function polygonalLength(
  fx: (t: number) => number,
  fy: (t: number) => number,
  fz: (t: number) => number,
  a: number,
  b: number,
  segments: number
): number {
  const pts = polygonalVertices(fx, fy, fz, a, b, segments);
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(
      pts[i].x - pts[i - 1].x,
      pts[i].y - pts[i - 1].y,
      pts[i].z - pts[i - 1].z
    );
  }
  return total;
}

export function vectorFieldCurlAndDiv(
  F1: (x: number, y: number) => number,
  F2: (x: number, y: number) => number,
  x: number,
  y: number,
  h = 1e-4
): { curl: number; div: number } {
  const dF1dx = (F1(x + h, y) - F1(x - h, y)) / (2 * h);
  const dF1dy = (F1(x, y + h) - F1(x, y - h)) / (2 * h);
  const dF2dx = (F2(x + h, y) - F2(x - h, y)) / (2 * h);
  const dF2dy = (F2(x, y + h) - F2(x, y - h)) / (2 * h);
  return {
    curl: dF2dx - dF1dy,
    div: dF1dx + dF2dy,
  };
}

export function gaussGreenVerify(
  F1: (x: number, y: number) => number,
  F2: (x: number, y: number) => number,
  a: number,
  b: number,
  alpha: (x: number) => number,
  beta: (x: number) => number,
  steps = 80
): {
  lineIntegral: number;
  doubleIntegral: number;
  gamma1: number;
  gamma2: number;
  gamma3: number;
  gamma4: number;
} {
  const h = 1e-4;
  // gamma_1: (x, alpha(x)) from a to b
  const gamma1 = integrate1D((x) => {
    const y = alpha(x);
    const ap = (alpha(x + h) - alpha(x - h)) / (2 * h);
    return F1(x, y) + F2(x, y) * ap;
  }, a, b, steps);

  // gamma_2: (b, y) from alpha(b) to beta(b)
  const gamma2 = integrate1D((y) => F2(b, y), alpha(b), beta(b), steps);

  // gamma_3: (x, beta(x)) from b to a (opposite of gamma_3^-)
  const gamma3 = -integrate1D((x) => {
    const y = beta(x);
    const bp = (beta(x + h) - beta(x - h)) / (2 * h);
    return F1(x, y) + F2(x, y) * bp;
  }, a, b, steps);

  // gamma_4: (a, y) from beta(a) to alpha(a) (opposite of gamma_4^-)
  const gamma4 = -integrate1D((y) => F2(a, y), alpha(a), beta(a), steps);

  const lineIntegral = gamma1 + gamma2 + gamma3 + gamma4;

  const doubleIntegral = integrate1D(
    (x) => {
      const y0 = alpha(x);
      const y1 = beta(x);
      return integrate1D((y) => vectorFieldCurlAndDiv(F1, F2, x, y, h).curl, y0, y1, 40);
    },
    a,
    b,
    steps
  );

  return { lineIntegral, doubleIntegral, gamma1, gamma2, gamma3, gamma4 };
}

export function integrateFieldLineRK4(
  F1: (x: number, y: number) => number,
  F2: (x: number, y: number) => number,
  x0: number,
  y0: number,
  dt = 0.04,
  steps = 120
): Array<{ x: number; y: number }> {
  const trace = (dir: number): Array<{ x: number; y: number }> => {
    const pts: Array<{ x: number; y: number }> = [];
    let x = x0;
    let y = y0;
    const h = dt * dir;
    for (let i = 0; i < steps; i++) {
      const k1x = F1(x, y);
      const k1y = F2(x, y);
      if (!Number.isFinite(k1x) || !Number.isFinite(k1y)) break;
      const n1 = Math.hypot(k1x, k1y);
      if (n1 < 1e-6) break;
      const ux1 = k1x / Math.max(0.25, n1);
      const uy1 = k1y / Math.max(0.25, n1);

      const x2 = x + 0.5 * h * ux1;
      const y2 = y + 0.5 * h * uy1;
      const k2x = F1(x2, y2);
      const k2y = F2(x2, y2);
      const n2 = Math.hypot(k2x, k2y);
      const ux2 = k2x / Math.max(0.25, n2 || 1);
      const uy2 = k2y / Math.max(0.25, n2 || 1);

      const x3 = x + 0.5 * h * ux2;
      const y3 = y + 0.5 * h * uy2;
      const k3x = F1(x3, y3);
      const k3y = F2(x3, y3);
      const n3 = Math.hypot(k3x, k3y);
      const ux3 = k3x / Math.max(0.25, n3 || 1);
      const uy3 = k3y / Math.max(0.25, n3 || 1);

      const x4 = x + h * ux3;
      const y4 = y + h * uy3;
      const k4x = F1(x4, y4);
      const k4y = F2(x4, y4);
      const n4 = Math.hypot(k4x, k4y);
      const ux4 = k4x / Math.max(0.25, n4 || 1);
      const uy4 = k4y / Math.max(0.25, n4 || 1);

      x += (h / 6) * (ux1 + 2 * ux2 + 2 * ux3 + ux4);
      y += (h / 6) * (uy1 + 2 * uy2 + 2 * uy3 + uy4);
      if (Math.hypot(x, y) > 50) break;
      pts.push({ x, y });
    }
    return pts;
  };

  const back = trace(-1).reverse();
  const fwd = trace(1);
  return [...back, { x: x0, y: y0 }, ...fwd];
}

export function contourIntegralComplex(
  fz: (z: Complex) => Complex,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  samples = 256
): Complex {
  let sumRe = 0;
  let sumIm = 0;
  const dTheta = (2 * Math.PI) / samples;
  for (let k = 0; k < samples; k++) {
    const theta = (k + 0.5) * dTheta;
    const z: Complex = {
      re: cx + rx * Math.cos(theta),
      im: cy + ry * Math.sin(theta),
    };
    const dz: Complex = {
      re: -rx * Math.sin(theta) * dTheta,
      im: ry * Math.cos(theta) * dTheta,
    };
    const val = fz(z);
    if (!Number.isFinite(val.re) || !Number.isFinite(val.im)) continue;
    const prod = cMul(val, dz);
    sumRe += prod.re;
    sumIm += prod.im;
  }
  return { re: sumRe, im: sumIm };
}

export function estimateResidue(
  fz: (z: Complex) => Complex,
  pole: Complex,
  radius = 0.04,
  samples = 128
): Complex {
  const integral = contourIntegralComplex(fz, pole.re, pole.im, radius, radius, samples);
  return cDiv(integral, { re: 0, im: 2 * Math.PI });
}

export function isInsideEllipse(
  z: Complex,
  cx: number,
  cy: number,
  rx: number,
  ry: number
): boolean {
  if (rx <= 0 || ry <= 0) return false;
  const dx = (z.re - cx) / rx;
  const dy = (z.im - cy) / ry;
  return dx * dx + dy * dy < 1;
}

export function fourierCoefficients(
  fn: (t: number) => number,
  N: number,
  samples = 512
): { a0: number; ak: number[]; bk: number[] } {
  const dt = (2 * Math.PI) / samples;
  let sum0 = 0;
  const ak: number[] = [];
  const bk: number[] = [];
  for (let k = 1; k <= N; k++) {
    ak.push(0);
    bk.push(0);
  }
  for (let i = 0; i < samples; i++) {
    const t = -Math.PI + (i + 0.5) * dt;
    const y = fn(t);
    if (!Number.isFinite(y)) continue;
    sum0 += y;
    for (let k = 1; k <= N; k++) {
      ak[k - 1] += y * Math.cos(k * t);
      bk[k - 1] += y * Math.sin(k * t);
    }
  }
  const factor = dt / Math.PI;
  return {
    a0: sum0 * factor,
    ak: ak.map((v) => v * factor),
    bk: bk.map((v) => v * factor),
  };
}

export function evaluateFourierPartialSum(
  a0: number,
  ak: number[],
  bk: number[],
  x: number
): number {
  let s = a0 / 2;
  for (let k = 0; k < ak.length; k++) {
    const n = k + 1;
    s += ak[k] * Math.cos(n * x) + bk[k] * Math.sin(n * x);
  }
  return s;
}

export function dirichletKernel(n: number, y: number): number {
  if (Math.abs(Math.sin(y / 2)) < 1e-7) {
    return n + 0.5;
  }
  return Math.sin((n + 0.5) * y) / (2 * Math.sin(y / 2));
}

export function sumComplexTerms(terms: Complex[]): Complex {
  return terms.reduce((acc, item) => cAdd(acc, item), { re: 0, im: 0 });
}

export function darbouxSums2D(
  fn: (x: number, y: number) => number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  n: number
): { upper: number; lower: number; gap: number } {
  const divs = Math.max(1, Math.min(40, Math.round(n)));
  const dx = (xMax - xMin) / divs;
  const dy = (yMax - yMin) / divs;
  const cellArea = dx * dy;
  const sub = 4;
  let upper = 0;
  let lower = 0;

  for (let ix = 0; ix < divs; ix++) {
    const x0 = xMin + ix * dx;
    for (let iy = 0; iy < divs; iy++) {
      const y0 = yMin + iy * dy;
      let cellMin = Infinity;
      let cellMax = -Infinity;
      for (let sx = 0; sx <= sub; sx++) {
        const x = x0 + (dx * sx) / sub;
        for (let sy = 0; sy <= sub; sy++) {
          const y = y0 + (dy * sy) / sub;
          const v = fn(x, y);
          if (Number.isFinite(v)) {
            if (v < cellMin) cellMin = v;
            if (v > cellMax) cellMax = v;
          }
        }
      }
      if (Number.isFinite(cellMin) && Number.isFinite(cellMax)) {
        lower += cellMin * cellArea;
        upper += cellMax * cellArea;
      }
    }
  }
  return { upper, lower, gap: upper - lower };
}

export function divergenceVerify2D(
  F1: (x: number, y: number) => number,
  F2: (x: number, y: number) => number,
  a: number,
  b: number,
  alpha: (x: number) => number,
  beta: (x: number) => number,
  steps = 64
): { fluxIntegral: number; divDoubleIntegral: number } {
  // Using G = (-F2, F1), outward normal flux of F equals counterclockwise circulation of G.
  const h = 1e-4;
  const g1 = (x: number, y: number) => -F2(x, y);
  const g2 = (x: number, y: number) => F1(x, y);
  const res = gaussGreenVerify(g1, g2, a, b, alpha, beta, steps);
  const divDoubleIntegral = integrate1D(
    (x) => {
      const y0 = alpha(x);
      const y1 = beta(x);
      return integrate1D((y) => vectorFieldCurlAndDiv(F1, F2, x, y, h).div, y0, y1, 40);
    },
    a,
    b,
    steps
  );
  return { fluxIntegral: res.lineIntegral, divDoubleIntegral };
}

export function upperSemicircleIntegralComplex(
  fz: (z: Complex) => Complex,
  rho: number,
  samples = 256
): Complex {
  let sumRe = 0;
  let sumIm = 0;
  const dEta = Math.PI / samples;
  for (let k = 0; k < samples; k++) {
    const eta = (k + 0.5) * dEta;
    const z: Complex = {
      re: rho * Math.cos(eta),
      im: rho * Math.sin(eta),
    };
    const dz: Complex = {
      re: -rho * Math.sin(eta) * dEta,
      im: rho * Math.cos(eta) * dEta,
    };
    const val = fz(z);
    if (!Number.isFinite(val.re) || !Number.isFinite(val.im)) continue;
    const prod = cMul(val, dz);
    sumRe += prod.re;
    sumIm += prod.im;
  }
  return { re: sumRe, im: sumIm };
}
