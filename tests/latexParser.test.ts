import { describe, expect, it } from 'vitest';
import { parseLatex, tryParseLatex } from '../src/engine/latex/latexParser';
import { evalComplex, evalReal } from '../src/engine/math/evaluator';
import { cAbs } from '../src/engine/math/complex';

describe('latexParser & evaluator', () => {
  it('parses fractions, powers and implicit multiplication', () => {
    const ast = parseLatex('\\frac{x^2 - y^2}{2} + 3x\\sin(y)');
    const val = evalReal(ast, { x: 4, y: Math.PI / 2 });
    expect(val).toBeCloseTo((16 - (Math.PI / 2) ** 2) / 2 + 12, 5);
  });

  it('handles MathLive wrappers, \\left|..\\right| and \\sqrt[n]{...}', () => {
    const ast = parseLatex('\\left| -5 \\right| + \\sqrt[3]{27} + \\sqrt{16}');
    expect(evalReal(ast, {})).toBeCloseTo(12, 6);
  });

  it('handles trigonometric powers like \\sin^2(x) + \\cos^2(x)', () => {
    const ast = parseLatex('\\sin^2(x) + \\cos^2(x)');
    expect(evalReal(ast, { x: 1.234 })).toBeCloseTo(1, 6);
  });

  it('evaluates \\sum_{k=1}^{N} Fourier partial sums', () => {
    const ast = parseLatex('\\frac{4}{\\pi}\\sum_{k=1}^{15} \\frac{\\sin((2k-1)x)}{2k-1}');
    const val = evalReal(ast, { x: Math.PI / 2 });
    expect(val).toBeCloseTo(1, 1);
  });

  it('evaluates complex expressions with Euler formula and poles', () => {
    const ast = parseLatex('e^{i \\pi} + 1');
    const res = evalComplex(ast, {});
    expect(cAbs(res)).toBeLessThan(1e-9);

    const poleAst = parseLatex('\\frac{1}{z - z_1}');
    const val = evalComplex(poleAst, { z: { re: 2, im: 1 }, z_1: { re: 1, im: 1 } });
    expect(val.re).toBeCloseTo(1, 6);
    expect(val.im).toBeCloseTo(0, 6);
  });

  it('returns clear errors on malformed LaTeX', () => {
    const bad1 = tryParseLatex('\\frac{x}{');
    expect(bad1.error).toBeTruthy();
    const bad2 = tryParseLatex('');
    expect(bad2.error).toBeTruthy();
  });
});
