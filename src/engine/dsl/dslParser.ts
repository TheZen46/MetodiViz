import { tryParseLatex } from '../latex/latexParser';
import { DslDiagnostic, DslParseResult, SceneObject, SceneRange, SceneSpec, ViewMode } from './types';

export function createDefaultRange(view: ViewMode): SceneRange {
  if (view === '2d') {
    return { x: [-4, 4], y: [-3, 3], z: [-2, 2] };
  }
  if (view === 'complex') {
    return { x: [-3.5, 3.5], y: [-3, 3], z: [-2, 2] };
  }
  return { x: [-3, 3], y: [-3, 3], z: [-2.5, 2.5] };
}

export function createEmptyScene(view: ViewMode = '3d'): SceneSpec {
  return {
    view,
    range: createDefaultRange(view),
    params: [],
    objects: [],
    measures: [],
  };
}

function parseNumberOrLatex(raw: string): number | null {
  const trimmed = raw.trim();
  const n = Number(trimmed);
  if (Number.isFinite(n)) return n;
  const parsed = tryParseLatex(trimmed);
  if (!parsed.ast) return null;
  if (parsed.ast.type === 'number') return parsed.ast.value;
  if (parsed.ast.type === 'unary' && parsed.ast.op === '-' && parsed.ast.arg.type === 'number') {
    return -parsed.ast.arg.value;
  }
  if (parsed.ast.type === 'const' && parsed.ast.name === 'pi') return Math.PI;
  if (parsed.ast.type === 'const' && parsed.ast.name === 'e') return Math.E;
  return null;
}

function splitTopLevelCommas(text: string): string[] {
  const parts: string[] = [];
  let depthParen = 0;
  let depthBrace = 0;
  let depthBracket = 0;
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(') depthParen++;
    else if (ch === ')') depthParen = Math.max(0, depthParen - 1);
    else if (ch === '{') depthBrace++;
    else if (ch === '}') depthBrace = Math.max(0, depthBrace - 1);
    else if (ch === '[') depthBracket++;
    else if (ch === ']') depthBracket = Math.max(0, depthBracket - 1);

    if (ch === ',' && depthParen === 0 && depthBrace === 0 && depthBracket === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function extractColor(rest: string, defaultColor: string): { clean: string; color: string } {
  const match = rest.match(/\bcolor\s+(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)\s*$/);
  if (!match) return { clean: rest.trim(), color: defaultColor };
  return {
    clean: rest.slice(0, match.index).trim(),
    color: match[1],
  };
}

const DEFAULT_COLORS = ['#38bdf8', '#f59e0b', '#34d399', '#f472b6', '#a78bfa', '#fb7185'];

export function parseDsl(source: string): DslParseResult {
  const lines = source.split(/\r?\n/);
  const errors: DslDiagnostic[] = [];
  const scene = createEmptyScene('3d');
  let colorIdx = 0;
  const nextColor = () => DEFAULT_COLORS[colorIdx++ % DEFAULT_COLORS.length];

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith('#') || rawLine.startsWith('//')) continue;

    // view: 3d | 2d | complex
    const viewMatch = rawLine.match(/^view\s*:\s*(3d|2d|complex)\s*$/i);
    if (viewMatch) {
      scene.view = viewMatch[1].toLowerCase() as ViewMode;
      continue;
    }

    // range: x in [-3, 3], y in [-3, 3], z in [-2, 2]
    if (/^range\s*:/.test(rawLine)) {
      const body = rawLine.replace(/^range\s*:/, '').trim();
      const segments = splitTopLevelCommas(body);
      for (const seg of segments) {
        const m = seg.match(/^([xyz])\s+in\s+\[\s*([^,]+)\s*,\s*([^\]]+)\s*\]$/i);
        if (!m) {
          errors.push({ line: lineNo, message: `Intervallo range non valido: "${seg}". Usa es: x in [-3, 3]` });
          continue;
        }
        const axis = m[1].toLowerCase() as 'x' | 'y' | 'z';
        const minV = parseNumberOrLatex(m[2]);
        const maxV = parseNumberOrLatex(m[3]);
        if (minV === null || maxV === null || minV >= maxV) {
          errors.push({ line: lineNo, message: `Estremi non validi per asse ${axis}` });
          continue;
        }
        scene.range[axis] = [minV, maxV];
      }
      continue;
    }

    // param name = value in [min, max] (step s)?
    if (/^param\s+/.test(rawLine)) {
      const m = rawLine.match(
        /^param\s+([a-zA-Z][a-zA-Z0-9_]*)\s*=\s*([^\s]+)\s+in\s+\[\s*([^,]+)\s*,\s*([^\]]+)\s*\](?:\s+step\s+([^\s]+))?$/
      );
      if (!m) {
        errors.push({
          line: lineNo,
          message: 'Sintassi param non valida. Atteso: param a = 1 in [0, 5] step 0.1',
        });
        continue;
      }
      const val = parseNumberOrLatex(m[2]);
      const min = parseNumberOrLatex(m[3]);
      const max = parseNumberOrLatex(m[4]);
      const step = m[5] ? parseNumberOrLatex(m[5]) : (max !== null && min !== null ? (max - min) / 100 : 0.1);
      if (val === null || min === null || max === null || step === null) {
        errors.push({ line: lineNo, message: `Valori numerici non validi per param ${m[1]}` });
        continue;
      }
      scene.params.push({ name: m[1], value: val, min, max, step });
      continue;
    }

    // surface id: z = expr (wireframe)? (color #hex)?
    if (/^surface\s+/.test(rawLine)) {
      const m = rawLine.match(/^surface\s+([a-zA-Z0-9_]+)\s*:\s*(.+)$/);
      if (!m) {
        errors.push({ line: lineNo, message: 'Sintassi attesa: surface S: z = <formula>' });
        continue;
      }
      const { clean, color } = extractColor(m[2], nextColor());
      const wireframe = /\bwireframe\b/.test(clean);
      const exprRaw = clean.replace(/\bwireframe\b/g, '').replace(/^\s*z\s*=\s*/i, '').trim();
      const check = tryParseLatex(exprRaw);
      if (check.error) {
        errors.push({ line: lineNo, message: `Formula superficie non valida: ${check.error}` });
      }
      scene.objects.push({
        kind: 'surface',
        id: m[1],
        expr: exprRaw,
        color,
        visible: true,
        wireframe,
      });
      continue;
    }

    // plot id: y = expr (dashed)? (color #hex)?
    if (/^plot\s+/.test(rawLine)) {
      const m = rawLine.match(/^plot\s+([a-zA-Z0-9_]+)\s*:\s*(.+)$/);
      if (!m) {
        errors.push({ line: lineNo, message: 'Sintassi attesa: plot f: y = <formula>' });
        continue;
      }
      const { clean, color } = extractColor(m[2], nextColor());
      const dashed = /\bdashed\b/.test(clean);
      const exprRaw = clean.replace(/\bdashed\b/g, '').replace(/^\s*(?:y|f\(x\))\s*=\s*/i, '').trim();
      const check = tryParseLatex(exprRaw);
      if (check.error) {
        errors.push({ line: lineNo, message: `Formula plot non valida: ${check.error}` });
      }
      scene.objects.push({
        kind: 'plot',
        id: m[1],
        expr: exprRaw,
        color,
        visible: true,
        dashed,
      });
      continue;
    }

    // curve id: (x, y, z?) for t in [a, b] (color #hex)?
    if (/^curve\s+/.test(rawLine)) {
      const m = rawLine.match(/^curve\s+([a-zA-Z0-9_]+)\s*:\s*\((.+)\)\s+for\s+t\s+in\s+\[\s*([^,]+)\s*,\s*([^\]]+)\s*\](.*)$/);
      if (!m) {
        errors.push({
          line: lineNo,
          message: 'Sintassi attesa: curve g: (cos(t), sin(t), t/4) for t in [0, 2\\pi]',
        });
        continue;
      }
      const coords = splitTopLevelCommas(m[2]);
      if (coords.length < 2 || coords.length > 3) {
        errors.push({ line: lineNo, message: 'Una curva richiede 2 o 3 componenti (x, y[, z])' });
        continue;
      }
      const { color } = extractColor(m[5] ?? '', nextColor());
      for (const cExpr of coords) {
        const chk = tryParseLatex(cExpr);
        if (chk.error) errors.push({ line: lineNo, message: `Componente curva non valida: ${chk.error}` });
      }
      scene.objects.push({
        kind: 'curve',
        id: m[1],
        xExpr: coords[0],
        yExpr: coords[1],
        zExpr: coords[2],
        tMin: m[3].trim(),
        tMax: m[4].trim(),
        color,
        visible: true,
      });
      continue;
    }

    // polygonal id: on curveId with N segments (color #hex)?
    if (/^polygonal\s+/.test(rawLine)) {
      const m = rawLine.match(/^polygonal\s+([a-zA-Z0-9_]+)\s*:\s*on\s+([a-zA-Z0-9_]+)\s+with\s+(.+?)\s+segments(.*)$/);
      if (!m) {
        errors.push({
          line: lineNo,
          message: 'Sintassi attesa: polygonal P: on gamma with N segments',
        });
        continue;
      }
      const { color } = extractColor(m[4] ?? '', '#f59e0b');
      scene.objects.push({
        kind: 'polygonal',
        id: m[1],
        curveId: m[2],
        segmentsExpr: m[3].trim(),
        color,
        visible: true,
      });
      continue;
    }

    // vectorfield id: (Fx, Fy) (heatmap)? (color #hex)?
    if (/^vectorfield\s+/.test(rawLine)) {
      const m = rawLine.match(/^vectorfield\s+([a-zA-Z0-9_]+)\s*:\s*\((.+)\)(.*)$/);
      if (!m) {
        errors.push({
          line: lineNo,
          message: 'Sintassi attesa: vectorfield F: (-y, x)',
        });
        continue;
      }
      const comps = splitTopLevelCommas(m[2]);
      if (comps.length !== 2) {
        errors.push({ line: lineNo, message: 'Il campo vettoriale 2D richiede esattamente 2 componenti (F1, F2)' });
        continue;
      }
      const { clean, color } = extractColor(m[3] ?? '', '#38bdf8');
      const showCurlHeatmap = /\bheatmap\b/.test(clean);
      scene.objects.push({
        kind: 'vectorfield',
        id: m[1],
        fxExpr: comps[0],
        fyExpr: comps[1],
        color,
        visible: true,
        showCurlHeatmap,
      });
      continue;
    }

    // domain id: x in [a, b], y in [alpha, beta] (color #hex)?
    if (/^domain\s+/.test(rawLine)) {
      const m = rawLine.match(
        /^domain\s+([a-zA-Z0-9_]+)\s*:\s*x\s+in\s+\[\s*([^,]+)\s*,\s*([^\]]+)\s*\]\s*,\s*y\s+in\s+\[\s*([^,]+)\s*,\s*([^\]]+)\s*\](.*)$/
      );
      if (!m) {
        errors.push({
          line: lineNo,
          message: 'Sintassi attesa: domain D: x in [0, 2], y in [0.5, 2 + 0.3\\sin(2x)]',
        });
        continue;
      }
      const { color } = extractColor(m[6] ?? '', '#34d399');
      scene.objects.push({
        kind: 'domain',
        id: m[1],
        aExpr: m[2].trim(),
        bExpr: m[3].trim(),
        alphaExpr: m[4].trim(),
        betaExpr: m[5].trim(),
        color,
        visible: true,
        showBoundaryArrows: true,
      });
      continue;
    }

    // complex id: f(z) = expr (colorDomain)?
    if (/^complex\s+/.test(rawLine)) {
      const m = rawLine.match(/^complex\s+([a-zA-Z0-9_]+)\s*:\s*(.+)$/);
      if (!m) {
        errors.push({ line: lineNo, message: 'Sintassi attesa: complex f: f(z) = \\frac{1}{z^2+1}' });
        continue;
      }
      const expr = m[2].replace(/^\s*f\(z\)\s*=\s*/i, '').trim();
      const chk = tryParseLatex(expr);
      if (chk.error) errors.push({ line: lineNo, message: `Formula complessa non valida: ${chk.error}` });
      scene.objects.push({
        kind: 'complexFn',
        id: m[1],
        expr,
        visible: true,
        domainColoring: true,
      });
      continue;
    }

    // contour id: circle(cx, cy, r) | ellipse(cx, cy, rx, ry)
    if (/^contour\s+/.test(rawLine)) {
      const m = rawLine.match(/^contour\s+([a-zA-Z0-9_]+)\s*:\s*(circle|ellipse)\(([^)]+)\)(.*)$/);
      if (!m) {
        errors.push({ line: lineNo, message: 'Sintassi attesa: contour C: circle(0, 0, 2)' });
        continue;
      }
      const args = splitTopLevelCommas(m[3]).map(parseNumberOrLatex);
      const { color } = extractColor(m[4] ?? '', '#f43f5e');
      if (m[2] === 'circle' && args.length >= 3 && args.every((v) => v !== null)) {
        const r = args[2] as number;
        scene.objects.push({
          kind: 'contour',
          id: m[1],
          shape: 'circle',
          cx: args[0] as number,
          cy: args[1] as number,
          rx: r,
          ry: r,
          color,
          visible: true,
        });
      } else if (m[2] === 'ellipse' && args.length >= 4 && args.every((v) => v !== null)) {
        scene.objects.push({
          kind: 'contour',
          id: m[1],
          shape: 'ellipse',
          cx: args[0] as number,
          cy: args[1] as number,
          rx: args[2] as number,
          ry: args[3] as number,
          color,
          visible: true,
        });
      } else {
        errors.push({ line: lineNo, message: 'Parametri contorno non validi' });
      }
      continue;
    }

    // pole id: (re, im)
    if (/^pole\s+/.test(rawLine)) {
      const m = rawLine.match(/^pole\s+([a-zA-Z0-9_]+)\s*:\s*\(([^,]+),\s*([^)]+)\)(.*)$/);
      if (!m) {
        errors.push({ line: lineNo, message: 'Sintassi attesa: pole z1: (1, 0.5)' });
        continue;
      }
      const re = parseNumberOrLatex(m[2]);
      const im = parseNumberOrLatex(m[3]);
      const { color } = extractColor(m[4] ?? '', '#22c55e');
      if (re === null || im === null) {
        errors.push({ line: lineNo, message: 'Coordinate polo non valide' });
        continue;
      }
      scene.objects.push({
        kind: 'pole',
        id: m[1],
        re,
        im,
        label: m[1],
        color,
        visible: true,
      });
      continue;
    }

    // point id: (x, y, z?)
    if (/^point\s+/.test(rawLine)) {
      const m = rawLine.match(/^point\s+([a-zA-Z0-9_]+)\s*:\s*\(([^)]+)\)(.*)$/);
      if (!m) {
        errors.push({ line: lineNo, message: 'Sintassi attesa: point P: (1, 2)' });
        continue;
      }
      const coords = splitTopLevelCommas(m[2]).map(parseNumberOrLatex);
      const { color } = extractColor(m[3] ?? '', '#facc15');
      if (coords.length < 2 || coords.some((c) => c === null)) {
        errors.push({ line: lineNo, message: 'Coordinate punto non valide' });
        continue;
      }
      scene.objects.push({
        kind: 'point',
        id: m[1],
        x: coords[0] as number,
        y: coords[1] as number,
        z: coords[2] !== undefined ? (coords[2] as number) : undefined,
        label: m[1],
        color,
        visible: true,
        draggable: true,
      });
      continue;
    }

    // measure "Label" = expr
    if (/^measure\s+/.test(rawLine)) {
      const m = rawLine.match(/^measure\s+"([^"]+)"\s*=\s*(.+)$/);
      if (!m) {
        errors.push({ line: lineNo, message: 'Sintassi attesa: measure "Titolo" = length(P)' });
        continue;
      }
      scene.measures.push({ label: m[1], expr: m[2].trim() });
      continue;
    }

    errors.push({ line: lineNo, message: `Istruzione sconosciuta: "${rawLine}"` });
  }

  // Ensure ids are unique
  const seenIds = new Set<string>();
  scene.objects.forEach((obj: SceneObject, idx) => {
    if (seenIds.has(obj.id)) obj.id = `${obj.id}_${idx + 1}`;
    seenIds.add(obj.id);
  });

  return { scene, errors };
}
