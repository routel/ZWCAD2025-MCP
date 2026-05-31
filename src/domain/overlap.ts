import type { CadObject, OverlapPair } from "./cadObject.js";
import { boxesOverlap2d, point, translateBox, type Point3d } from "./geometry.js";

export interface MovePlanItem {
  readonly objectId: string;
  readonly delta: Point3d;
  readonly reason: string;
}

export interface ResolveOverlapPlan {
  readonly moves: MovePlanItem[];
}

export const detectOverlaps = (objects: readonly CadObject[]): OverlapPair[] => {
  const overlaps: OverlapPair[] = [];

  for (let i = 0; i < objects.length; i += 1) {
    for (let j = i + 1; j < objects.length; j += 1) {
      if (boxesOverlap2d(objects[i].boundingBox, objects[j].boundingBox)) {
        overlaps.push({ firstId: objects[i].id, secondId: objects[j].id });
      }
    }
  }

  return overlaps;
};

export const createResolveOverlapPlan = (
  objects: readonly CadObject[],
  spacing = 10,
): ResolveOverlapPlan => {
  const placed: CadObject[] = [];
  const moves: MovePlanItem[] = [];

  for (const object of objects) {
    let current = object;
    let moveCount = 0;

    while (placed.some((placedObject) => boxesOverlap2d(placedObject.boundingBox, current.boundingBox))) {
      const delta = point(spacing, spacing, 0);
      current = {
        ...current,
        boundingBox: translateBox(current.boundingBox, delta),
      };
      moveCount += 1;
    }

    if (moveCount > 0) {
      moves.push({
        objectId: object.id,
        delta: point(spacing * moveCount, spacing * moveCount, 0),
        reason: `重なり回避のためXY方向へ${moveCount}回移動`,
      });
    }

    placed.push(current);
  }

  return { moves };
};
