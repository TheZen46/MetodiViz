import { proof01Length } from './proof01_length';
import { proof02Integrability } from './proof02_integrability';
import { proof03GaussGreen } from './proof03_gaussGreen';
import { proof04Divergence2d } from './proof04_divergence2d';
import { proof05Stokes2d } from './proof05_stokes2d';
import { proof06Implicit } from './proof06_implicit';
import { proof07Inverse } from './proof07_inverse';
import { proof08ComplexNumbers } from './proof08_complexNumbers';
import { proof09PolarForm } from './proof09_polarForm';
import { proof10Euler } from './proof10_euler';
import { proof11CauchyRiemann } from './proof11_cauchyRiemann';
import { proof12CauchyTheorem } from './proof12_cauchyTheorem';
import { proof13CauchyFormula } from './proof13_cauchyFormula';
import { proof14Residues } from './proof14_residues';
import { proof15Jordan } from './proof15_jordan';
import { proof16Sinc } from './proof16_sinc';
import { proof17Riemann } from './proof17_riemann';
import { proof18Fourier } from './proof18_fourier';
import { ProofDefinition } from './types';

export const ALL_PROOFS: ProofDefinition[] = [
  // Blocco 1
  proof06Implicit,
  proof07Inverse,

  // Blocco 2
  proof01Length,
  proof02Integrability,
  proof03GaussGreen,
  proof04Divergence2d,
  proof05Stokes2d,

  // Blocco 3
  proof16Sinc,
  proof17Riemann,
  proof18Fourier,

  // Blocco 4
  proof08ComplexNumbers,
  proof09PolarForm,
  proof10Euler,
  proof11CauchyRiemann,
  proof12CauchyTheorem,
  proof13CauchyFormula,
  proof14Residues,
  proof15Jordan,
];

export const PILOT_PROOFS: ProofDefinition[] = ALL_PROOFS.filter((p) => p.status === 'ready');
