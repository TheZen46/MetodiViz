# Changelog

Tutte le modifiche rilevanti al progetto vengono documentate in questo file.

## 0.2.0 (2026-11-25)

Copertura completa di tutte le 18 dimostrazioni del corso e revisione UI/UX.

### Aggiunto
- Implementate tutte le 14 dimostrazioni restanti (`02`, `04`, `05`, `06`, `07`, `08`, `09`, `10`, `11`, `12`, `13`, `15`, `16`, `17`) sincronizzate con i visualizzatori 3D, 2D e complesso.
- Esteso il motore numerico (`src/engine/math/numerics.ts` e `runtime.ts`) con somme di Darboux 2D, verifica del teorema della divergenza, integrali 1D su plot, formula integrale di Cauchy e integrale sulla semicirconferenza di Jordan.
- File `DESIGN.md` con palette WCAG AA verificata, tipografia serif per teoremi e supporto responsive a tre breakpoint (desktop, tablet con drawer, mobile con switcher dedicato).

### Modificato
- Migliorata l'accessibilità da tastiera (skip link, focus visibile, bottoni nativi per passaggi e modali, `aria-pressed` / `aria-selected`) e corretto il contrasto di MathLive in tema scuro.
- Aggiornati i riferimenti di licenza a GNU AGPL-3.0.

## 0.1.0 (2026-11-25)

Prima release pubblica (MVP).

### Aggiunto
- Motore di parsing LaTeX verso AST e valutatore numerico reale e complesso in TypeScript (`src/engine/`).
- Linguaggio dichiarativo `MathScene DSL` con parser, serializzatore bidirezionale, 5 preset pronti e import/export `.mmath`.
- Visualizzatore `View3D` con orbita 360 gradi, viste rapide, wireframe, piano di sezione `z = c`, sonda gradiente e piano tangente al clic.
- Visualizzatore `View2D` con pan/zoom, sonda rotore/divergenza, punti trascinabili, linee di flusso RK4 e sovrapposizioni per Gauss-Green e Fourier.
- Visualizzatore `ViewComplex` con domain coloring, sonda complessa, aggiunta e trascinamento dei poli, contorno spostabile e ridimensionabile.
- Editor matematico visivo basato su MathLive con copia automatica degli asset locali in `postinstall`.
- Quattro dimostrazioni pilota interattive (`01`, `03`, `14`, `18`) con modalità lavagna per il ripasso orale e catalogo completo delle 18 dimostrazioni del corso.
- Suite di test Vitest (15 test in 4 file) e configurazione CI GitHub Actions.
