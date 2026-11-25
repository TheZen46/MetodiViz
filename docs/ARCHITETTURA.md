# Architettura tecnica

MetodiViz è una single-page application scritta in TypeScript con React e Vite. Tutto il parsing matematico, il calcolo numerico e il rendering grafico avvengono nel browser dell'utente.

## Flusso dei dati

1. Input dell'utente o definizione di una dimostrazione:
   - Le dimostrazioni guidate forniscono oggetti `ProofDefinition` (`src/proofs/`) con una `SceneSpec` per ogni passaggio.
   - Nella Sandbox l'utente modifica la `SceneSpec` tramite le schede visive (con `<math-field>` di MathLive) oppure editando il testo DSL.
   - `parseDsl` e `serializeSceneToDsl` (`src/engine/dsl/`) mantengono allineati testo DSL e stato strutturato `SceneSpec`.
2. Compilazione delle espressioni (`src/engine/latex/latexParser.ts`):
   - Le stringhe LaTeX vengono normalizzate e convertite in un albero sintattico (`ExprNode`).
   - Non viene mai usato `eval()` o `new Function()`, in modo da evitare rischi di esecuzione arbitraria e problemi con le Content Security Policy.
3. Valutazione e calcolo numerico (`src/engine/math/`):
   - `evaluator.ts` valuta gli AST sia su numeri reali (`evalReal`) sia su numeri complessi (`evalComplex`).
   - `numerics.ts` fornisce derivate parziali finite centrate, quadratura di Simpson composita 1D, integrali doppi su domini normali per Gauss-Green, tracciamento RK4 per linee di flusso 2D, integrali di contorno e stima dei residui, coefficienti e nucleo di Dirichlet per Fourier.
   - `runtime.ts` combina `SceneSpec` e valori correnti degli slider per calcolare le misure mostrate nella barra inferiore.
4. Visualizzazione (`src/visualizers/`):
   - `View3D.tsx` usa Three.js con `camera.up.set(0, 0, 1)` per rispettare la convenzione matematica con asse `Z` verticale, `OrbitControls`, `Raycaster` per sonda e piano tangente, e `ResizeObserver` per adattarsi al pannello divisibile.
   - `View2D.tsx` usa un Canvas HTML5 scalato per `devicePixelRatio` per disegnare domini normali, frecce orientate sui bordi, campi vettoriali, linee di flusso RK4 e somme di Fourier.
   - `ViewComplex.tsx` usa un buffer offscreen per il domain coloring (risoluzione ridotta durante il trascinamento, affinata al rilascio) sovrapposto a un Canvas Hi-DPI per contorno, poli trascinabili, circonferenze `C_k` e tagli `T_k`.

## Scelte implementative rilevanti

- Gestione offline di MathLive: invece di appoggiarsi a CDN esterni, `scripts/copy-mathlive-assets.mjs` copia `fonts/` e `sounds/` da `node_modules/mathlive/dist/` dentro `public/mathlive/` in fase di `postinstall`. `MathLatexInput.tsx` configura `MathfieldElement.fontsDirectory` e `soundsDirectory` su `/mathlive/...`.
- Pulizia delle risorse WebGL: `View3D.tsx` esegue `dispose()` su geometrie e materiali ad ogni ricostruzione della scena dinamica e del piano tangente per evitare memory leak quando si muovono gli slider rapidamente.
- Compatibilità dei test: tutta la directory `src/engine/` e i dati delle dimostrazioni in `src/proofs/` sono indipendenti dal DOM, così Vitest può testarli in ambiente Node puro senza browser headless.
