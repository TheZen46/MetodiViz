import { SceneSpec } from '../engine/dsl/types';
import { ProofDefinition } from './types';

function makeEulerScene(alpha: number, showRoots: boolean): SceneSpec {
  const roots = showRoots
    ? [0, 1, 2].map((k) => {
        const ang = (2 * Math.PI * k) / 3;
        return {
          kind: 'pole' as const,
          id: `x_${k + 1}`,
          re: Number(Math.cos(ang).toFixed(3)),
          im: Number(Math.sin(ang).toFixed(3)),
          label: `x_${k + 1}`,
          color: '#4ade80',
          visible: true,
        };
      })
    : [];

  return {
    view: 'complex',
    range: { x: [-2.4, 2.4], y: [-2.0, 2.0], z: [-1, 1] },
    params: [{ name: 'alpha', value: alpha, min: 0, max: 6.28, step: 0.1, label: 'Angolo α' }],
    objects: [
      {
        kind: 'complexFn',
        id: 'expz',
        expr: showRoots ? 'z^3 - 1' : 'e^z',
        visible: true,
        domainColoring: true,
      },
      {
        kind: 'contour',
        id: 'S1',
        shape: 'circle',
        cx: 0,
        cy: 0,
        rx: 1,
        ry: 1,
        color: '#38bdf8',
        visible: true,
      },
      {
        kind: 'pole',
        id: 'u',
        re: Number(Math.cos(alpha).toFixed(2)),
        im: Number(Math.sin(alpha).toFixed(2)),
        label: 'e^{iα}',
        color: '#e5a93c',
        visible: !showRoots,
      },
      ...roots,
    ],
    measures: [
      { label: 'cos(α)', expr: '\\cos(\\alpha)' },
      { label: 'sin(α)', expr: '\\sin(\\alpha)' },
      { label: '|e^{iα}|', expr: '1' },
    ],
  };
}

export const proof10Euler: ProofDefinition = {
  id: 'proof-10-euler',
  number: '10',
  title: 'Numeri complessi e formula di Eulero',
  block: 4,
  blockLabel: 'Blocco 4: Analisi Complessa',
  lecturer: 'Benini',
  sourceFile: '10 - Numeri complessi (2024) e formula di Eulero.md',
  status: 'ready',
  statementLatex:
    'e^{\\alpha + i\\beta} = e^\\alpha(\\cos\\beta + i\\sin\\beta), \\qquad z = |z|e^{i\\alpha}',
  hypotheses: [
    'z = a + ib ∈ ℂ rappresentato con modulo |z| e argomento α = arg(z)',
    'L’esponenziale complesso estende e^x reale mantenendo la proprietà e^{z+w} = e^z e^w',
  ],
  steps: [
    {
      title: '1. Richiami sul coniugato e sull’argomento',
      explanation:
        'Il coniugato conserva il modulo (|z̄| = |z|) e inverte il segno dell’argomento. L’argomento soddisfa cos(arg z) = a/|z| e sin(arg z) = b/|z|.',
      formulasLatex: [
        '|\\bar z| = |z|, \\quad z\\cdot\\bar z = |z|^2, \\quad \\tan(\\arg z) = \\frac{b}{a} \\; (a \\neq 0)',
      ],
      callout: {
        kind: 'warning',
        title: 'Modulo del coniugato',
        body: 'Ricorda che |z̄| = |z| (non z): il modulo è sempre un numero reale non negativo.',
      },
      scene: makeEulerScene(0.7, false),
    },
    {
      title: '2. Ricavare l’inverso in forma trigonometrica',
      explanation:
        'Cercando w = z⁻¹ di modulo 1/|z| e argomento β tale che z · w = 1, il confronto tra parte reale = 1 e parte immaginaria = 0 impone β = -α.',
      formulasLatex: [
        '\\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta = 1,\\; \\cos\\alpha\\sin\\beta + \\cos\\beta\\sin\\alpha = 0 \\implies \\beta = -\\alpha',
      ],
      callout: {
        kind: 'warning',
        title: 'Terminologia: inverso vs opposto',
        body: 'Si ricava l’inverso rispetto al prodotto (z · z⁻¹ = 1), non l’opposto rispetto alla somma (-z).',
      },
      scene: makeEulerScene(0.7, false),
    },
    {
      title: '3. Formula di Eulero e forma esponenziale',
      explanation:
        'Per z = α + iβ definendo e^{iβ} = cos β + i sin β otteniamo e^z = e^α(cos β + i sin β). Quindi ogni numero complesso z ≠ 0 si scrive compattamente come |z| e^{iα}.',
      formulasLatex: [
        'e^z = e^\\alpha(\\cos\\beta + i\\sin\\beta), \\qquad z = |z|e^{i\\alpha}',
      ],
      scene: makeEulerScene(1.2, false),
    },
    {
      title: '4. Prodotto e inverso in forma esponenziale',
      explanation:
        'In forma esponenziale il calcolo con i numeri complessi diventa immediato: i moduli si moltiplicano e gli esponenti si sommano.',
      formulasLatex: [
        'z\\cdot w = |z|\\cdot|w|\\,e^{i(\\arg z + \\arg w)}, \\qquad z^{-1} = \\frac{1}{|z|}e^{-i\\alpha}',
      ],
      scene: makeEulerScene(2.1, false),
    },
    {
      title: '5. Risoluzione di xⁿ = w ed esempio x³ = 1',
      explanation:
        'Scrivendo w = |w| e^{iθ} si ha |x| = ⁿ√|w| e n arg(x) = θ + 2kπ. Per x³ = 1 (w = 1, θ = 0) otteniamo le tre radici cubiche dell’unità sul cerchio unitario.',
      formulasLatex: [
        'x_k = \\sqrt[n]{|w|}\\,e^{i\\frac{\\theta + 2k\\pi}{n}}, \\quad x^3 = 1 \\implies x_1 = 1,\\; x_2 = e^{i\\frac{2\\pi}{3}},\\; x_3 = e^{i\\frac{4\\pi}{3}} \\qquad \\square',
      ],
      scene: makeEulerScene(0, true),
    },
  ],
};
