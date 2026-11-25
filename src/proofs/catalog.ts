import { proof01Length } from './proof01_length';
import { proof03GaussGreen } from './proof03_gaussGreen';
import { proof14Residues } from './proof14_residues';
import { proof18Fourier } from './proof18_fourier';
import { ProofDefinition } from './types';
import { createEmptyScene } from '../engine/dsl/dslParser';

function makePlanned(
  number: string,
  title: string,
  block: 1 | 2 | 3 | 4,
  blockLabel: string,
  lecturer: 'Pinamonti' | 'Benini',
  sourceFile: string
): ProofDefinition {
  return {
    id: `proof-${number}`,
    number,
    title,
    block,
    blockLabel,
    lecturer,
    sourceFile,
    status: 'planned',
    statementLatex: `\\text{Dimostrazione } ${number}\\text{ — in programma per la Fase 2}`,
    hypotheses: ['Verrà integrata nella Fase 2 del progetto a partire dagli appunti del corso'],
    steps: [
      {
        title: 'In arrivo nella Fase 2',
        explanation:
          'Questa dimostrazione fa parte del catalogo completo delle 18 dimostrazioni del corso. Puoi comunque usare la Modalità Sandbox per visualizzarne subito le formule e i grafici!',
        formulasLatex: [],
        scene: createEmptyScene(block === 4 ? 'complex' : block === 3 ? '2d' : '3d'),
      },
    ],
  };
}

export const ALL_PROOFS: ProofDefinition[] = [
  // Blocco 1
  makePlanned('06', 'Teorema della funzione implicita', 1, 'Blocco 1 — Calcolo Differenziale in ℝⁿ', 'Pinamonti', '06 - Teorema della funzione implicita.md'),
  makePlanned('07', 'Teorema della funzione inversa', 1, 'Blocco 1 — Calcolo Differenziale in ℝⁿ', 'Pinamonti', '07 - Teorema della funzione inversa.md'),

  // Blocco 2
  proof01Length,
  makePlanned('02', 'Condizioni di integrabilità', 2, 'Blocco 2 — Curve, Superfici e Integrali', 'Pinamonti', '02 - Condizioni di integrabilitá.md'),
  proof03GaussGreen,
  makePlanned('04', 'Divergenza in 2D', 2, 'Blocco 2 — Curve, Superfici e Integrali', 'Pinamonti', '04 - Divergenza in 2D.md'),
  makePlanned('05', 'Teorema di Stokes in 2D', 2, 'Blocco 2 — Curve, Superfici e Integrali', 'Pinamonti', '05 - Teorema di Stokes in 2D.md'),

  // Blocco 3
  makePlanned('16', 'Seno cardinale', 3, 'Blocco 3 — Serie di Fourier', 'Benini', '16 - Seno cardinale.md'),
  makePlanned('17', 'Lemma di Riemann', 3, 'Blocco 3 — Serie di Fourier', 'Benini', '17 - Lemma di Riemann.md'),
  proof18Fourier,

  // Blocco 4
  makePlanned('08', 'Numeri complessi', 4, 'Blocco 4 — Analisi Complessa', 'Benini', '08 - Numeri complessi.md'),
  makePlanned('09', 'Modulo e forma trigonometrica', 4, 'Blocco 4 — Analisi Complessa', 'Benini', '09 - Modulo e forma trigonometrica.md'),
  makePlanned('10', 'Numeri complessi e formula di Eulero', 4, 'Blocco 4 — Analisi Complessa', 'Benini', '10 - Numeri complessi (2024) e formula di Eulero.md'),
  makePlanned('11', 'Condizioni di Cauchy-Riemann', 4, 'Blocco 4 — Analisi Complessa', 'Benini', '11 - Condizioni di Cauchy-Riemann.md'),
  makePlanned('12', 'Teorema di Cauchy', 4, 'Blocco 4 — Analisi Complessa', 'Benini', '12 - Teorema di Cauchy.md'),
  makePlanned('13', 'Formula integrale di Cauchy', 4, 'Blocco 4 — Analisi Complessa', 'Benini', '13 - Formula integrale di Cauchy.md'),
  proof14Residues,
  makePlanned('15', 'Lemma di Jordan', 4, 'Blocco 4 — Analisi Complessa', 'Benini', '15 - Lemma di Jordan.md'),
];

export const PILOT_PROOFS: ProofDefinition[] = ALL_PROOFS.filter((p) => p.status === 'ready');
