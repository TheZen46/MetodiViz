import { describe, expect, it } from 'vitest';
import {
  contourIntegralComplex,
  curveLengthExact,
  estimateResidue,
  evaluateFourierPartialSum,
  fourierCoefficients,
  gaussGreenVerify,
  polygonalLength,
} from '../src/engine/math/numerics';
import { cDiv } from '../src/engine/math/complex';

describe('numerics engine', () => {
  it('computes exact helix length and polygonal convergence', () => {
    const fx = (t: number) => Math.cos(t);
    const fy = (t: number) => Math.sin(t);
    const fz = (t: number) => 0.25 * t;
    const exact = curveLengthExact(fx, fy, fz, 0, 4 * Math.PI);
    const analytic = 4 * Math.PI * Math.sqrt(1 + 0.25 * 0.25);
    expect(exact).toBeCloseTo(analytic, 3);

    const polyLow = polygonalLength(fx, fy, fz, 0, 4 * Math.PI, 6);
    const polyHigh = polygonalLength(fx, fy, fz, 0, 4 * Math.PI, 60);
    expect(polyLow).toBeLessThan(exact);
    expect(polyHigh).toBeGreaterThan(polyLow);
    expect(polyHigh).toBeCloseTo(exact, 1);
  });

  it('verifies Gauss-Green line integral equals double integral of curl', () => {
    const F1 = (_x: number, y: number) => -y;
    const F2 = (x: number, _y: number) => x + 0.25 * x * x;
    const alpha = (x: number) => 0.7 + 0.22 * Math.sin(2.5 * x);
    const beta = (x: number) => 2.5 + 0.3 * Math.cos(1.6 * x);

    const res = gaussGreenVerify(F1, F2, 0.6, 3.1, alpha, beta, 64);
    expect(Math.abs(res.lineIntegral - res.doubleIntegral)).toBeLessThan(1e-3);
  });

  it('verifies Residue Theorem for poles inside vs outside contour', () => {
    // f(z) = 2/(z - 0.5) + 3/(z - 3.0)
    const fz = (z: { re: number; im: number }) => {
      const t1 = cDiv({ re: 2, im: 0 }, { re: z.re - 0.5, im: z.im });
      const t2 = cDiv({ re: 3, im: 0 }, { re: z.re - 3.0, im: z.im });
      return { re: t1.re + t2.re, im: t1.im + t2.im };
    };

    // Circle centered at 0 with radius 1.5 encloses z=0.5 (res=2) and excludes z=3.0
    const integral = contourIntegralComplex(fz, 0, 0, 1.5, 1.5, 256);
    expect(integral.re).toBeCloseTo(0, 2);
    expect(integral.im).toBeCloseTo(2 * Math.PI * 2, 2);

    const res1 = estimateResidue(fz, { re: 0.5, im: 0 });
    expect(res1.re).toBeCloseTo(2, 2);
    expect(res1.im).toBeCloseTo(0, 2);
  });

  it('converges Fourier partial sum of square wave to jump mean 0', () => {
    const sq = (x: number) => {
      let t = ((x + Math.PI) % (2 * Math.PI));
      if (t < 0) t += 2 * Math.PI;
      t -= Math.PI;
      return t >= 0 ? 1 : -1;
    };
    const { a0, ak, bk } = fourierCoefficients(sq, 25, 512);
    expect(evaluateFourierPartialSum(a0, ak, bk, 0)).toBeCloseTo(0, 1);
    expect(evaluateFourierPartialSum(a0, ak, bk, Math.PI / 2)).toBeCloseTo(1, 1);
    expect(evaluateFourierPartialSum(a0, ak, bk, -Math.PI / 2)).toBeCloseTo(-1, 1);
  });
});
