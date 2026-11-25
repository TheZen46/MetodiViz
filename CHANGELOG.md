# Changelog

Tutte le modifiche rilevanti al progetto vengono documentate in questo file.

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
