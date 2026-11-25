# Guida al linguaggio MathScene DSL

Un file `.mmath` descrive una scena matematica in testo semplice, combinando direttive dichiarative ed espressioni LaTeX. Le stesse scene possono essere create dalle schede visive nella Sandbox e poi esportate o modificate come testo.

## Direttive di scena

### `view` e `range`

```text
view: 3d
range: x in [-3, 3], y in [-3, 3], z in [-2, 2]
```

`view` accetta `3d`, `2d` oppure `complex`. Nelle viste `2d` e `complex` è sufficiente specificare gli intervalli di `x` e `y`. Gli estremi accettano numeri o costanti come `-2\pi` e `2\pi`.

### `param`

Genera uno slider interattivo collegato al nome del parametro:

```text
param N = 8 in [2, 60] step 1
param a = 1 in [0.1, 3] step 0.1
```

## Oggetti grafici

Ogni oggetto ha un identificatore univoco dopo la parola chiave. Alla fine della riga puoi specificare `color #rrggbb` (opzionale).

```text
# Superficie 3D z = f(x, y), con opzione wireframe
surface S: z = \frac{x^2 - y^2}{2} color #38bdf8
surface W: z = \sin(x)\cos(y) wireframe color #a78bfa

# Funzione 2D y = f(x), con opzione dashed
plot f: y = \frac{4}{\pi}\sum_{k=1}^{N} \frac{\sin((2k-1)x)}{2k-1} color #38bdf8
plot g: y = \sin(x) dashed color #94a3b8

# Curva parametrica 2D o 3D su [tMin, tMax]
curve gamma: (\cos(t), \sin(t), 0.25 \cdot t) for t in [0, 4\pi] color #38bdf8

# Poligonale inscritta su una curva esistente
polygonal P: on gamma with N segments color #f59e0b

# Campo vettoriale 2D, con heatmap opzionale del rotore
vectorfield F: (-y, x + 0.2x^2) heatmap color #38bdf8

# Dominio normale rispetto all'asse x (usato da Gauss-Green)
domain D: x in [0.5, 3], y in [0.6 + 0.2\sin(2x), 2.5 + 0.3\cos(x)] color #34d399

# Funzione complessa e geometria per l'analisi complessa
complex f: f(z) = \frac{1}{z - z_1} + \frac{0.8}{z - z_2}
contour C: circle(0, 0, 2.2) color #f43f5e
contour E: ellipse(0, 0, 2.4, 1.6) color #f43f5e
pole z_1: (-1, 0.4) color #22c55e

# Punto 2D o 3D
point P0: (1, 1, 0) color #facc15
```

I commenti iniziano con `#` o `//` su una riga dedicata.

## Misure numeriche live

Le misure compaiono nella barra inferiore e si ricalcolano quando sposti uno slider, trascini un polo o ridimensioni un contorno.

```text
measure "Lunghezza poligonale" = length(P)
measure "Integrale esatto" = exactLength(gamma)
measure "Circuitazione bordo" = gaussGreenLine(D)
measure "Integrale doppio rotore" = gaussGreenDouble(D)
measure "Integrale sul contorno C" = contourIntegral(C)
measure "2 pi i * Somma Residui" = residuesSum(C)
```

Puoi anche mostrare un'espressione aritmetica basata sui parametri, ad esempio `measure "Armoniche" = N`.

## Sintassi LaTeX supportata dal parser

Il parser (`src/engine/latex/latexParser.ts`) supporta sia il LaTeX prodotto da MathLive sia quello scritto a mano:

- Operatori e raggruppamenti: `+`, `-`, `*`, `\cdot`, `\times`, `/`, `\div`, `\frac{a}{b}`, `\dfrac{a}{b}`, `a^b`, `a^{b+c}`, `\left( ... \right)`, `\left| ... \right|`, `|...|`, moltiplicazione implicita (`2x`, `2\pi t`, `x\sin(y)`).
- Radici e potenze trigonometriche: `\sqrt{x}`, `\sqrt[n]{x}`, `\sin^2(x)`.
- Funzioni reali e complesse: `sin`, `cos`, `tan`, `arcsin`, `arccos`, `arctan`, `sinh`, `cosh`, `tanh`, `exp`, `ln`, `log`, `sqrt`, `abs`, `sinc`, `re` (`\Re`), `im` (`\Im`), `arg`, `conj`, `floor`, `ceil`, `sign`, `heaviside`, `step`, `min`, `max`, `mod`.
- Sommatorie finite: `\sum_{k=1}^{N} ...` (con limite massimo di sicurezza a 500 termini per iterazione).
- Costanti e simboli: `\pi` (`pi`), `e`, `i` (unità immaginaria nel piano complesso), lettere greche comuni (`\theta`, `\varphi`, `\lambda`, `\varepsilon`, `\alpha`, `\beta`, `\gamma`, `\omega`, `\delta`, `\sigma`, `\tau`) e pedici come `z_1` o `x_0`.

## Esempi completi

### Elica 3D con poligonale inscritta

```text
view: 3d
range: x in [-2.5, 2.5], y in [-2.5, 2.5], z in [-0.5, 3.5]

param N = 8 in [2, 60] step 1
param c = 0.25 in [0, 0.6] step 0.05

curve gamma: (\cos(t), \sin(t), c \cdot t) for t in [0, 4\pi] color #38bdf8
polygonal P: on gamma with N segments color #f59e0b

measure "Lunghezza poligonale L(P)" = length(P)
measure "Integrale esatto" = exactLength(gamma)
```

### Piano complesso con due poli

```text
view: complex
range: x in [-3.5, 3.5], y in [-3, 3]

complex f: f(z) = \frac{1}{z - z_1} + \frac{0.8}{z - z_2}
contour C: circle(0, 0, 2.0) color #f43f5e
pole z_1: (-1, 0.4) color #22c55e
pole z_2: (2.5, -0.4) color #f59e0b

measure "Integrale sul contorno C" = contourIntegral(C)
measure "2 pi i * Somma Residui" = residuesSum(C)
```
