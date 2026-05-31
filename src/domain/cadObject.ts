import type { BoundingBox, Point3d } from "./geometry.js";

export type CadObjectId = string;
export type CadObjectKind = "line" | "block" | "circle" | "polyline" | "text" | "unknown";

export interface CadObject {
  readonly id: CadObjectId;
  readonly kind: CadObjectKind;
  readonly layer: string;
  readonly boundingBox: BoundingBox;
  readonly metadata?: Record<string, unknown>;
}

export interface LineObject extends CadObject {
  readonly kind: "line";
  readonly start: Point3d;
  readonly end: Point3d;
}

export interface BlockObject extends CadObject {
  readonly kind: "block";
  readonly name: string;
  readonly insertionPoint: Point3d;
  readonly rotation: number;
  readonly scale: Point3d;
}

export interface DrawingSummary {
  readonly totalObjects: number;
  readonly countByKind: Record<CadObjectKind, number>;
  readonly countByLayer: Record<string, number>;
  readonly overlaps: OverlapPair[];
}

export interface OverlapPair {
  readonly firstId: CadObjectId;
  readonly secondId: CadObjectId;
}
