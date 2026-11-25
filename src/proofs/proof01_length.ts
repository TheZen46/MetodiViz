import { SceneSpec } from '../engine/dsl/types';
import { ProofDefinition } from './types';

function makeLengthScene(opts: {
  N: number;
  c: number;
  s: number;
  showPolygonal: boolean;
  showTangent: boolean;
}): SceneSpec {
  return {
    view: '3d',
    range: { x: [-2, 2], y: [-2, 2], z: [0, 3.5] },
    params: [
      { name: 'N', value: opts.N, min: 2, max: 60, step: 1, label: 'Suddivisioni N' },
      { name: 'c', value: opts.c, min: 0, max: 0.5, step: 0.05, label: 'Passo elica c' },
      { name: 's', value: opts.s, min: 0, max: 12.5, step: 0.1, label: 'Punto s' },
    ],
    objects: [
      {
        kind: 'curve',
        id: 'gamma',
        xExpr: '\\cos(t)',
        yExpr: '\\sin(t)',
        zExpr: 'c \\cdot t',
        tMin: '0',
        tMax: '4\\pi',
        color: '#38bdf8',
        visible: true,
        showTangentAtParam: 's',
      },
      {
        kind: 'polygonal',
        id: 'P',
        curveId: 'gamma',
        segmentsExpr: 'N',
        color: '#f59e0b',
        visible: opts.showPolygonal,
      },
    ],
    measures: [
      { label: 'Lunghezza poligonale L(P)', expr: 'length(P)' },
      { label: 'Integrale ∫|φ\'(t)|dt', expr: 'exactLength(gamma)' },
    ],
    overlay: {
      mode: 'length',
      showTangentVector: opts.showTangent,
    },
  };
}

export const proof01Length: ProofDefinition = {
  id: 'proof-01-length',
  number: '01',
  title: 'Rettificabilità e lunghezza di una curva',
  block: 2,
  blockLabel: 'Blocco 2: Curve, Superfici e Integrali',
  lecturer: 'Pinamonti',
  sourceFile: '01 - Rettificabilitá e lunghezza di una curva.md',
  status: 'ready',
  statementLatex:
    '\\text{Sia } \\gamma \\text{ parametrizzata da } \\varphi : [a,b] \\to \\mathbb{R}^n \\text{ con } \\varphi \\in C^1([a,b]). \\quad L(\\gamma) = \\sup_{P} L(P) = \\int_a^b |\\varphi\'(t)|\\,dt',
  hypotheses: [
    'Curva parametrizzata su intervallo chiuso e limitato [a, b]',
    'Regolarità φ ∈ C¹([a, b]) (necessaria per applicare Heine-Cantor a φ\')',
  ],
  steps: [
    {
      title: '1. Definizione di poligonale e rettificabilità',
      explanation:
        'Consideriamo una partizione π = {t₀, …, t_N} di [a, b] e la poligonale inscritta P (in arancione). Aumentando N con lo slider, L(P) cresce e si avvicina alla lunghezza della curva.',
      formulasLatex: [
        'L(P) = \\sum_{i=1}^{N} |\\varphi(t_i) - \\varphi(t_{i-1})|, \\qquad L(\\gamma) = \\sup_{P} L(P)',
      ],
      scene: makeLengthScene({ N: 5, c: 0.25, s: 2.0, showPolygonal: true, showTangent: false }),
    },
    {
      title: '2. Stima dall’alto tramite Teorema Fondamentale del Calcolo',
      explanation:
        'Scriviamo ogni corda φ(t_i) - φ(t_{i-1}) come integrale di φ\'(t) sul sotto-intervallo e applichiamo la disuguaglianza triangolare per gli integrali.',
      formulasLatex: [
        'L(P) = \\sum_{i=1}^{N} \\left| \\int_{t_{i-1}}^{t_i} \\varphi\'(t)\\,dt \\right| \\le \\sum_{i=1}^{N} \\int_{t_{i-1}}^{t_i} |\\varphi\'(t)|\\,dt = \\int_a^b |\\varphi\'(t)|\\,dt',
        '\\implies L(\\gamma) = \\sup_P L(P) \\le \\int_a^b |\\varphi\'(t)|\\,dt',
      ],
      callout: {
        kind: 'warning',
        title: 'Ipotesi C¹ essenziale',
        body: 'Questa prima stima prova subito che ogni curva C¹ su [a,b] è rettificabile (L(γ) < +∞). La continuità di φ\' sarà poi indispensabile per la stima dal basso.',
      },
      scene: makeLengthScene({ N: 12, c: 0.25, s: 3.1, showPolygonal: true, showTangent: true }),
    },
    {
      title: '3. Continuità uniforme di φ\' (Heine-Cantor)',
      explanation:
        'Poiché φ\' è continua sul compatto [a, b], per il teorema di Heine-Cantor è uniformemente continua: fissato ε > 0 esiste δ_ε > 0 tale che su ogni sotto-intervallo più stretto di δ_ε il vettore tangente φ\'(t) oscilla meno di ε.',
      formulasLatex: [
        '\\forall \\varepsilon > 0 \\;\\; \\exists \\delta_\\varepsilon > 0 \\;\\; \\forall s,t \\in [a,b]: \\quad |s - t| < \\delta_\\varepsilon \\implies |\\varphi\'(s) - \\varphi\'(t)| < \\varepsilon',
      ],
      scene: makeLengthScene({ N: 20, c: 0.25, s: 4.5, showPolygonal: true, showTangent: true }),
    },
    {
      title: '4. Aggiungi e togli φ\'(s) sull’intervallo fine',
      explanation:
        'Scegliamo una partizione abbastanza fine (t_i - t_{i-1} < δ_ε) e in ogni tratto [t_{i-1}, t_i] fissiamo s. Isoliamo il termine costante φ\'(s)(t_i - t_{i-1}) rispetto alla corda.',
      formulasLatex: [
        '\\varphi(t_i) - \\varphi(t_{i-1}) = \\int_{t_{i-1}}^{t_i} (\\varphi\'(t) - \\varphi\'(s))\\,dt + \\varphi\'(s)(t_i - t_{i-1})',
        '|\\varphi\'(s)|\\,(t_i - t_{i-1}) \\le |\\varphi(t_i) - \\varphi(t_{i-1})| + \\varepsilon\\,(t_i - t_{i-1})',
      ],
      scene: makeLengthScene({ N: 28, c: 0.25, s: 6.2, showPolygonal: true, showTangent: true }),
    },
    {
      title: '5. Stima dal basso e arbitrarietà di ε',
      explanation:
        'Integriamo rispetto ad s su ogni sotto-intervallo e sommiamo su i = 1, …, N. Otteniamo l’integrale di |φ\'| maggiorato da L(γ) + ε(b - a).',
      formulasLatex: [
        '\\int_a^b |\\varphi\'(s)|\\,ds \\le L(P) + \\varepsilon(b-a) \\le L(\\gamma) + \\varepsilon(b-a)',
        '\\text{Per } \\varepsilon \\to 0^+: \\quad \\int_a^b |\\varphi\'(s)|\\,ds \\le L(\\gamma)',
      ],
      callout: {
        kind: 'note',
        title: 'Dettaglio da ricordare all’orale',
        body: 'L(P) + ε(b-a) ≤ L(γ) + ε(b-a), NON ≤ L(γ)! Il passaggio finale a ≤ L(γ) avviene solo grazie all’arbitrarietà di ε > 0.',
      },
      scene: makeLengthScene({ N: 40, c: 0.25, s: 7.5, showPolygonal: true, showTangent: true }),
    },
    {
      title: '6. Conclusione: coincidenza delle due stime',
      explanation:
        'Unendo la stima dall’alto (step 2) e la stima dal basso (step 5) segue l’uguaglianza esatta tra estremo superiore delle poligonali e integrale della norma della velocità.',
      formulasLatex: [
        '\\int_a^b |\\varphi\'(s)|\\,ds \\le L(\\gamma) \\le \\int_a^b |\\varphi\'(s)|\\,ds \\implies L(\\gamma) = \\int_a^b |\\varphi\'(t)|\\,dt \\qquad \\square',
      ],
      scene: makeLengthScene({ N: 55, c: 0.25, s: 9.0, showPolygonal: true, showTangent: true }),
    },
  ],
};
