import { SceneSpec } from '../engine/dsl/types';
import { ProofDefinition } from './types';

function makeCauchyFormulaScene(opts: { showCircles: boolean; showCuts: boolean }): SceneSpec {
  return {
    view: 'complex',
    range: { x: [-3.0, 3.0], y: [-2.4, 2.4], z: [-1, 1] },
    params: [],
    objects: [
      {
        kind: 'complexFn',
        id: 'integrand',
        expr: '\\frac{e^{0.4 z}}{z - z_0}',
        visible: true,
        domainColoring: true,
      },
      {
        kind: 'contour',
        id: 'C',
        shape: 'ellipse',
        cx: 0,
        cy: 0,
        rx: 2.1,
        ry: 1.5,
        color: '#f43f5e',
        visible: true,
      },
      {
        kind: 'pole',
        id: 'z_0',
        re: 0.5,
        im: 0.3,
        label: 'z₀',
        color: '#22c55e',
        visible: true,
      },
    ],
    measures: [
      { label: '(1/2πi) ∮_C f(z)/(z-z₀) dz', expr: 'cauchyFormula(C)' },
      { label: '∮_C f(z)/(z-z₀) dz', expr: 'contourIntegral(C)' },
    ],
    overlay: {
      mode: 'residues',
      showCircles: opts.showCircles,
      showCuts: opts.showCuts,
    },
  };
}

export const proof13CauchyFormula: ProofDefinition = {
  id: 'proof-13-cauchy-formula',
  number: '13',
  title: 'Formula integrale di Cauchy',
  block: 4,
  blockLabel: 'Blocco 4: Analisi Complessa',
  lecturer: 'Benini',
  sourceFile: '13 - Formula integrale di Cauchy.md',
  status: 'ready',
  statementLatex:
    'f : D \\subset \\mathbb{C} \\to \\mathbb{C} \\text{ olomorfa},\\; z_0 \\text{ interno a } C \\subset D \\implies f(z_0) = \\frac{1}{2\\pi i}\\oint_C \\frac{f(z)}{z - z_0}\\,dz',
  hypotheses: [
    'D semplicemente connesso e f olomorfa su tutto D',
    'C curva chiusa semplice in D (verso antiorario) e z₀ interno a C',
  ],
  steps: [
    {
      title: '1. Singolarità in z₀ per il quoziente f(z) / (z - z₀)',
      explanation:
        'Sebbene f sia olomorfa su tutto D, la funzione z ↦ f(z)/(z - z₀) è olomorfa su D \\ {z₀} e presenta una singolarità in z₀. Trascina z₀ dentro o fuori da C per osservarne l’effetto.',
      formulasLatex: [
        'z \\mapsto \\frac{f(z)}{z - z_0} \\text{ è olomorfa su } D \\setminus \\{z_0\\}',
      ],
      callout: {
        kind: 'warning',
        title: 'Ipotesi di olomorfia',
        body: 'Perché il teorema valga è indispensabile che f sia olomorfa su tutto D (non basta su D \\ {z₀}).',
      },
      scene: makeCauchyFormulaScene({ showCircles: false, showCuts: false }),
    },
    {
      title: '2. Circonferenza C₀ di raggio δ e cammino tagliato C̃',
      explanation:
        'Attorno a z₀ tracciamo una circonferenza C₀(η) = z₀ + δ e^{iη} (verde) e colleghiamo C a C₀ con un taglio T (giallo), costruendo C̃ = C * T * C₀⁻ * T⁻ che esclude z₀.',
      formulasLatex: [
        'C_0 : \\eta \\mapsto z_0 + \\delta e^{i\\eta}, \\qquad \\tilde C = C * T * C_0^- * T^-',
      ],
      scene: makeCauchyFormulaScene({ showCircles: true, showCuts: true }),
    },
    {
      title: '3. Teorema di Cauchy su C̃ e indipendenza da δ',
      explanation:
        'Su C̃ la funzione f(z)/(z - z₀) è olomorfa dentro la regione delimitata, quindi l’integrale su C̃ è 0. I due passaggi opposti lungo T si elidono e resta l’uguaglianza tra C e C₀.',
      formulasLatex: [
        '\\oint_{\\tilde C} \\frac{f(z)}{z - z_0}\\,dz = 0 \\implies \\oint_C \\frac{f(z)}{z - z_0}\\,dz = \\oint_{C_0} \\frac{f(z)}{z - z_0}\\,dz',
      ],
      scene: makeCauchyFormulaScene({ showCircles: true, showCuts: true }),
    },
    {
      title: '4. Sostituzione parametrica su C₀ e sottrazione di 2πi f(z₀)',
      explanation:
        'Su C₀ si ha z - z₀ = δ e^{iη} e dz = i δ e^{iη} dη: il fattore δ e^{iη} si cancella esattamente! Sottraendo 2πi f(z₀) = i ∫_0^{2π} f(z₀) dη isoliamo la differenza f(z₀ + δ e^{iη}) - f(z₀).',
      formulasLatex: [
        '\\oint_C \\frac{f(z)}{z - z_0}\\,dz - 2\\pi i f(z_0) = i\\int_0^{2\\pi} \\big(f(z_0 + \\delta e^{i\\eta}) - f(z_0)\\big)\\,d\\eta',
      ],
      scene: makeCauchyFormulaScene({ showCircles: true, showCuts: false }),
    },
    {
      title: '5. Continuità di f in z₀ e conclusione',
      explanation:
        'Poiché f è continua in z₀, fissato ε > 0 possiamo prendere δ abbastanza piccolo da avere |f(z) - f(z₀)| ≤ ε su C₀. Essendo il primo membro indipendente da δ, esso vale 0 per l’arbitrarietà di ε.',
      formulasLatex: [
        '\\left|\\oint_C \\frac{f(z)}{z - z_0}\\,dz - 2\\pi i f(z_0)\\right| \\le 2\\pi\\varepsilon \\quad \\forall\\varepsilon > 0 \\implies f(z_0) = \\frac{1}{2\\pi i}\\oint_C \\frac{f(z)}{z - z_0}\\,dz \\qquad \\square',
      ],
      scene: makeCauchyFormulaScene({ showCircles: true, showCuts: false }),
    },
  ],
};
