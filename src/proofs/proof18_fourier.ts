import { SceneSpec } from '../engine/dsl/types';
import { ProofDefinition } from './types';

function makeFourierScene(opts: {
  N: number;
  x0: number;
  fourierMode: 'signal' | 'kernel' | 'phi';
  showJumpMean: boolean;
  rangeX?: [number, number];
  rangeY?: [number, number];
}): SceneSpec {
  return {
    view: '2d',
    range: {
      x: opts.rangeX ?? [-4.2, 4.2],
      y: opts.rangeY ?? [-1.6, 1.6],
      z: [-1, 1],
    },
    params: [
      { name: 'N', value: opts.N, min: 1, max: 40, step: 1, label: 'Armoniche N' },
      { name: 'x0', value: opts.x0, min: -3.14, max: 3.14, step: 0.05, label: 'Punto x₀' },
    ],
    objects: [],
    measures: [
      { label: 'Ordine somma parziale N', expr: 'N' },
      { label: 'Punto osservato x₀', expr: 'x0' },
    ],
    overlay: {
      mode: 'fourier',
      fourierPreset: 'square',
      fourierMode: opts.fourierMode,
      showJumpMean: opts.showJumpMean,
    },
  };
}

export const proof18Fourier: ProofDefinition = {
  id: 'proof-18-fourier',
  number: '18',
  title: 'Teorema di Fourier',
  block: 3,
  blockLabel: 'Blocco 3: Serie di Fourier',
  lecturer: 'Benini',
  sourceFile: '18 - Teorema di Fourier.md',
  status: 'ready',
  statementLatex:
    '\\frac{a_0}{2} + \\sum_{k=1}^{\\infty} \\left(a_k\\cos(kx) + b_k\\sin(kx)\\right) = \\frac{f(x^+) + f(x^-)}{2}',
  hypotheses: [
    'f : ℝ → ℝ è 2π-periodica',
    'f è di classe C¹ a tratti (continua a tratti con derivata continua a tratti su [-π, π])',
  ],
  steps: [
    {
      title: '1. Somma parziale S_N(x) e valore medio nei salti',
      explanation:
        'Vogliamo mostrare che S_N(x) converge al valore medio tra limite destro f(x⁺) e sinistro f(x⁻). Con x₀ = 0 sull’onda quadra vedi i due limiti (±1) e la media (0).',
      formulasLatex: [
        'S_N(x) = \\frac{a_0}{2} + \\sum_{k=1}^{N} \\left(a_k\\cos(kx) + b_k\\sin(kx)\\right)',
        '\\lim_{N\\to +\\infty} \\left[S_N(x) - \\frac{f(x^+) + f(x^-)}{2}\\right] = 0',
      ],
      scene: makeFourierScene({ N: 7, x0: 0, fourierMode: 'signal', showJumpMean: true }),
    },
    {
      title: '2. Cambio di variabile y = t - x e Nucleo di Dirichlet',
      explanation:
        'Sostituendo i coefficienti di Fourier in S_N(x), usando cos(k(t-x)) e la 2π-periodicità con y = t - x, compare il Nucleo di Dirichlet (identità di Lagrange) mostrato ora nel grafico!',
      formulasLatex: [
        'S_N(x) = \\frac{1}{\\pi}\\int_{-\\pi}^{\\pi} f(x+y)\\left[\\frac{1}{2} + \\sum_{k=1}^N \\cos(ky)\\right]dy',
        '\\frac{1}{2} + \\sum_{k=1}^{N} \\cos(ky) = \\frac{\\sin\\left((N + \\tfrac{1}{2})y\\right)}{2\\sin(y/2)} = D_N(y)',
      ],
      callout: {
        kind: 'note',
        title: 'Ruolo del Nucleo di Dirichlet',
        body: 'L’integrale di D_N(y) su [-π, 0] vale esattamente π/2, e così su [0, π]. Aumenta N con lo slider per vedere il picco centrale in y = 0 crescere!',
      },
      scene: makeFourierScene({
        N: 8,
        x0: 0,
        fourierMode: 'kernel',
        showJumpMean: false,
        rangeX: [-3.2, 3.2],
        rangeY: [-2.5, 10],
      }),
    },
    {
      title: '3. Spezzamento su [-π, 0] e [0, π]',
      explanation:
        'Usando l’integrale noto del nucleo costante f(x⁻)/2 su [-π, 0] e f(x⁺)/2 su [0, π], scriviamo la differenza da azzerare come somma di due integrali oscillanti.',
      formulasLatex: [
        'S_N(x) - \\frac{f(x^+) + f(x^-)}{2} = \\frac{1}{\\pi}\\int_{-\\pi}^{0}\\Phi^-(y)\\sin\\left((N+\\tfrac{1}{2})y\\right)dy + \\frac{1}{\\pi}\\int_{0}^{\\pi}\\Phi^+(y)\\sin\\left((N+\\tfrac{1}{2})y\\right)dy',
      ],
      callout: {
        kind: 'warning',
        title: 'Attenzione alla formulazione sulle due metà',
        body: 'La metà su [-π, 0] tende a f(x⁻)/2 e quella su [0, π] tende a f(x⁺)/2. Non vanno attribuite separatamente all’intera somma S_N(x)!',
      },
      scene: makeFourierScene({ N: 12, x0: 0, fourierMode: 'signal', showJumpMean: true }),
    },
    {
      title: '4. Definizione della funzione ausiliaria Φ⁻(y)',
      explanation:
        'Nel grafico è tracciata Φ⁻(y) = (f(x₀+y) - f(x₀⁻)) / (2 sin(y/2)) su [-π, 0). L’unico punto critico dove il denominatore si annulla è y = 0.',
      formulasLatex: [
        '\\Phi^-(y) = \\begin{cases} \\dfrac{f(x+y) - f(x^-)}{2\\sin(y/2)} & y \\in [-\\pi, 0) \\\\[2mm] f\'(x^-) & y = 0 \\end{cases}',
      ],
      scene: makeFourierScene({
        N: 12,
        x0: 1.2,
        fourierMode: 'phi',
        showJumpMean: false,
        rangeX: [-3.4, 0.8],
        rangeY: [-1.5, 1.5],
      }),
    },
    {
      title: '5. Prolungamento continuo in y = 0 tramite Lagrange',
      explanation:
        'Poiché f è C¹ a tratti, su un intorno sinistro (x-δ, x) il Teorema di Lagrange dà f(x+y)-f(x⁻) = f\'(x+η)y. Semplificando con y / (2 sin(y/2)) → 1 il limite in y → 0⁻ è finito e vale f\'(x⁻)!',
      formulasLatex: [
        '\\lim_{y\\to 0^-} \\Phi^-(y) = \\lim_{y\\to 0^-} f\'(x+\\eta)\\cdot\\frac{y}{2\\sin(y/2)} = f\'(x^-)',
      ],
      scene: makeFourierScene({
        N: 15,
        x0: 1.2,
        fourierMode: 'phi',
        showJumpMean: false,
        rangeX: [-3.4, 0.8],
        rangeY: [-1.5, 1.5],
      }),
    },
    {
      title: '6. Applicazione del Lemma di Riemann e conclusione',
      explanation:
        'Poiché Φ⁻ e Φ⁺ sono continue a tratti sui rispettivi compatti, il Lemma di Riemann con λ = N + 1/2 garantisce che entrambi gli integrali tendono a 0 per N → +∞.',
      formulasLatex: [
        '\\lim_{N\\to +\\infty} \\left[S_N(x) - \\frac{f(x^+) + f(x^-)}{2}\\right] = 0 \\qquad \\square',
      ],
      scene: makeFourierScene({ N: 28, x0: 0, fourierMode: 'signal', showJumpMean: true }),
    },
  ],
};
