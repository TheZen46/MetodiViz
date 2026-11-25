export interface DslPreset {
  id: string;
  title: string;
  subtitle: string;
  view: '3d' | '2d' | 'complex';
  dsl: string;
}

export const DSL_PRESETS: DslPreset[] = [
  {
    id: 'saddle-3d',
    title: 'Sella & Onda 3D',
    subtitle: 'Superficie parametrica con slider ampiezza',
    view: '3d',
    dsl: `view: 3d
range: x in [-3, 3], y in [-3, 3], z in [-2.5, 2.5]

param a = 1 in [0.2, 2.5] step 0.1

surface S: z = a \\cdot \\frac{\\sin(x^2 + y^2)}{x^2 + y^2 + 0.4} color #38bdf8
point P0: (0, 0, 0) color #facc15`,
  },
  {
    id: 'helix-polygonal',
    title: 'Elica 3D & Poligonale',
    subtitle: 'Approssimazione della lunghezza di una curva',
    view: '3d',
    dsl: `view: 3d
range: x in [-2.5, 2.5], y in [-2.5, 2.5], z in [-0.5, 3.5]

param N = 8 in [2, 60] step 1
param c = 0.25 in [0, 0.6] step 0.05

curve gamma: (\\cos(t), \\sin(t), c \\cdot t) for t in [0, 4\\pi] color #38bdf8
polygonal P: on gamma with N segments color #f59e0b

measure "Lunghezza poligonale L(P)" = length(P)
measure "Integrale esatto" = exactLength(gamma)`,
  },
  {
    id: 'gauss-green-2d',
    title: 'Campo Vettoriale & Dominio 2D',
    subtitle: 'Clicca sul campo per tracciare linee di flusso RK4',
    view: '2d',
    dsl: `view: 2d
range: x in [-1.5, 4.5], y in [-0.5, 4]

param k = 1 in [0.2, 2] step 0.1

vectorfield F: (-k \\cdot y, k \\cdot x + 0.2 x^2) heatmap color #38bdf8
domain D: x in [0.5, 3.2], y in [0.6 + 0.2\\sin(2x), 2.5 + 0.35\\cos(x)] color #34d399

measure "Circuitazione bordo" = gaussGreenLine(D)
measure "Integrale doppio rotore" = gaussGreenDouble(D)`,
  },
  {
    id: 'fourier-2d',
    title: 'Serie di Fourier (Onda Quadra)',
    subtitle: 'Somma parziale trigonometrica fino ad N armoniche',
    view: '2d',
    dsl: `view: 2d
range: x in [-6.5, 6.5], y in [-1.8, 1.8]

param N = 7 in [1, 35] step 1

plot S_N: y = \\frac{4}{\\pi} \\sum_{k=1}^{N} \\frac{\\sin((2k - 1)x)}{2k - 1} color #38bdf8
point Salto: (0, 0) color #facc15`,
  },
  {
    id: 'residues-complex',
    title: 'Poli & Domain Coloring',
    subtitle: 'Trascina i poli dentro/fuori dal contorno C',
    view: 'complex',
    dsl: `view: complex
range: x in [-3.5, 3.5], y in [-3, 3]

complex f: f(z) = \\frac{1}{z - z_1} + \\frac{0.8}{z - z_2} - \\frac{0.6}{z - z_3}
contour C: circle(0, 0, 2.2) color #f43f5e
pole z_1: (-1, 0.4) color #22c55e
pole z_2: (0.7, -0.5) color #22c55e
pole z_3: (2.7, 0.8) color #f59e0b

measure "Integrale sul contorno C" = contourIntegral(C)
measure "2 pi i * Somma Residui" = residuesSum(C)`,
  },
];
