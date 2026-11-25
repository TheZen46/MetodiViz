import { SceneSpec } from '../engine/dsl/types';
import { ProofDefinition } from './types';

function makeJordanComplexScene(rho: number, a: number): SceneSpec {
  return {
    view: 'complex',
    range: { x: [-4.5, 4.5], y: [-0.8, 4.8], z: [-1, 1] },
    params: [
      { name: 'rho', value: rho, min: 1.5, max: 12.0, step: 0.5, label: 'Raggio ρ' },
      { name: 'a', value: a, min: 0.4, max: 2.5, step: 0.1, label: 'Parametro a > 0' },
    ],
    objects: [
      {
        kind: 'complexFn',
        id: 'f',
        expr: '\\frac{e^{i a z}}{z^2 + 1}',
        visible: true,
        domainColoring: true,
      },
      {
        kind: 'pole',
        id: 'z_p',
        re: 0,
        im: 1,
        label: 'i (polo)',
        color: '#e5a93c',
        visible: true,
      },
    ],
    measures: [
      { label: '|∫_Γρ e^{iaz}g(z)dz|', expr: 'jordanArcAbs(\\rho)' },
      { label: 'Stima π/(a(ρ²-1))·(1-e^{-aρ})', expr: '\\frac{\\pi}{a(\\rho^2 - 1)}(1 - e^{-a\\rho})' },
    ],
  };
}

function makeJordanInequalityScene(): SceneSpec {
  return {
    view: '2d',
    range: { x: [-0.2, 1.8], y: [-0.2, 1.25], z: [-1, 1] },
    params: [],
    objects: [
      {
        kind: 'plot',
        id: 'seno',
        expr: '\\sin(x)',
        color: '#38bdf8',
        visible: true,
      },
      {
        kind: 'plot',
        id: 'corda',
        expr: '\\frac{2}{\\pi} x',
        color: '#e5a93c',
        visible: true,
        dashed: true,
      },
      {
        kind: 'point',
        id: 'estremo',
        x: 1.57,
        y: 1,
        label: '(π/2, 1)',
        color: '#4ade80',
        visible: true,
        draggable: false,
      },
    ],
    measures: [
      { label: 'Valore in π/4: sin(π/4)', expr: '\\sin(\\pi / 4)' },
      { label: 'Corda (2/π)·(π/4) = 0.5', expr: '0.5' },
    ],
  };
}

export const proof15Jordan: ProofDefinition = {
  id: 'proof-15-jordan',
  number: '15',
  title: 'Lemma di Jordan',
  block: 4,
  blockLabel: 'Blocco 4: Analisi Complessa',
  lecturer: 'Benini',
  sourceFile: '15 - Lemma di Jordan.md',
  status: 'ready',
  statementLatex:
    '|g(z)| \\le G(|z|) \\xrightarrow{|z|\\to+\\infty} 0,\\; a > 0 \\implies \\lim_{\\rho\\to +\\infty} \\int_{\\Gamma_\\rho} e^{iaz} g(z)\\,dz = 0',
  hypotheses: [
    'g continua fuori da un disco {|z| ≤ R} e dominata da G(|z|) infinitesima all’infinito',
    'Γ_ρ semicirconferenza di raggio ρ > R nel semipiano superiore Im(z) ≥ 0 per a > 0 (inferiore per a < 0)',
  ],
  steps: [
    {
      title: '1. Parametrizzazione di Γ_ρ e decadimento esponenziale',
      explanation:
        'Parametrizziamo Γ_ρ con z(η) = ρ e^{iη}, η ∈ [0, π]. Per a > 0 e Im(z) = ρ sin η ≥ 0, il fattore |e^{iaz}| = e^{-aρ sin η} decade esponenzialmente lontano dall’asse reale.',
      formulasLatex: [
        '\\int_{\\Gamma_\\rho} e^{iaz}g(z)\\,dz = \\int_0^{\\pi} e^{ia\\rho\\cos\\eta}\\cdot e^{-a\\rho\\sin\\eta}\\cdot g(\\rho e^{i\\eta})\\cdot i\\rho e^{i\\eta}\\,d\\eta',
      ],
      callout: {
        kind: 'warning',
        title: 'Fattore ρ nell’esponente oscillante',
        body: 'Nel primo fattore compare e^{iaρ cos η} (con ρ all’esponente). Poiché iaρ cos η è immaginario puro, il suo modulo resta comunque 1.',
      },
      scene: makeJordanComplexScene(2.5, 1.0),
    },
    {
      title: '2. Maggiorazione col modulo e dominazione con G(ρ)',
      explanation:
        'Portando il modulo dentro l’integrale, usando |e^{iaρ cos η}| = 1, |iρ e^{iη}| = ρ e |g(ρ e^{iη})| ≤ G(ρ), isoliamo il solo integrale di e^{-aρ sin η}.',
      formulasLatex: [
        '\\left|\\int_{\\Gamma_\\rho} e^{iaz}g(z)\\,dz\\right| \\le G(\\rho)\\cdot\\rho\\cdot\\int_0^\\pi e^{-a\\rho\\sin\\eta}\\,d\\eta',
      ],
      scene: makeJordanComplexScene(3.5, 1.0),
    },
    {
      title: '3. Simmetria su [0, π/2] e disuguaglianza di Jordan',
      explanation:
        'Per simmetria sin(π - η) = sin η l’integrale su [0, π] è 2 volte quello su [0, π/2]. Per la concavità del seno su [0, π/2], la corda (2/π)η sta sempre sotto sin η (vedi il grafico 2D!).',
      formulasLatex: [
        '\\frac{2}{\\pi}\\eta \\le \\sin\\eta \\;\\;\\forall\\eta \\in [0, \\tfrac{\\pi}{2}] \\implies e^{-a\\rho\\sin\\eta} \\le e^{-a\\rho\\frac{2\\eta}{\\pi}}',
      ],
      scene: makeJordanInequalityScene(),
    },
    {
      title: '4. Integrazione esatta dell’esponenziale lineare',
      explanation:
        'Integrando 2 e^{-aρ (2η/π)} tra 0 e π/2 otteniamo esattamente (π / (aρ))(1 - e^{-aρ}). Il fattore ρ al denominatore è la chiave della dimostrazione.',
      formulasLatex: [
        '2\\int_0^{\\pi/2} e^{-a\\rho\\frac{2\\eta}{\\pi}}\\,d\\eta = 2\\left[-\\frac{\\pi}{2a\\rho}e^{-a\\rho\\frac{2\\eta}{\\pi}}\\right]_0^{\\pi/2} = \\frac{\\pi}{a\\rho}\\left(1 - e^{-a\\rho}\\right)',
      ],
      scene: makeJordanComplexScene(5.0, 1.0),
    },
    {
      title: '5. Semplificazione di ρ e passaggio al limite ρ → +∞',
      explanation:
        'Il fattore ρ della lunghezza d’arco si semplifica con 1/ρ proveniente dall’integrale! Aumenta ρ con lo slider per vedere sia l’integrale esatto sull’arco sia la stima tendere a 0 grazie a G(ρ) → 0.',
      formulasLatex: [
        '\\left|\\int_{\\Gamma_\\rho} e^{iaz}g(z)\\,dz\\right| \\le G(\\rho)\\cdot \\frac{\\pi}{a}\\left(1 - e^{-a\\rho}\\right) \\xrightarrow{\\rho\\to+\\infty} 0 \\qquad \\square',
      ],
      scene: makeJordanComplexScene(8.0, 1.0),
    },
  ],
};
