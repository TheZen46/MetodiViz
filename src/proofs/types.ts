import { SceneSpec } from '../engine/dsl/types';

export interface ProofCallout {
  kind: 'note' | 'warning';
  title: string;
  body: string;
}

export interface ProofStep {
  title: string;
  explanation: string;
  formulasLatex: string[];
  callout?: ProofCallout;
  scene: SceneSpec;
}

export interface ProofDefinition {
  id: string;
  number: string;
  title: string;
  block: 1 | 2 | 3 | 4;
  blockLabel: string;
  lecturer: 'Pinamonti' | 'Benini';
  sourceFile: string;
  status: 'ready' | 'planned';
  statementLatex: string;
  hypotheses: string[];
  steps: ProofStep[];
}
