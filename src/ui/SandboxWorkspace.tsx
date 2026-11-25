import React, { useRef, useState } from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
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
  const [mobilePane, setMobilePane] = useState<'editor' | 'viz'>('editor');
  const [dslText, setDslText] = useState(() => serializeSceneToDsl(scene));
  const [dslErrors, setDslErrors] = useState<DslDiagnostic[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [newObjType, setNewObjType] = useState<'surface' | 'plot' | 'curve' | 'vectorfield' | 'complexFn'>('surface');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleAddObject = (kindOverride?: typeof newObjType) => {
    const kind = kindOverride ?? newObjType;
    const id = `obj_${scene.objects.length + 1}`;
    let obj: SceneObject;
    if (kind === 'surface') {
      obj = { kind: 'surface', id, expr: '\\sin(x) \\cdot \\cos(y)', color: '#e5a93c', visible: true };
    } else if (kind === 'plot') {
      obj = { kind: 'plot', id, expr: '\\sin(x) + 0.5\\cos(2x)', color: '#38bdf8', visible: true };
    } else if (kind === 'curve') {
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
    } else if (kind === 'vectorfield') {
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
    e.target.value = '';
  };

  return (
    <div className="workspace-body">
      <div className="mobile-pane-switch" role="group" aria-label="Pannello attivo su schermo piccolo">
        <button
          type="button"
          className="mobile-pane-btn"
          aria-pressed={mobilePane === 'editor'}
          onClick={() => setMobilePane('editor')}
        >
          Editor e Formule
        </button>
        <button
          type="button"
          className="mobile-pane-btn"
          aria-pressed={mobilePane === 'viz'}
          onClick={() => setMobilePane('viz')}
        >
          Grafico ({scene.view.toUpperCase()})
        </button>
      </div>

      <section
        className={`split-left ${mobilePane === 'viz' ? 'mobile-hidden' : ''}`}
        aria-label="Configurazione scena matematica"
      >
        <div className="sandbox-tabs" role="tablist" aria-label="Modalità di modifica scena">
          <button
            type="button"
            role="tab"
            id="tab-cards"
            aria-selected={activeTab === 'cards'}
            className="sandbox-tab"
            onClick={() => {
              setDslText(serializeSceneToDsl(scene));
              setActiveTab('cards');
            }}
          >
            Schede Visive (LaTeX)
          </button>
          <button
            type="button"
            role="tab"
            id="tab-dsl"
            aria-selected={activeTab === 'dsl'}
            className="sandbox-tab"
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
              <strong>Vista e preset</strong>
              <button type="button" className="ghost-btn" onClick={onOpenGuide}>
                Guida DSL
              </button>
            </div>

            <div className="inline-row" role="group" aria-label="Tipo di visualizzatore" style={{ flexWrap: 'wrap' }}>
              {(['3d', '2d', 'complex'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className="viz-btn"
                  aria-pressed={scene.view === v}
                  onClick={() => handleViewSwitch(v)}
                >
                  {v === '3d' ? 'Vista 3D' : v === '2d' ? 'Vista 2D' : 'Piano Complesso'}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="preset-select" className="field-label">
                Carica un esempio pronto
              </label>
              <select
                id="preset-select"
                className="select-input"
                value={selectedPreset}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedPreset(val);
                  const preset = DSL_PRESETS.find((p) => p.id === val);
                  if (preset) {
                    const res = parseDsl(preset.dsl);
                    setDslText(preset.dsl);
                    setDslErrors(res.errors);
                    onSceneChange(res.scene);
                  }
                }}
              >
                <option value="" disabled>
                  Seleziona un preset...
                </option>
                {DSL_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.view.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeTab === 'cards' ? (
            <div role="tabpanel" aria-labelledby="tab-cards">
              <div className="object-card">
                <div className="object-card-head">
                  <strong>Nuovo elemento</strong>
                  <button type="button" className="ghost-btn" onClick={handleAddParam}>
                    + Slider
                  </button>
                </div>

                <label htmlFor="new-obj-select" className="field-label">
                  Tipo di oggetto matematico
                </label>
                <div className="inline-row">
                  <select
                    id="new-obj-select"
                    className="select-input"
                    style={{ flex: 1 }}
                    value={newObjType}
                    onChange={(e) => setNewObjType(e.target.value as typeof newObjType)}
                  >
                    <option value="surface">Superficie 3D z = f(x, y)</option>
                    <option value="plot">Funzione 2D y = f(x)</option>
                    <option value="curve">Curva parametrica (x(t), y(t), z(t))</option>
                    <option value="vectorfield">Campo vettoriale (F1, F2)</option>
                    <option value="complexFn">Funzione complessa f(z)</option>
                  </select>
                  <button type="button" className="primary-btn" onClick={() => handleAddObject()}>
                    Aggiungi
                  </button>
                </div>
              </div>

              {scene.objects.length === 0 ? (
                <div className="empty-state-box">
                  <h3>Scena vuota</h3>
                  <p>
                    Non ci sono ancora oggetti grafici in questa scena. Aggiungi una formula
                    oppure carica uno dei preset pronti.
                  </p>
                  <div className="inline-row" style={{ flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => handleAddObject('surface')}
                    >
                      Aggiungi superficie 3D
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => {
                        const preset = DSL_PRESETS[0];
                        const res = parseDsl(preset.dsl);
                        setDslText(preset.dsl);
                        setDslErrors(res.errors);
                        onSceneChange(res.scene);
                      }}
                    >
                      Carica primo preset
                    </button>
                  </div>
                </div>
              ) : (
                scene.objects.map((obj, idx) => (
                  <div className="object-card" key={`${obj.id}-${idx}`}>
                    <div className="object-card-head">
                      <strong>
                        {obj.kind.toUpperCase()} · {obj.id}
                      </strong>
                      <div className="inline-row">
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={obj.visible ? `Nascondi ${obj.id}` : `Mostra ${obj.id}`}
                          aria-pressed={obj.visible}
                          onClick={() =>
                            applySceneFromUi({
                              ...scene,
                              objects: scene.objects.map((o, i) =>
                                i === idx ? { ...o, visible: !o.visible } : o
                              ),
                            })
                          }
                        >
                          {obj.visible ? (
                            <Eye size={15} aria-hidden="true" />
                          ) : (
                            <EyeOff size={15} aria-hidden="true" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={`Elimina ${obj.id}`}
                          onClick={() =>
                            applySceneFromUi({
                              ...scene,
                              objects: scene.objects.filter((_, i) => i !== idx),
                            })
                          }
                        >
                          <Trash2 size={15} aria-hidden="true" />
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
                          label="F1(x, y)"
                          value={obj.fxExpr}
                          onChange={(fxExpr) =>
                            applySceneFromUi({
                              ...scene,
                              objects: scene.objects.map((o, i) => (i === idx ? { ...obj, fxExpr } : o)),
                            })
                          }
                        />
                        <MathLatexInput
                          label="F2(x, y)"
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
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Coordinate: ({obj.x.toFixed(2)}, {obj.y.toFixed(2)}
                        {obj.z !== undefined ? `, ${obj.z.toFixed(2)}` : ''})
                      </div>
                    )}

                    {obj.kind === 'pole' && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Polo complesso: {obj.re.toFixed(2)} {obj.im >= 0 ? '+' : '-'}{' '}
                        {Math.abs(obj.im).toFixed(2)}i
                      </div>
                    )}

                    {obj.kind === 'contour' && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Centro ({obj.cx.toFixed(2)}, {obj.cy.toFixed(2)}), raggi ({obj.rx.toFixed(2)},{' '}
                        {obj.ry.toFixed(2)})
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div role="tabpanel" aria-labelledby="tab-dsl">
              <label htmlFor="dsl-editor" className="dsl-label">
                Sorgente MathScene DSL (modifica diretta con aggiornamento live)
              </label>
              <textarea
                id="dsl-editor"
                className="dsl-textarea"
                value={dslText}
                onChange={(e) => handleDslEdit(e.target.value)}
                spellCheck={false}
              />
              {dslErrors.length > 0 && (
                <div className="diag-box" role="alert">
                  <strong>Errori nel codice DSL:</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
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
          <button type="button" className="ghost-btn" onClick={handleExport}>
            Esporta .mmath
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            Importa .mmath
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mmath,.txt"
            hidden
            aria-label="Seleziona file .mmath da importare"
            onChange={handleImport}
          />
        </div>
      </section>

      <div className={`split-right ${mobilePane === 'editor' ? 'mobile-hidden' : ''}`}>
        <SceneViewport
          scene={scene}
          theme={theme}
          onSceneChange={applySceneFromUi}
          allowAddObjects
        />
      </div>
    </div>
  );
};
