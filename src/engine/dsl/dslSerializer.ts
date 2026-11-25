import { SceneSpec } from './types';

function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : Number(n.toFixed(3)).toString();
}

export function serializeSceneToDsl(scene: SceneSpec): string {
  const lines: string[] = [];
  lines.push(`view: ${scene.view}`);
  if (scene.view === '3d') {
    lines.push(
      `range: x in [${fmtNum(scene.range.x[0])}, ${fmtNum(scene.range.x[1])}], y in [${fmtNum(scene.range.y[0])}, ${fmtNum(scene.range.y[1])}], z in [${fmtNum(scene.range.z[0])}, ${fmtNum(scene.range.z[1])}]`
    );
  } else {
    lines.push(
      `range: x in [${fmtNum(scene.range.x[0])}, ${fmtNum(scene.range.x[1])}], y in [${fmtNum(scene.range.y[0])}, ${fmtNum(scene.range.y[1])}]`
    );
  }

  if (scene.params.length > 0) {
    lines.push('');
    for (const p of scene.params) {
      lines.push(
        `param ${p.name} = ${fmtNum(p.value)} in [${fmtNum(p.min)}, ${fmtNum(p.max)}] step ${fmtNum(p.step)}`
      );
    }
  }

  if (scene.objects.length > 0) {
    lines.push('');
    for (const obj of scene.objects) {
      switch (obj.kind) {
        case 'surface':
          lines.push(
            `surface ${obj.id}: z = ${obj.expr}${obj.wireframe ? ' wireframe' : ''} color ${obj.color}`
          );
          break;
        case 'plot':
          lines.push(
            `plot ${obj.id}: y = ${obj.expr}${obj.dashed ? ' dashed' : ''} color ${obj.color}`
          );
          break;
        case 'curve':
          lines.push(
            `curve ${obj.id}: (${obj.xExpr}, ${obj.yExpr}${obj.zExpr ? `, ${obj.zExpr}` : ''}) for t in [${obj.tMin}, ${obj.tMax}] color ${obj.color}`
          );
          break;
        case 'polygonal':
          lines.push(
            `polygonal ${obj.id}: on ${obj.curveId} with ${obj.segmentsExpr} segments color ${obj.color}`
          );
          break;
        case 'vectorfield':
          lines.push(
            `vectorfield ${obj.id}: (${obj.fxExpr}, ${obj.fyExpr})${obj.showCurlHeatmap ? ' heatmap' : ''} color ${obj.color}`
          );
          break;
        case 'domain':
          lines.push(
            `domain ${obj.id}: x in [${obj.aExpr}, ${obj.bExpr}], y in [${obj.alphaExpr}, ${obj.betaExpr}] color ${obj.color}`
          );
          break;
        case 'complexFn':
          lines.push(`complex ${obj.id}: f(z) = ${obj.expr}`);
          break;
        case 'contour':
          if (obj.shape === 'circle') {
            lines.push(
              `contour ${obj.id}: circle(${fmtNum(obj.cx)}, ${fmtNum(obj.cy)}, ${fmtNum(obj.rx)}) color ${obj.color}`
            );
          } else {
            lines.push(
              `contour ${obj.id}: ellipse(${fmtNum(obj.cx)}, ${fmtNum(obj.cy)}, ${fmtNum(obj.rx)}, ${fmtNum(obj.ry)}) color ${obj.color}`
            );
          }
          break;
        case 'pole':
          lines.push(`pole ${obj.id}: (${fmtNum(obj.re)}, ${fmtNum(obj.im)}) color ${obj.color}`);
          break;
        case 'point':
          lines.push(
            `point ${obj.id}: (${fmtNum(obj.x)}, ${fmtNum(obj.y)}${obj.z !== undefined ? `, ${fmtNum(obj.z)}` : ''}) color ${obj.color}`
          );
          break;
      }
    }
  }

  if (scene.measures.length > 0) {
    lines.push('');
    for (const m of scene.measures) {
      lines.push(`measure "${m.label}" = ${m.expr}`);
    }
  }

  return lines.join('\n');
}
