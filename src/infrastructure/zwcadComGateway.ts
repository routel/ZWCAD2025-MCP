import type { CadObject } from "../domain/cadObject.js";
import { lineBoundingBox, point, translateBox, type BoundingBox } from "../domain/geometry.js";
import type { AddLineCommand, CadGateway, InsertBlockCommand, MoveObjectCommand } from "../application/cadGateway.js";

type ComFactory = (programId: string) => unknown;

export interface ZwcadComGatewayOptions {
  readonly programId?: string;
  readonly comFactory?: ComFactory;
}

interface ComEntity {
  readonly ObjectID?: string | number;
  readonly Handle?: string;
  readonly ObjectName?: string;
  readonly Layer?: string;
  Move?: (from: number[], to: number[]) => void;
  GetBoundingBox?: (min: { value?: number[] } | number[], max: { value?: number[] } | number[]) => void;
}

interface ComModelSpace {
  AddLine(start: number[], end: number[]): ComEntity;
  InsertBlock(point: number[], name: string, xScale: number, yScale: number, zScale: number, rotation: number): ComEntity;
  Count?: number;
  Item?: (index: number) => ComEntity;
}

interface ComDocument {
  readonly ModelSpace: ComModelSpace;
}

interface ComApplication {
  readonly ActiveDocument: ComDocument;
}

/**
 * Windows/ZWCAD実機用のCOMアダプタです。
 *
 * Node.jsからCOMを扱うライブラリは環境差が大きいため、このクラスはCOM生成処理を注入できる形にしています。
 * 例: `new ZwcadComGateway({ comFactory: (programId) => new ActiveXObject(programId) })`
 */
export class ZwcadComGateway implements CadGateway {
  private readonly programId: string;
  private readonly comFactory?: ComFactory;

  public constructor(options: ZwcadComGatewayOptions = {}) {
    this.programId = options.programId ?? "ZWCAD.Application";
    this.comFactory = options.comFactory;
  }

  public async addLine(command: AddLineCommand): Promise<CadObject> {
    const entity = this.modelSpace().AddLine(toComPoint(command.start), toComPoint(command.end));
    if (command.layer && "Layer" in entity) {
      (entity as { Layer: string }).Layer = command.layer;
    }
    return this.toCadObject(entity, lineBoundingBox(command.start, command.end), "line");
  }

  public async insertBlock(command: InsertBlockCommand): Promise<CadObject> {
    const scale = command.scale ?? point(1, 1, 1);
    const entity = this.modelSpace().InsertBlock(
      toComPoint(command.insertionPoint),
      command.name,
      scale.x,
      scale.y,
      scale.z,
      command.rotation ?? 0,
    );
    if (command.layer && "Layer" in entity) {
      (entity as { Layer: string }).Layer = command.layer;
    }
    return this.toCadObject(entity, undefined, "block");
  }

  public async listObjects(): Promise<CadObject[]> {
    const modelSpace = this.modelSpace();
    const count = modelSpace.Count ?? 0;
    const objects: CadObject[] = [];
    for (let index = 0; index < count; index += 1) {
      const entity = modelSpace.Item?.(index);
      if (entity) {
        objects.push(this.toCadObject(entity));
      }
    }
    return objects;
  }

  public async moveObject(command: MoveObjectCommand): Promise<CadObject> {
    const target = (await this.listObjects()).find((object) => object.id === command.objectId);
    if (!target) {
      throw new Error(`CAD object not found: ${command.objectId}`);
    }

    const entity = this.findEntity(command.objectId);
    if (!entity?.Move) {
      throw new Error(`CAD object cannot be moved through COM: ${command.objectId}`);
    }

    entity.Move([0, 0, 0], toComPoint(command.delta));
    return { ...target, boundingBox: translateBox(target.boundingBox, command.delta) };
  }

  private application(): ComApplication {
    if (!this.comFactory) {
      throw new Error(
        "COM factory is not configured. Provide ZwcadComGatewayOptions.comFactory on Windows with ZWCAD installed.",
      );
    }
    return this.comFactory(this.programId) as ComApplication;
  }

  private modelSpace(): ComModelSpace {
    return this.application().ActiveDocument.ModelSpace;
  }

  private findEntity(objectId: string): ComEntity | undefined {
    const modelSpace = this.modelSpace();
    const count = modelSpace.Count ?? 0;
    for (let index = 0; index < count; index += 1) {
      const entity = modelSpace.Item?.(index);
      if (entity && this.entityId(entity) === objectId) {
        return entity;
      }
    }
    return undefined;
  }

  private toCadObject(entity: ComEntity, fallbackBox?: BoundingBox, fallbackKind: CadObject["kind"] = "unknown"): CadObject {
    return {
      id: this.entityId(entity),
      kind: this.entityKind(entity.ObjectName, fallbackKind),
      layer: entity.Layer ?? "0",
      boundingBox: this.readBoundingBox(entity) ?? fallbackBox ?? { min: point(0, 0, 0), max: point(0, 0, 0) },
      metadata: {
        objectName: entity.ObjectName,
        handle: entity.Handle,
      },
    };
  }

  private entityId(entity: ComEntity): string {
    return String(entity.Handle ?? entity.ObjectID ?? crypto.randomUUID());
  }

  private entityKind(objectName: string | undefined, fallback: CadObject["kind"]): CadObject["kind"] {
    const normalized = objectName?.toLowerCase() ?? "";
    if (normalized.includes("line")) return "line";
    if (normalized.includes("block")) return "block";
    if (normalized.includes("circle")) return "circle";
    if (normalized.includes("polyline")) return "polyline";
    if (normalized.includes("text")) return "text";
    return fallback;
  }

  private readBoundingBox(entity: ComEntity): BoundingBox | undefined {
    if (!entity.GetBoundingBox) {
      return undefined;
    }

    const minRef: { value?: number[] } = {};
    const maxRef: { value?: number[] } = {};
    entity.GetBoundingBox(minRef, maxRef);
    const min = minRef.value;
    const max = maxRef.value;
    if (!min || !max) {
      return undefined;
    }

    return {
      min: point(min[0], min[1], min[2] ?? 0),
      max: point(max[0], max[1], max[2] ?? 0),
    };
  }
}

const toComPoint = (p: { x: number; y: number; z: number }): number[] => [p.x, p.y, p.z];
