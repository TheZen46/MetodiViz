import React, { useEffect, useRef, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { SceneSpec } from '../engine/dsl/types';
import { ALL_PROOFS } from '../proofs/catalog';
import { ProofDefinition } from '../proofs/types';
import { KatexBlock } from './KatexBlock';
import { SceneViewport } from './SceneViewport';

interface ProofStudioProps {
  theme: 'dark' | 'light';
  onOpenInSandbox: (scene: SceneSpec) => void;
}

const BLOCK_TITLES: Record<1 | 2 | 3 | 4, string> = {
  1: 'Blocco 1: Calcolo Differenziale ℝⁿ',
  2: 'Blocco 2: Curve, Superfici e Integrali',
  3: 'Blocco 3: Serie di Fourier',
  4: 'Blocco 4: Analisi Complessa',
};

export const ProofStudio: React.FC<ProofStudioProps> = ({ theme, onOpenInSandbox }) => {
  const firstReady = ALL_PROOFS.find((p) => p.status === 'ready') ?? ALL_PROOFS[0];
  const [selectedProof, setSelectedProof] = useState<ProofDefinition>(firstReady);
  const [stepIdx, setStepIdx] = useState(0);
  const [oralMode, setOralMode] = useState(false);
  const [revealedUpTo, setRevealedUpTo] = useState(0);
  const [liveScene, setLiveScene] = useState<SceneSpec>(firstReady.steps[0].scene);
  const [indexOpen, setIndexOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1160 : true
  );
  const [mobilePane, setMobilePane] = useState<'proof' | 'viz'>('proof');

  const indexTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1160px)');
    const onChange = (e: MediaQueryListEvent) => {
      if (!e.matches) setIndexOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const step = selectedProof.steps[stepIdx] ?? selectedProof.steps[0];
    setLiveScene(structuredClone(step.scene));
  }, [selectedProof, stepIdx]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && indexOpen && window.innerWidth < 1160) {
        setIndexOpen(false);
        indexTriggerRef.current?.focus();
        return;
      }
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'MATH-FIELD')
      ) {
        return;
      }
      if (e.key === 'ArrowRight') {
        setStepIdx((i) => {
          const next = Math.min(selectedProof.steps.length - 1, i + 1);
          setRevealedUpTo((r) => Math.max(r, next));
          return next;
        });
      } else if (e.key === 'ArrowLeft') {
        setStepIdx((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedProof, indexOpen]);

  const handleSelectProof = (proof: ProofDefinition) => {
    setSelectedProof(proof);
    setStepIdx(0);
    setRevealedUpTo(0);
    if (window.innerWidth < 1160) {
      setIndexOpen(false);
    }
  };

  return (
    <div className="workspace-body">
      <div className="mobile-pane-switch" role="group" aria-label="Pannello attivo su schermo piccolo">
        <button
          type="button"
          className="mobile-pane-btn"
          aria-pressed={mobilePane === 'proof'}
          onClick={() => setMobilePane('proof')}
        >
          Dimostrazione
        </button>
        <button
          type="button"
          className="mobile-pane-btn"
          aria-pressed={mobilePane === 'viz'}
          onClick={() => setMobilePane('viz')}
        >
          Grafico ({liveScene.view.toUpperCase()})
        </button>
      </div>

      {indexOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => {
            setIndexOpen(false);
            indexTriggerRef.current?.focus();
          }}
        />
      )}

      <aside
        id="proof-catalog-nav"
        aria-label="Indice delle 18 dimostrazioni"
        className={`sidebar ${indexOpen ? '' : 'collapsed'}`}
      >
        <div className="sidebar-header">
          <h2 className="sidebar-title">Indice del corso (18)</h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="Chiudi indice"
            onClick={() => {
              setIndexOpen(false);
              indexTriggerRef.current?.focus();
            }}
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        {([1, 2, 3, 4] as const).map((blk) => {
          const items = ALL_PROOFS.filter((p) => p.block === blk);
          return (
            <div className="sidebar-section" key={blk}>
              <div className="sidebar-block-title">{BLOCK_TITLES[blk]}</div>
              {items.map((proof) => (
                <button
                  key={proof.id}
                  type="button"
                  aria-current={selectedProof.id === proof.id ? 'page' : undefined}
                  className={`proof-nav-item ${proof.status === 'planned' ? 'planned' : ''}`}
                  onClick={() => handleSelectProof(proof)}
                >
                  <span>
                    <span className="proof-num">{proof.number}</span>
                    {proof.title}
                  </span>
                  {proof.status === 'ready' ? (
                    <span className="status-tag-ready">Attiva</span>
                  ) : (
                    <span className="status-tag-soon">Fase 2</span>
                  )}
                </button>
              ))}
            </div>
          );
        })}
      </aside>

      <section
        className={`split-left ${mobilePane === 'viz' ? 'mobile-hidden' : ''}`}
        aria-label="Testo della dimostrazione"
      >
        <div className="split-left-toolbar">
          <button
            ref={indexTriggerRef}
            type="button"
            className="ghost-btn"
            aria-expanded={indexOpen}
            aria-controls="proof-catalog-nav"
            onClick={() => setIndexOpen((o) => !o)}
          >
            {indexOpen ? (
              <PanelLeftClose size={15} aria-hidden="true" />
            ) : (
              <PanelLeftOpen size={15} aria-hidden="true" />
            )}
            Indice (18)
          </button>

          <button
            type="button"
            className="ghost-btn"
            onClick={() => onOpenInSandbox(liveScene)}
          >
            Apri nella Sandbox
          </button>
        </div>

        <div className="split-left-scroll">
          <div className="proof-header-card">
            <h2 className="proof-title">
              {selectedProof.number}: {selectedProof.title}
            </h2>
            <div className="proof-meta">
              <span>Docente: {selectedProof.lecturer}</span>
              <span>|</span>
              <span>Fonte: {selectedProof.sourceFile}</span>
            </div>
            <div className="statement-box">
              <KatexBlock latex={selectedProof.statementLatex} />
            </div>
            <ul className="hypotheses-list">
              {selectedProof.hypotheses.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>

          {selectedProof.status === 'ready' ? (
            <>
              <div className="proof-actions-bar">
                <button
                  type="button"
                  className={`ghost-btn ${oralMode ? 'active' : ''}`}
                  aria-pressed={oralMode}
                  onClick={() => {
                    setOralMode((v) => !v);
                    setRevealedUpTo(stepIdx);
                  }}
                >
                  {oralMode ? 'Modalità Lavagna attiva' : 'Modalità Lavagna (Orale)'}
                </button>
              </div>

              {selectedProof.steps.map((st, idx) => {
                const isHidden = oralMode && idx > revealedUpTo;
                const isActive = idx === stepIdx;
                return (
                  <article key={st.title} className={`step-card ${isActive ? 'active' : ''}`}>
                    <button
                      type="button"
                      className="step-card-trigger"
                      aria-current={isActive ? 'step' : undefined}
                      disabled={isHidden}
                      onClick={() => setStepIdx(idx)}
                    >
                      <h3 className="step-card-title">{st.title}</h3>
                      {isActive && <span className="step-state-label">Attivo</span>}
                    </button>

                    <div className="step-card-body">
                      {isHidden ? (
                        <div className="inline-row" style={{ justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                            Passaggio nascosto: prova a ricostruirlo a voce prima di svelarlo.
                          </span>
                          <button
                            type="button"
                            className="primary-btn"
                            onClick={() => {
                              setRevealedUpTo(idx);
                              setStepIdx(idx);
                            }}
                          >
                            Svela
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="step-card-text">{st.explanation}</p>
                          {st.formulasLatex.map((f, fIdx) => (
                            <div className="step-formula" key={fIdx}>
                              <KatexBlock latex={f} />
                            </div>
                          ))}
                          {st.callout && (
                            <div className={`callout ${st.callout.kind}`}>
                              <strong>{st.callout.title}:</strong> {st.callout.body}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </>
          ) : (
            <div className="planned-state-card">
              <h3>Dimostrazione in programma per la Fase 2</h3>
              <p>
                Questa scheda fa parte del catalogo completo del corso ma non ha ancora i passaggi
                animati. Puoi tornare alle quattro dimostrazioni attive oppure costruire subito una
                scena dedicata nella Sandbox.
              </p>
              <div className="inline-row" style={{ flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => handleSelectProof(firstReady)}
                >
                  Vai a dimostrazione attiva
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => onOpenInSandbox(liveScene)}
                >
                  Apri nella Sandbox
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="step-nav-footer">
          <button
            type="button"
            className="ghost-btn"
            disabled={stepIdx === 0}
            onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
          >
            Precedente
          </button>
          <span className="step-counter">
            Passaggio {stepIdx + 1} / {selectedProof.steps.length}
          </span>
          <button
            type="button"
            className="primary-btn"
            disabled={stepIdx >= selectedProof.steps.length - 1}
            onClick={() => {
              const next = Math.min(selectedProof.steps.length - 1, stepIdx + 1);
              setRevealedUpTo((r) => Math.max(r, next));
              setStepIdx(next);
            }}
          >
            Successivo
          </button>
        </div>
      </section>

      <div className={`split-right ${mobilePane === 'proof' ? 'mobile-hidden' : ''}`}>
        <SceneViewport
          scene={liveScene}
          theme={theme}
          onSceneChange={setLiveScene}
          allowAddObjects={selectedProof.status === 'ready'}
        />
      </div>
    </div>
  );
};
