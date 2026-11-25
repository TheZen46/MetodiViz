import React, { useEffect, useMemo, useRef, useState } from 'react';
import { buildParamScope, compileRealExpr } from '../engine/dsl/runtime';
import {
  CurveObject,
  DomainObject,
  PlotObject,
  PointObject,
  SceneSpec,
  VectorFieldObject,
} from '../engine/dsl/types';
import {
  dirichletKernel,
  evaluateFourierPartialSum,
  fourierCoefficients,
  integrateFieldLineRK4,
  vectorFieldCurlAndDiv,
} from '../engine/math/numerics';

interface View2DProps {
  scene: SceneSpec;
  theme: 'dark' | 'light';
  onUpdatePoint?: (id: string, x: number, y: number) => void;
  onAddPoint?: (x: number, y: number) => void;
}

type Tool2D = 'pan' | 'probe' | 'addPoint' | 'flow';

interface Camera2D {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

function fourierSignalFn(preset: 'square' | 'sawtooth'): (x: number) => number {
  const wrapPi = (x: number) => {
    let t = ((x + Math.PI) % (2 * Math.PI));
    if (t < 0) t += 2 * Math.PI;
    return t - Math.PI;
  };
  if (preset === 'sawtooth') {
    return (x: number) => {
      const t = wrapPi(x);
      return t / Math.PI;
    };
  }
  return (x: number) => {
    const t = wrapPi(x);
    if (Math.abs(t) < 1e-4 || Math.abs(Math.abs(t) - Math.PI) < 1e-4) return 0;
    return t > 0 ? 1 : -1;
  };
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  headLen = 7
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

export const View2D: React.FC<View2DProps> = ({ scene, theme, onUpdatePoint, onAddPoint }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  const [tool, setTool] = useState<Tool2D>('pan');
  const [cam, setCam] = useState<Camera2D>(() => ({
    xMin: scene.range.x[0],
    xMax: scene.range.x[1],
    yMin: scene.range.y[0],
    yMax: scene.range.y[1],
  }));
  const [flowSeeds, setFlowSeeds] = useState<Array<{ x: number; y: number }>>([]);
  const [probe, setProbe] = useState<{
    x: number;
    y: number;
    values: Array<{ label: string; val: string }>;
  } | null>(null);

  // Sync camera when scene range resets (e.g. switching proof or preset)
  const rangeKey = `${scene.range.x[0]},${scene.range.x[1]},${scene.range.y[0]},${scene.range.y[1]}`;
  useEffect(() => {
    setCam({
      xMin: scene.range.x[0],
      xMax: scene.range.x[1],
      yMin: scene.range.y[0],
      yMax: scene.range.y[1],
    });
    setFlowSeeds([]);
  }, [rangeKey]);

  const scope = useMemo(() => buildParamScope(scene), [scene]);

  const dragRef = useRef<{
    active: boolean;
    mode: 'pan' | 'point';
    pointId?: string;
    startX: number;
    startY: number;
    startCam: Camera2D;
    moved: boolean;
  }>({
    active: false,
    mode: 'pan',
    startX: 0,
    startY: 0,
    startCam: cam,
    moved: false,
  });

  const fourierData = useMemo(() => {
    if (scene.overlay?.mode !== 'fourier') return null;
    const N = Math.max(1, Math.min(50, Math.round(scope.N ?? 5)));
    const preset = scene.overlay.fourierPreset ?? 'square';
    const fn = fourierSignalFn(preset);
    const coeffs = fourierCoefficients(fn, N, 512);
    return { N, preset, fn, coeffs };
  }, [scene.overlay, scope.N]);

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = host.clientWidth || 640;
    const h = host.clientHeight || 460;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const toScreenX = (x: number) => ((x - cam.xMin) / (cam.xMax - cam.xMin)) * w;
    const toScreenY = (y: number) => h - ((y - cam.yMin) / (cam.yMax - cam.yMin)) * h;

    // Background
    ctx.fillStyle = theme === 'dark' ? '#121417' : '#f5f2eb';
    ctx.fillRect(0, 0, w, h);

    // Optional Curl heatmap inside domain or viewport
    const vectorFields = scene.objects.filter(
      (o): o is VectorFieldObject => o.kind === 'vectorfield' && o.visible
    );
    const domains = scene.objects.filter((o): o is DomainObject => o.kind === 'domain' && o.visible);

    // Draw grid
    const spanX = cam.xMax - cam.xMin;
    const rawStep = spanX / 10;
    const pow10 = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = rawStep / pow10 > 5 ? 5 * pow10 : rawStep / pow10 > 2 ? 2 * pow10 : pow10;

    ctx.strokeStyle = theme === 'dark' ? 'rgba(148, 163, 184, 0.14)' : 'rgba(100, 116, 139, 0.18)';
    ctx.lineWidth = 1;
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = theme === 'dark' ? '#94a3b8' : '#475569';

    const startGx = Math.ceil(cam.xMin / step) * step;
    for (let x = startGx; x <= cam.xMax; x += step) {
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
      if (Math.abs(x) > step * 0.1) {
        ctx.fillText(Number(x.toFixed(2)).toString(), sx + 3, Math.min(h - 6, Math.max(14, toScreenY(0) + 12)));
      }
    }
    const startGy = Math.ceil(cam.yMin / step) * step;
    for (let y = startGy; y <= cam.yMax; y += step) {
      const sy = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();
      if (Math.abs(y) > step * 0.1) {
        ctx.fillText(Number(y.toFixed(2)).toString(), Math.max(6, Math.min(w - 30, toScreenX(0) + 5)), sy - 3);
      }
    }

    // Axes
    ctx.strokeStyle = theme === 'dark' ? '#64748b' : '#475569';
    ctx.lineWidth = 1.5;
    if (cam.yMin <= 0 && cam.yMax >= 0) {
      const y0 = toScreenY(0);
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(w, y0);
      ctx.stroke();
    }
    if (cam.xMin <= 0 && cam.xMax >= 0) {
      const x0 = toScreenX(0);
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x0, h);
      ctx.stroke();
    }

    // Domains (Gauss-Green)
    for (const dom of domains) {
      const aFn = compileRealExpr(dom.aExpr, scope);
      const bFn = compileRealExpr(dom.bExpr, scope);
      const alphaFn = compileRealExpr(dom.alphaExpr, scope);
      const betaFn = compileRealExpr(dom.betaExpr, scope);
      if (!aFn || !bFn || !alphaFn || !betaFn) continue;
      const a = aFn({});
      const b = bFn({});
      const samples = 80;

      // Curl heatmap inside domain if requested and vector field present
      if ((scene.overlay?.showCurlHeatmap || vectorFields.some((v) => v.showCurlHeatmap)) && vectorFields[0]) {
        const vf = vectorFields[0];
        const F1 = compileRealExpr(vf.fxExpr, scope);
        const F2 = compileRealExpr(vf.fyExpr, scope);
        if (F1 && F2) {
          const cols = 24;
          const rows = 18;
          for (let ix = 0; ix < cols; ix++) {
            const x = a + ((b - a) * (ix + 0.5)) / cols;
            const yLo = alphaFn({ x });
            const yHi = betaFn({ x });
            const dx = (b - a) / cols;
            const dy = (yHi - yLo) / rows;
            for (let iy = 0; iy < rows; iy++) {
              const y = yLo + ((yHi - yLo) * (iy + 0.5)) / rows;
              const { curl } = vectorFieldCurlAndDiv(
                (px, py) => F1({ x: px, y: py }),
                (px, py) => F2({ x: px, y: py }),
                x,
                y
              );
              const intensity = Math.min(0.45, Math.abs(curl) * 0.14);
              ctx.fillStyle = curl >= 0 ? `rgba(52, 211, 153, ${intensity})` : `rgba(244, 63, 94, ${intensity})`;
              const sx = toScreenX(x - dx / 2);
              const sy = toScreenY(y + dy / 2);
              const sw = toScreenX(x + dx / 2) - sx + 1;
              const sh = toScreenY(y - dy / 2) - sy + 1;
              ctx.fillRect(sx, sy, sw, sh);
            }
          }
        }
      }

      // Fill domain polygon
      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const x = a + ((b - a) * i) / samples;
        const y = alphaFn({ x });
        if (i === 0) ctx.moveTo(toScreenX(x), toScreenY(y));
        else ctx.lineTo(toScreenX(x), toScreenY(y));
      }
      for (let i = samples; i >= 0; i--) {
        const x = a + ((b - a) * i) / samples;
        const y = betaFn({ x });
        ctx.lineTo(toScreenX(x), toScreenY(y));
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(52, 211, 153, 0.12)';
      ctx.fill();

      // Draw 4 boundary curves with counterclockwise arrows: gamma_1 (bottom), gamma_2 (right), gamma_3 (top), gamma_4 (left)
      const drawCurveSeg = (pts: Array<{ x: number; y: number }>, color: string, label: string) => {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        pts.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(toScreenX(p.x), toScreenY(p.y));
          else ctx.lineTo(toScreenX(p.x), toScreenY(p.y));
        });
        ctx.stroke();

        const mid = Math.floor(pts.length / 2);
        if (mid > 0 && mid < pts.length) {
          const p0 = pts[mid - 1];
          const p1 = pts[mid];
          drawArrow(ctx, toScreenX(p0.x), toScreenY(p0.y), toScreenX(p1.x), toScreenY(p1.y), 9);
          ctx.font = 'bold 12px system-ui, sans-serif';
          ctx.fillText(label, toScreenX(p1.x) + 8, toScreenY(p1.y) - 6);
        }
      };

      const g1: Array<{ x: number; y: number }> = [];
      const g3: Array<{ x: number; y: number }> = [];
      for (let i = 0; i <= samples; i++) {
        const x = a + ((b - a) * i) / samples;
        g1.push({ x, y: alphaFn({ x }) });
      }
      for (let i = samples; i >= 0; i--) {
        const x = a + ((b - a) * i) / samples;
        g3.push({ x, y: betaFn({ x }) });
      }
      const g2 = [
        { x: b, y: alphaFn({ x: b }) },
        { x: b, y: (alphaFn({ x: b }) + betaFn({ x: b })) / 2 },
        { x: b, y: betaFn({ x: b }) },
      ];
      const g4 = [
        { x: a, y: betaFn({ x: a }) },
        { x: a, y: (alphaFn({ x: a }) + betaFn({ x: a })) / 2 },
        { x: a, y: alphaFn({ x: a }) },
      ];

      drawCurveSeg(g1, '#facc15', 'γ₁');
      drawCurveSeg(g2, '#38bdf8', 'γ₂');
      drawCurveSeg(g3, '#f472b6', 'γ₃');
      drawCurveSeg(g4, '#a78bfa', 'γ₄');

      // Vertical slice E(x) if enabled
      if (scene.overlay?.showSlice) {
        const xs = Math.max(a, Math.min(b, scope[dom.sliceXParam ?? 'xSlice'] ?? (a + b) / 2));
        const y0 = alphaFn({ x: xs });
        const y1 = betaFn({ x: xs });
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(toScreenX(xs), toScreenY(y0));
        ctx.lineTo(toScreenX(xs), toScreenY(y1));
        ctx.stroke();
        ctx.fillStyle = '#fb923c';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.fillText('E(x)', toScreenX(xs) + 6, toScreenY((y0 + y1) / 2));
      }
    }

    // Vector Fields
    for (const vf of vectorFields) {
      const F1 = compileRealExpr(vf.fxExpr, scope);
      const F2 = compileRealExpr(vf.fyExpr, scope);
      if (!F1 || !F2) continue;

      const cols = 16;
      const rows = 12;
      const cellW = (cam.xMax - cam.xMin) / cols;
      const cellH = (cam.yMax - cam.yMin) / rows;
      const maxArrowWorld = Math.min(cellW, cellH) * 0.72;

      ctx.strokeStyle = vf.color;
      ctx.fillStyle = vf.color;
      ctx.lineWidth = 1.4;
      for (let ix = 0; ix < cols; ix++) {
        for (let iy = 0; iy < rows; iy++) {
          const x = cam.xMin + (ix + 0.5) * cellW;
          const y = cam.yMin + (iy + 0.5) * cellH;
          const vx = F1({ x, y });
          const vy = F2({ x, y });
          const mag = Math.hypot(vx, vy);
          if (!Number.isFinite(mag) || mag < 1e-6) continue;
          const scale = maxArrowWorld * Math.min(1, mag / 2.2) / mag;
          const x2 = x + vx * scale;
          const y2 = y + vy * scale;
          drawArrow(ctx, toScreenX(x), toScreenY(y), toScreenX(x2), toScreenY(y2), 5.5);
        }
      }

      // User-clicked RK4 flow lines
      for (const seed of flowSeeds) {
        const pts = integrateFieldLineRK4(
          (px, py) => F1({ x: px, y: py }),
          (px, py) => F2({ x: px, y: py }),
          seed.x,
          seed.y
        );
        if (pts.length > 1) {
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.beginPath();
          pts.forEach((p, idx) => {
            if (idx === 0) ctx.moveTo(toScreenX(p.x), toScreenY(p.y));
            else ctx.lineTo(toScreenX(p.x), toScreenY(p.y));
          });
          ctx.stroke();
        }
      }
    }

    // Fourier specialized overlays
    if (fourierData) {
      const fMode = scene.overlay?.fourierMode ?? 'signal';
      const samples = 420;
      const x0 = scope.x0 ?? 0;

      if (fMode === 'signal') {
        // Target function f(x)
        ctx.strokeStyle = theme === 'dark' ? '#94a3b8' : '#64748b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        let prevY: number | null = null;
        for (let i = 0; i <= samples; i++) {
          const x = cam.xMin + ((cam.xMax - cam.xMin) * i) / samples;
          const y = fourierData.fn(x);
          if (prevY !== null && Math.abs(y - prevY) > 1.2) {
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(toScreenX(x), toScreenY(y));
          } else if (i === 0) {
            ctx.moveTo(toScreenX(x), toScreenY(y));
          } else {
            ctx.lineTo(toScreenX(x), toScreenY(y));
          }
          prevY = y;
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Partial sum S_N(x)
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        for (let i = 0; i <= samples; i++) {
          const x = cam.xMin + ((cam.xMax - cam.xMin) * i) / samples;
          const y = evaluateFourierPartialSum(
            fourierData.coeffs.a0,
            fourierData.coeffs.ak,
            fourierData.coeffs.bk,
            x
          );
          if (i === 0) ctx.moveTo(toScreenX(x), toScreenY(y));
          else ctx.lineTo(toScreenX(x), toScreenY(y));
        }
        ctx.stroke();

        // Jump mean highlight at x0
        if (scene.overlay?.showJumpMean) {
          const yLeft = fourierData.fn(x0 - 0.002);
          const yRight = fourierData.fn(x0 + 0.002);
          const yMean = (yLeft + yRight) / 2;
          const drawDot = (wx: number, wy: number, col: string, lbl: string) => {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(toScreenX(wx), toScreenY(wy), 5.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = 'bold 12px system-ui, sans-serif';
            ctx.fillText(lbl, toScreenX(wx) + 8, toScreenY(wy) - 4);
          };
          drawDot(x0, yLeft, '#f472b6', 'f(x⁻)');
          drawDot(x0, yRight, '#34d399', 'f(x⁺)');
          drawDot(x0, yMean, '#facc15', 'Media');
        }
      } else if (fMode === 'kernel') {
        // Dirichlet Kernel D_N(y)
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let i = 0; i <= samples; i++) {
          const y = cam.xMin + ((cam.xMax - cam.xMin) * i) / samples;
          const val = dirichletKernel(fourierData.N, y);
          if (i === 0) ctx.moveTo(toScreenX(y), toScreenY(val));
          else ctx.lineTo(toScreenX(y), toScreenY(val));
        }
        ctx.stroke();
      } else if (fMode === 'phi') {
        // Phi^-(y) on [-pi, 0)
        const fMinus = fourierData.fn(x0 - 0.002);
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= samples; i++) {
          const y = -Math.PI + (Math.PI * i) / samples;
          if (y >= -0.02) continue;
          const val = (fourierData.fn(x0 + y) - fMinus) / (2 * Math.sin(y / 2));
          if (!Number.isFinite(val)) continue;
          if (!started) {
            ctx.moveTo(toScreenX(y), toScreenY(val));
            started = true;
          } else {
            ctx.lineTo(toScreenX(y), toScreenY(val));
          }
        }
        ctx.stroke();

        // Limit dot at y=0
        const derivLeft = (fourierData.fn(x0 - 0.002) - fourierData.fn(x0 - 0.012)) / 0.01;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(toScreenX(0), toScreenY(derivLeft), 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.fillText("f'(x⁻) (limite finito)", toScreenX(0) + 8, toScreenY(derivLeft) - 4);
      }
    }

    // Standard Plots
    const plots = scene.objects.filter((o): o is PlotObject => o.kind === 'plot' && o.visible);
    for (const pObj of plots) {
      const fn = compileRealExpr(pObj.expr, scope);
      if (!fn) continue;
      ctx.strokeStyle = pObj.color;
      ctx.lineWidth = 2.4;
      if (pObj.dashed) ctx.setLineDash([6, 4]);
      else ctx.setLineDash([]);

      ctx.beginPath();
      const samples = 420;
      let started = false;
      let prevY: number | null = null;
      for (let i = 0; i <= samples; i++) {
        const x = cam.xMin + ((cam.xMax - cam.xMin) * i) / samples;
        const y = fn({ x });
        if (!Number.isFinite(y) || Math.abs(y) > 1e5) {
          started = false;
          prevY = null;
          continue;
        }
        if (prevY !== null && Math.abs(y - prevY) > (cam.yMax - cam.yMin) * 0.65) {
          ctx.stroke();
          ctx.beginPath();
          started = false;
        }
        if (!started) {
          ctx.moveTo(toScreenX(x), toScreenY(y));
          started = true;
        } else {
          ctx.lineTo(toScreenX(x), toScreenY(y));
        }
        prevY = y;
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2D Curves
    const curves = scene.objects.filter((o): o is CurveObject => o.kind === 'curve' && o.visible);
    for (const cObj of curves) {
      const fx = compileRealExpr(cObj.xExpr, scope);
      const fy = compileRealExpr(cObj.yExpr, scope);
      const tMinFn = compileRealExpr(cObj.tMin, scope);
      const tMaxFn = compileRealExpr(cObj.tMax, scope);
      if (!fx || !fy || !tMinFn || !tMaxFn) continue;
      const tMin = tMinFn({});
      const tMax = tMaxFn({});
      ctx.strokeStyle = cObj.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const t = tMin + ((tMax - tMin) * i) / 200;
        const x = fx({ t });
        const y = fy({ t });
        if (i === 0) ctx.moveTo(toScreenX(x), toScreenY(y));
        else ctx.lineTo(toScreenX(x), toScreenY(y));
      }
      ctx.stroke();
    }

    // Points
    const points = scene.objects.filter((o): o is PointObject => o.kind === 'point' && o.visible);
    for (const pt of points) {
      const sx = toScreenX(pt.x);
      const sy = toScreenY(pt.y);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (pt.label) {
        ctx.fillStyle = theme === 'dark' ? '#f8fafc' : '#0f172a';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.fillText(pt.label, sx + 9, sy - 6);
      }
    }

    // Probe crosshair
    if (probe) {
      const px = toScreenX(probe.x);
      const py = toScreenY(probe.y);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [scene, scope, cam, theme, flowSeeds, probe, fourierData]);

  // Resize observer to trigger repaint when split-pane resizes
  const [, setTick] = useState(0);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const obs = new ResizeObserver(() => setTick((t) => t + 1));
    obs.observe(host);
    return () => obs.disconnect();
  }, []);

  const screenToWorld = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = cam.xMin + ((clientX - rect.left) / rect.width) * (cam.xMax - cam.xMin);
    const y = cam.yMax - ((clientY - rect.top) / rect.height) * (cam.yMax - cam.yMin);
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const wPos = screenToWorld(e.clientX, e.clientY);
    const points = scene.objects.filter((o): o is PointObject => o.kind === 'point' && o.visible && o.draggable !== false);
    const hitTol = (cam.xMax - cam.xMin) * 0.03;
    const hitPt = points.find((p) => Math.hypot(p.x - wPos.x, p.y - wPos.y) < hitTol);

    if (hitPt && onUpdatePoint && tool === 'pan') {
      dragRef.current = {
        active: true,
        mode: 'point',
        pointId: hitPt.id,
        startX: e.clientX,
        startY: e.clientY,
        startCam: cam,
        moved: false,
      };
      return;
    }

    dragRef.current = {
      active: true,
      mode: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      startCam: cam,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (dragRef.current.active) {
      const dxPx = e.clientX - dragRef.current.startX;
      const dyPx = e.clientY - dragRef.current.startY;
      if (Math.hypot(dxPx, dyPx) > 3) dragRef.current.moved = true;

      if (dragRef.current.mode === 'point' && dragRef.current.pointId && onUpdatePoint) {
        const wPos = screenToWorld(e.clientX, e.clientY);
        onUpdatePoint(dragRef.current.pointId, wPos.x, wPos.y);
        return;
      }

      if (tool === 'pan') {
        const sc = dragRef.current.startCam;
        const dxWorld = (dxPx / rect.width) * (sc.xMax - sc.xMin);
        const dyWorld = (dyPx / rect.height) * (sc.yMax - sc.yMin);
        setCam({
          xMin: sc.xMin - dxWorld,
          xMax: sc.xMax - dxWorld,
          yMin: sc.yMin + dyWorld,
          yMax: sc.yMax + dyWorld,
        });
      }
    }

    if (tool === 'probe' || tool === 'flow') {
      const wPos = screenToWorld(e.clientX, e.clientY);
      const values: Array<{ label: string; val: string }> = [];
      for (const obj of scene.objects) {
        if (!obj.visible) continue;
        if (obj.kind === 'plot') {
          const fn = compileRealExpr(obj.expr, scope);
          if (fn) {
            const v = fn({ x: wPos.x });
            if (Number.isFinite(v)) values.push({ label: obj.id, val: v.toFixed(3) });
          }
        } else if (obj.kind === 'vectorfield') {
          const F1 = compileRealExpr(obj.fxExpr, scope);
          const F2 = compileRealExpr(obj.fyExpr, scope);
          if (F1 && F2) {
            const fx = F1({ x: wPos.x, y: wPos.y });
            const fy = F2({ x: wPos.x, y: wPos.y });
            const { curl, div } = vectorFieldCurlAndDiv(
              (px, py) => F1({ x: px, y: py }),
              (px, py) => F2({ x: px, y: py }),
              wPos.x,
              wPos.y
            );
            values.push({
              label: `${obj.id}(x,y)`,
              val: `(${fx.toFixed(2)}, ${fy.toFixed(2)}) | rot=${curl.toFixed(2)} | div=${div.toFixed(2)}`,
            });
          }
        }
      }
      setProbe({ x: wPos.x, y: wPos.y, values });
    } else {
      setProbe(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const wasMoved = dragRef.current.moved;
    dragRef.current.active = false;
    if (wasMoved) return;

    const wPos = screenToWorld(e.clientX, e.clientY);
    if (tool === 'addPoint' && onAddPoint) {
      onAddPoint(wPos.x, wPos.y);
    } else if (tool === 'flow') {
      setFlowSeeds((prev) => [...prev.slice(-14), { x: wPos.x, y: wPos.y }]);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.12 : 0.89;
    const wPos = screenToWorld(e.clientX, e.clientY);
    setCam((prev) => ({
      xMin: wPos.x - (wPos.x - prev.xMin) * factor,
      xMax: wPos.x + (prev.xMax - wPos.x) * factor,
      yMin: wPos.y - (wPos.y - prev.yMin) * factor,
      yMax: wPos.y + (prev.yMax - wPos.y) * factor,
    }));
  };

  const hasVectorField = scene.objects.some((o) => o.kind === 'vectorfield' && o.visible);

  return (
    <div className="viz-wrapper">
      <div className="viz-toolbar">
        <div className="viz-tool-group" role="group" aria-label="Strumenti 2D">
          <button
            type="button"
            className="viz-btn"
            aria-pressed={tool === 'pan'}
            onClick={() => setTool('pan')}
          >
            Naviga / Trascina
          </button>
          <button
            type="button"
            className="viz-btn"
            aria-pressed={tool === 'probe'}
            onClick={() => setTool('probe')}
          >
            Sonda
          </button>
          {onAddPoint && (
            <button
              type="button"
              className="viz-btn"
              aria-pressed={tool === 'addPoint'}
              onClick={() => setTool('addPoint')}
            >
              + Punto
            </button>
          )}
          {hasVectorField && (
            <button
              type="button"
              className="viz-btn"
              aria-pressed={tool === 'flow'}
              onClick={() => setTool('flow')}
            >
              Linea di Flusso
            </button>
          )}
        </div>

        <div className="viz-tool-group">
          {flowSeeds.length > 0 && (
            <button type="button" className="viz-btn" onClick={() => setFlowSeeds([])}>
              Pulisci Tracce
            </button>
          )}
          <button
            type="button"
            className="viz-btn"
            onClick={() =>
              setCam({
                xMin: scene.range.x[0],
                xMax: scene.range.x[1],
                yMin: scene.range.y[0],
                yMax: scene.range.y[1],
              })
            }
          >
            Reset Vista
          </button>
        </div>
      </div>

      <div className="viz-canvas-host" ref={hostRef}>
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            dragRef.current.active = false;
            setProbe(null);
          }}
          onWheel={handleWheel}
        />
      </div>

      <div className="viz-hud">
        {probe ? (
          <div>
            <strong>(x, y) = ({probe.x.toFixed(2)}, {probe.y.toFixed(2)})</strong>
            {probe.values.map((v) => (
              <span key={v.label}>
                {' '}
                • {v.label} = {v.val}
              </span>
            ))}
          </div>
        ) : (
          <div className="viz-hud-muted">
            Trascina per spostarti • Rotella per zoom • Trascina i punti gialli o usa gli strumenti sopra
          </div>
        )}
      </div>
    </div>
  );
};
