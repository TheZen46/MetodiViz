import { SceneSpec } from '../engine/dsl/types';
import { ProofDefinition } from './types';

function makeImplicit3DScene(R: number): SceneSpec {
  return {
    view: '3d',
    range: { x: [-2.6, 2.6], y: [-2.6, 2.6], z: [-2.5, 4.5] },
    params: [{ name: 'R', value: R, min: 1.0, max: 2.2, step: 0.1, label: 'Raggio livello R' }],
    objects: [
      {
        kind: 'surface',
        id: 'f',
        expr: 'x^2 + y^2 - R^2',
        color: '#38bdf8',
        visible: true,
      },
      {
        kind: 'curve',
        id: 'livello0',
        xExpr: 'R \\cos(t)',
        yExpr: 'R \\sin(t)',
        zExpr: '0',
        tMin: '0',
        tMax: '2\\pi',
        color: '#e5a93c',
        visible: true,
      },
    ],
    measures: [
      { label: 'Livello R^2', expr: 'R^2' },
    ],
  };
}

function makeImplicit2DScene(R: number, x0: number, showTangent: boolean): SceneSpec {
  const y0 = Math.sqrt(Math.max(0.05, R * R - x0 * x0));
  return {
    view: '2d',
    range: { x: [-2.8, 2.8], y: [-2.6, 2.6], z: [-1, 1] },
    params: [
      { name: 'R', value: R, min: 1.0, max: 2.2, step: 0.1, label: 'Raggio R' },
      { name: 'x0', value: x0, min: -0.9, max: 0.9, step: 0.05, label: 'Punto x₀' },
    ],
    objects: [
      {
        kind: 'curve',
        id: 'cerchio',
        xExpr: 'R \\cos(t)',
        yExpr: 'R \\sin(t)',
        tMin: '0',
        tMax: '2\\pi',
        color: '#64748b',
        visible: true,
      },
      {
        kind: 'plot',
        id: 'g_ramo',
        expr: '\\sqrt{R^2 - x^2}',
        color: '#38bdf8',
        visible: true,
      },
      ...(showTangent
        ? [
            {
              kind: 'plot' as const,
              id: 'tangente',
              expr: '\\sqrt{R^2 - x0^2} - \\frac{x0}{\\sqrt{R^2 - x0^2}}(x - x0)',
              color: '#e5a93c',
              visible: true,
              dashed: true,
            },
          ]
        : []),
      {
        kind: 'point',
        id: 'P0',
        x: x0,
        y: Number(y0.toFixed(2)),
        label: '(x₀, y₀)',
        color: '#e5a93c',
        visible: true,
        draggable: false,
      },
    ],
    measures: [
      { label: '∂_y f(x₀, y₀)', expr: '2 \\sqrt{R^2 - x0^2}' },
      { label: "g'(x₀) = -∂_x f / ∂_y f", expr: '-\\frac{x0}{\\sqrt{R^2 - x0^2}}' },
    ],
  };
}

export const proof06Implicit: ProofDefinition = {
  id: 'proof-06-implicit',
  number: '06',
  title: 'Teorema della funzione implicita',
  block: 1,
  blockLabel: 'Blocco 1: Calcolo Differenziale in ℝⁿ',
  lecturer: 'Pinamonti',
  sourceFile: '06 - Teorema della funzione implicita.md',
  status: 'ready',
  statementLatex:
    'f \\in C^2(A),\\; f(x_0, y_0) = a,\\; \\nabla f(x_0, y_0) \\neq 0 \\implies \\{(x,y) \\in B \\mid f(x,y) = a\\} = \\{(x, g(x)) \\mid x \\in I\\}',
  hypotheses: [
    'f : A ⊂ ℝ² → ℝ di classe C² su A (a tratti)',
    'Punto (x₀, y₀) ∈ A con f(x₀, y₀) = a e ∂_y f(x₀, y₀) ≠ 0 (o ∂_x f ≠ 0 per g̃(y))',
  ],
  steps: [
    {
      title: '1. Insieme di livello come grafico locale',
      explanation:
        'Consideriamo la superficie f(x,y) = x² + y² - R² e la curva di livello f(x,y) = 0 (circonferenza in ocra). Vicino a un punto con ∂_y f ≠ 0 il luogo di livello coincide localmente con il grafico di una funzione y = g(x).',
      formulasLatex: [
        '\\partial_y f(x_0, y_0) \\neq 0 \\implies \\exists g : I \\to \\mathbb{R},\\; \\{(x,y)\\in B \\mid f(x,y)=a\\} = \\{(x, g(x)) \\mid x\\in I\\}',
      ],
      callout: {
        kind: 'note',
        title: 'Grafico e non valore',
        body: 'L’insieme di livello coincide in un intorno B con il grafico di g(x) (oppure di g̃(y) se ∂_x f ≠ 0). Attiva "Sezione z=c" nella vista 3D per esplorare le curve di livello.',
      },
      scene: makeImplicit3DScene(1.5),
    },
    {
      title: '2. Permanenza del segno per ∂_y f',
      explanation:
        'Poiché f ∈ C² la derivata parziale ∂_y f è continua. Essendo ∂_y f(x₀, y₀) ≠ 0, per il teorema della permanenza del segno esiste un intorno B((x₀, y₀), r) in cui ∂_y f non si annulla mai.',
      formulasLatex: [
        '\\exists r > 0 : \\quad \\partial_y f(x, y) \\neq 0 \\quad \\forall (x, y) \\in B((x_0, y_0), r)',
      ],
      scene: makeImplicit2DScene(1.5, 0.5, false),
    },
    {
      title: '3. Derivazione lungo la curva con la regola della catena',
      explanation:
        'Se g : I → ℝ soddisfa f(x, g(x)) = a per ogni x ∈ I, derivando entrambi i membri rispetto a x tramite la regola della catena si ottiene l’identità differenziale che lega g\' alle derivate parziali di f.',
      formulasLatex: [
        '\\forall x \\in I: \\quad \\partial_x f(x, g(x)) + \\partial_y f(x, g(x)) \\cdot g\'(x) = 0',
      ],
      scene: makeImplicit2DScene(1.5, 0.5, true),
    },
    {
      title: '4. Riduzione a un problema di Cauchy',
      explanation:
        'Poiché ∂_y f ≠ 0 dentro B, possiamo dividere per ∂_y f e trasformare la condizione implicita in una equazione differenziale ordinaria del primo ordine con dato iniziale g(x₀) = y₀.',
      formulasLatex: [
        '\\begin{cases} g\'(x) = -\\dfrac{\\partial_x f(x, g(x))}{\\partial_y f(x, g(x))} \\\\[2mm] g(x_0) = y_0 \\end{cases}',
      ],
      scene: makeImplicit2DScene(1.5, -0.4, true),
    },
    {
      title: '5. Esistenza, unicità (Cauchy-Lipschitz) e classe C²',
      explanation:
        'Essendo f ∈ C², il secondo membro è di classe C¹ su B, quindi localmente lipschitziano rispetto a g: il teorema di Cauchy-Lipschitz assicura un’unica soluzione locale g su I = (x₀ - δ, x₀ + δ). Poiché g\' è composizione di funzioni C¹, g risulta di classe C².',
      formulasLatex: [
        'g\' \\in C^1(I) \\implies g \\in C^2(I) \\qquad \\square',
      ],
      callout: {
        kind: 'note',
        title: 'Struttura logica per l’orale',
        body: 'Ricorda i 4 passi: permanenza del segno su ∂_y f -> regola della catena -> problema di Cauchy -> Cauchy-Lipschitz + bootstrap di regolarità a C².',
      },
      scene: makeImplicit2DScene(1.5, 0.65, true),
    },
  ],
};
