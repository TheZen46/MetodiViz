import { SceneSpec } from '../engine/dsl/types';
import { ProofDefinition } from './types';

function makePolarScene(rho: number, theta: number, n: number, showRoots: boolean): SceneSpec {
  const re = rho * Math.cos(theta);
  const im = rho * Math.sin(theta);
  const rootR = Math.pow(rho, 1 / Math.max(1, n));
  const roots = showRoots
    ? Array.from({ length: Math.min(8, Math.max(2, Math.round(n))) }, (_, k) => {
        const ang = (theta + 2 * Math.PI * k) / n;
        return {
          kind: 'pole' as const,
          id: `x_${k}`,
          re: Number((rootR * Math.cos(ang)).toFixed(2)),
          im: Number((rootR * Math.sin(ang)).toFixed(2)),
          label: `x_${k}`,
          color: '#4ade80',
          visible: true,
        };
      })
    : [];

  return {
    view: 'complex',
    range: { x: [-2.8, 2.8], y: [-2.4, 2.4], z: [-1, 1] },
    params: [
      { name: 'rho', value: rho, min: 0.4, max: 2.2, step: 0.1, label: 'Modulo ρ' },
      { name: 'theta', value: theta, min: 0, max: 6.28, step: 0.1, label: 'Argomento θ' },
      { name: 'n', value: n, min: 2, max: 6, step: 1, label: 'Indice radice n' },
    ],
    objects: [
      {
        kind: 'complexFn',
        id: 'zn',
        expr: 'z^3 - 1',
        visible: showRoots,
        domainColoring: showRoots,
      },
      {
        kind: 'contour',
        id: 'C_rho',
        shape: 'circle',
        cx: 0,
        cy: 0,
        rx: showRoots ? rootR : rho,
        ry: showRoots ? rootR : rho,
        color: '#38bdf8',
        visible: true,
      },
      {
        kind: 'pole',
        id: 'z',
        re: Number(re.toFixed(2)),
        im: Number(im.toFixed(2)),
        label: 'z',
        color: '#e5a93c',
        visible: true,
      },
      ...roots,
    ],
    measures: [
      { label: 'Modulo |z| = ρ', expr: '\\rho' },
      { label: 'Raggio radici n-esime', expr: '\\rho^{1/n}' },
    ],
  };
}

export const proof09PolarForm: ProofDefinition = {
  id: 'proof-09-polar-form',
  number: '09',
  title: 'Modulo e forma trigonometrica',
  block: 4,
  blockLabel: 'Blocco 4: Analisi Complessa',
  lecturer: 'Benini',
  sourceFile: '09 - Modulo e forma trigonometrica.md',
  status: 'ready',
  statementLatex:
    'z = \\rho(\\cos\\theta + i\\sin\\theta) \\implies z^n = \\rho^n(\\cos(n\\theta) + i\\sin(n\\theta)), \\quad x_k = \\sqrt[n]{\\rho}\\left(\\cos\\frac{\\theta + 2k\\pi}{n} + i\\sin\\frac{\\theta + 2k\\pi}{n}\\right)',
  hypotheses: [
    'z = a + ib con modulo |z| = √(a² + b²) = ρ ≥ 0',
    'Argomento θ definito modulo 2π (per z ≠ 0)',
  ],
  steps: [
    {
      title: '1. Modulo e disuguaglianza triangolare',
      explanation:
        'Il modulo |z| = √(a² + b²) = √N(z) è la distanza dall’origine nel piano di Gauss. Soddisfa |z₁ z₂| = |z₁||z₂| e la disuguaglianza triangolare |z₁ + z₂| ≤ |z₁| + |z₂|.',
      formulasLatex: [
        '|z| = \\sqrt{a^2 + b^2} = \\sqrt{N(z)}, \\qquad |z_1 + z_2| \\le |z_1| + |z_2|',
      ],
      scene: makePolarScene(1.5, 0.78, 3, false),
    },
    {
      title: '2. Coordinate polari e forma trigonometrica',
      explanation:
        'Proiettando il punto z = (a, b) sugli assi otteniamo a = ρ cos θ e b = ρ sin θ, quindi la forma trigonometrica di z.',
      formulasLatex: [
        'a = \\rho\\cos\\theta,\\; b = \\rho\\sin\\theta \\implies z = \\rho(\\cos\\theta + i\\sin\\theta)',
      ],
      scene: makePolarScene(1.5, 0.78, 3, false),
    },
    {
      title: '3. Prodotto e divisione in forma trigonometrica',
      explanation:
        'Moltiplicando due numeri in forma trigonometrica e applicando le formule di addizione per seno e coseno, i moduli si moltiplicano e gli argomenti si sommano; nella divisione si dividono i moduli e si sottraggono gli argomenti.',
      formulasLatex: [
        'z_1 z_2 = \\rho_1 \\rho_2\\big(\\cos(\\theta_1 + \\theta_2) + i\\sin(\\theta_1 + \\theta_2)\\big)',
        '\\frac{z_1}{z_2} = \\frac{\\rho_1}{\\rho_2}\\big(\\cos(\\theta_1 - \\theta_2) + i\\sin(\\theta_1 - \\theta_2)\\big)',
      ],
      scene: makePolarScene(1.5, 1.1, 3, false),
    },
    {
      title: '4. Formula di De Moivre per ogni n ∈ ℤ',
      explanation:
        'Iterando il prodotto n volte (e usando z⁻¹ = ρ⁻¹(cos(-θ) + i sin(-θ)) per gli esponenti negativi), segue la formula di De Moivre valida per tutti gli interi n ∈ ℤ.',
      formulasLatex: [
        'z^n = \\rho^n(\\cos(n\\theta) + i\\sin(n\\theta)) \\qquad \\forall n \\in \\mathbb{Z}',
      ],
      scene: makePolarScene(1.4, 0.6, 4, false),
    },
    {
      title: '5. Le n radici n-esime distinte (poligono regolare)',
      explanation:
        'Cercando x = c(cos φ + i sin φ) tale che xⁿ = z otteniamo c = ⁿ√ρ e nφ ≡ θ (mod 2π). Le n radici distinte si trovano per k = 0, …, n - 1 (poi si ripetono perché k = nq + r) e formano un poligono regolare inscritto nella circonferenza.',
      formulasLatex: [
        '\\begin{cases} c = \\sqrt[n]{\\rho} \\\\[1mm] \\varphi_k = \\dfrac{\\theta + 2k\\pi}{n}, & k \\in \\{0,\\dots,n-1\\} \\end{cases} \\qquad \\square',
      ],
      scene: makePolarScene(1.4, 0.4, 3, true),
    },
  ],
};
