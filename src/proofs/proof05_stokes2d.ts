import { SceneSpec } from '../engine/dsl/types';
import { ProofDefinition } from './types';

function makeStokes3DScene(): SceneSpec {
  return {
    view: '3d',
    range: { x: [-2.2, 2.2], y: [-2.2, 2.2], z: [-1.5, 2.5] },
    params: [{ name: 'r', value: 1.5, min: 0.6, max: 2.0, step: 0.1, label: 'Raggio disco r' }],
    objects: [
      {
        kind: 'surface',
        id: 'rotore_z',
        expr: '0.45 (x^2 + y^2)',
        color: '#38bdf8',
        visible: true,
      },
      {
        kind: 'curve',
        id: 'bordo_D',
        xExpr: 'r \\cos(t)',
        yExpr: 'r \\sin(t)',
        zExpr: '0',
        tMin: '0',
        tMax: '2\\pi',
        color: '#e5a93c',
        visible: true,
      },
    ],
    measures: [
      { label: 'Lunghezza bordo 2πr', expr: 'exactLength(bordo_D)' },
    ],
  };
}

function makeStokes2DScene(k: number): SceneSpec {
  return {
    view: '2d',
    range: { x: [-0.5, 4.2], y: [-0.2, 3.6], z: [-1, 1] },
    params: [{ name: 'k', value: k, min: 0.2, max: 2.0, step: 0.1, label: 'Rotore k' }],
    objects: [
      {
        kind: 'vectorfield',
        id: 'F',
        fxExpr: '-k \\cdot y',
        fyExpr: 'k \\cdot x + 0.2 x^2',
        color: '#38bdf8',
        visible: true,
        showCurlHeatmap: true,
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
      },
    ],
    measures: [
      { label: 'Circuitazione ∫_∂D f(·,0)·dP', expr: 'gaussGreenLine(D)' },
      { label: 'Flusso rotore ∬_D (∇∧f)·e₃', expr: 'gaussGreenDouble(D)' },
    ],
  };
}

export const proof05Stokes2d: ProofDefinition = {
  id: 'proof-05-stokes-2d',
  number: '05',
  title: 'Teorema di Stokes in 2D',
  block: 2,
  blockLabel: 'Blocco 2: Curve, Superfici e Integrali',
  lecturer: 'Pinamonti',
  sourceFile: '05 - Teorema di Stokes in 2D.md',
  status: 'ready',
  statementLatex:
    '\\iint_D (\\nabla \\wedge f)\\cdot e_3\\,dx\\,dy = \\int_{\\partial D} f(\\cdot, 0)\\,dP',
  hypotheses: [
    'D ⊂ ℝ² immerso nel piano z = 0 di ℝ³ come D̃ = D × {0}',
    'f : D × [-ε, ε] ⊂ ℝ³ → ℝ³ campo vettoriale di classe C¹',
    'Normale alla superficie piatta scelta uguale a e₃ = (0, 0, 1)',
  ],
  steps: [
    {
      title: '1. Immersione nel piano z = 0 di ℝ³',
      explanation:
        'Il dominio piano D giace sul piano z = 0 (bordo arancione nella vista 3D) e il campo f è definito in un intorno tridimensionale D × [-ε, ε].',
      formulasLatex: [
        '\\tilde D = D \\times \\{0\\} \\subset \\mathbb{R}^3, \\qquad \\underline{n} = e_3 = (0, 0, 1)',
      ],
      scene: makeStokes3DScene(),
    },
    {
      title: '2. Espansione del rotore lungo e₃',
      explanation:
        'Calcolando il rotore ∇ ∧ f in ℝ³ e proiettandolo lungo e₃, sopravvive soltanto la terza componente: ∂₁ f₂ - ∂₂ f₁.',
      formulasLatex: [
        '\\nabla \\wedge f = (\\partial_2 f_3 - \\partial_3 f_2,\\; \\partial_3 f_1 - \\partial_1 f_3,\\; \\partial_1 f_2 - \\partial_2 f_1)',
        '(\\nabla \\wedge f)\\cdot e_3 = \\partial_1 f_2 - \\partial_2 f_1',
      ],
      scene: makeStokes2DScene(1.0),
    },
    {
      title: '3. Restrizione a z = 0 e Gauss-Green',
      explanation:
        'Valutando l’integrale doppio sul piano z = 0, riconosciamo esattamente il secondo membro della formula di Gauss-Green applicata a (f₁(x,y,0), f₂(x,y,0)).',
      formulasLatex: [
        '\\iint_D \\left(\\partial_1 f_2(x,y,0) - \\partial_2 f_1(x,y,0)\\right)dx\\,dy = \\int_{\\partial D} f_1\\,dx + f_2\\,dy',
      ],
      scene: makeStokes2DScene(1.2),
    },
    {
      title: '4. Ruolo di f₃ e conclusione',
      explanation:
        'Lungo il bordo ∂D che giace in z = 0 si ha dz = 0, quindi la componente f₃ non dà alcun contributo all’integrale di linea di f(·, 0).',
      formulasLatex: [
        '\\int_{\\partial D} f_1\\,dx + f_2\\,dy = \\int_{\\partial D} f(\\cdot, 0)\\,dP \\qquad \\square',
      ],
      callout: {
        kind: 'note',
        title: 'Ponte verso Stokes 3D',
        body: 'Questa è la versione piana del teorema di Stokes: nel caso di una superficie curva 3D si riporta lo stesso conto sul dominio parametrico tramite la prima forma fondamentale.',
      },
      scene: makeStokes2DScene(1.4),
    },
  ],
};
