import type { CadObject } from "../domain/cadObject.js";
import { lineBoundingBox, point, translateBox } from "../domain/geometry.js";
import type { AddLineCommand, CadGateway, InsertBlockCommand, MoveObjectCommand } from "../application/cadGateway.js";

export class InMemoryCadGateway implements CadGateway {
  private readonly objects = new Map<string, CadObject>();
  private nextId = 1;

  public constructor(initialObjects: readonly CadObject[] = []) {
    for (const object of initialObjects) {
      this.objects.set(object.id, object);
    }
    this.nextId = initialObjects.length + 1;
  }

  public async addLine(command: AddLineCommand): Promise<CadObject> {
    const object: CadObject = {
      id: this.createId(),
      kind: "line",
      layer: command.layer ?? "0",
      boundingBox: lineBoundingBox(command.start, command.end),
      metadata: {
        start: command.start,
        end: command.end,
      },
    };
    this.objects.set(object.id, object);
    return object;
  }

  public async insertBlock(command: InsertBlockCommand): Promise<CadObject> {
    const scale = command.scale ?? point(1, 1, 1);
    const size = 10;
    const object: CadObject = {
      id: this.createId(),
      kind: "block",
      layer: command.layer ?? "0",
      boundingBox: {
        min: command.insertionPoint,
        max: point(
          command.insertionPoint.x + size * scale.x,
          command.insertionPoint.y + size * scale.y,
          command.insertionPoint.z,
        ),
      },
      metadata: {
        name: command.name,
        insertionPoint: command.insertionPoint,
        rotation: command.rotation ?? 0,
        scale,
      },
    };
    this.objects.set(object.id, object);
    return object;
  }

  public async listObjects(): Promise<CadObject[]> {
    return [...this.objects.values()];
  }

  public async moveObject(command: MoveObjectCommand): Promise<CadObject> {
    const object = this.objects.get(command.objectId);
    if (!object) {
      throw new Error(`CAD object not found: ${command.objectId}`);
    }

    const moved: CadObject = {
      ...object,
      boundingBox: translateBox(object.boundingBox, command.delta),
      metadata: {
        ...object.metadata,
        lastMoveDelta: command.delta,
      },
    };
    this.objects.set(moved.id, moved);
    return moved;
  }

  private createId(): string {
    const id = `mem-${this.nextId}`;
    this.nextId += 1;
    return id;
  }
}
