import { SceneSpec } from '../engine/dsl/types';
import { ProofDefinition } from './types';

function makeSinc2DScene(R: number): SceneSpec {
  return {
    view: '2d',
    range: { x: [-12, 12], y: [-0.4, 1.2], z: [-1, 1] },
    params: [{ name: 'R', value: R, min: 3, max: 40, step: 1, label: 'Estremo R' }],
    objects: [
      {
        kind: 'plot',
        id: 'f',
        expr: '\\operatorname{sinc}(x)',
        color: '#38bdf8',
        visible: true,
      },
      {
        kind: 'point',
        id: 'P0',
        x: 0,
        y: 1,
        label: 'sinc(0) = 1',
        color: '#e5a93c',
        visible: true,
        draggable: false,
      },
    ],
    measures: [
      { label: 'Integrale su [-R, R]', expr: 'integral1D(f, -R, R)' },
      { label: 'Valore limite π', expr: '\\pi' },
    ],
  };
}

function makeSincComplexScene(): SceneSpec {
  return {
    view: 'complex',
    range: { x: [-3.2, 3.2], y: [-1.2, 3.2], z: [-1, 1] },
    params: [],
    objects: [
      {
        kind: 'complexFn',
        id: 'g',
        expr: '\\frac{e^{i z}}{z}',
        visible: true,
        domainColoring: true,
      },
      {
        kind: 'pole',
        id: 'z_0',
        re: 0,
        im: 0,
        label: 'z = 0 (polo)',
        color: '#e5a93c',
        visible: true,
      },
      {
        kind: 'contour',
        id: 'C',
        shape: 'circle',
        cx: 0,
        cy: 1.2,
        rx: 1.8,
        ry: 1.4,
        color: '#f43f5e',
        visible: true,
      },
    ],
    measures: [
      { label: 'Res(e^{iz}/z, 0)', expr: '1' },
      { label: 'Valore principale iπ (parte imm.)', expr: '\\pi' },
    ],
  };
}

export const proof16Sinc: ProofDefinition = {
  id: 'proof-16-sinc',
  number: '16',
  title: 'Seno cardinale',
  block: 3,
  blockLabel: 'Blocco 3: Serie di Fourier',
  lecturer: 'Benini',
  sourceFile: '16 - Seno cardinale.md',
  status: 'ready',
  statementLatex:
    '\\operatorname{sinc}(x) = \\begin{cases} \\dfrac{\\sin(x)}{x}, & x \\neq 0 \\\\[2mm] 1, & x = 0 \\end{cases} \\implies \\int_{-\\infty}^{+\\infty} \\operatorname{sinc}(x)\\,dx = \\pi',
  hypotheses: [
    'sinc(x) prolungata con continuità in x = 0 ponendo sinc(0) = 1',
    'Integrale improprio inteso nel senso del valore principale simmetrico su [-R, R]',
  ],
  steps: [
    {
      title: '1. Esclusione simmetrica dell’origine [-ε, ε]',
      explanation:
        'Aumentando R con lo slider vedi l’integrale di sinc(x) su [-R, R] oscillare attorno a π ≈ 3.1416. Per usare la formula di Eulero separiamo l’intervallo evitando x = 0.',
      formulasLatex: [
        '\\int_{-\\infty}^{+\\infty} \\operatorname{sinc}(x)\\,dx = \\lim_{\\substack{R\\to+\\infty \\\\ \\varepsilon\\to 0^+}} \\int_{[-R,R]\\setminus[-\\varepsilon,\\varepsilon]} \\frac{\\sin(x)}{x}\\,dx',
      ],
      scene: makeSinc2DScene(10),
    },
    {
      title: '2. Riscrittura complessa con formula di Eulero',
      explanation:
        'Scriviamo sin(x) = (e^{ix} - e^{-ix}) / (2i). Senza l’esclusione di [-ε, ε], ciascuno dei due addendi avrebbe una singolarità non integrabile in x = 0.',
      formulasLatex: [
        '= \\lim \\int \\frac{e^{ix} - e^{-ix}}{2ix}\\,dx = \\frac{1}{2i}\\left(\\lim\\int e^{ix}\\frac{1}{x}\\,dx + \\lim\\int e^{-ix}\\left(-\\frac{1}{x}\\right)dx\\right)',
      ],
      scene: makeSinc2DScene(16),
    },
    {
      title: '3. Cambio di variabile y = -x sul secondo integrale',
      explanation:
        'Poiché il dominio [-R, R] \\ [-ε, ε] è simmetrico, la sostituzione y = -x (con dy = -dx) trasforma esattamente il secondo integrale nel primo, raddoppiandolo.',
      formulasLatex: [
        'y = -x,\\; dy = -dx \\implies \\frac{1}{2i}\\left(2\\lim\\int e^{ix}\\frac{1}{x}\\,dx\\right) = \\frac{1}{i}\\lim\\int_{[-R,R]\\setminus[-\\varepsilon,\\varepsilon]} \\frac{e^{ix}}{x}\\,dx',
      ],
      scene: makeSinc2DScene(24),
    },
    {
      title: '4. Valore principale tramite residui e Lemma di Jordan',
      explanation:
        'Passiamo nel piano complesso con f(z) = e^{iz} / z. Sul cammino chiuso formato da [-R,-ε], piccola semicirconferenza attorno a 0, [ε,R] e grande semicirconferenza nel semipiano superiore (che tende a 0 per Jordan), l’unico contributo netto è iπ · Res(e^{iz}/z, 0) = iπ.',
      formulasLatex: [
        '\\lim_{\\substack{R\\to+\\infty \\\\ \\varepsilon\\to 0^+}} \\int_{[-R,R]\\setminus[-\\varepsilon,\\varepsilon]} \\frac{e^{ix}}{x}\\,dx = i\\pi \\cdot \\operatorname{Res}\\left(\\frac{e^{iz}}{z}, 0\\right) = i\\pi',
      ],
      callout: {
        kind: 'note',
        title: 'Segno della semicirconferenza piccola',
        body: 'Aggirando z = 0 nel semipiano superiore da -ε a +ε in senso orario, il contributo della semicirconferenza piccola è -iπ·Res, che portato a destra dà +iπ.',
      },
      scene: makeSincComplexScene(),
    },
    {
      title: '5. Divisione per i e risultato finale π',
      explanation:
        'Dividendo iπ per i si ottiene π. Nella vista 2D con R = 40 l’integrale numerico su [-R, R] si avvicina già a 3.14.',
      formulasLatex: [
        '\\int_{-\\infty}^{+\\infty} \\operatorname{sinc}(x)\\,dx = \\frac{1}{i}\\cdot \\pi i = \\pi \\qquad \\square',
      ],
      scene: makeSinc2DScene(38),
    },
  ],
};
