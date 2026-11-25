import React, { useState } from 'react';
import { BookOpen, Download, Eye, EyeOff, Plus, Trash2, Upload } from 'lucide-react';
import { parseDsl } from '../engine/dsl/dslParser';
import { serializeSceneToDsl } from '../engine/dsl/dslSerializer';
import { DSL_PRESETS } from '../engine/dsl/presets';
import { DslDiagnostic, SceneObject, SceneSpec, ViewMode } from '../engine/dsl/types';
import { MathLatexInput } from './MathLatexInput';
import { SceneViewport } from './SceneViewport';

interface SandboxWorkspaceProps {
  theme: 'dark' | 'light';
  scene: SceneSpec;
  onSceneChange: (next: SceneSpec) => void;
  onOpenGuide: () => void;
}

export const SandboxWorkspace: React.FC<SandboxWorkspaceProps> = ({
  theme,
  scene,
  onSceneChange,
  onOpenGuide,
}) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'dsl'>('cards');
  const [dslText, setDslText] = useState(() => serializeSceneToDsl(scene));
  const [dslErrors, setDslErrors] = useState<DslDiagnostic[]>([]);
  const [newObjType, setNewObjType] = useState<'surface' | 'plot' | 'curve' | 'vectorfield' | 'complexFn'>('surface');

  // Keep dslText aligned when scene changes from cards/canvas while in 'cards' mode
  const applySceneFromUi = (next: SceneSpec) => {
    onSceneChange(next);
    setDslText(serializeSceneToDsl(next));
    setDslErrors([]);
  };

  const handleDslEdit = (text: string) => {
    setDslText(text);
    const res = parseDsl(text);
    setDslErrors(res.errors);
    if (res.errors.length === 0) {
      onSceneChange(res.scene);
    }
  };

  const handleViewSwitch = (view: ViewMode) => {
    applySceneFromUi({ ...scene, view });
  };

  const handleAddObject = () => {
    const id = `obj_${scene.objects.length + 1}`;
    let obj: SceneObject;
    if (newObjType === 'surface') {
      obj = { kind: 'surface', id, expr: '\\sin(x) \\cdot \\cos(y)', color: '#38bdf8', visible: true };
    } else if (newObjType === 'plot') {
      obj = { kind: 'plot', id, expr: '\\sin(x) + 0.5\\cos(2x)', color: '#38bdf8', visible: true };
    } else if (newObjType === 'curve') {
      obj = {
        kind: 'curve',
        id,
        xExpr: '\\cos(t)',
        yExpr: '\\sin(t)',
        zExpr: scene.view === '3d' ? '0.2 t' : undefined,
        tMin: '0',
        tMax: '2\\pi',
        color: '#f59e0b',
        visible: true,
      };
    } else if (newObjType === 'vectorfield') {
      obj = { kind: 'vectorfield', id, fxExpr: '-y', fyExpr: 'x', color: '#38bdf8', visible: true };
    } else {
      obj = { kind: 'complexFn', id, expr: '\\frac{1}{z^2 + 1}', visible: true, domainColoring: true };
    }
    applySceneFromUi({ ...scene, objects: [...scene.objects, obj] });
  };

  const handleAddParam = () => {
    const idx = scene.params.length + 1;
    const name = idx === 1 ? 'a' : `p_${idx}`;
    applySceneFromUi({
      ...scene,
      params: [...scene.params, { name, value: 1, min: -5, max: 5, step: 0.1 }],
    });
  };

  const handleExport = () => {
    const content = serializeSceneToDsl(scene);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scena-${scene.view}.mmath`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      setDslText(text);
      const parsed = parseDsl(text);
      setDslErrors(parsed.errors);
      if (parsed.errors.length === 0) onSceneChange(parsed.scene);
    };
    reader.readAsText(file);
  };

  return (
    <div className="workspace-body">
      <section className="split-left">
        <div className="sandbox-tabs">
          <button
            className={`sandbox-tab ${activeTab === 'cards' ? 'active' : ''}`}
            onClick={() => {
              setDslText(serializeSceneToDsl(scene));
              setActiveTab('cards');
            }}
          >
            Schede Visive (LaTeX)
          </button>
          <button
            className={`sandbox-tab ${activeTab === 'dsl' ? 'active' : ''}`}
            onClick={() => {
              setDslText(serializeSceneToDsl(scene));
              setActiveTab('dsl');
            }}
          >
            Codice MathScene DSL
          </button>
        </div>

        <div className="split-left-scroll">
          <div className="object-card">
            <div className="object-card-head">
              <strong>Vista & Preset</strong>
              <button className="ghost-btn" onClick={onOpenGuide}>
                <BookOpen size={14} /> Guida DSL
              </button>
            </div>
            <div className="inline-row" style={{ flexWrap: 'wrap' }}>
              {(['3d', '2d', 'complex'] as const).map((v) => (
                <button
                  key={v}
                  className={`viz-btn ${scene.view === v ? 'active' : ''}`}
                  onClick={() => handleViewSwitch(v)}
                >
                  {v === '3d' ? 'Vista 3D' : v === '2d' ? 'Vista 2D' : 'Piano Complesso ℂ'}
                </button>
              ))}
            </div>
            <select
              className="select-input"
              defaultValue=""
              onChange={(e) => {
                const preset = DSL_PRESETS.find((p) => p.id === e.target.value);
                if (preset) {
                  const res = parseDsl(preset.dsl);
                  setDslText(preset.dsl);
                  setDslErrors(res.errors);
                  onSceneChange(res.scene);
                }
              }}
            >
              <option value="" disabled>
                Carica un preset pronto...
              </option>
              {DSL_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.view.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'cards' ? (
            <>
              <div className="object-card">
                <div className="object-card-head">
                  <strong>Aggiungi alla scena</strong>
                  <button className="ghost-btn" onClick={handleAddParam}>
                    <Plus size={14} /> Slider
                  </button>
                </div>
                <div className="inline-row">
                  <select
                    className="select-input"
                    style={{ flex: 1 }}
                    value={newObjType}
                    onChange={(e) => setNewObjType(e.target.value as typeof newObjType)}
                  >
                    <option value="surface">Superficie 3D z = f(x, y)</option>
                    <option value="plot">Funzione 2D y = f(x)</option>
                    <option value="curve">Curva parametrica (x(t), y(t), z(t))</option>
                    <option value="vectorfield">Campo vettoriale (F₁, F₂)</option>
                    <option value="complexFn">Funzione complessa f(z)</option>
                  </select>
                  <button className="primary-btn" onClick={handleAddObject}>
                    <Plus size={14} /> Aggiungi
                  </button>
                </div>
              </div>

              {scene.objects.map((obj, idx) => (
                <div className="object-card" key={`${obj.id}-${idx}`}>
                  <div className="object-card-head">
                    <strong>
                      {obj.kind.toUpperCase()} · {obj.id}
                    </strong>
                    <div className="inline-row">
                      <button
                        className="icon-btn"
                        title={obj.visible ? 'Nascondi' : 'Mostra'}
                        onClick={() =>
                          applySceneFromUi({
                            ...scene,
                            objects: scene.objects.map((o, i) =>
                              i === idx ? { ...o, visible: !o.visible } : o
                            ),
                          })
                        }
                      >
                        {obj.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        className="icon-btn"
                        title="Elimina"
                        onClick={() =>
                          applySceneFromUi({
                            ...scene,
                            objects: scene.objects.filter((_, i) => i !== idx),
                          })
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {obj.kind === 'surface' && (
                    <MathLatexInput
                      label="z = f(x, y)"
                      value={obj.expr}
                      onChange={(expr) =>
                        applySceneFromUi({
                          ...scene,
                          objects: scene.objects.map((o, i) => (i === idx ? { ...obj, expr } : o)),
                        })
                      }
                    />
                  )}

                  {obj.kind === 'plot' && (
                    <MathLatexInput
                      label="y = f(x)"
                      value={obj.expr}
                      onChange={(expr) =>
                        applySceneFromUi({
                          ...scene,
                          objects: scene.objects.map((o, i) => (i === idx ? { ...obj, expr } : o)),
                        })
                      }
                    />
                  )}

                  {obj.kind === 'curve' && (
                    <>
                      <MathLatexInput
                        label="x(t)"
                        value={obj.xExpr}
                        onChange={(xExpr) =>
                          applySceneFromUi({
                            ...scene,
                            objects: scene.objects.map((o, i) => (i === idx ? { ...obj, xExpr } : o)),
                          })
                        }
                      />
                      <MathLatexInput
                        label="y(t)"
                        value={obj.yExpr}
                        onChange={(yExpr) =>
                          applySceneFromUi({
                            ...scene,
                            objects: scene.objects.map((o, i) => (i === idx ? { ...obj, yExpr } : o)),
                          })
                        }
                      />
                      {obj.zExpr !== undefined && (
                        <MathLatexInput
                          label="z(t)"
                          value={obj.zExpr}
                          onChange={(zExpr) =>
                            applySceneFromUi({
                              ...scene,
                              objects: scene.objects.map((o, i) => (i === idx ? { ...obj, zExpr } : o)),
                            })
                          }
                        />
                      )}
                    </>
                  )}

                  {obj.kind === 'vectorfield' && (
                    <>
                      <MathLatexInput
                        label="F₁(x, y)"
                        value={obj.fxExpr}
                        onChange={(fxExpr) =>
                          applySceneFromUi({
                            ...scene,
                            objects: scene.objects.map((o, i) => (i === idx ? { ...obj, fxExpr } : o)),
                          })
                        }
                      />
                      <MathLatexInput
                        label="F₂(x, y)"
                        value={obj.fyExpr}
                        onChange={(fyExpr) =>
                          applySceneFromUi({
                            ...scene,
                            objects: scene.objects.map((o, i) => (i === idx ? { ...obj, fyExpr } : o)),
                          })
                        }
                      />
                    </>
                  )}

                  {obj.kind === 'complexFn' && (
                    <MathLatexInput
                      label="f(z)"
                      value={obj.expr}
                      onChange={(expr) =>
                        applySceneFromUi({
                          ...scene,
                          objects: scene.objects.map((o, i) => (i === idx ? { ...obj, expr } : o)),
                        })
                      }
                    />
                  )}

                  {obj.kind === 'point' && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Coordinate: ({obj.x.toFixed(2)}, {obj.y.toFixed(2)}
                      {obj.z !== undefined ? `, ${obj.z.toFixed(2)}` : ''})
                    </div>
                  )}

                  {obj.kind === 'pole' && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Polo complesso: {obj.re.toFixed(2)} {obj.im >= 0 ? '+' : '-'} {Math.abs(obj.im).toFixed(2)}i
                    </div>
                  )}

                  {obj.kind === 'contour' && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Centro ({obj.cx.toFixed(2)}, {obj.cy.toFixed(2)}), raggi ({obj.rx.toFixed(2)}, {obj.ry.toFixed(2)})
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div>
              <textarea
                className="dsl-textarea"
                value={dslText}
                onChange={(e) => handleDslEdit(e.target.value)}
                spellCheck={false}
              />
              {dslErrors.length > 0 && (
                <div className="diag-box">
                  <strong>Errori nel codice DSL:</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                    {dslErrors.map((err, i) => (
                      <li key={i}>
                        Riga {err.line}: {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="step-nav-footer">
          <button className="ghost-btn" onClick={handleExport}>
            <Download size={14} /> Esporta .mmath
          </button>
          <label className="ghost-btn" style={{ margin: 0 }}>
            <Upload size={14} /> Importa .mmath
            <input type="file" accept=".mmath,.txt" hidden onChange={handleImport} />
          </label>
        </div>
      </section>

      <SceneViewport scene={scene} theme={theme} onSceneChange={applySceneFromUi} allowAddObjects />
    </div>
  );
};
