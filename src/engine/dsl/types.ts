export type ViewMode = '3d' | '2d' | 'complex';

export interface SceneRange {
  x: [number, number];
  y: [number, number];
  z: [number, number];
}

export interface ParamDef {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  label?: string;
}

export interface SurfaceObject {
  kind: 'surface';
  id: string;
  expr: string;
  color: string;
  visible: boolean;
  wireframe?: boolean;
}

export interface PlotObject {
  kind: 'plot';
  id: string;
  expr: string;
  color: string;
  visible: boolean;
  dashed?: boolean;
}

export interface CurveObject {
  kind: 'curve';
  id: string;
  xExpr: string;
  yExpr: string;
  zExpr?: string;
  tMin: string;
  tMax: string;
  color: string;
  visible: boolean;
  showTangentAtParam?: string;
}

export interface PolygonalObject {
  kind: 'polygonal';
  id: string;
  curveId: string;
  segmentsExpr: string;
  color: string;
  visible: boolean;
}

export interface VectorFieldObject {
  kind: 'vectorfield';
  id: string;
  fxExpr: string;
  fyExpr: string;
  color: string;
  visible: boolean;
  showCurlHeatmap?: boolean;
}

export interface DomainObject {
  kind: 'domain';
  id: string;
  aExpr: string;
  bExpr: string;
  alphaExpr: string;
  betaExpr: string;
  color: string;
  visible: boolean;
  showBoundaryArrows?: boolean;
  sliceXParam?: string;
}

export interface ComplexFnObject {
  kind: 'complexFn';
  id: string;
  expr: string;
  visible: boolean;
  domainColoring?: boolean;
}

export interface ContourObject {
  kind: 'contour';
  id: string;
  shape: 'circle' | 'ellipse';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  color: string;
  visible: boolean;
}

export interface PoleObject {
  kind: 'pole';
  id: string;
  re: number;
  im: number;
  label?: string;
  color: string;
  visible: boolean;
}

export interface PointObject {
  kind: 'point';
  id: string;
  x: number;
  y: number;
  z?: number;
  label?: string;
  color: string;
  visible: boolean;
  draggable?: boolean;
}

export type SceneObject =
  | SurfaceObject
  | PlotObject
  | CurveObject
  | PolygonalObject
  | VectorFieldObject
  | DomainObject
  | ComplexFnObject
  | ContourObject
  | PoleObject
  | PointObject;

export interface MeasureDef {
  label: string;
  expr: string;
}

export interface ProofOverlayConfig {
  mode?: 'length' | 'gaussGreen' | 'residues' | 'fourier';
  showCuts?: boolean;
  showCircles?: boolean;
  showCurlHeatmap?: boolean;
  showSlice?: boolean;
  showDirichlet?: boolean;
  showPhiMinus?: boolean;
  showJumpMean?: boolean;
  showTangentVector?: boolean;
  showExactIntegral?: boolean;
  fourierPreset?: 'square' | 'sawtooth';
  fourierMode?: 'signal' | 'kernel' | 'phi';
  tangentPoint?: { x: number; y: number } | null;
  sectionZ?: number | null;
}

export interface SceneSpec {
  view: ViewMode;
  range: SceneRange;
  params: ParamDef[];
  objects: SceneObject[];
  measures: MeasureDef[];
  overlay?: ProofOverlayConfig;
}

export interface DslDiagnostic {
  line: number;
  message: string;
}

export interface DslParseResult {
  scene: SceneSpec;
  errors: DslDiagnostic[];
}
