import React, { useEffect, useMemo, useRef, useState } from 'react';
import { buildParamScope, compileComplexSceneFn } from '../engine/dsl/runtime';
import { ContourObject, PoleObject, SceneSpec } from '../engine/dsl/types';
import { Complex, cAbs, cArg, formatComplex } from '../engine/math/complex';
import { isInsideEllipse } from '../engine/math/numerics';

interface ViewComplexProps {
  scene: SceneSpec;
  theme: 'dark' | 'light';
  onUpdatePole?: (id: string, re: number, im: number) => void;
  onUpdateContour?: (id: string, cx: number, cy: number, rx: number, ry: number) => void;
  onAddPole?: (re: number, im: number) => void;
}

type ToolComplex = 'manipulate' | 'probe' | 'addPole';

interface Camera2D {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

export const ViewComplex: React.FC<ViewComplexProps> = ({
  scene,
  theme,
  onUpdatePole,
  onUpdateContour,
  onAddPole,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  const [tool, setTool] = useState<ToolComplex>('manipulate');
  const [domainColoring, setDomainColoring] = useState(true);
  const [cam, setCam] = useState<Camera2D>(() => ({
    xMin: scene.range.x[0],
    xMax: scene.range.x[1],
    yMin: scene.range.y[0],
    yMax: scene.range.y[1],
  }));
  const [probe, setProbe] = useState<{ z: Complex; fz: Complex | null } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const rangeKey = `${scene.range.x[0]},${scene.range.x[1]},${scene.range.y[0]},${scene.range.y[1]}`;
  useEffect(() => {
    setCam({
      xMin: scene.range.x[0],
      xMax: scene.range.x[1],
      yMin: scene.range.y[0],
      yMax: scene.range.y[1],
    });
  }, [rangeKey]);

  const scope = useMemo(() => buildParamScope(scene), [scene]);
  const complexFn = useMemo(() => compileComplexSceneFn(scene, scope), [scene, scope]);

  const dragRef = useRef<{
    active: boolean;
    target: 'pan' | 'pole' | 'contourMove' | 'contourResize';
    id?: string;
    startX: number;
    startY: number;
    startCam: Camera2D;
    startObj?: { cx: number; cy: number; rx: number; ry: number };
    moved: boolean;
  }>({
    active: false,
    target: 'pan',
    startX: 0,
    startY: 0,
    startCam: cam,
    moved: false,
  });

  // Render Domain Coloring + Contour + Poles + Cuts
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

    ctx.fillStyle = theme === 'dark' ? '#121417' : '#f5f2eb';
    ctx.fillRect(0, 0, w, h);

    // Domain coloring
    if (domainColoring && complexFn) {
      const resW = isDragging ? 130 : 280;
      const resH = Math.max(80, Math.round((resW * h) / w));
      if (!offscreenRef.current) offscreenRef.current = document.createElement('canvas');
      const off = offscreenRef.current;
      off.width = resW;
      off.height = resH;
      const octx = off.getContext('2d');
      if (octx) {
        const img = octx.createImageData(resW, resH);
        const data = img.data;
        for (let py = 0; py < resH; py++) {
          const im = cam.yMax - ((py + 0.5) / resH) * (cam.yMax - cam.yMin);
          for (let px = 0; px < resW; px++) {
            const re = cam.xMin + ((px + 0.5) / resW) * (cam.xMax - cam.xMin);
            const val = complexFn({ re, im });
            const idx = (py * resW + px) * 4;
            if (!Number.isFinite(val.re) || !Number.isFinite(val.im)) {
              data[idx] = 255;
              data[idx + 1] = 255;
              data[idx + 2] = 255;
              data[idx + 3] = 220;
            } else {
              const r = cAbs(val);
              const arg = cArg(val);
              const hue = ((arg * 180) / Math.PI + 360) % 360;
              const logR = Math.log2(Math.max(1e-6, r));
              const frac = logR - Math.floor(logR);
              const baseL = 0.16 + 0.64 * (1 - Math.exp(-0.55 * r));
              const light = Math.max(0.06, Math.min(0.94, baseL * (0.86 + 0.22 * frac)));
              const [cr, cg, cb] = hslToRgb(hue, 0.85, light);
              data[idx] = cr;
              data[idx + 1] = cg;
              data[idx + 2] = cb;
              data[idx + 3] = theme === 'dark' ? 165 : 140;
            }
          }
        }
        octx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(off, 0, 0, w, h);
      }
    }

    // Grid & axes
    ctx.strokeStyle = theme === 'dark' ? 'rgba(226, 232, 240, 0.18)' : 'rgba(15, 23, 42, 0.16)';
    ctx.lineWidth = 1;
    for (let gx = Math.ceil(cam.xMin); gx <= Math.floor(cam.xMax); gx++) {
      const sx = toScreenX(gx);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
    }
    for (let gy = Math.ceil(cam.yMin); gy <= Math.floor(cam.yMax); gy++) {
      const sy = toScreenY(gy);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();
    }

    ctx.strokeStyle = theme === 'dark' ? 'rgba(248, 250, 252, 0.55)' : 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = 1.5;
    if (cam.yMin <= 0 && cam.yMax >= 0) {
      ctx.beginPath();
      ctx.moveTo(0, toScreenY(0));
      ctx.lineTo(w, toScreenY(0));
      ctx.stroke();
    }
    if (cam.xMin <= 0 && cam.xMax >= 0) {
      ctx.beginPath();
      ctx.moveTo(toScreenX(0), 0);
      ctx.lineTo(toScreenX(0), h);
      ctx.stroke();
    }
    ctx.fillStyle = theme === 'dark' ? '#e2e8f0' : '#0f172a';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('Re(z)', w - 42, Math.max(16, Math.min(h - 10, toScreenY(0) - 6)));
    ctx.fillText('Im(z)', Math.max(8, Math.min(w - 40, toScreenX(0) + 8)), 16);

    // Contours
    const contours = scene.objects.filter((o): o is ContourObject => o.kind === 'contour' && o.visible);
    const poles = scene.objects.filter((o): o is PoleObject => o.kind === 'pole' && o.visible);
    const mainContour = contours[0];

    for (const cObj of contours) {
      ctx.strokeStyle = cObj.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const segs = 120;
      for (let i = 0; i <= segs; i++) {
        const theta = (2 * Math.PI * i) / segs;
        const x = cObj.cx + cObj.rx * Math.cos(theta);
        const y = cObj.cy + cObj.ry * Math.sin(theta);
        if (i === 0) ctx.moveTo(toScreenX(x), toScreenY(y));
        else ctx.lineTo(toScreenX(x), toScreenY(y));
      }
      ctx.closePath();
      ctx.stroke();

      // Orientation arrows (counterclockwise)
      for (const angle of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
        const ax = cObj.cx + cObj.rx * Math.cos(angle);
        const ay = cObj.cy + cObj.ry * Math.sin(angle);
        const tx = -cObj.rx * Math.sin(angle);
        const ty = cObj.ry * Math.cos(angle);
        const sx = toScreenX(ax);
        const sy = toScreenY(ay);
        const ang = Math.atan2(-(ty / (cam.yMax - cam.yMin)), tx / (cam.xMax - cam.xMin));
        ctx.fillStyle = cObj.color;
        ctx.beginPath();
        ctx.moveTo(sx + 8 * Math.cos(ang), sy + 8 * Math.sin(ang));
        ctx.lineTo(sx - 6 * Math.cos(ang - 0.55), sy - 6 * Math.sin(ang - 0.55));
        ctx.lineTo(sx - 6 * Math.cos(ang + 0.55), sy - 6 * Math.sin(ang + 0.55));
        ctx.closePath();
        ctx.fill();
      }

      // Resize handle at rightmost edge (cx + rx, cy)
      const hx = toScreenX(cObj.cx + cObj.rx);
      const hy = toScreenY(cObj.cy);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = cObj.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hx, hy, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = cObj.color;
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText(cObj.id, toScreenX(cObj.cx + cObj.rx * 0.72) + 6, toScreenY(cObj.cy + cObj.ry * 0.72) - 6);
    }

    // Poles, little circles C_k, and cancellation cuts T_k
    for (const p of poles) {
      const inside = mainContour
        ? isInsideEllipse({ re: p.re, im: p.im }, mainContour.cx, mainContour.cy, mainContour.rx, mainContour.ry)
        : false;
      const sx = toScreenX(p.re);
      const sy = toScreenY(p.im);

      // Small circle C_k and cut T_k if inside contour and overlay enabled
      if (inside && mainContour) {
        const ckRadius = Math.min(mainContour.rx, mainContour.ry) * 0.16;
        if (scene.overlay?.showCircles) {
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          const rxPx = Math.abs(toScreenX(p.re + ckRadius) - sx);
          const ryPx = Math.abs(toScreenY(p.im + ckRadius) - sy);
          ctx.ellipse(sx, sy, rxPx, ryPx, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (scene.overlay?.showCuts) {
          const dx = p.re - mainContour.cx;
          const dy = p.im - mainContour.cy;
          const ang = Math.atan2(dy, dx);
          const bx = mainContour.cx + mainContour.rx * Math.cos(ang);
          const by = mainContour.cy + mainContour.ry * Math.sin(ang);
          const cxStart = p.re + ckRadius * Math.cos(ang);
          const cyStart = p.im + ckRadius * Math.sin(ang);

          const x1 = toScreenX(cxStart);
          const y1 = toScreenY(cyStart);
          const x2 = toScreenX(bx);
          const y2 = toScreenY(by);
          const nx = -(y2 - y1);
          const ny = x2 - x1;
          const nLen = Math.hypot(nx, ny) || 1;
          const ox = (nx / nLen) * 3;
          const oy = (ny / nLen) * 3;

          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(x1 + ox, y1 + oy);
          ctx.lineTo(x2 + ox, y2 + oy);
          ctx.moveTo(x1 - ox, y1 - oy);
          ctx.lineTo(x2 - ox, y2 - oy);
          ctx.stroke();
        }
      }

      // Pole marker
      ctx.strokeStyle = inside ? '#22c55e' : '#f59e0b';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(sx - 6, sy - 6);
      ctx.lineTo(sx + 6, sy + 6);
      ctx.moveTo(sx + 6, sy - 6);
      ctx.lineTo(sx - 6, sy + 6);
      ctx.stroke();

      ctx.fillStyle = theme === 'dark' ? '#f8fafc' : '#0f172a';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(
        `${p.label ?? p.id} ${inside ? '(dentro)' : '(fuori)'}`,
        sx + 10,
        sy - 6
      );
    }
  }, [scene, cam, theme, domainColoring, complexFn, isDragging]);

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
    return {
      x: cam.xMin + ((clientX - rect.left) / rect.width) * (cam.xMax - cam.xMin),
      y: cam.yMax - ((clientY - rect.top) / rect.height) * (cam.yMax - cam.yMin),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const wPos = screenToWorld(e.clientX, e.clientY);
    const tol = (cam.xMax - cam.xMin) * 0.035;

    if (tool === 'manipulate') {
      // Check resize handle on contour
      const contours = scene.objects.filter((o): o is ContourObject => o.kind === 'contour' && o.visible);
      for (const cObj of contours) {
        if (Math.hypot(wPos.x - (cObj.cx + cObj.rx), wPos.y - cObj.cy) < tol) {
          setIsDragging(true);
          dragRef.current = {
            active: true,
            target: 'contourResize',
            id: cObj.id,
            startX: e.clientX,
            startY: e.clientY,
            startCam: cam,
            startObj: { cx: cObj.cx, cy: cObj.cy, rx: cObj.rx, ry: cObj.ry },
            moved: false,
          };
          return;
        }
      }

      // Check pole hit
      const poles = scene.objects.filter((o): o is PoleObject => o.kind === 'pole' && o.visible);
      const hitPole = poles.find((p) => Math.hypot(p.re - wPos.x, p.im - wPos.y) < tol);
      if (hitPole && onUpdatePole) {
        setIsDragging(true);
        dragRef.current = {
          active: true,
          target: 'pole',
          id: hitPole.id,
          startX: e.clientX,
          startY: e.clientY,
          startCam: cam,
          moved: false,
        };
        return;
      }

      // Check contour center or rim hit to move contour
      for (const cObj of contours) {
        const normDist = Math.hypot((wPos.x - cObj.cx) / cObj.rx, (wPos.y - cObj.cy) / cObj.ry);
        if (Math.abs(normDist - 1) < 0.08 && onUpdateContour) {
          setIsDragging(true);
          dragRef.current = {
            active: true,
            target: 'contourMove',
            id: cObj.id,
            startX: e.clientX,
            startY: e.clientY,
            startCam: cam,
            startObj: { cx: cObj.cx, cy: cObj.cy, rx: cObj.rx, ry: cObj.ry },
            moved: false,
          };
          return;
        }
      }
    }

    setIsDragging(true);
    dragRef.current = {
      active: true,
      target: 'pan',
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
    const wPos = screenToWorld(e.clientX, e.clientY);

    if (dragRef.current.active) {
      const dxPx = e.clientX - dragRef.current.startX;
      const dyPx = e.clientY - dragRef.current.startY;
      if (Math.hypot(dxPx, dyPx) > 3) dragRef.current.moved = true;

      if (dragRef.current.target === 'pole' && dragRef.current.id && onUpdatePole) {
        onUpdatePole(dragRef.current.id, wPos.x, wPos.y);
        return;
      }
      if (dragRef.current.target === 'contourResize' && dragRef.current.id && dragRef.current.startObj && onUpdateContour) {
        const o = dragRef.current.startObj;
        const newR = Math.max(0.25, Math.hypot(wPos.x - o.cx, wPos.y - o.cy));
        onUpdateContour(dragRef.current.id, o.cx, o.cy, newR, newR);
        return;
      }
      if (dragRef.current.target === 'contourMove' && dragRef.current.id && dragRef.current.startObj && onUpdateContour) {
        const o = dragRef.current.startObj;
        const sc = dragRef.current.startCam;
        const dxWorld = (dxPx / rect.width) * (sc.xMax - sc.xMin);
        const dyWorld = (dyPx / rect.height) * (sc.yMax - sc.yMin);
        onUpdateContour(dragRef.current.id, o.cx + dxWorld, o.cy - dyWorld, o.rx, o.ry);
        return;
      }

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

    if (tool === 'probe' || tool === 'manipulate') {
      const z: Complex = { re: wPos.x, im: wPos.y };
      setProbe({ z, fz: complexFn ? complexFn(z) : null });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const moved = dragRef.current.moved;
    dragRef.current.active = false;
    setIsDragging(false);
    if (!moved && tool === 'addPole' && onAddPole) {
      const wPos = screenToWorld(e.clientX, e.clientY);
      onAddPole(wPos.x, wPos.y);
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

  return (
    <div className="viz-wrapper">
      <div className="viz-toolbar">
        <div className="viz-tool-group" role="group" aria-label="Strumenti Piano Complesso">
          <button
            type="button"
            className="viz-btn"
            aria-pressed={tool === 'manipulate'}
            onClick={() => setTool('manipulate')}
            title="Trascina poli, sposta o ridimensiona il contorno C"
          >
            Sposta Poli / Contorno
          </button>
          <button
            type="button"
            className="viz-btn"
            aria-pressed={tool === 'probe'}
            onClick={() => setTool('probe')}
          >
            Sonda Complessa
          </button>
          {onAddPole && (
            <button
              type="button"
              className="viz-btn"
              aria-pressed={tool === 'addPole'}
              onClick={() => setTool('addPole')}
            >
              + Polo
            </button>
          )}
        </div>

        <div className="viz-tool-group">
          <button
            type="button"
            className="viz-btn"
            aria-pressed={domainColoring}
            onClick={() => setDomainColoring((v) => !v)}
          >
            Domain Coloring
          </button>
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
            setIsDragging(false);
            setProbe(null);
          }}
          onWheel={handleWheel}
        />
      </div>

      <div className="viz-hud">
        {probe ? (
          <div>
            <strong>z = {formatComplex(probe.z, 2)}</strong> (|z|={cAbs(probe.z).toFixed(2)}, arg=
            {((cArg(probe.z) * 180) / Math.PI).toFixed(0)}°)
            {probe.fz && (
              <span>
                {' '}
                • f(z) = {formatComplex(probe.fz, 2)} (|f|={cAbs(probe.fz).toFixed(2)})
              </span>
            )}
          </div>
        ) : (
          <div className="viz-hud-muted">
            Trascina i poli (✕) dentro o fuori dal contorno C, oppure usa la maniglia bianca su C per ridimensionarlo
          </div>
        )}
      </div>
    </div>
  );
};
