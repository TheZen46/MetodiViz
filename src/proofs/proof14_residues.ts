import { SceneSpec } from '../engine/dsl/types';
import { ProofDefinition } from './types';

function makeResiduesScene(opts: { showCircles: boolean; showCuts: boolean }): SceneSpec {
  return {
    view: 'complex',
    range: { x: [-3.5, 3.5], y: [-2.8, 2.8], z: [-1, 1] },
    params: [],
    objects: [
      {
        kind: 'complexFn',
        id: 'f',
        expr: '\\frac{1}{z - z_1} + \\frac{0.8}{z - z_2} + \\frac{0.6}{z - z_3}',
        visible: true,
        domainColoring: true,
      },
      {
        kind: 'contour',
        id: 'C',
        shape: 'ellipse',
        cx: 0,
        cy: 0,
        rx: 2.35,
        ry: 1.65,
        color: '#f43f5e',
        visible: true,
      },
      {
        kind: 'pole',
        id: 'z_1',
        re: -1.1,
        im: 0.3,
        label: 'z₁',
        color: '#22c55e',
        visible: true,
      },
      {
        kind: 'pole',
        id: 'z_2',
        re: 0.1,
        im: 0.7,
        label: 'z₂',
        color: '#22c55e',
        visible: true,
      },
      {
        kind: 'pole',
        id: 'z_3',
        re: 1.15,
        im: -0.35,
        label: 'z₃',
        color: '#22c55e',
        visible: true,
      },
    ],
    measures: [
      { label: 'Integrale ∮_C f(z)dz', expr: 'contourIntegral(C)' },
      { label: '2πi · ∑ Res(f, z_k)', expr: 'residuesSum(C)' },
    ],
    overlay: {
      mode: 'residues',
      showCircles: opts.showCircles,
      showCuts: opts.showCuts,
    },
  };
}

export const proof14Residues: ProofDefinition = {
  id: 'proof-14-residues',
  number: '14',
  title: 'Teorema dei residui',
  block: 4,
  blockLabel: 'Blocco 4: Analisi Complessa',
  lecturer: 'Benini',
  sourceFile: '14 - Teorema dei residui.md',
  status: 'ready',
  statementLatex:
    '\\oint_C f(z)\\,dz = 2\\pi i \\sum_{k=1}^{n} \\operatorname{Res}(f, z_k)',
  hypotheses: [
    'D ⊂ ℂ aperto semplicemente connesso',
    'f olomorfa su D \\ {z₁, …, z_n} con singolarità isolate z₁, …, z_n ∈ D',
    'C curva chiusa semplice in D (verso antiorario) che racchiude z₁, …, z_n',
  ],
  steps: [
    {
      title: '1. Curva C e singolarità isolate interne',
      explanation:
        'Consideriamo la curva chiusa C (rossa, antioraria) che racchiude le singolarità z₁, z₂, z₃. Puoi già trascinare i poli con il mouse dentro o fuori da C!',
      formulasLatex: [
        'f : D \\setminus \\{z_1,\\dots,z_n\\} \\to \\mathbb{C} \\text{ olomorfa}',
      ],
      scene: makeResiduesScene({ showCircles: false, showCuts: false }),
    },
    {
      title: '2. Isolamento delle singolarità con circonferenze C_k',
      explanation:
        'Attorno a ciascuna singolarità interna z_k tracciamo una piccola circonferenza C_k (verde) contenuta nell’interno di C, in modo da isolare i poli.',
      formulasLatex: [
        '\\operatorname{Res}(f, z_k) = \\frac{1}{2\\pi i}\\oint_{C_k} f(z)\\,dz',
      ],
      callout: {
        kind: 'note',
        title: 'Significato del residuo',
        body: 'Il residuo di f in z_k è il coefficiente c_{-1} dello sviluppo di Laurent attorno a z_k, ed è uguale a (1 / 2πi) ∮_{C_k} f(z) dz.',
      },
      scene: makeResiduesScene({ showCircles: true, showCuts: false }),
    },
    {
      title: '3. Costruzione dei tagli T_k e del cammino C̃',
      explanation:
        'Colleghiamo il bordo esterno C a ciascuna C_k mediante segmenti T_k (gialli) percorsi due volte in versi opposti. Il cammino complessivo C̃ racchiude una regione senza singolarità.',
      formulasLatex: [
        '\\tilde C = C \\cup \\bigcup_{k=1}^n \\left( T_k \\cup C_k^- \\cup T_k^- \\right)',
        '\\text{Per il Teorema di Cauchy: } \\oint_{\\tilde C} f(z)\\,dz = 0',
      ],
      scene: makeResiduesScene({ showCircles: true, showCuts: true }),
    },
    {
      title: '4. Cancellazione dei tagli T_k',
      explanation:
        'Poiché ogni segmento T_k è percorso in un verso e poi nell’altro, i relativi integrali si elidono esattamente (+∫_{T_k} - ∫_{T_k} = 0), lasciando solo C e le circonferenze C_k.',
      formulasLatex: [
        '\\oint_C f(z)\\,dz = \\sum_{k=1}^n \\left(\\oint_{C_k} f(z)\\,dz + \\int_{T_k} f(z)\\,dz - \\int_{T_k} f(z)\\,dz\\right) = \\sum_{k=1}^n \\oint_{C_k} f(z)\\,dz',
      ],
      scene: makeResiduesScene({ showCircles: true, showCuts: true }),
    },
    {
      title: '5. Sostituzione dei residui e verifica interattiva',
      explanation:
        'Sostituendo ogni integrale su C_k con 2πi · Res(f, z_k) si ottiene la formula. Trascina un polo fuori dal contorno C per vedere che l’integrale su C cambia istantaneamente!',
      formulasLatex: [
        '\\oint_C f(z)\\,dz = 2\\pi i \\sum_{k=1}^{n} \\operatorname{Res}(f, z_k) \\qquad \\square',
      ],
      scene: makeResiduesScene({ showCircles: true, showCuts: true }),
    },
  ],
};
