import { SceneSpec } from '../engine/dsl/types';
import { ProofDefinition } from './types';

function makeRiemannScene(lambda: number, n: number): SceneSpec {
  return {
    view: '2d',
    range: { x: [-0.2, 3.4], y: [-1.8, 1.8], z: [-1, 1] },
    params: [
      { name: 'lambda', value: lambda, min: 1, max: 40, step: 1, label: 'Frequenza λ' },
      { name: 'n', value: n, min: 2, max: 20, step: 1, label: 'Suddivisioni n' },
    ],
    objects: [
      {
        kind: 'plot',
        id: 'g',
        expr: '0.8 + 0.5\\cos(x) + 0.2\\sin(2x)',
        color: '#94a3b8',
        visible: true,
        dashed: true,
      },
      {
        kind: 'plot',
        id: 'osc',
        expr: '(0.8 + 0.5\\cos(x) + 0.2\\sin(2x)) \\cdot \\sin(\\lambda x)',
        color: '#38bdf8',
        visible: true,
      },
    ],
    measures: [
      { label: '∫_0^π g(x)sin(λx)dx', expr: 'integral1D(osc, 0, \\pi)' },
      { label: 'Frequenza λ', expr: '\\lambda' },
    ],
  };
}

export const proof17Riemann: ProofDefinition = {
  id: 'proof-17-riemann',
  number: '17',
  title: 'Lemma di Riemann',
  block: 3,
  blockLabel: 'Blocco 3: Serie di Fourier',
  lecturer: 'Benini',
  sourceFile: '17 - Lemma di Riemann.md',
  status: 'ready',
  statementLatex:
    'g : [a,b] \\to \\mathbb{R} \\text{ di classe } C^0 \\text{ a tratti} \\implies \\lim_{\\lambda\\to +\\infty} \\int_a^b g(x)\\sin(\\lambda x)\\,dx = \\lim_{\\lambda\\to +\\infty} \\int_a^b g(x)\\cos(\\lambda x)\\,dx = 0',
  hypotheses: [
    'g : [a, b] → ℝ continua a tratti (C⁰ a tratti)',
    'Si dimostra prima su un singolo sotto-intervallo [ã, b̃] di continuità, poi si sommano i finiti tratti',
  ],
  steps: [
    {
      title: '1. Cancellazione delle oscillazioni ad alta frequenza',
      explanation:
        'La curva tratteggiata è g(x), mentre quella continua è g(x)sin(λx). Al crescere di λ con lo slider le oscillazioni diventano così fitte da compensarsi quasi del tutto su ogni sotto-intervallo.',
      formulasLatex: [
        '\\lim_{\\lambda\\to+\\infty} \\int_{\\tilde a}^{\\tilde b} g(x)\\sin(\\lambda x)\\,dx = 0',
      ],
      scene: makeRiemannScene(3, 4),
    },
    {
      title: '2. Suddivisione di [ã, b̃] e aggiungi/togli g(x_i)',
      explanation:
        'Dividiamo [ã, b̃] in n parti uguali [a_i, a_{i+1}], fissiamo un punto x_i in ciascuna e spezziamo l’integrando in una parte costante a tratti g(x_i) più lo scarto g(x) - g(x_i).',
      formulasLatex: [
        '\\int_{\\tilde a}^{\\tilde b} g(x)\\sin(\\lambda x)\\,dx = \\sum_{i=0}^{n-1}\\int_{a_i}^{a_{i+1}} g(x_i)\\sin(\\lambda x)\\,dx + \\sum_{i=0}^{n-1}\\int_{a_i}^{a_{i+1}} [g(x) - g(x_i)]\\sin(\\lambda x)\\,dx',
      ],
      scene: makeRiemannScene(6, 6),
    },
    {
      title: '3. Integrazione esatta del termine costante g(x_i)',
      explanation:
        'Su ogni tratto g(x_i) esce dall’integrale e la primitiva di sin(λx) è -cos(λx)/λ: compare il fattore 1/λ che abbatte la prima somma per λ grande.',
      formulasLatex: [
        '\\sum_{i=0}^{n-1} g(x_i)\\left[-\\frac{\\cos(\\lambda x)}{\\lambda}\\right]_{a_i}^{a_{i+1}} = \\sum_{i=0}^{n-1} g(x_i)\\frac{\\cos(\\lambda a_i) - \\cos(\\lambda a_{i+1})}{\\lambda}',
      ],
      scene: makeRiemannScene(12, 8),
    },
    {
      title: '4. Stima dei moduli e uniforme continuità di g',
      explanation:
        'Poiché g è continua sul compatto [ã, b̃], è limitata (|g| ≤ M) e uniformemente continua: per ogni ε > 0 scegliamo n così grande che (b̃ - ã)/n < δ, rendendo |g(x) - g(x_i)| < ε su ogni cella.',
      formulasLatex: [
        '\\left|\\int_{\\tilde a}^{\\tilde b} g(x)\\sin(\\lambda x)\\,dx\\right| \\le \\sum_{i=0}^{n-1} M\\frac{2}{\\lambda} + \\sum_{i=0}^{n-1} \\varepsilon(a_{i+1}-a_i) = \\frac{2nM}{\\lambda} + \\varepsilon(\\tilde b - \\tilde a)',
      ],
      scene: makeRiemannScene(20, 12),
    },
    {
      title: '5. Scelta di ε e della soglia Λ̃',
      explanation:
        'Fissato ε̃ > 0 qualsiasi, scegliamo prima ε < ε̃ / (2(b̃ - ã)) (che fissa δ quindi n), poi prendiamo λ > Λ̃ > 4nM / ε̃. Entrambi i termini scendono sotto ε̃ / 2.',
      formulasLatex: [
        '\\varepsilon \\in \\left(0, \\frac{\\tilde\\varepsilon}{2(\\tilde b - \\tilde a)}\\right), \\quad \\tilde\\Lambda > \\frac{4nM}{\\tilde\\varepsilon} \\implies \\left|\\int_{\\tilde a}^{\\tilde b} g(x)\\sin(\\lambda x)\\,dx\\right| < \\frac{\\tilde\\varepsilon}{2} + \\frac{\\tilde\\varepsilon}{2} = \\tilde\\varepsilon',
      ],
      callout: {
        kind: 'warning',
        title: 'Ordine delle scelte e formulazione finale',
        body: 'n dipende da ε tramite δ, quindi va fissato PRIMA di scegliere Λ̃. Inoltre non si scrive "ε̃ = 0": poiché la stima ≤ ε̃ vale per ogni ε̃ > 0 definitivamente in λ, il limite è 0.',
      },
      scene: makeRiemannScene(32, 16),
    },
    {
      title: '6. Estensione al caso a tratti e al coseno',
      explanation:
        'Per g continua a tratti su [a, b] si applica la stima a ciascuno dei finiti intervalli di continuità e si sommano i limiti (tutti 0). Per cos(λx) il conto è identico con primitiva sin(λx)/λ.',
      formulasLatex: [
        '\\lim_{\\lambda\\to+\\infty}\\int_a^b g(x)\\sin(\\lambda x)\\,dx = \\lim_{\\lambda\\to+\\infty}\\int_a^b g(x)\\cos(\\lambda x)\\,dx = 0 \\qquad \\square',
      ],
      scene: makeRiemannScene(40, 18),
    },
  ],
};
