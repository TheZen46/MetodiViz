import { SceneSpec } from '../engine/dsl/types';
import { ProofDefinition } from './types';

function makeComplexAlgScene(a: number, b: number, showInverse: boolean): SceneSpec {
  const norm = a * a + b * b;
  const invRe = norm > 1e-6 ? a / norm : 0;
  const invIm = norm > 1e-6 ? -b / norm : 0;
  return {
    view: 'complex',
    range: { x: [-3.2, 3.2], y: [-2.6, 2.6], z: [-1, 1] },
    params: [
      { name: 'a', value: a, min: -2.5, max: 2.5, step: 0.1, label: 'Parte reale a' },
      { name: 'b', value: b, min: -2.5, max: 2.5, step: 0.1, label: 'Parte imm. b' },
    ],
    objects: [
      {
        kind: 'complexFn',
        id: 'id_z',
        expr: 'z',
        visible: true,
        domainColoring: true,
      },
      {
        kind: 'pole',
        id: 'z',
        re: a,
        im: b,
        label: 'z = a+ib',
        color: '#e5a93c',
        visible: true,
      },
      {
        kind: 'pole',
        id: 'z_conj',
        re: a,
        im: -b,
        label: 'z̄ = a-ib',
        color: '#38bdf8',
        visible: true,
      },
      ...(showInverse
        ? [
            {
              kind: 'pole' as const,
              id: 'z_inv',
              re: Number(invRe.toFixed(2)),
              im: Number(invIm.toFixed(2)),
              label: 'z⁻¹',
              color: '#4ade80',
              visible: true,
            },
          ]
        : []),
    ],
    measures: [
      { label: 'Norma N(z) = a² + b²', expr: 'a^2 + b^2' },
      { label: 'Re(z⁻¹) = a / N(z)', expr: '\\frac{a}{a^2 + b^2}' },
      { label: 'Im(z⁻¹) = -b / N(z)', expr: '-\\frac{b}{a^2 + b^2}' },
    ],
  };
}

export const proof08ComplexNumbers: ProofDefinition = {
  id: 'proof-08-complex-numbers',
  number: '08',
  title: 'Numeri complessi',
  block: 4,
  blockLabel: 'Blocco 4: Analisi Complessa',
  lecturer: 'Benini',
  sourceFile: '08 - Numeri complessi.md',
  status: 'ready',
  statementLatex:
    '\\mathbb{C} := \\{a + ib \\mid a, b \\in \\mathbb{R},\\; i^2 = -1\\}, \\qquad \\forall z \\in \\mathbb{C}^* \\;\\; z^{-1} = \\frac{\\bar z}{N(z)} = \\frac{a}{a^2+b^2} - i\\frac{b}{a^2+b^2}',
  hypotheses: [
    'Unità immaginaria i definita dalla proprietà algebrica i² = -1',
    'ℂ non è un campo ordinato (a differenza di ℝ), ma è un campo rispetto a somma e prodotto',
  ],
  steps: [
    {
      title: '1. Definizione algebrica di ℂ, somma e prodotto',
      explanation:
        'Ogni numero complesso z = a + ib ha parte reale Re(z) = a e parte immaginaria Im(z) = b. Somma e prodotto si svolgono come polinomi imponendo i² = -1.',
      formulasLatex: [
        '(a + ib) + (c + id) = (a + c) + i(b + d)',
        '(a + ib)(c + id) = (ac - bd) + i(bc + ad)',
      ],
      scene: makeComplexAlgScene(1.2, 0.8, false),
    },
    {
      title: '2. Complesso coniugato z̄ e simmetria rispetto all’asse reale',
      explanation:
        'Il coniugato z̄ = a - ib riflette z rispetto all’asse Re(z). Il prodotto z · z̄ elimina la parte immaginaria e restituisce un numero reale non negativo.',
      formulasLatex: [
        'z = \\bar z \\iff z \\in \\mathbb{R}, \\qquad z + \\bar z = 2\\operatorname{Re}(z), \\qquad z\\cdot\\bar z = a^2 + b^2',
      ],
      scene: makeComplexAlgScene(1.2, 0.8, false),
    },
    {
      title: '3. Norma N(z) = a² + b²',
      explanation:
        'Definiamo norma di z il reale N(z) = z · z̄ = a² + b². Essa si annulla se e solo se z = 0 (cioè a = b = 0).',
      formulasLatex: [
        'N(z) = a^2 + b^2 \\in \\mathbb{R}_{\\ge 0}, \\qquad N(z) = 0 \\iff z = 0',
      ],
      scene: makeComplexAlgScene(1.2, 0.8, false),
    },
    {
      title: '4. Inverso moltiplicativo z⁻¹ per z ≠ 0',
      explanation:
        'Per ogni z ∈ ℂ* = ℂ \\ {0}, N(z) ≠ 0 e possiamo dividere per N(z): l’inverso è z̄ / N(z). Nel grafico verde vedi z⁻¹ che si avvicina all’origine quando z si allontana.',
      formulasLatex: [
        'z^{-1} = \\frac{\\bar z}{N(z)} = \\frac{a}{a^2 + b^2} - i\\frac{b}{a^2 + b^2}',
      ],
      callout: {
        kind: 'warning',
        title: 'Segno della parte immaginaria dell’inverso',
        body: 'In z⁻¹ compare -b / N(z) (con il segno MENO), perché al numeratore c’è il coniugato z̄ = a - ib e non z.',
      },
      scene: makeComplexAlgScene(1.2, 0.8, true),
    },
    {
      title: '5. Verifica esplicita z · z⁻¹ = 1',
      explanation:
        'Svolgendo il prodotto algebrico tra z e z⁻¹ i termini immaginari ab/N(z) e -ab/N(z) si cancellano e resta (a² + b²)/N(z) = 1.',
      formulasLatex: [
        '(a + ib)\\left(\\frac{a}{N(z)} - i\\frac{b}{N(z)}\\right) = \\frac{a^2 + b^2}{N(z)} + i\\frac{ba - ab}{N(z)} = 1 \\qquad \\square',
      ],
      scene: makeComplexAlgScene(-1.5, 1.0, true),
    },
  ],
};
