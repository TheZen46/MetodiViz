import { SceneSpec } from '../engine/dsl/types';
import { ProofDefinition } from './types';

function makeIntegrabilityScene(n: number, amp: number): SceneSpec {
  return {
    view: '3d',
    range: { x: [0, 3], y: [0, 3], z: [0, 2.8] },
    params: [
      { name: 'n', value: n, min: 2, max: 24, step: 1, label: 'Suddivisioni n×n' },
      { name: 'A', value: amp, min: 0.1, max: 0.9, step: 0.05, label: 'Oscillazione f' },
    ],
    objects: [
      {
        kind: 'surface',
        id: 'S',
        expr: '1.4 + A \\cdot \\sin(x) \\cdot \\cos(y)',
        color: '#38bdf8',
        visible: true,
      },
    ],
    measures: [
      { label: 'Somma superiore S_sup', expr: 'darbouxUpper(S)' },
      { label: 'Somma inferiore S_inf', expr: 'darbouxLower(S)' },
      { label: 'Differenza S_sup - S_inf', expr: 'darbouxGap(S)' },
    ],
  };
}

export const proof02Integrability: ProofDefinition = {
  id: 'proof-02-integrability',
  number: '02',
  title: 'Condizioni di integrabilità',
  block: 2,
  blockLabel: 'Blocco 2: Curve, Superfici e Integrali',
  lecturer: 'Pinamonti',
  sourceFile: '02 - Condizioni di integrabilitá.md',
  status: 'ready',
  statementLatex:
    'f : Q = [a,b]\\times[c,d] \\subset \\mathbb{R}^2 \\to \\mathbb{R} \\text{ continua su } Q \\text{ compatto} \\implies f \\text{ è integrabile secondo Riemann su } Q',
  hypotheses: [
    'Q = [a, b] × [c, d] rettangolo chiuso e limitato (compatto in ℝ²)',
    'f continua su tutto Q',
  ],
  steps: [
    {
      title: '1. Continuità uniforme su Q compatto (Heine-Cantor)',
      explanation:
        'Poiché f è continua sul compatto Q, per il teorema di Heine-Cantor è uniformemente continua: fissato ε > 0 esiste δ_ε > 0 valido uniformemente su tutto il rettangolo.',
      formulasLatex: [
        '\\forall \\varepsilon > 0 \\;\\; \\exists \\delta_\\varepsilon > 0 : \\quad |z_1 - z_2| < \\delta_\\varepsilon \\implies |f(z_1) - f(z_2)| < \\varepsilon',
      ],
      scene: makeIntegrabilityScene(3, 0.5),
    },
    {
      title: '2. Partizione di Q adattata a δ_ε / 2',
      explanation:
        'Suddividiamo [a, b] e [c, d] in sotto-rettangoli Q_{jk} = [x_{j-1}, x_j] × [y_{k-1}, y_k] aventi lati Δx_j < δ_ε / 2 e Δy_k < δ_ε / 2.',
      formulasLatex: [
        '\\Delta x_j < \\frac{\\delta_\\varepsilon}{2}, \\qquad \\Delta y_k < \\frac{\\delta_\\varepsilon}{2} \\qquad \\forall j, k',
      ],
      scene: makeIntegrabilityScene(6, 0.5),
    },
    {
      title: '3. Stima della diagonale su ogni cella Q_{jk}',
      explanation:
        'Per due punti qualsiasi z₁, z₂ ∈ Q_{jk}, il teorema di Pitagora limita il quadrato della distanza a meno di δ_ε² / 2.',
      formulasLatex: [
        '|z_1 - z_2|^2 < \\left(\\frac{\\delta_\\varepsilon}{2}\\right)^2 + \\left(\\frac{\\delta_\\varepsilon}{2}\\right)^2 = \\frac{\\delta_\\varepsilon^2}{2} \\implies |z_1 - z_2| < \\frac{\\delta_\\varepsilon}{\\sqrt{2}} < \\delta_\\varepsilon',
      ],
      callout: {
        kind: 'warning',
        title: 'Stima con i quadrati',
        body: 'La somma dei quadrati dei lati stima |z₁ - z₂|² (non |z₁ - z₂|). Estraendo la radice si ottiene δ_ε / √2 < δ_ε, che attiva l’uniforme continuità.',
      },
      scene: makeIntegrabilityScene(10, 0.5),
    },
    {
      title: '4. Oscillazione su Q_{jk}: M_{jk} - m_{jk} < ε',
      explanation:
        'Dall’uniforme continuità segue che su ogni cella Q_{jk} il divario tra estremo superiore M_{jk} ed estremo inferiore m_{jk} è minore di ε. Guarda la misura S_sup - S_inf ridursi aumentando n.',
      formulasLatex: [
        'M_{jk} = \\sup_{Q_{jk}} f, \\quad m_{jk} = \\inf_{Q_{jk}} f \\implies M_{jk} - m_{jk} \\le \\varepsilon',
      ],
      scene: makeIntegrabilityScene(14, 0.5),
    },
    {
      title: '5. Differenza tra somme superiore e inferiore',
      explanation:
        'Sommando su tutti i rettangolini Q_{jk}, la differenza tra somma superiore e somma inferiore è maggiorata da ε · A(Q). Poiché ε > 0 è arbitrario, vale il criterio di integrabilità.',
      formulasLatex: [
        'S_{\\sup}(D, f) - S_{\\inf}(D, f) = \\sum_{j,k} (M_{jk} - m_{jk}) A(Q_{jk}) < \\varepsilon \\sum_{j,k} A(Q_{jk}) = \\varepsilon \\cdot A(Q) \\qquad \\square',
      ],
      callout: {
        kind: 'note',
        title: 'Perché la costante A(Q) non disturba',
        body: 'Per avere differenza < η basta scegliere ε = η / A(Q) all’inizio della dimostrazione.',
      },
      scene: makeIntegrabilityScene(20, 0.5),
    },
  ],
};
