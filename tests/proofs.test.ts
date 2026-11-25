import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { evaluateSceneMeasures } from '../src/engine/dsl/runtime';
import { ALL_PROOFS, PILOT_PROOFS } from '../src/proofs/catalog';

describe('Course Proofs Catalog (All 18 Proofs)', () => {
  it('lists all 18 proofs and marks all 18 ready', () => {
    expect(ALL_PROOFS.length).toBe(18);
    expect(PILOT_PROOFS.length).toBe(18);
  });

  it('renders all KaTeX formulas in all 18 proofs without errors and evaluates live measures', () => {
    for (const proof of ALL_PROOFS) {
      expect(proof.steps.length).toBeGreaterThanOrEqual(4);
      expect(() =>
        katex.renderToString(proof.statementLatex, { throwOnError: true, strict: false })
      ).not.toThrow();

      for (const step of proof.steps) {
        for (const f of step.formulasLatex) {
          expect(() =>
            katex.renderToString(f, { throwOnError: true, strict: false })
          ).not.toThrow();
        }
        const measures = evaluateSceneMeasures(step.scene);
        expect(measures.length).toBe(step.scene.measures.length);
        for (const m of measures) {
          expect(m.value, `${proof.id} (${step.title}) measure "${m.label}"`).not.toBe('-');
          expect(m.value, `${proof.id} (${step.title}) measure "${m.label}"`).not.toContain('NaN');
        }
      }
    }
  });

  it('contains zero em-dash characters in UI and proof source files', () => {
    const rawFiles = import.meta.glob('/src/**/*.{ts,tsx}', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;
    const paths = Object.keys(rawFiles);
    expect(paths.length).toBeGreaterThan(20);
    for (const filePath of paths) {
      expect(rawFiles[filePath], `Em dash found in ${filePath}`).not.toContain('\u2014');
    }
  });
});
