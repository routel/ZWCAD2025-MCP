import type { CadObject, CadObjectKind, DrawingSummary } from "../domain/cadObject.js";
import { createResolveOverlapPlan, detectOverlaps, type ResolveOverlapPlan } from "../domain/overlap.js";
import type { AddLineCommand, CadGateway, InsertBlockCommand, MoveObjectCommand } from "./cadGateway.js";

const CAD_KINDS: CadObjectKind[] = ["line", "block", "circle", "polyline", "text", "unknown"];

export class DrawingService {
  public constructor(private readonly cadGateway: CadGateway) {}

  public addLine(command: AddLineCommand): Promise<CadObject> {
    return this.cadGateway.addLine(command);
  }

  public insertBlock(command: InsertBlockCommand): Promise<CadObject> {
    return this.cadGateway.insertBlock(command);
  }

  public async analyzeDrawing(): Promise<DrawingSummary> {
    const objects = await this.cadGateway.listObjects();
    const countByKind = Object.fromEntries(CAD_KINDS.map((kind) => [kind, 0])) as Record<CadObjectKind, number>;
    const countByLayer: Record<string, number> = {};

    for (const object of objects) {
      countByKind[object.kind] += 1;
      countByLayer[object.layer] = (countByLayer[object.layer] ?? 0) + 1;
    }

    return {
      totalObjects: objects.length,
      countByKind,
      countByLayer,
      overlaps: detectOverlaps(objects),
    };
  }

  public async createResolveOverlapPlan(spacing?: number): Promise<ResolveOverlapPlan> {
    return createResolveOverlapPlan(await this.cadGateway.listObjects(), spacing);
  }

  public async resolveOverlaps(spacing?: number): Promise<ResolveOverlapPlan> {
    const plan = await this.createResolveOverlapPlan(spacing);
    for (const move of plan.moves) {
      const command: MoveObjectCommand = { objectId: move.objectId, delta: move.delta };
      await this.cadGateway.moveObject(command);
    }
    return plan;
  }
}
