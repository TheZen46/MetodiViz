import React, { useMemo } from 'react';
import { evaluateSceneMeasures } from '../engine/dsl/runtime';
import { SceneSpec } from '../engine/dsl/types';
import { View2D } from '../visualizers/View2D';
import { View3D } from '../visualizers/View3D';
import { ViewComplex } from '../visualizers/ViewComplex';

interface SceneViewportProps {
  scene: SceneSpec;
  theme: 'dark' | 'light';
  onSceneChange: (next: SceneSpec) => void;
  allowAddObjects?: boolean;
}

export const SceneViewport: React.FC<SceneViewportProps> = ({
  scene,
  theme,
  onSceneChange,
  allowAddObjects = true,
}) => {
  const measures = useMemo(() => evaluateSceneMeasures(scene), [scene]);

  const handleParamChange = (name: string, val: number) => {
    onSceneChange({
      ...scene,
      params: scene.params.map((p) => (p.name === name ? { ...p, value: val } : p)),
    });
  };

  const handleUpdatePoint = (id: string, x: number, y: number) => {
    onSceneChange({
      ...scene,
      objects: scene.objects.map((o) => (o.kind === 'point' && o.id === id ? { ...o, x, y } : o)),
    });
  };

  const handleAddPoint = (x: number, y: number, z?: number) => {
    const idx = scene.objects.filter((o) => o.kind === 'point').length + 1;
    onSceneChange({
      ...scene,
      objects: [
        ...scene.objects,
        {
          kind: 'point',
          id: `P_${idx}`,
          x: Number(x.toFixed(2)),
          y: Number(y.toFixed(2)),
          z: z !== undefined ? Number(z.toFixed(2)) : undefined,
          label: `P${idx}`,
          color: '#e5a93c',
          visible: true,
          draggable: true,
        },
      ],
    });
  };

  const handleUpdatePole = (id: string, re: number, im: number) => {
    onSceneChange({
      ...scene,
      objects: scene.objects.map((o) => (o.kind === 'pole' && o.id === id ? { ...o, re, im } : o)),
    });
  };

  const handleUpdateContour = (id: string, cx: number, cy: number, rx: number, ry: number) => {
    onSceneChange({
      ...scene,
      objects: scene.objects.map((o) =>
        o.kind === 'contour' && o.id === id ? { ...o, cx, cy, rx, ry } : o
      ),
    });
  };

  const handleAddPole = (re: number, im: number) => {
    const idx = scene.objects.filter((o) => o.kind === 'pole').length + 1;
    const poleId = `z_${idx}`;
    const nextObjects = scene.objects.map((o) => {
      if (o.kind === 'complexFn') {
        return { ...o, expr: `${o.expr} + \\frac{1}{z - ${poleId}}` };
      }
      return o;
    });
    nextObjects.push({
      kind: 'pole',
      id: poleId,
      re: Number(re.toFixed(2)),
      im: Number(im.toFixed(2)),
      label: `z${idx}`,
      color: '#22c55e',
      visible: true,
    });
    onSceneChange({ ...scene, objects: nextObjects });
  };

  return (
    <>
      <div className="viz-stage">
        {scene.view === '3d' && (
          <View3D
            scene={scene}
            theme={theme}
            onAddPoint={allowAddObjects ? (x, y, z) => handleAddPoint(x, y, z) : undefined}
          />
        )}
        {scene.view === '2d' && (
          <View2D
            scene={scene}
            theme={theme}
            onUpdatePoint={handleUpdatePoint}
            onAddPoint={allowAddObjects ? (x, y) => handleAddPoint(x, y) : undefined}
          />
        )}
        {scene.view === 'complex' && (
          <ViewComplex
            scene={scene}
            theme={theme}
            onUpdatePole={handleUpdatePole}
            onUpdateContour={handleUpdateContour}
            onAddPole={allowAddObjects ? handleAddPole : undefined}
          />
        )}
      </div>

      {(scene.params.length > 0 || measures.length > 0) && (
        <div className="bottom-controls-dock">
          {scene.params.length > 0 && (
            <div className="sliders-row">
              {scene.params.map((p) => {
                const sliderId = `param-slider-${p.name}`;
                return (
                  <div className="slider-chip" key={p.name}>
                    <div className="slider-chip-head">
                      <label htmlFor={sliderId}>{p.label ?? p.name}</label>
                      <span className="slider-value">
                        {Number.isInteger(p.step) ? p.value : p.value.toFixed(2)}
                      </span>
                    </div>
                    <input
                      id={sliderId}
                      type="range"
                      min={p.min}
                      max={p.max}
                      step={p.step}
                      value={p.value}
                      onChange={(e) => handleParamChange(p.name, Number(e.target.value))}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {measures.length > 0 && (
            <div className="measures-row" aria-label="Misure calcolate in tempo reale">
              {measures.map((m) => (
                <div className="measure-pill" key={m.label}>
                  <span>{m.label}:</span>
                  <strong>{m.value}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};
