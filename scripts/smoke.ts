import { DrawingService } from "../src/application/drawingService.js";
import { point } from "../src/domain/geometry.js";
import { InMemoryCadGateway } from "../src/infrastructure/inMemoryCadGateway.js";

const service = new DrawingService(new InMemoryCadGateway());

const line = await service.addLine({
  start: point(0, 0, 0),
  end: point(100, 0, 0),
  layer: "smoke-line",
});

const firstBlock = await service.insertBlock({
  name: "SMOKE_BLOCK_A",
  insertionPoint: point(1, 1, 0),
  layer: "smoke-block",
});

const secondBlock = await service.insertBlock({
  name: "SMOKE_BLOCK_B",
  insertionPoint: point(1, 1, 0),
  layer: "smoke-block",
});

const before = await service.analyzeDrawing();
const plan = await service.createResolveOverlapPlan(20);
const appliedPlan = await service.resolveOverlaps(20);
const after = await service.analyzeDrawing();

const result = {
  ok: after.overlaps.length === 0,
  operations: {
    addedLine: line,
    insertedBlocks: [firstBlock, secondBlock],
    before,
    plan,
    appliedPlan,
    after,
  },
};

console.log(JSON.stringify(result, null, 2));

if (!result.ok) {
  console.error("Smoke verification failed: overlaps remain after applying move plan.");
  process.exitCode = 1;
}
