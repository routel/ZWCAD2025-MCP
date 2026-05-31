import { describe, expect, it } from "vitest";
import { DrawingService } from "../../src/application/drawingService.js";
import { point } from "../../src/domain/geometry.js";
import { InMemoryCadGateway } from "../../src/infrastructure/inMemoryCadGateway.js";

describe("DrawingService listObjects", () => {
  it("returns all objects when no filter is provided", async () => {
    const service = new DrawingService(new InMemoryCadGateway());

    await service.addLine({ start: point(0, 0, 0), end: point(10, 0, 0), layer: "geometry" });
    await service.insertBlock({ name: "PUMP", insertionPoint: point(1, 1, 0), layer: "equipment" });

    const objects = await service.listObjects();

    expect(objects).toHaveLength(2);
    expect(objects.map((object) => object.kind)).toEqual(["line", "block"]);
  });

  it("filters objects by kind and layer", async () => {
    const service = new DrawingService(new InMemoryCadGateway());

    await service.addLine({ start: point(0, 0, 0), end: point(10, 0, 0), layer: "geometry" });
    await service.insertBlock({ name: "PUMP", insertionPoint: point(1, 1, 0), layer: "equipment" });
    await service.insertBlock({ name: "VALVE", insertionPoint: point(20, 20, 0), layer: "equipment" });

    const objects = await service.listObjects({ kind: "block", layer: "equipment" });

    expect(objects).toHaveLength(2);
    expect(objects.every((object) => object.kind === "block")).toBe(true);
    expect(objects.every((object) => object.layer === "equipment")).toBe(true);
  });

  it("supports limiting returned objects", async () => {
    const service = new DrawingService(new InMemoryCadGateway());

    await service.insertBlock({ name: "A", insertionPoint: point(0, 0, 0) });
    await service.insertBlock({ name: "B", insertionPoint: point(20, 0, 0) });
    await service.insertBlock({ name: "C", insertionPoint: point(40, 0, 0) });

    const objects = await service.listObjects({ limit: 2 });

    expect(objects).toHaveLength(2);
  });
});
