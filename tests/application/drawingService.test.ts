import { describe, expect, it } from "vitest";
import { DrawingService } from "../../src/application/drawingService.js";
import { point } from "../../src/domain/geometry.js";
import { InMemoryCadGateway } from "../../src/infrastructure/inMemoryCadGateway.js";

describe("DrawingService", () => {
  it("adds lines and blocks through a CAD gateway", async () => {
    const service = new DrawingService(new InMemoryCadGateway());

    const line = await service.addLine({ start: point(0, 0, 0), end: point(100, 0, 0) });
    const block = await service.insertBlock({ name: "VALVE", insertionPoint: point(1, 1, 0) });

    expect(line.kind).toBe("line");
    expect(block.kind).toBe("block");
  });

  it("analyzes drawing objects by kind, layer, and overlap", async () => {
    const gateway = new InMemoryCadGateway();
    const service = new DrawingService(gateway);

    await service.insertBlock({ name: "A", insertionPoint: point(0, 0, 0), layer: "equipment" });
    await service.insertBlock({ name: "B", insertionPoint: point(5, 5, 0), layer: "equipment" });

    const summary = await service.analyzeDrawing();

    expect(summary.totalObjects).toBe(2);
    expect(summary.countByKind.block).toBe(2);
    expect(summary.countByLayer.equipment).toBe(2);
    expect(summary.overlaps).toHaveLength(1);
  });

  it("resolves overlaps by moving later objects", async () => {
    const gateway = new InMemoryCadGateway();
    const service = new DrawingService(gateway);

    await service.insertBlock({ name: "A", insertionPoint: point(0, 0, 0) });
    await service.insertBlock({ name: "B", insertionPoint: point(0, 0, 0) });

    const plan = await service.resolveOverlaps(20);
    const summary = await service.analyzeDrawing();

    expect(plan.moves).toHaveLength(1);
    expect(summary.overlaps).toHaveLength(0);
  });
});
