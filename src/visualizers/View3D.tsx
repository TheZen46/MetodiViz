import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildParamScope, compileRealExpr } from '../engine/dsl/runtime';
import { CurveObject, PointObject, PolygonalObject, SceneSpec, SurfaceObject } from '../engine/dsl/types';
import { curvePointAndTangent, partialDerivatives2D, polygonalVertices } from '../engine/math/numerics';

interface View3DProps {
  scene: SceneSpec;
  theme: 'dark' | 'light';
  onAddPoint?: (x: number, y: number, z: number) => void;
}

type Tool3D = 'orbit' | 'probe' | 'tangent' | 'addPoint';

interface ProbeInfo3D {
  x: number;
  y: number;
  z: number;
  fx?: number;
  fy?: number;
  sourceLabel: string;
}

function makeTextSprite(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 32);
  }
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.55, 0.28, 1);
  return sprite;
}

function heightColor(t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  // Cool blue -> cyan -> emerald -> amber -> rose
  const c = new THREE.Color();
  c.setHSL((1 - clamped) * 0.62, 0.82, 0.54);
  return [c.r, c.g, c.b];
}

export const View3D: React.FC<View3DProps> = ({ scene, theme, onAddPoint }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const tangentGroupRef = useRef<THREE.Group | null>(null);
  const sectionMeshRef = useRef<THREE.Mesh | null>(null);
  const surfaceMeshesRef = useRef<Array<{ mesh: THREE.Mesh; id: string; fn: (x: number, y: number) => number }>>([]);
  const curveLinesRef = useRef<Array<{ line: THREE.Line; id: string }>>([]);

  const [tool, setTool] = useState<Tool3D>('orbit');
  const [wireframe, setWireframe] = useState(false);
  const [showSection, setShowSection] = useState(false);
  const [sectionZ, setSectionZ] = useState(0);
  const [probe, setProbe] = useState<ProbeInfo3D | null>(null);
  const [tangentInfo, setTangentInfo] = useState<{
    x: number;
    y: number;
    z: number;
    fx: number;
    fy: number;
  } | null>(null);

  const toolRef = useRef(tool);
  toolRef.current = tool;
  const onAddPointRef = useRef(onAddPoint);
  onAddPointRef.current = onAddPoint;

  const scope = useMemo(() => buildParamScope(scene), [scene]);

  // Initialize Three.js scene once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth || 640, container.clientHeight || 480);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      (container.clientWidth || 640) / (container.clientHeight || 480),
      0.1,
      200
    );
    camera.up.set(0, 0, 1);
    camera.position.set(5.2, -5.2, 4.1);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, 0.72);
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.85);
    dir1.position.set(6, -6, 10);
    const dir2 = new THREE.DirectionalLight(0x93c5fd, 0.45);
    dir2.position.set(-6, 6, -4);
    threeScene.add(amb, dir1, dir2);

    // Base grid in XY plane (Z-up)
    const grid = new THREE.GridHelper(10, 10, 0x475569, 0x334155);
    grid.rotation.x = Math.PI / 2;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    threeScene.add(grid);

    // Axes lines
    const axisLen = 4.2;
    const makeAxis = (to: THREE.Vector3, hex: number) => {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), to]);
      const mat = new THREE.LineBasicMaterial({ color: hex });
      return new THREE.Line(geo, mat);
    };
    threeScene.add(
      makeAxis(new THREE.Vector3(axisLen, 0, 0), 0xf87171),
      makeAxis(new THREE.Vector3(0, axisLen, 0), 0x4ade80),
      makeAxis(new THREE.Vector3(0, 0, axisLen), 0x60a5fa)
    );

    const lblX = makeTextSprite('X', '#f87171');
    lblX.position.set(axisLen + 0.35, 0, 0);
    const lblY = makeTextSprite('Y', '#4ade80');
    lblY.position.set(0, axisLen + 0.35, 0);
    const lblZ = makeTextSprite('Z', '#60a5fa');
    lblZ.position.set(0, 0, axisLen + 0.35);
    threeScene.add(lblX, lblY, lblZ);

    const dynamicGroup = new THREE.Group();
    const tangentGroup = new THREE.Group();
    threeScene.add(dynamicGroup, tangentGroup);
    dynamicGroupRef.current = dynamicGroup;
    tangentGroupRef.current = tangentGroup;

    // Section plane z = c
    const secGeo = new THREE.PlaneGeometry(8, 8);
    const secMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const secMesh = new THREE.Mesh(secGeo, secMat);
    secMesh.visible = false;
    threeScene.add(secMesh);
    sectionMeshRef.current = secMesh;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downPos = { x: 0, y: 0 };

    const updatePointer = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handlePointerDown = (ev: PointerEvent) => {
      downPos = { x: ev.clientX, y: ev.clientY };
    };

    const handlePointerMove = (ev: PointerEvent) => {
      if (toolRef.current !== 'probe' && toolRef.current !== 'tangent') return;
      updatePointer(ev);
      raycaster.setFromCamera(pointer, camera);
      const meshes = surfaceMeshesRef.current.map((s) => s.mesh);
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length > 0) {
        const hit = hits[0];
        const entry = surfaceMeshesRef.current.find((s) => s.mesh === hit.object);
        const p = hit.point;
        if (entry) {
          const d = partialDerivatives2D(entry.fn, p.x, p.y);
          setProbe({ x: p.x, y: p.y, z: p.z, fx: d.fx, fy: d.fy, sourceLabel: entry.id });
        } else {
          setProbe({ x: p.x, y: p.y, z: p.z, sourceLabel: 'Superficie' });
        }
        return;
      }
      const lines = curveLinesRef.current.map((c) => c.line);
      raycaster.params.Line = { threshold: 0.18 };
      const lineHits = raycaster.intersectObjects(lines, false);
      if (lineHits.length > 0) {
        const p = lineHits[0].point;
        const entry = curveLinesRef.current.find((c) => c.line === lineHits[0].object);
        setProbe({ x: p.x, y: p.y, z: p.z, sourceLabel: entry?.id ?? 'Curva' });
      } else {
        setProbe(null);
      }
    };

    const handlePointerUp = (ev: PointerEvent) => {
      const dist = Math.hypot(ev.clientX - downPos.x, ev.clientY - downPos.y);
      if (dist > 5) return; // Was a drag/orbit, not a click

      const activeTool = toolRef.current;
      if (activeTool !== 'tangent' && activeTool !== 'addPoint') return;

      updatePointer(ev);
      raycaster.setFromCamera(pointer, camera);
      const meshes = surfaceMeshesRef.current.map((s) => s.mesh);
      const hits = raycaster.intersectObjects(meshes, false);

      if (activeTool === 'tangent' && hits.length > 0) {
        const hit = hits[0];
        const entry = surfaceMeshesRef.current.find((s) => s.mesh === hit.object);
        if (entry) {
          const d = partialDerivatives2D(entry.fn, hit.point.x, hit.point.y);
          setTangentInfo({
            x: hit.point.x,
            y: hit.point.y,
            z: hit.point.z,
            fx: d.fx,
            fy: d.fy,
          });
        }
      } else if (activeTool === 'addPoint') {
        if (hits.length > 0) {
          const p = hits[0].point;
          onAddPointRef.current?.(p.x, p.y, p.z);
        } else {
          // Intersect z=0 plane
          const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
          const target = new THREE.Vector3();
          if (raycaster.ray.intersectPlane(plane, target)) {
            onAddPointRef.current?.(target.x, target.y, target.z);
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(threeScene, camera);
    };
    animate();

    const resizeObs = new ResizeObserver(() => {
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObs.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObs.disconnect();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update background on theme change
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setClearColor(theme === 'dark' ? 0x0b1120 : 0xf8fafc, 1);
  }, [theme]);

  // Update section plane
  useEffect(() => {
    const sec = sectionMeshRef.current;
    if (!sec) return;
    sec.visible = showSection;
    sec.position.z = sectionZ;
  }, [showSection, sectionZ]);

  // Rebuild dynamic mathematical objects whenever scene/scope/wireframe changes
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;

    // Dispose previous objects cleanly
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      child.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
    }
    surfaceMeshesRef.current = [];
    curveLinesRef.current = [];

    const [xMin, xMax] = scene.range.x;
    const [yMin, yMax] = scene.range.y;
    const [zMin, zMax] = scene.range.z;

    // Surfaces
    const surfaces = scene.objects.filter((o): o is SurfaceObject => o.kind === 'surface' && o.visible);
    for (const surf of surfaces) {
      const compiled = compileRealExpr(surf.expr, scope);
      if (!compiled) continue;
      const fn = (x: number, y: number) => compiled({ x, y });

      const segs = 60;
      const positions: number[] = [];
      const colors: number[] = [];
      const indices: number[] = [];

      for (let iy = 0; iy <= segs; iy++) {
        const y = yMin + ((yMax - yMin) * iy) / segs;
        for (let ix = 0; ix <= segs; ix++) {
          const x = xMin + ((xMax - xMin) * ix) / segs;
          let z = fn(x, y);
          if (!Number.isFinite(z)) z = 0;
          z = Math.max(zMin * 2, Math.min(zMax * 2, z));
          positions.push(x, y, z);
          const normZ = (z - zMin) / Math.max(1e-6, zMax - zMin);
          const [r, g, b] = heightColor(normZ);
          colors.push(r, g, b);
        }
      }

      for (let iy = 0; iy < segs; iy++) {
        for (let ix = 0; ix < segs; ix++) {
          const a = iy * (segs + 1) + ix;
          const b = a + 1;
          const c = a + (segs + 1);
          const d = c + 1;
          indices.push(a, b, d, a, d, c);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      const mat = new THREE.MeshPhongMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        wireframe: Boolean(surf.wireframe || wireframe),
        shininess: 35,
        transparent: true,
        opacity: 0.92,
      });

      const mesh = new THREE.Mesh(geo, mat);
      group.add(mesh);
      surfaceMeshesRef.current.push({ mesh, id: surf.id, fn });
    }

    // Curves 3D
    const curves = scene.objects.filter((o): o is CurveObject => o.kind === 'curve' && o.visible);
    const curveMap = new Map<
      string,
      { fx: (t: number) => number; fy: (t: number) => number; fz: (t: number) => number; a: number; b: number }
    >();

    for (const cObj of curves) {
      const fxC = compileRealExpr(cObj.xExpr, scope);
      const fyC = compileRealExpr(cObj.yExpr, scope);
      const fzC = cObj.zExpr ? compileRealExpr(cObj.zExpr, scope) : () => 0;
      const tMinC = compileRealExpr(cObj.tMin, scope);
      const tMaxC = compileRealExpr(cObj.tMax, scope);
      if (!fxC || !fyC || !fzC || !tMinC || !tMaxC) continue;

      const fx = (t: number) => fxC({ t });
      const fy = (t: number) => fyC({ t });
      const fz = (t: number) => fzC({ t });
      const tMin = tMinC({});
      const tMax = tMaxC({});
      curveMap.set(cObj.id, { fx, fy, fz, a: tMin, b: tMax });

      const samples = 220;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= samples; i++) {
        const t = tMin + ((tMax - tMin) * i) / samples;
        const x = fx(t);
        const y = fy(t);
        const z = fz(t);
        if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
          pts.push(new THREE.Vector3(x, y, z));
        }
      }
      if (pts.length >= 2) {
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: cObj.color, linewidth: 2 });
        const line = new THREE.Line(geo, mat);
        group.add(line);
        curveLinesRef.current.push({ line, id: cObj.id });

        // Tangent vector at parameter s (if overlay requests it)
        const sVal = scope[cObj.showTangentAtParam ?? 's'];
        if (scene.overlay?.showTangentVector && Number.isFinite(sVal)) {
          const tClamped = Math.max(tMin, Math.min(tMax, sVal));
          const { point, tangent } = curvePointAndTangent(fx, fy, fz, tClamped);
          const origin = new THREE.Vector3(point.x, point.y, point.z);
          const dir = new THREE.Vector3(tangent.x, tangent.y, tangent.z);
          const len = dir.length();
          if (len > 1e-6) {
            const arrow = new THREE.ArrowHelper(dir.clone().normalize(), origin, Math.min(1.6, len), 0x34d399, 0.2, 0.1);
            group.add(arrow);
            const dot = new THREE.Mesh(
              new THREE.SphereGeometry(0.08, 16, 16),
              new THREE.MeshBasicMaterial({ color: 0x34d399 })
            );
            dot.position.copy(origin);
            group.add(dot);
          }
        }
      }
    }

    // Polygonals
    const polys = scene.objects.filter((o): o is PolygonalObject => o.kind === 'polygonal' && o.visible);
    for (const pObj of polys) {
      const target = curveMap.get(pObj.curveId);
      const segFn = compileRealExpr(pObj.segmentsExpr, scope);
      if (!target || !segFn) continue;
      const N = Math.max(1, Math.min(200, Math.round(segFn({}))));
      const verts = polygonalVertices(target.fx, target.fy, target.fz, target.a, target.b, N);
      const pts = verts.map((v) => new THREE.Vector3(v.x, v.y, v.z));
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: pObj.color });
      group.add(new THREE.Line(geo, mat));

      const sphereGeo = new THREE.SphereGeometry(0.055, 12, 12);
      const sphereMat = new THREE.MeshBasicMaterial({ color: pObj.color });
      for (const p of pts) {
        const m = new THREE.Mesh(sphereGeo, sphereMat);
        m.position.copy(p);
        group.add(m);
      }
    }

    // Points
    const points = scene.objects.filter((o): o is PointObject => o.kind === 'point' && o.visible);
    for (const pt of points) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 16, 16),
        new THREE.MeshBasicMaterial({ color: pt.color })
      );
      mesh.position.set(pt.x, pt.y, pt.z ?? 0);
      group.add(mesh);
      if (pt.label) {
        const lbl = makeTextSprite(pt.label, pt.color);
        lbl.position.set(pt.x, pt.y, (pt.z ?? 0) + 0.25);
        group.add(lbl);
      }
    }
  }, [scene, scope, wireframe]);

  // Render Tangent Plane overlay when tangentInfo changes
  useEffect(() => {
    const tGroup = tangentGroupRef.current;
    if (!tGroup) return;
    while (tGroup.children.length > 0) {
      const child = tGroup.children[0];
      tGroup.remove(child);
      child.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
    }
    if (!tangentInfo) return;

    const { x, y, z, fx, fy } = tangentInfo;
    const size = 1.1;
    const corners = [
      [-size, -size],
      [size, -size],
      [size, size],
      [-size, size],
    ].map(([dx, dy]) => new THREE.Vector3(x + dx, y + dy, z + fx * dx + fy * dy));

    const planeGeo = new THREE.BufferGeometry().setFromPoints([
      corners[0],
      corners[1],
      corners[2],
      corners[0],
      corners[2],
      corners[3],
    ]);
    planeGeo.computeVertexNormals();
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    tGroup.add(new THREE.Mesh(planeGeo, planeMat));

    // Point marker
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    dot.position.set(x, y, z);
    tGroup.add(dot);

    // Normal arrow (-fx, -fy, 1)
    const normal = new THREE.Vector3(-fx, -fy, 1).normalize();
    tGroup.add(new THREE.ArrowHelper(normal, new THREE.Vector3(x, y, z), 1.1, 0xf43f5e, 0.18, 0.09));

    // Gradient arrow in tangent direction projected on XY at z
    const grad = new THREE.Vector3(fx, fy, 0);
    if (grad.length() > 1e-4) {
      tGroup.add(
        new THREE.ArrowHelper(
          grad.clone().normalize(),
          new THREE.Vector3(x, y, z),
          Math.min(1.3, grad.length()),
          0x22c55e,
          0.18,
          0.09
        )
      );
    }
  }, [tangentInfo]);

  const setPresetCamera = (preset: '3d' | 'xy' | 'xz' | 'yz') => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    ctrl.target.set(0, 0, 0);
    if (preset === '3d') cam.position.set(5.2, -5.2, 4.1);
    else if (preset === 'xy') cam.position.set(0, -0.01, 8.5);
    else if (preset === 'xz') cam.position.set(0, -8.5, 0);
    else if (preset === 'yz') cam.position.set(8.5, 0, 0);
    ctrl.update();
  };

  return (
    <div className="viz-wrapper">
      <div className="viz-toolbar">
        <div className="viz-tool-group">
          <button
            className={`viz-btn ${tool === 'orbit' ? 'active' : ''}`}
            onClick={() => setTool('orbit')}
            title="Ruota 360°, zoom e pan"
          >
            Orbita 360°
          </button>
          <button
            className={`viz-btn ${tool === 'probe' ? 'active' : ''}`}
            onClick={() => setTool('probe')}
            title="Passa il mouse su superfici o curve per leggere coordinate e gradiente"
          >
            Sonda
          </button>
          <button
            className={`viz-btn ${tool === 'tangent' ? 'active' : ''}`}
            onClick={() => setTool('tangent')}
            title="Clicca su una superficie per disegnare piano tangente, normale e gradiente"
          >
            Piano Tangente
          </button>
          {onAddPoint && (
            <button
              className={`viz-btn ${tool === 'addPoint' ? 'active' : ''}`}
              onClick={() => setTool('addPoint')}
              title="Clicca sulla scena per posizionare un punto"
            >
              + Punto
            </button>
          )}
        </div>

        <div className="viz-tool-group">
          <button className="viz-btn" onClick={() => setPresetCamera('3d')}>3D</button>
          <button className="viz-btn" onClick={() => setPresetCamera('xy')}>XY</button>
          <button className="viz-btn" onClick={() => setPresetCamera('xz')}>XZ</button>
          <button className="viz-btn" onClick={() => setPresetCamera('yz')}>YZ</button>
          <button
            className={`viz-btn ${wireframe ? 'active' : ''}`}
            onClick={() => setWireframe((w) => !w)}
          >
            Wireframe
          </button>
          <button
            className={`viz-btn ${showSection ? 'active' : ''}`}
            onClick={() => setShowSection((s) => !s)}
          >
            Sezione z=c
          </button>
          {tangentInfo && (
            <button className="viz-btn" onClick={() => setTangentInfo(null)}>
              Pulisci Tangente
            </button>
          )}
        </div>
      </div>

      {showSection && (
        <div className="viz-subbar">
          <label>
            Piano di sezione z = {sectionZ.toFixed(2)}
            <input
              type="range"
              min={scene.range.z[0]}
              max={scene.range.z[1]}
              step={0.05}
              value={sectionZ}
              onChange={(e) => setSectionZ(Number(e.target.value))}
            />
          </label>
        </div>
      )}

      <div className="viz-canvas-host" ref={containerRef} />

      <div className="viz-hud">
        {probe ? (
          <div>
            <strong>{probe.sourceLabel}:</strong> ({probe.x.toFixed(2)}, {probe.y.toFixed(2)},{' '}
            {probe.z.toFixed(2)})
            {probe.fx !== undefined && probe.fy !== undefined && (
              <span>
                {' '}
                | ∇f = ({probe.fx.toFixed(2)}, {probe.fy.toFixed(2)})
              </span>
            )}
          </div>
        ) : (
          <div className="viz-hud-muted">
            Trascina per ruotare • Rotella per zoom • Tasto destro per spostare
          </div>
        )}
        {tangentInfo && (
          <div className="viz-hud-accent">
            Piano tangente in ({tangentInfo.x.toFixed(2)}, {tangentInfo.y.toFixed(2)}): z ={' '}
            {tangentInfo.z.toFixed(2)} + ({tangentInfo.fx.toFixed(2)})(x - {tangentInfo.x.toFixed(2)}) + (
            {tangentInfo.fy.toFixed(2)})(y - {tangentInfo.y.toFixed(2)})
          </div>
        )}
      </div>
    </div>
  );
};
