# Design Direction: MetodiViz

## Design Read

Reading this as: interactive university mathematics study studio for engineering students, in an academic chalkboard-and-monograph visual language, dial ENERGY 1 / RHYTHM 2 / MOTION 1.

## Dials

- **ENERGY 1:** calm, distraction-free reading surface for long university study sessions; the mathematical canvas is the only bright visual protagonist.
- **RHYTHM 2:** structured three-zone studio on desktop (collapsible index rail, proof/editor column, dominant interactive viewport) with asymmetric spacing between narrative cards, formula blocks, and toolbar controls.
- **MOTION 1:** subtle hover and focus transitions only, disabled automatically under `prefers-reduced-motion: reduce`.

## Palette (WCAG AA verified)

Core neutrals: 2 neutral surface ramps (slate chalkboard dark, warm paper light) + 1 deliberate accent (amber ochre).

### Dark theme (default, motivated by prolonged reading and high contrast on 3D/complex plots)

- App background: `#121417`
- Panel background: `#1A1D22`
- Card background: `#22262D`
- Elevated surface: `#2A2F38`
- Primary text: `#EDEAE2` (15.35:1 on app, 14.06:1 on panel, 12.63:1 on card)
- Muted text: `#A3AAB6` (7.23:1 on panel, 6.49:1 on card)
- Deliberate accent: `#E5A93C` (8.10:1 on panel, 7.28:1 on card)
- Accent ink: `#121417` (8.85:1 on `#E5A93C`)
- Structural divider: `#313742`
- Interactive control border: `#6E7787` (3.74:1 on panel, 3.36:1 on card, WCAG 1.4.11)
- Semantic status: success `#4ADE80` (9.70:1), danger `#F87171` (6.11:1), warning `#E5A93C` (8.10:1)

### Light theme (warm academic paper)

- App background: `#F5F2EB`
- Panel background: `#FFFFFF`
- Card background: `#EFECE4`
- Elevated surface: `#E5E0D5`
- Primary text: `#17191E` (17.58:1 on panel, 14.90:1 on card)
- Muted text: `#525866` (7.13:1 on panel, 6.04:1 on card)
- Deliberate accent: `#9A4D08` (6.11:1 on panel, 5.17:1 on card)
- Accent ink: `#FFFFFF` (6.11:1 on `#9A4D08`)
- Structural divider: `#D8D2C5`
- Interactive control border: `#707785` (4.46:1 on panel, 3.81:1 on card, WCAG 1.4.11)
- Semantic status: success `#15803D` (5.02:1), danger `#B91C1C` (6.47:1), warning `#9A4D08` (6.11:1)

## Typography

- Headings, theorem statements, and primary brand title: `Georgia, Cambria, "Times New Roman", serif` with `font-variant-numeric: tabular-nums` to match mathematical monograph typography.
- Controls, navigation, and prose body: `system-ui, -apple-system, "Segoe UI", sans-serif` for crisp legibility at all zoom levels.
- DSL editor, coordinates, and live measurements: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.

## Radii, Elevation, and Whitespace

- Radii: `--radius-sm: 4px` (badges/chips), `--radius-md: 6px` (buttons/inputs), `--radius-lg: 10px` (theorem header, modal). No full-pill `999px` capsules.
- Elevation: flat surfaces separated by crisp 1px borders; shadow reserved strictly for overlaid modal and mobile drawer (`--shadow-overlay`).
- Identity motif: numbered theorem step markers paired with academic serif headings and warm ochre active border indicator.

## Responsive Breakpoints

- Desktop (`>= 1160px`): collapsible 256px index rail + proof/editor column + dominant live canvas.
- Tablet / Small laptop (`720px - 1159px`): index rail switches to an accessible slide-over drawer triggered by `Indice (18)` (`Escape` closes and restores focus); two-column workspace reflows without clipping.
- Mobile (`< 720px`): full-height scrolling flow (`min-height: 100dvh`), compact header, explicit mobile view switcher (`Dimostrazione` / `Grafico` or `Editor` / `Grafico`), minimum 44x44px touch targets with >= 8px gaps.

## Decision Log (R-31)

- Color: warm slate and warm paper with ochre accent differentiate this math studio from generic neon blue/purple dark apps and pass WCAG AA across every surface.
- Layout: three-breakpoint reflow avoids cramped split panes on tablets and phones while keeping the mathematical canvas dominant on desktop.
- Typography: pairing serif theorem headings with system sans controls creates clear hierarchy between mathematical statements and tool controls.
- Spacing: asymmetric padding separates proof header, active step cards, and bottom slider/measure dock without uniform grid monotony.
- Cards: step cards and sandbox object cards represent discrete interactive units (selectable steps and editable scene objects), not decorative feature tiles.
- Icons: minimal functional icons only where they clarify action (theme toggle, modal close, expand/collapse); text carries primary navigation.
