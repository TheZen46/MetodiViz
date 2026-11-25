import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DslGuideModalProps {
  open: boolean;
  onClose: () => void;
  onLoadExample: (dsl: string) => void;
}

const SNIPPET_EX = `view: 3d
range: x in [-3, 3], y in [-3, 3], z in [-2, 2]

param k = 1 in [0.2, 3] step 0.1

surface S: z = \\frac{x^2 - y^2}{2} \\cdot k color #e5a93c
curve g: (\\cos(t), \\sin(t), 0.2 t) for t in [0, 2\\pi] color #38bdf8`;

export const DslGuideModal: React.FC<DslGuideModalProps> = ({
  open,
  onClose,
  onLoadExample,
}) => {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dsl-guide-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="dsl-guide-title">Guida rapida al linguaggio MathScene DSL</h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Chiudi guida"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body">
          <p>
            Il linguaggio <strong>MathScene DSL</strong> descrive scene 3D, 2D e complesse usando
            direttamente espressioni <strong>LaTeX</strong>. Le modifiche nelle Schede Visive e nel
            codice testuale restano sincronizzate.
          </p>

          <h3>Istruzioni principali</h3>
          <ul className="guide-list">
            <li>
              <code>view: 3d | 2d | complex</code> imposta il tipo di visualizzatore.
            </li>
            <li>
              <code>range: x in [-3, 3], y in [-3, 3], z in [-2, 2]</code> imposta gli assi.
            </li>
            <li>
              <code>param a = 1 in [0.1, 5] step 0.1</code> crea uno slider interattivo.
            </li>
            <li>
              <code>surface S: z = \frac&#123;x^2 - y^2&#125;&#123;2&#125;</code> disegna una superficie 3D.
            </li>
            <li>
              <code>plot f: y = \sin(a x) + \cos(2x)</code> disegna un grafico 2D (supporta anche{' '}
              <code>\sum_&#123;k=1&#125;^&#123;N&#125;</code>).
            </li>
            <li>
              <code>curve g: (\cos(t), \sin(t), t/4) for t in [0, 4\pi]</code> traccia una curva 2D o 3D.
            </li>
            <li>
              <code>polygonal P: on g with N segments</code> inscrive una poligonale sulla curva.
            </li>
            <li>
              <code>vectorfield F: (-y, x) heatmap</code> disegna un campo vettoriale 2D con mappa rotore.
            </li>
            <li>
              <code>domain D: x in [0, 2], y in [0, x^2]</code> definisce un dominio normale per Gauss-Green.
            </li>
            <li>
              <code>complex f: f(z) = \frac&#123;1&#125;&#123;z - z_1&#125;</code> insieme a{' '}
              <code>contour C: circle(0, 0, 2)</code> e <code>pole z_1: (0.5, 0.5)</code> configura il piano complesso.
            </li>
          </ul>

          <h3>Esempio completo</h3>
          <pre className="guide-code">{SNIPPET_EX}</pre>

          <div className="modal-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                onLoadExample(SNIPPET_EX);
                onClose();
              }}
            >
              Carica esempio nella Sandbox
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
