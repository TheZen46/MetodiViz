import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { evaluateSceneMeasures } from '../src/engine/dsl/runtime';
import { ALL_PROOFS, PILOT_PROOFS } from '../src/proofs/catalog';

describe('Course Proofs Catalog & 4 Pilot Proofs', () => {
  it('lists all 18 proofs and marks 4 pilot proofs ready', () => {
    expect(ALL_PROOFS.length).toBe(18);
    expect(PILOT_PROOFS.length).toBe(4);
  });

  it('renders all KaTeX formulas in pilot proofs without errors and evaluates live measures', () => {
    for (const proof of PILOT_PROOFS) {
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
          expect(m.value).not.toBe('—');
          expect(m.value).not.toContain('NaN');
        }
      }
    }
  });
});
