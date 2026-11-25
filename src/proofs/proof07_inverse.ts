import { SceneSpec } from '../engine/dsl/types';
import { ProofDefinition } from './types';

function makeInverseScene(delta: number, alpha: number, showLinearOnly: boolean): SceneSpec {
  const nonLinWeight = showLinearOnly ? '0' : '\\alpha';
  return {
    view: '2d',
    range: { x: [-2.4, 3.2], y: [-2.2, 2.8], z: [-1, 1] },
    params: [
      { name: 'delta', value: delta, min: 0.25, max: 1.4, step: 0.05, label: 'Raggio δ' },
      { name: 'alpha', value: alpha, min: 0, max: 0.6, step: 0.05, label: 'Peso non lineare g' },
    ],
    objects: [
      {
        kind: 'curve',
        id: 'B_delta',
        xExpr: '\\delta \\cos(t)',
        yExpr: '\\delta \\sin(t)',
        tMin: '0',
        tMax: '2\\pi',
        color: '#64748b',
        visible: true,
      },
      {
        kind: 'curve',
        id: 'J_immagine',
        xExpr: '1.4 \\delta \\cos(t) + 0.35 \\delta \\sin(t)',
        yExpr: '-0.25 \\delta \\cos(t) + 1.2 \\delta \\sin(t)',
        tMin: '0',
        tMax: '2\\pi',
        color: '#38bdf8',
        visible: true,
      },
      {
        kind: 'curve',
        id: 'f_immagine',
        xExpr: `1.4 \\delta \\cos(t) + 0.35 \\delta \\sin(t) + ${nonLinWeight} \\cdot (\\delta \\cos(t))^2`,
        yExpr: `-0.25 \\delta \\cos(t) + 1.2 \\delta \\sin(t) + ${nonLinWeight} \\cdot (\\delta \\sin(t))^2`,
        tMin: '0',
        tMax: '2\\pi',
        color: '#e5a93c',
        visible: !showLinearOnly,
      },
    ],
    measures: [
      { label: 'det J_x̂', expr: '1.4 * 1.2 - 0.35 * (-0.25)' },
      { label: 'Stima non lineare ε ~ α·δ', expr: '\\alpha * \\delta' },
    ],
  };
}

export const proof07Inverse: ProofDefinition = {
  id: 'proof-07-inverse',
  number: '07',
  title: 'Teorema della funzione inversa',
  block: 1,
  blockLabel: 'Blocco 1: Calcolo Differenziale in ℝⁿ',
  lecturer: 'Pinamonti',
  sourceFile: '07 - Teorema della funzione inversa.md',
  status: 'ready',
  statementLatex:
    'f : D \\subset \\mathbb{R}^n \\to \\mathbb{R}^n,\\; f \\in C^1(D),\\; \\det J_{\\hat x} \\neq 0 \\implies \\exists N \\text{ intorno di } \\hat x \\text{ t.c. } f : N \\to f(N) \\text{ è invertibile}',
  hypotheses: [
    'f : D ⊂ ℝⁿ → ℝⁿ di classe C¹ su D aperto',
    'Matrice jacobiana J_x̂ invertibile in x̂ ∈ D (cioè det J_x̂ ≠ 0)',
  ],
  steps: [
    {
      title: '1. Obiettivo: iniettività locale su B(x̂, δ)',
      explanation:
        'Vogliamo provare che esiste δ > 0 tale che f sia iniettiva su N = B(x̂, δ), cioè per ogni x ≠ y in B valga |f(x) - f(y)| > 0.',
      formulasLatex: [
        '\\forall x, y \\in B(\\hat x, \\delta),\\; x \\neq y \\implies f(x) - f(y) \\neq 0 \\iff |f(x) - f(y)| > 0',
      ],
      scene: makeInverseScene(0.8, 0.25, true),
    },
    {
      title: '2. Scomposizione in parte lineare J_x̂ e resto g(x)',
      explanation:
        'Separiamo la parte lineare (ellisse azzurra: immagine tramite J_x̂) dal resto non lineare g(x) = f(x) - J_x̂ x (curva ocra: immagine effettiva tramite f).',
      formulasLatex: [
        'g(x) = f(x) - J_{\\hat x} x \\implies f(x) = J_{\\hat x} x + g(x)',
        '|f(x) - f(y)| = |J_{\\hat x}(x - y) + (g(x) - g(y))| \\ge |J_{\\hat x}(x - y)| - |g(x) - g(y)|',
      ],
      callout: {
        kind: 'warning',
        title: 'Disuguaglianza triangolare inversa',
        body: 'Dal valore assoluto della somma si passa alla stima dal basso tramite |a + b| ≥ |a| - |b|, con a = J_x̂(x - y) e b = g(x) - g(y).',
      },
      scene: makeInverseScene(0.8, 0.35, false),
    },
    {
      title: '3. Stima dal basso per la parte lineare',
      explanation:
        'Poiché det J_x̂ ≠ 0, esiste J_x̂⁻¹. Posto τ = 1 / ||J_x̂⁻¹|| > 0, la parte lineare non può comprimere i vettori sotto la soglia τ.',
      formulasLatex: [
        '|x - y| = |J_{\\hat x}^{-1} J_{\\hat x}(x - y)| \\le \\|J_{\\hat x}^{-1}\\| \\cdot |J_{\\hat x}(x - y)| \\implies |J_{\\hat x}(x - y)| \\ge \\tau |x - y|',
      ],
      scene: makeInverseScene(0.8, 0.25, false),
    },
    {
      title: '4. Stima dall’alto su g tramite il teorema della stima',
      explanation:
        'La jacobiana di g è J_g(x) = J_f(x) - J_x̂, che si annulla in x̂ ed è continua. Riducendo δ (prova lo slider), otteniamo ||J_g(x)|| < ε su B(x̂, δ) e, per il teorema della stima su un convesso, |g(x) - g(y)| ≤ ε |x - y|.',
      formulasLatex: [
        'J_g(\\hat x) = 0,\\; J_g \\text{ continua} \\implies \\exists \\delta > 0 : \\|J_g(x)\\| < \\varepsilon \\implies |g(x) - g(y)| \\le \\varepsilon |x - y|',
      ],
      scene: makeInverseScene(0.45, 0.25, false),
    },
    {
      title: '5. Scelta di ε < τ e conclusione',
      explanation:
        'Scegliendo ε < τ (restringendo δ abbastanza), i due termini combinati danno una distanza positiva proporzionale a |x - y|: f è quindi iniettiva su B(x̂, δ).',
      formulasLatex: [
        '|f(x) - f(y)| \\ge (\\tau - \\varepsilon)|x - y| > 0 \\quad (\\tau > \\varepsilon) \\implies f \\text{ iniettiva su } N \\qquad \\square',
      ],
      callout: {
        kind: 'note',
        title: 'Portata completa del teorema',
        body: 'L’argomento prova l’iniettività locale. L’enunciato completo aggiunge che f(N) è aperto e l’inversa f⁻¹ è C¹ con J_{f⁻¹}(f(x)) = J_f(x)⁻¹.',
      },
      scene: makeInverseScene(0.35, 0.15, false),
    },
  ],
};
