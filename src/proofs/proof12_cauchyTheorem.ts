import { SceneSpec } from '../engine/dsl/types';
import { ProofDefinition } from './types';

function makeCauchyTheoremScene(): SceneSpec {
  return {
    view: 'complex',
    range: { x: [-3.0, 3.0], y: [-2.4, 2.4], z: [-1, 1] },
    params: [],
    objects: [
      {
        kind: 'complexFn',
        id: 'f',
        expr: 'e^{0.4 z} + 0.3 z^2',
        visible: true,
        domainColoring: true,
      },
      {
        kind: 'contour',
        id: 'C',
        shape: 'ellipse',
        cx: 0,
        cy: 0,
        rx: 1.8,
        ry: 1.3,
        color: '#e5a93c',
        visible: true,
      },
    ],
    measures: [
      { label: 'Integrale ∮_C f(z)dz', expr: 'contourIntegral(C)' },
    ],
  };
}

export const proof12CauchyTheorem: ProofDefinition = {
  id: 'proof-12-cauchy-theorem',
  number: '12',
  title: 'Teorema di Cauchy',
  block: 4,
  blockLabel: 'Blocco 4: Analisi Complessa',
  lecturer: 'Benini',
  sourceFile: '12 - Teorema di Cauchy.md',
  status: 'ready',
  statementLatex:
    'f : D \\subset \\mathbb{C} \\to \\mathbb{C} \\text{ olomorfa},\\; C \\text{ chiusa e } A_C \\cup C \\subset D \\implies \\oint_C f(z)\\,dz = 0',
  hypotheses: [
    'f olomorfa su D aperto (e con parte reale u e immaginaria v di classe C¹ per applicare Gauss-Green)',
    'Curva chiusa C e tutta la sua regione interna A_C contenute in D (nessuna singolarità interna)',
  ],
  steps: [
    {
      title: '1. Parametrizzazione γ(η) = x(η) + iy(η) del contorno C',
      explanation:
        'Sia γ : [a, b] → D una parametrizzazione di C. Scrivendo f(z) = u(x,y) + i v(x,y), esprimiamo l’integrale complesso come integrale reale su [a, b].',
      formulasLatex: [
        '\\int_C f(z)\\,dz = \\int_a^b [u(\\gamma(\\eta)) + i v(\\gamma(\\eta))]\\,(x\'(\\eta) + i y\'(\\eta))\\,d\\eta',
      ],
      scene: makeCauchyTheoremScene(),
    },
    {
      title: '2. Separazione in parte reale e parte immaginaria',
      explanation:
        'Sviluppando il prodotto e riconoscendo x\'(η)dη = dx e y\'(η)dη = dy, l’integrale diventa una combinazione di due integrali di linea su C.',
      formulasLatex: [
        '= \\left(\\int_C u\\,dx - \\int_C v\\,dy\\right) + i\\left(\\int_C v\\,dx + \\int_C u\\,dy\\right)',
      ],
      scene: makeCauchyTheoremScene(),
    },
    {
      title: '3. Applicazione di Gauss-Green su A_C',
      explanation:
        'Usando ∫_C (P dx + Q dy) = ∬_{A_C} (Q_x - P_y) dx dy con (P, Q) = (u, -v) per la parte reale e (P, Q) = (v, u) per la parte immaginaria.',
      formulasLatex: [
        '= -\\iint_{A_C} (u_y + v_x)\\,dx\\,dy + i\\iint_{A_C} (u_x - v_y)\\,dx\\,dy',
      ],
      callout: {
        kind: 'note',
        title: 'Ipotesi C¹ per Gauss-Green',
        body: 'Questa dimostrazione richiede u, v ∈ C¹ su A_C ∪ C (nel caso generale, il teorema di Goursat elimina l’ipotesi di continuità della derivata).',
      },
      scene: makeCauchyTheoremScene(),
    },
    {
      title: '4. Sostituzione delle condizioni di Cauchy-Riemann',
      explanation:
        'Poiché f è olomorfa su tutto A_C ⊂ D, valgono ovunque u_x = v_y e v_x = -u_y: entrambi gli integrandi si annullano identicamente.',
      formulasLatex: [
        'u_y + v_x = u_y - u_y = 0, \\qquad u_x - v_y = u_x - u_x = 0',
      ],
      scene: makeCauchyTheoremScene(),
    },
    {
      title: '5. Conclusione e verifica sul contorno mobile',
      explanation:
        'Sposta o ridimensiona il contorno C sul grafico complesso: finché f non ha singolarità dentro C, l’integrale calcolato numericamente resta 0.000 + 0.000i.',
      formulasLatex: [
        '\\oint_C f(z)\\,dz = 0 \\qquad \\square',
      ],
      scene: makeCauchyTheoremScene(),
    },
  ],
};
