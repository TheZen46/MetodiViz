import { SceneSpec } from '../engine/dsl/types';
import { ProofDefinition } from './types';

function makeDivergenceScene(k: number, showHeatmap: boolean): SceneSpec {
  return {
    view: '2d',
    range: { x: [-0.5, 4.2], y: [-0.2, 3.6], z: [-1, 1] },
    params: [{ name: 'k', value: k, min: 0.2, max: 2.0, step: 0.1, label: 'Sorgente div k' }],
    objects: [
      {
        kind: 'vectorfield',
        id: 'F',
        fxExpr: 'k \\cdot x + 0.15 y^2',
        fyExpr: 'k \\cdot y - 0.1 x^2',
        color: '#38bdf8',
        visible: true,
        showCurlHeatmap: showHeatmap,
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
      { label: 'Flusso ∫_∂D F·n ds', expr: 'divergenceFlux(D)' },
      { label: 'Doppio ∬_D (∇·F) dx dy', expr: 'divergenceDouble(D)' },
    ],
  };
}

export const proof04Divergence2d: ProofDefinition = {
  id: 'proof-04-divergence-2d',
  number: '04',
  title: 'Divergenza in 2D',
  block: 2,
  blockLabel: 'Blocco 2: Curve, Superfici e Integrali',
  lecturer: 'Pinamonti',
  sourceFile: '04 - Divergenza in 2D.md',
  status: 'ready',
  statementLatex:
    '\\iint_{\\bar D} (\\nabla \\cdot F)\\,dx\\,dy = \\int_{\\partial D} F \\cdot \\underline{n}\\,ds',
  hypotheses: [
    'D ⊂ ℝ² dominio regolare con bordo ∂D regolare a tratti percorso in verso antiorario',
    'Campo F = (F₁, F₂) ∈ C¹(D̄)',
    'n̲ versore normale uscente dal bordo ∂D',
  ],
  steps: [
    {
      title: '1. Significato fisico: flusso uscente e sorgenti',
      explanation:
        'Il teorema afferma che il flusso netto di F uscente attraverso il bordo ∂D è uguale all’integrale della divergenza ∂_x F₁ + ∂_y F₂ su D. Clicca sul campo per tracciare linee di flusso uscenti.',
      formulasLatex: [
        '\\iint_{\\bar D} \\nabla \\cdot F\\,dx\\,dy = \\iint_{\\bar D} (\\partial_x F_1 + \\partial_y F_2)\\,dx\\,dy',
      ],
      scene: makeDivergenceScene(1.0, false),
    },
    {
      title: '2. Campo ausiliario ruotato G = (-F₂, F₁)',
      explanation:
        'Introduciamo un campo G definito scambiando le componenti di F con un segno meno. In questo modo la divergenza di F coincide esattamente con il rotore scalare di G!',
      formulasLatex: [
        'G = (G_1, G_2) = (-F_2, F_1) \\implies \\partial_x G_2 - \\partial_y G_1 = \\partial_x F_1 + \\partial_y F_2',
      ],
      scene: makeDivergenceScene(1.0, false),
    },
    {
      title: '3. Applicazione della formula di Gauss-Green a G',
      explanation:
        'Applicando il teorema di Gauss-Green al campo G su D, trasformiamo l’integrale doppio nella circuitazione di G lungo ∂D percorso in senso antiorario.',
      formulasLatex: [
        '\\iint_{\\bar D} (\\partial_x G_2 - \\partial_y G_1)\\,dx\\,dy = \\int_{\\partial D} G\\,dP',
      ],
      scene: makeDivergenceScene(1.2, false),
    },
    {
      title: '4. Parametrizzazione in ascissa curvilinea e normale uscente',
      explanation:
        'Parametrizzando il bordo con l’ascissa curvilinea s (così |φ\'(s)| = 1), φ\'(s) = (x\'(s), y\'(s)) è il versore tangente t̂. Ruotando t̂ di -π/2 (senso orario) otteniamo la normale uscente n̲ = (y\'(s), -x\'(s)).',
      formulasLatex: [
        '\\hat t = \\varphi\'(s) = (x\'(s), y\'(s)), \\qquad \\underline{n} = R_0^{-\\pi/2}(\\hat t) = (y\'(s), -x\'(s))',
      ],
      callout: {
        kind: 'warning',
        title: 'Verso della rotazione e parametro s',
        body: 'Con bordo antiorario, la normale uscente si ottiene ruotando t̂ in senso orario (-π/2). Inoltre s deve essere l’ascissa curvilinea affinché t̂ e n̲ siano versori unitari.',
      },
      scene: makeDivergenceScene(1.2, false),
    },
    {
      title: '5. Sostituzione finale nel prodotto scalare',
      explanation:
        'Esplicitando G · φ\'(s) otteniamo proprio F · n̲: la circuitazione di G coincide con il flusso uscente di F. Verifica i due numeri identici nella barra in basso.',
      formulasLatex: [
        '\\int_a^b (-F_2 x\'(s) + F_1 y\'(s))\\,ds = \\int_a^b (F_1, F_2)\\cdot(y\'(s), -x\'(s))\\,ds = \\int_{\\partial D} F\\cdot\\underline{n}\\,ds \\qquad \\square',
      ],
      scene: makeDivergenceScene(1.4, false),
    },
  ],
};
