import React from 'react';
import { X } from 'lucide-react';

interface DslGuideModalProps {
  open: boolean;
  onClose: () => void;
  onLoadExample: (dsl: string) => void;
}

const SNIPPET_EX = `view: 3d
range: x in [-3, 3], y in [-3, 3], z in [-2, 2]

param k = 1 in [0.2, 3] step 0.1

surface S: z = \\frac{x^2 - y^2}{2} \\cdot k color #38bdf8
curve g: (\\cos(t), \\sin(t), 0.2 t) for t in [0, 2\\pi] color #f59e0b`;

export const DslGuideModal: React.FC<DslGuideModalProps> = ({
  open,
  onClose,
  onLoadExample,
}) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Guida rapida — Linguaggio MathScene DSL</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p>
            Il linguaggio <strong>MathScene DSL</strong> ti permette di descrivere scene 3D, 2D e
            complesse usando direttamente espressioni <strong>LaTeX</strong>. Ogni modifica nelle
            Schede Visive aggiorna questo codice e viceversa.
          </p>

          <h3>Istruzioni principali</h3>
          <ul className="guide-list">
            <li>
              <code>view: 3d | 2d | complex</code> — sceglie il tipo di visualizzatore.
            </li>
            <li>
              <code>range: x in [-3, 3], y in [-3, 3], z in [-2, 2]</code> — imposta gli assi.
            </li>
            <li>
              <code>param a = 1 in [0.1, 5] step 0.1</code> — crea automaticamente uno slider.
            </li>
            <li>
              <code>surface S: z = \frac&#123;x^2 - y^2&#125;&#123;2&#125;</code> — superficie 3D.
            </li>
            <li>
              <code>plot f: y = \sin(a x) + \cos(2x)</code> — grafico 2D (supporta anche{' '}
              <code>\sum_&#123;k=1&#125;^&#123;N&#125;</code>).
            </li>
            <li>
              <code>curve g: (\cos(t), \sin(t), t/4) for t in [0, 4\pi]</code> — curva 2D o 3D.
            </li>
            <li>
              <code>polygonal P: on g with N segments</code> — poligonale inscritta su una curva.
            </li>
            <li>
              <code>vectorfield F: (-y, x) heatmap</code> — campo vettoriale 2D (+ mappa rotore).
            </li>
            <li>
              <code>domain D: x in [0, 2], y in [0, x^2]</code> — dominio normale per Gauss-Green.
            </li>
            <li>
              <code>complex f: f(z) = \frac&#123;1&#125;&#123;z - z_1&#125;</code> +{' '}
              <code>contour C: circle(0, 0, 2)</code> + <code>pole z_1: (0.5, 0.5)</code>.
            </li>
          </ul>

          <h3>Esempio completo</h3>
          <pre className="guide-code">{SNIPPET_EX}</pre>

          <div className="modal-actions">
            <button
              className="primary-btn"
              onClick={() => {
                onLoadExample(SNIPPET_EX);
                onClose();
              }}
            >
              Carica questo esempio nella Sandbox
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
