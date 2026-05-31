import { describe, expect, it } from "vitest";
import type { CadObject } from "../../src/domain/cadObject.js";
import { point } from "../../src/domain/geometry.js";
import { createResolveOverlapPlan, detectOverlaps } from "../../src/domain/overlap.js";

const object = (id: string, minX: number, minY: number, maxX: number, maxY: number): CadObject => ({
  id,
  kind: "block",
  layer: "0",
  boundingBox: {
    min: point(minX, minY, 0),
    max: point(maxX, maxY, 0),
  },
});

describe("overlap domain service", () => {
  it("detects overlapping object pairs", () => {
    const overlaps = detectOverlaps([
      object("a", 0, 0, 10, 10),
      object("b", 5, 5, 15, 15),
      object("c", 20, 20, 30, 30),
    ]);

    expect(overlaps).toEqual([{ firstId: "a", secondId: "b" }]);
  });

  it("creates a deterministic move plan for overlapped objects", () => {
    const plan = createResolveOverlapPlan([
      object("a", 0, 0, 10, 10),
      object("b", 0, 0, 10, 10),
    ], 20);

    expect(plan.moves).toEqual([
      {
        objectId: "b",
        delta: point(20, 20, 0),
        reason: "重なり回避のためXY方向へ1回移動",
      },
    ]);
  });
});
