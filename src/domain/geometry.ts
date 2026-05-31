export type Millimeter = number;

export interface Point3d {
  readonly x: Millimeter;
  readonly y: Millimeter;
  readonly z: Millimeter;
}

export interface BoundingBox {
  readonly min: Point3d;
  readonly max: Point3d;
}

export const point = (x: number, y: number, z = 0): Point3d => ({ x, y, z });

export const translatePoint = (p: Point3d, delta: Point3d): Point3d => ({
  x: p.x + delta.x,
  y: p.y + delta.y,
  z: p.z + delta.z,
});

export const boxesOverlap2d = (a: BoundingBox, b: BoundingBox): boolean => {
  const separated =
    a.max.x <= b.min.x ||
    b.max.x <= a.min.x ||
    a.max.y <= b.min.y ||
    b.max.y <= a.min.y;
  return !separated;
};

export const translateBox = (box: BoundingBox, delta: Point3d): BoundingBox => ({
  min: translatePoint(box.min, delta),
  max: translatePoint(box.max, delta),
});

export const lineBoundingBox = (start: Point3d, end: Point3d): BoundingBox => ({
  min: point(Math.min(start.x, end.x), Math.min(start.y, end.y), Math.min(start.z, end.z)),
  max: point(Math.max(start.x, end.x), Math.max(start.y, end.y), Math.max(start.z, end.z)),
});
