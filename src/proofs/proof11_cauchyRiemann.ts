import { SceneSpec } from '../engine/dsl/types';
import { ProofDefinition } from './types';

function makeCRScene(x0: number, y0: number): SceneSpec {
  return {
    view: 'complex',
    range: { x: [-2.6, 2.6], y: [-2.2, 2.2], z: [-1, 1] },
    params: [
      { name: 'x0', value: x0, min: -1.8, max: 1.8, step: 0.1, label: 'Ascissa x₀' },
      { name: 'y0', value: y0, min: -1.5, max: 1.5, step: 0.1, label: 'Ordinata y₀' },
    ],
    objects: [
      {
        kind: 'complexFn',
        id: 'f',
        expr: 'z^2',
        visible: true,
        domainColoring: true,
      },
      {
        kind: 'pole',
        id: 'z_0',
        re: x0,
        im: y0,
        label: 'z₀',
        color: '#e5a93c',
        visible: true,
      },
    ],
    measures: [
      { label: 'u_x = v_y (per z²: 2x₀)', expr: '2 * x0' },
      { label: 'u_y = -v_x (per z²: -2y₀)', expr: '-2 * y0' },
      { label: 'f(z₀) = z₀²', expr: 'evalComplexAt(f, x0, y0)' },
    ],
  };
}

export const proof11CauchyRiemann: ProofDefinition = {
  id: 'proof-11-cauchy-riemann',
  number: '11',
  title: 'Condizioni di Cauchy-Riemann',
  block: 4,
  blockLabel: 'Blocco 4: Analisi Complessa',
  lecturer: 'Benini',
  sourceFile: '11 - Condizioni di Cauchy-Riemann.md',
  status: 'ready',
  statementLatex:
    'f(x+iy) = u(x,y) + iv(x,y) \\text{ derivabile in } z_0 \\iff u, v \\text{ differenziabili e } \\begin{cases} u_x = v_y \\\\ u_y = -v_x \\end{cases}',
  hypotheses: [
    'f : D ⊂ ℂ → ℂ scritta tramite parte reale u(x, y) e immaginaria v(x, y)',
    'Punto interno z₀ = x₀ + iy₀ ∈ D',
  ],
  steps: [
    {
      title: '1. Parte 1 (necessità): esistenza di f\'(z₀) e due direzioni',
      explanation:
        'Se esiste il limite complesso f\'(z₀), esso deve dare lo stesso risultato avvicinandosi lungo l’asse reale (z = z₀ + h) e lungo l’asse immaginario (z = z₀ + ih).',
      formulasLatex: [
        '\\exists f\'(z_0) = \\lim_{z\\to z_0} \\frac{f(z) - f(z_0)}{z - z_0} \\in \\mathbb{C}',
      ],
      scene: makeCRScene(0.8, 0.5),
    },
    {
      title: '2. Restrizione reale z = z₀ + h e restrizione immaginaria z = z₀ + ih',
      explanation:
        'Lungo z₀ + h si ricava u_x + i v_x; lungo z₀ + ih, usando 1/i = -i, si ricava v_y - i u_y. Uguagliando parte reale e immaginaria seguono le condizioni di Cauchy-Riemann.',
      formulasLatex: [
        'f\'(z_0) = u_x(x_0, y_0) + i v_x(x_0, y_0) = v_y(x_0, y_0) - i u_y(x_0, y_0)',
        '\\implies u_x = v_y \\quad \\text{e} \\quad u_y = -v_x',
      ],
      callout: {
        kind: 'note',
        title: 'Passaggio algebrico chiave',
        body: 'Dividendo u(x₀, y₀+h) - u(x₀, y₀) per ih si usa 1/i = -i, mentre nella frazione di v la i al numeratore e al denominatore si semplifica.',
      },
      scene: makeCRScene(0.8, 0.5),
    },
    {
      title: '3. Parte 2 (sufficienza): ipotesi di differenziabilità + C.R.',
      explanation:
        'Viceversa, supponiamo u e v differenziabili in (x₀, y₀) e che valgano u_x = v_y e u_y = -v_x. Sviluppiamo f(z) - f(z₀) fino al resto o(|z - z₀|).',
      formulasLatex: [
        'u(x,y) - u(x_0, y_0) = u_x(x - x_0) + u_y(y - y_0) + o(|z - z_0|)',
        'v(x,y) - v(x_0, y_0) = -u_y(x - x_0) + u_x(y - y_0) + o(|z - z_0|)',
      ],
      scene: makeCRScene(-0.7, 0.9),
    },
    {
      title: '4. Raccolta del fattore (z - z₀) = (x - x₀) + i(y - y₀)',
      explanation:
        'Sommando u + iv e raccogliendo (u_x - i u_y), i coefficienti di (x - x₀) e i(y - y₀) diventano identici grazie alle condizioni di Cauchy-Riemann.',
      formulasLatex: [
        'f(z) - f(z_0) = [u_x - i u_y]\\cdot[(x - x_0) + i(y - y_0)] + o(|z - z_0|) = [u_x - i u_y](z - z_0) + o(|z - z_0|)',
      ],
      scene: makeCRScene(-0.7, 0.9),
    },
    {
      title: '5. Rapporto incrementale e limite per z → z₀',
      explanation:
        'Dividendo per (z - z₀) e passando al limite z → z₀, il termine o(|z - z₀|)/(z - z₀) tende a 0: esiste dunque f\'(z₀) = u_x + i v_x.',
      formulasLatex: [
        '\\lim_{z\\to z_0}\\frac{f(z) - f(z_0)}{z - z_0} = u_x(x_0, y_0) + i v_x(x_0, y_0) = f\'(z_0) \\qquad \\square',
      ],
      scene: makeCRScene(1.0, 0.4),
    },
  ],
};
