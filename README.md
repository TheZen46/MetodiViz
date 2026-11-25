# MetodiViz

Applicazione web locale per studiare le dimostrazioni del corso di Metodi Matematici attraverso grafici interattivi 3D, 2D e nel piano complesso. Funziona interamente nel browser, senza backend esterni.

Il progetto è alla versione `0.1.0` (MVP): il motore di calcolo, i tre visualizzatori, l'editor LaTeX visivo e le prime 4 dimostrazioni guida sono completi e testati. Le restanti 14 dimostrazioni del catalogo sono segnate come da completare.

## Stato delle dimostrazioni

Il programma del corso è suddiviso in quattro blocchi. La tabella riassume la copertura attuale:

| Blocco | Dimostrazioni pronte | In programma |
| :--- | :--- | :--- |
| 1. Calcolo differenziale in R^n | nessuna | `06` Funzione implicita, `07` Funzione inversa |
| 2. Curve, superfici e integrali | `01` Rettificabilità e lunghezza di una curva, `03` Formula di Gauss-Green | `02` Condizioni di integrabilità, `04` Divergenza in 2D, `05` Stokes in 2D |
| 3. Serie di Fourier | `18` Teorema di Fourier | `16` Seno cardinale, `17` Lemma di Riemann |
| 4. Analisi complessa | `14` Teorema dei residui | `08` Numeri complessi, `09` Modulo e forma trigonometrica, `10` Formula di Eulero, `11` Cauchy-Riemann, `12` Teorema di Cauchy, `13` Formula integrale di Cauchy, `15` Lemma di Jordan |

Chi vuole aggiungere una delle 14 dimostrazioni mancanti può seguire la guida in [CONTRIBUTING.md](CONTRIBUTING.md).

## Cosa puoi fare nell'app

La modalità Studio Dimostrazioni affianca enunciato, ipotesi e passaggi in KaTeX al visualizzatore grafico sincronizzato. Ogni passaggio aggiorna automaticamente parametri e sovrapposizioni sulla scena (poligonali inscritte, fetta verticale di Leibniz, tagli che si elidono, nucleo di Dirichlet). È disponibile anche una modalità lavagna che nasconde i passaggi successivi per esercitarsi a ricostruire la dimostrazione a voce.

La modalità Sandbox permette di costruire scene personali in due modi sincronizzati: tramite schede visive con input matematico MathLive (scrivi comandi LaTeX e vedi subito la formula tipografica) oppure scrivendo direttamente nel linguaggio testuale MathScene DSL. Le scene possono essere esportate e reimportate come file `.mmath`.

Tutti e tre i visualizzatori rispondono direttamente al mouse senza scrivere codice:

- Nella vista 3D puoi ruotare a 360 gradi, cambiare proiezione (`3D`, `XY`, `XZ`, `YZ`), attivare il wireframe, tagliare la superficie con un piano orizzontale `z = c`, leggere coordinate e gradiente al passaggio del mouse, posizionare punti e tracciare il piano tangente (con normale e gradiente) cliccando sulla superficie.
- Nella vista 2D puoi fare pan e zoom sul cursore, trascinare punti sul piano, leggere rotore e divergenza dei campi vettoriali con la sonda e tracciare linee di flusso integrate con RK4 cliccando sul campo.
- Nella vista del piano complesso puoi attivare il domain coloring, leggere `z` e `f(z)` con la sonda, aggiungere poli con un clic, trascinare i poli dentro o fuori dal contorno `C` e spostare o ridimensionare `C` vedendo cambiare in tempo reale integrale di contorno e somma dei residui.

## Requisiti e avvio

Serve `Node.js` (versione 20 o superiore) con `npm`.

```bash
git clone <url-del-repository>
cd MetodiMatematiciSoftware
npm install
npm run dev
```

Su Windows puoi anche fare doppio clic su `avvia.bat`, che installa le dipendenze se mancanti e apre l'applicazione nel browser. Durante `npm install`, lo script `postinstall` copia localmente i font e i suoni di MathLive in `public/mathlive/` in modo che l'editor funzioni anche offline.

## Comandi di sviluppo

| Comando | Scopo |
| :--- | :--- |
| `npm run dev` | Avvia il server di sviluppo Vite |
| `npm test` | Esegue la suite di test Vitest (parser LaTeX, numerica, DSL, integrità dimostrazioni) |
| `npm run typecheck` | Controlla i tipi TypeScript senza generare file |
| `npm run build` | Esegue il check dei tipi e genera il bundle statico in `dist/` |
| `npm run preview` | Avvia il server locale sul bundle compilato |

## Struttura delle cartelle

```text
MetodiMatematiciSoftware/
├── docs/                 Documentazione DSL e architettura
├── scripts/              Script di supporto (copia asset MathLive in postinstall)
├── src/
│   ├── engine/
│   │   ├── dsl/          Parser, serializzatore, preset e runtime MathScene DSL
│   │   ├── latex/        Tokenizer e parser LaTeX verso AST
│   │   └── math/         Aritmetica complessa, valutatore AST e calcolo numerico
│   ├── proofs/           Definizione delle 4 dimostrazioni pilota e catalogo delle 18
│   ├── styles/           Variabili tema scuro/chiaro e layout
│   ├── ui/               Componenti React (Studio, Sandbox, input MathLive, KaTeX)
│   └── visualizers/      Motori grafici View3D, View2D e ViewComplex
├── tests/                Test unitari Vitest
├── avvia.bat             Avvio rapido su Windows
└── package.json
```

Documentazione aggiuntiva:

- Sintassi completa del linguaggio e dei comandi LaTeX supportati: [docs/GUIDA_DSL.md](docs/GUIDA_DSL.md)
- Panoramica tecnica del motore e delle scelte implementative: [docs/ARCHITETTURA.md](docs/ARCHITETTURA.md)
- Registro delle modifiche: [CHANGELOG.md](CHANGELOG.md)

## Contribuire

Le proposte di correzione, le segnalazioni di bug e le nuove dimostrazioni sono benvenute. Leggi [CONTRIBUTING.md](CONTRIBUTING.md) per capire come è strutturata una dimostrazione e quali verifiche eseguire prima di aprire una pull request.

## Licenza

Questo progetto è distribuito sotto licenza GNU AGPL-3.0. Vedi [LICENSE](LICENSE).
