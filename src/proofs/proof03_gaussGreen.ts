import { SceneSpec } from '../engine/dsl/types';
import { ProofDefinition } from './types';

function makeGaussGreenScene(opts: {
  xSlice: number;
  k: number;
  showCurlHeatmap: boolean;
  showSlice: boolean;
}): SceneSpec {
  return {
    view: '2d',
    range: { x: [-0.5, 4.2], y: [-0.2, 3.6], z: [-1, 1] },
    params: [
      { name: 'k', value: opts.k, min: 0.2, max: 2.0, step: 0.1, label: 'Intensità rotore k' },
      { name: 'xSlice', value: opts.xSlice, min: 0.6, max: 3.1, step: 0.05, label: 'Ascissa fetta x' },
    ],
    objects: [
      {
        kind: 'vectorfield',
        id: 'F',
        fxExpr: '-k \\cdot y',
        fyExpr: 'k \\cdot x + 0.25 x^2',
        color: '#38bdf8',
        visible: true,
        showCurlHeatmap: opts.showCurlHeatmap,
      },
      {
        kind: 'domain',
        id: 'D',
        aExpr: '0.6',
        bExpr: '3.1',
        alphaExpr: '0.7 + 0.22\\sin(2.5x)',
        betaExpr: '2.5 + 0.3\\cos(1.6x)',
        color: '#34d399',
        visible: true,
        showBoundaryArrows: true,
        sliceXParam: 'xSlice',
      },
    ],
    measures: [
      { label: 'Circuitazione ∫_∂D F·dP', expr: 'gaussGreenLine(D)' },
      { label: 'Doppio ∬_D (∂_x F₂ - ∂_y F₁)', expr: 'gaussGreenDouble(D)' },
    ],
    overlay: {
      mode: 'gaussGreen',
      showCurlHeatmap: opts.showCurlHeatmap,
      showSlice: opts.showSlice,
    },
  };
}

export const proof03GaussGreen: ProofDefinition = {
  id: 'proof-03-gauss-green',
  number: '03',
  title: 'Formula di Gauss-Green',
  block: 2,
  blockLabel: 'Blocco 2 — Curve, Superfici e Integrali',
  lecturer: 'Pinamonti',
  sourceFile: '03 - Formula di Gauss-Green.md',
  status: 'ready',
  statementLatex:
    '\\oint_{\\partial D} F\\,dP = \\iint_D \\left(\\partial_x F_2 - \\partial_y F_1\\right)\\,dx\\,dy',
  hypotheses: [
    'D ⊂ ℝ² limitato con bordo ∂D regolare a tratti, percorso in verso antiorario',
    'Campo vettoriale F = (F₁, F₂) ∈ C¹(D̄) a tratti',
    'Dimostrazione su dominio normale rispetto alle x (poi generalizzabile per decomposizione)',
  ],
  steps: [
    {
      title: '1. Dominio normale rispetto alle x e bordo in 4 tratti',
      explanation:
        'Scriviamo D compreso tra x ∈ [a, b] e i due grafici α(x) ≤ y ≤ β(x). Il bordo ∂D orientato in senso antiorario si spezza in 4 curve: γ₁ (sotto), γ₂ (destra), γ₃ (sopra), γ₄ (sinistra).',
      formulasLatex: [
        'D = \\{(x,y) \\in \\mathbb{R}^2 \\mid x \\in [a,b],\\; \\alpha(x) \\le y \\le \\beta(x)\\}',
        '\\partial D = \\gamma_1 \\cup \\gamma_2 \\cup \\gamma_3 \\cup \\gamma_4',
      ],
      scene: makeGaussGreenScene({ xSlice: 1.85, k: 1.0, showCurlHeatmap: false, showSlice: false }),
    },
    {
      title: '2. Parametrizzazione e segni su γ₃⁻ e γ₄⁻',
      explanation:
        'Parametrizzando γ₃ e γ₄ con x e y crescenti (γ₃⁻ e γ₄⁻) otteniamo il verso opposto a quello antiorario: i loro integrali vanno quindi sottratti!',
      formulasLatex: [
        '\\int_{\\partial D} F\\,dP = \\underbrace{\\int_a^b (F_1(x,\\alpha(x)) - F_1(x,\\beta(x)))\\,dx}_{A} + \\underbrace{\\text{termini in } F_2}_{B}',
      ],
      callout: {
        kind: 'warning',
        title: 'Attenzione ai segni su γ₃ e γ₄',
        body: 'γ₃⁻(x) = (x, β(x)) va da sinistra a destra (orario!), quindi ∫_{γ₃} = -∫_{γ₃⁻}. Lo stesso vale per γ₄⁻(y) = (a, y) che sale invece di scendere.',
      },
      scene: makeGaussGreenScene({ xSlice: 1.85, k: 1.0, showCurlHeatmap: false, showSlice: false }),
    },
    {
      title: '3. Termine A: calcolo con -∂_y F₁',
      explanation:
        'Per il Teorema Fondamentale del Calcolo lungo ciascuna fetta verticale [α(x), β(x)], F₁(x, α(x)) - F₁(x, β(x)) diventa l’integrale di -∂_y F₁.',
      formulasLatex: [
        'F_1(x,\\alpha(x)) - F_1(x,\\beta(x)) = -\\int_{\\alpha(x)}^{\\beta(x)} \\partial_y F_1(x,y)\\,dy',
        'A = \\int_a^b \\int_{\\alpha(x)}^{\\beta(x)} -\\partial_y F_1(x,y)\\,dy\\,dx = \\iint_D -\\partial_y F_1\\,dx\\,dy',
      ],
      scene: makeGaussGreenScene({ xSlice: 1.85, k: 1.0, showCurlHeatmap: false, showSlice: true }),
    },
    {
      title: '4. Termine B: funzione ausiliaria E(x) sulla fetta verticale',
      explanation:
        'Definiamo E(x) come l’integrale di F₂ lungo il segmento verticale [α(x), β(x)] (linea arancione nel grafico). I termini verticali γ₂ e γ₄ valgono esattamente E(b) - E(a)!',
      formulasLatex: [
        '\\mathcal{E}(x) = \\int_{\\alpha(x)}^{\\beta(x)} F_2(x,y)\\,dy \\implies \\text{tratti } 2 + 4 = \\mathcal{E}(b) - \\mathcal{E}(a) = \\int_a^b \\mathcal{E}\'(x)\\,dx',
      ],
      scene: makeGaussGreenScene({ xSlice: 2.1, k: 1.0, showCurlHeatmap: false, showSlice: true }),
    },
    {
      title: '5. Derivazione sotto il segno di integrale (Regola di Leibniz)',
      explanation:
        'Derivando E(x) compaiono: la derivata ∂_x F₂ integrata su [α(x), β(x)] più i due contributi agli estremi mobili β\'(x) e α\'(x), che cancellano esattamente i tratti 1 e 3!',
      formulasLatex: [
        '\\mathcal{E}\'(x) = \\int_{\\alpha(x)}^{\\beta(x)} \\partial_x F_2(x,y)\\,dy + F_2(x,\\beta(x))\\beta\'(x) - F_2(x,\\alpha(x))\\alpha\'(x)',
        'B = 1 + 2 + 3 + 4 = \\iint_D \\partial_x F_2(x,y)\\,dx\\,dy',
      ],
      callout: {
        kind: 'note',
        title: 'Idea chiave della dimostrazione',
        body: 'I contributi degli estremi mobili nella regola di Leibniz compensano esattamente le componenti F₂ lungo γ₁ e γ₃!',
      },
      scene: makeGaussGreenScene({ xSlice: 1.4, k: 1.0, showCurlHeatmap: true, showSlice: true }),
    },
    {
      title: '6. Somma A + B e verifica numerica live',
      explanation:
        'Sommando A e B otteniamo la Formula di Gauss-Green. Prova a spostare lo slider k o cliccare sul campo per tracciare linee di flusso e vedere i due integrali restare uguali!',
      formulasLatex: [
        '\\oint_{\\partial D} F\\,dP = A + B = \\iint_D \\left(\\partial_x F_2 - \\partial_y F_1\\right)\\,dx\\,dy \\qquad \\square',
      ],
      scene: makeGaussGreenScene({ xSlice: 1.85, k: 1.2, showCurlHeatmap: true, showSlice: false }),
    },
  ],
};
