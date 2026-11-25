import { evalComplex, evalReal } from '../math/evaluator';
import { tryParseLatex } from '../latex/latexParser';
import {
  contourIntegralComplex,
  curveLengthExact,
  estimateResidue,
  gaussGreenVerify,
  isInsideEllipse,
  polygonalLength,
} from '../math/numerics';
import { Complex, cAdd, cDiv, cMul, formatComplex } from '../math/complex';
import { PoleObject, SceneSpec } from './types';

export interface ComputedMeasure {
  label: string;
  value: string;
}

export function buildParamScope(scene: SceneSpec): Record<string, number> {
  const scope: Record<string, number> = {};
  for (const p of scene.params) {
    scope[p.name] = p.value;
  }
  return scope;
}

export function compileRealExpr(
  expr: string,
  baseScope: Record<string, number>
): ((vars: Record<string, number>) => number) | null {
  const parsed = tryParseLatex(expr);
  if (!parsed.ast) return null;
  const ast = parsed.ast;
  return (vars) => evalReal(ast, { ...baseScope, ...vars });
}

export function compileComplexSceneFn(
  scene: SceneSpec,
  baseScope: Record<string, number>
): ((z: Complex) => Complex) | null {
  const fnObj = scene.objects.find((o) => o.kind === 'complexFn' && o.visible);
  const poles = scene.objects.filter((o): o is PoleObject => o.kind === 'pole' && o.visible);

  // If poles exist and expr uses standard residue demo or empty, build rational function from poles when requested
  if (fnObj && fnObj.kind === 'complexFn') {
    const parsed = tryParseLatex(fnObj.expr);
    if (!parsed.ast) return null;
    const ast = parsed.ast;
    const complexScope: Record<string, Complex> = {};
    for (const [k, v] of Object.entries(baseScope)) {
      complexScope[k] = { re: v, im: 0 };
    }
    // Check if expression references poles dynamically (e.g. z_1, z_2, z_3)
    for (const p of poles) {
      complexScope[p.id] = { re: p.re, im: p.im };
    }
    return (z: Complex) => evalComplex(ast, { ...complexScope, z });
  }

  if (poles.length > 0) {
    return (z: Complex) => {
      let acc: Complex = { re: 0, im: 0 };
      for (const p of poles) {
        const diff = { re: z.re - p.re, im: z.im - p.im };
        acc = cAdd(acc, cDiv({ re: 1, im: 0 }, diff));
      }
      return acc;
    };
  }
  return null;
}

export function evaluateSceneMeasures(scene: SceneSpec): ComputedMeasure[] {
  const scope = buildParamScope(scene);
  const results: ComputedMeasure[] = [];

  for (const m of scene.measures) {
    // Built-in symbolic measures: length(id), exactLength(id), gaussGreenLine(), gaussGreenDouble(), contourIntegral(), residuesSum()
    const fnMatch = m.expr.match(/^([a-zA-Z0-9_]+)\(([^)]*)\)$/);
    if (fnMatch) {
      const fnName = fnMatch[1];
      const arg = fnMatch[2].trim();

      if (fnName === 'length') {
        const poly = scene.objects.find((o) => o.kind === 'polygonal' && o.id === arg);
        if (poly && poly.kind === 'polygonal') {
          const curve = scene.objects.find((o) => o.kind === 'curve' && o.id === poly.curveId);
          if (curve && curve.kind === 'curve') {
            const fx = compileRealExpr(curve.xExpr, scope);
            const fy = compileRealExpr(curve.yExpr, scope);
            const fz = curve.zExpr ? compileRealExpr(curve.zExpr, scope) : () => 0;
            const tMinFn = compileRealExpr(curve.tMin, scope);
            const tMaxFn = compileRealExpr(curve.tMax, scope);
            const segFn = compileRealExpr(poly.segmentsExpr, scope);
            if (fx && fy && fz && tMinFn && tMaxFn && segFn) {
              const len = polygonalLength(
                (t) => fx({ t }),
                (t) => fy({ t }),
                (t) => fz({ t }),
                tMinFn({}),
                tMaxFn({}),
                segFn({})
              );
              results.push({ label: m.label, value: len.toFixed(4) });
              continue;
            }
          }
        }
      }

      if (fnName === 'exactLength') {
        const curve = scene.objects.find((o) => o.kind === 'curve' && o.id === arg);
        if (curve && curve.kind === 'curve') {
          const fx = compileRealExpr(curve.xExpr, scope);
          const fy = compileRealExpr(curve.yExpr, scope);
          const fz = curve.zExpr ? compileRealExpr(curve.zExpr, scope) : () => 0;
          const tMinFn = compileRealExpr(curve.tMin, scope);
          const tMaxFn = compileRealExpr(curve.tMax, scope);
          if (fx && fy && fz && tMinFn && tMaxFn) {
            const len = curveLengthExact(
              (t) => fx({ t }),
              (t) => fy({ t }),
              (t) => fz({ t }),
              tMinFn({}),
              tMaxFn({})
            );
            results.push({ label: m.label, value: len.toFixed(4) });
            continue;
          }
        }
      }

      if (fnName === 'gaussGreenLine' || fnName === 'gaussGreenDouble') {
        const vf = scene.objects.find((o) => o.kind === 'vectorfield');
        const dom = scene.objects.find((o) => o.kind === 'domain');
        if (vf && vf.kind === 'vectorfield' && dom && dom.kind === 'domain') {
          const F1 = compileRealExpr(vf.fxExpr, scope);
          const F2 = compileRealExpr(vf.fyExpr, scope);
          const aFn = compileRealExpr(dom.aExpr, scope);
          const bFn = compileRealExpr(dom.bExpr, scope);
          const alphaFn = compileRealExpr(dom.alphaExpr, scope);
          const betaFn = compileRealExpr(dom.betaExpr, scope);
          if (F1 && F2 && aFn && bFn && alphaFn && betaFn) {
            const res = gaussGreenVerify(
              (x, y) => F1({ x, y }),
              (x, y) => F2({ x, y }),
              aFn({}),
              bFn({}),
              (x) => alphaFn({ x }),
              (x) => betaFn({ x }),
              48
            );
            const val = fnName === 'gaussGreenLine' ? res.lineIntegral : res.doubleIntegral;
            results.push({ label: m.label, value: val.toFixed(4) });
            continue;
          }
        }
      }

      if (fnName === 'contourIntegral' || fnName === 'residuesSum') {
        const fz = compileComplexSceneFn(scene, scope);
        const contour = scene.objects.find((o) => o.kind === 'contour' && o.visible);
        const poles = scene.objects.filter((o): o is PoleObject => o.kind === 'pole' && o.visible);
        if (fz && contour && contour.kind === 'contour') {
          if (fnName === 'contourIntegral') {
            const integral = contourIntegralComplex(
              fz,
              contour.cx,
              contour.cy,
              contour.rx,
              contour.ry,
              256
            );
            results.push({ label: m.label, value: formatComplex(integral, 3) });
            continue;
          } else {
            let sumRes: Complex = { re: 0, im: 0 };
            for (const p of poles) {
              if (isInsideEllipse({ re: p.re, im: p.im }, contour.cx, contour.cy, contour.rx, contour.ry)) {
                sumRes = cAdd(sumRes, estimateResidue(fz, { re: p.re, im: p.im }, 0.035, 96));
              }
            }
            const total = cMul({ re: 0, im: 2 * Math.PI }, sumRes);
            results.push({ label: m.label, value: formatComplex(total, 3) });
            continue;
          }
        }
      }
    }

    // Fallback: evaluate arithmetic/LaTeX expression against parameters
    const parsed = tryParseLatex(m.expr);
    if (parsed.ast) {
      const v = evalReal(parsed.ast, scope);
      results.push({
        label: m.label,
        value: Number.isFinite(v) ? v.toFixed(4) : '—',
      });
    } else {
      results.push({ label: m.label, value: '—' });
    }
  }

  return results;
}
