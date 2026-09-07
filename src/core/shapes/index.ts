// src/core/shapes/index.ts
//
// Rounded polygons and the Material 3 shapes (a port of the geometry in
// androidx.graphics.shapes and Compose Material 3 MaterialShapes).

export type { Cubic, Point, PointTransformer } from './cubic';
export { straightLine, circularArc, pointOnCurve, cubicBounds } from './cubic';
export type { CornerRounding, RoundedPolygon } from './polygon';
export {
  UNROUNDED,
  roundedPolygon,
  regularPolygon,
  circle,
  star,
  transformPolygon,
  rotatePolygon,
  scalePolygon,
  polygonBounds,
  polygonMaxRadius,
  normalizePolygon,
} from './polygon';
export type { MaterialShapeName, RadialProfile } from './material';
export { materialShape, radialProfile } from './material';
