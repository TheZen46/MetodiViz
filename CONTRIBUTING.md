# Contribuire a MetodiViz

Grazie per l'interesse nel migliorare il progetto. Il modo più utile per contribuire in questa fase è completare una delle 14 dimostrazioni segnate come `planned` in `src/proofs/catalog.ts`, correggere bug nel parser LaTeX o migliorare l'usabilità dei visualizzatori.

## Setup locale

1. Esegui il fork del repository e clonalo sul tuo computer.
2. Verifica di avere Node.js 20 o superiore installato.
3. Installa le dipendenze e avvia l'ambiente di sviluppo:

```bash
npm install
npm run dev
```

Lo script `postinstall` copia automaticamente i font di MathLive in `public/mathlive/`. Non committare quella cartella né `dist/` o `node_modules/`.

## Come aggiungere una nuova dimostrazione

Ogni dimostrazione vive in un file dedicato dentro `src/proofs/` (ad esempio `src/proofs/proof06_implicit.ts`) ed esporta un oggetto conforme a `ProofDefinition` definito in [src/proofs/types.ts](src/proofs/types.ts).

1. Scegli una dimostrazione in stato `planned` da [src/proofs/catalog.ts](src/proofs/catalog.ts).
2. Crea il file `src/proofs/proofXX_nome.ts` definendo `id`, `number`, `title`, `block`, `blockLabel`, `lecturer`, `sourceFile`, `status: 'ready'`, `statementLatex`, `hypotheses` e l'array `steps`.
3. Per ogni step, scrivi:
   - `title` e `explanation` chiari e fedeli al ragionamento matematico.
   - `formulasLatex` con sintassi compatibile con KaTeX (puoi verificare automaticamente con i test).
   - `callout` opzionale (`note` o `warning`) per ipotesi critiche o errori frequenti all'orale.
   - `scene` di tipo `SceneSpec` (`3d`, `2d` o `complex`) con parametri, oggetti e misure coerenti con il passaggio corrente.
4. Sostituisci la voce `makePlanned(...)` in `src/proofs/catalog.ts` con l'import della nuova dimostrazione.
5. Aggiorna la tabella dello stato in [README.md](README.md) se la dimostrazione è pronta.

Nota sui test automatici: `tests/proofs.test.ts` verifica che tutte le dimostrazioni con `status: 'ready'` abbiano formule KaTeX valide senza errori di rendering e che tutte le misure configurate nella scena restituiscano valori numerici finiti. Se cambi il numero totale di dimostrazioni pronte, aggiorna l'asserzione corrispondente in `tests/proofs.test.ts`.

## Come estendere parser o visualizzatori

- Il parser LaTeX si trova in `src/engine/latex/latexParser.ts` e produce un AST puro valutato da `src/engine/math/evaluator.ts` senza usare `eval()` o `new Function()`. Aggiungi sempre i relativi casi di test in `tests/latexParser.test.ts`.
- Se aggiungi nuove direttive a `MathScene DSL` in `src/engine/dsl/dslParser.ts`, aggiorna anche `src/engine/dsl/dslSerializer.ts`, `docs/GUIDA_DSL.md` e `tests/dslParser.test.ts`.
- Tutte le etichette e i messaggi di errore dell'interfaccia devono restare in italiano, chiari e privi di gergo inutile.

## Controlli prima di aprire una pull request

Prima di inviare le modifiche, esegui tutti e tre i comandi dalla cartella principale e verifica che passino senza errori:

```bash
npm test
npm run typecheck
npm run build
```

Quando apri la pull request, indica brevemente cosa cambia, quale dimostrazione o modulo hai toccato e l'esito dei controlli locali.
