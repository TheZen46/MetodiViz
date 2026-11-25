import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, FlaskConical } from 'lucide-react';
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
  1: 'Blocco 1 — Calcolo Differenziale ℝⁿ',
  2: 'Blocco 2 — Curve, Superfici e Integrali',
  3: 'Blocco 3 — Serie di Fourier',
  4: 'Blocco 4 — Analisi Complessa',
};

export const ProofStudio: React.FC<ProofStudioProps> = ({ theme, onOpenInSandbox }) => {
  const firstReady = ALL_PROOFS.find((p) => p.status === 'ready') ?? ALL_PROOFS[0];
  const [selectedProof, setSelectedProof] = useState<ProofDefinition>(firstReady);
  const [stepIdx, setStepIdx] = useState(0);
  const [oralMode, setOralMode] = useState(false);
  const [revealedUpTo, setRevealedUpTo] = useState(0);
  const [liveScene, setLiveScene] = useState<SceneSpec>(firstReady.steps[0].scene);

  // Sync liveScene when proof or step changes
  useEffect(() => {
    const step = selectedProof.steps[stepIdx] ?? selectedProof.steps[0];
    setLiveScene(structuredClone(step.scene));
  }, [selectedProof, stepIdx]);

  // Keyboard navigation Left/Right
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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
  }, [selectedProof]);

  const handleSelectProof = (proof: ProofDefinition) => {
    setSelectedProof(proof);
    setStepIdx(0);
    setRevealedUpTo(0);
  };

  return (
    <div className="workspace-body">
      <aside className="sidebar">
        {([1, 2, 3, 4] as const).map((blk) => {
          const items = ALL_PROOFS.filter((p) => p.block === blk);
          return (
            <div className="sidebar-section" key={blk}>
              <div className="sidebar-block-title">{BLOCK_TITLES[blk]}</div>
              {items.map((proof) => (
                <button
                  key={proof.id}
                  className={`proof-nav-item ${selectedProof.id === proof.id ? 'active' : ''} ${
                    proof.status === 'planned' ? 'planned' : ''
                  }`}
                  onClick={() => handleSelectProof(proof)}
                >
                  <span>
                    <strong>{proof.number}</strong> · {proof.title}
                  </span>
                  {proof.status === 'ready' ? (
                    <span className="pill-ready">Attiva</span>
                  ) : (
                    <span className="pill-soon">Fase 2</span>
                  )}
                </button>
              ))}
            </div>
          );
        })}
      </aside>

      <section className="split-left">
        <div className="split-left-scroll">
          <div className="proof-header-card">
            <h2 className="proof-title">
              {selectedProof.number} — {selectedProof.title}
            </h2>
            <div className="proof-meta">
              <span>Docente: {selectedProof.lecturer}</span>
              <span>•</span>
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

          <div className="inline-row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <button
              className={`ghost-btn ${oralMode ? 'active' : ''}`}
              onClick={() => {
                setOralMode((v) => !v);
                setRevealedUpTo(stepIdx);
              }}
              title="Nasconde i passaggi futuri per esercitarti alla lavagna"
            >
              {oralMode ? <EyeOff size={15} /> : <Eye size={15} />}
              {oralMode ? 'Modalità Lavagna: ON' : 'Modalità Lavagna (Orale)'}
            </button>

            <button
              className="ghost-btn"
              onClick={() => onOpenInSandbox(liveScene)}
              title="Modifica questa scena con formule LaTeX o codice DSL nella Sandbox"
            >
              <FlaskConical size={15} />
              Apri nella Sandbox
            </button>
          </div>

          {selectedProof.steps.map((st, idx) => {
            const isHidden = oralMode && idx > revealedUpTo;
            return (
              <div
                key={st.title}
                className={`step-card ${idx === stepIdx ? 'active' : ''}`}
                onClick={() => {
                  if (!isHidden) setStepIdx(idx);
                }}
              >
                <h3 className="step-card-title">{st.title}</h3>
                {isHidden ? (
                  <div className="inline-row" style={{ justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      Passaggio nascosto — prova a spiegarlo a voce!
                    </span>
                    <button
                      className="primary-btn"
                      onClick={(e) => {
                        e.stopPropagation();
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
            );
          })}
        </div>

        <div className="step-nav-footer">
          <button
            className="ghost-btn"
            disabled={stepIdx === 0}
            onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
          >
            <ArrowLeft size={15} /> Precedente
          </button>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Passaggio {stepIdx + 1} / {selectedProof.steps.length}
          </span>
          <button
            className="primary-btn"
            disabled={stepIdx >= selectedProof.steps.length - 1}
            onClick={() => {
              const next = Math.min(selectedProof.steps.length - 1, stepIdx + 1);
              setRevealedUpTo((r) => Math.max(r, next));
              setStepIdx(next);
            }}
          >
            Successivo <ArrowRight size={15} />
          </button>
        </div>
      </section>

      <SceneViewport
        scene={liveScene}
        theme={theme}
        onSceneChange={setLiveScene}
        allowAddObjects={selectedProof.status === 'ready'}
      />
    </div>
  );
};
