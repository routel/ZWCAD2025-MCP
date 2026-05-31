import type { CadObject } from "../domain/cadObject.js";
import type { Point3d } from "../domain/geometry.js";

export interface AddLineCommand {
  readonly start: Point3d;
  readonly end: Point3d;
  readonly layer?: string;
}

export interface InsertBlockCommand {
  readonly name: string;
  readonly insertionPoint: Point3d;
  readonly scale?: Point3d;
  readonly rotation?: number;
  readonly layer?: string;
}

export interface MoveObjectCommand {
  readonly objectId: string;
  readonly delta: Point3d;
}

export interface CadGateway {
  addLine(command: AddLineCommand): Promise<CadObject>;
  insertBlock(command: InsertBlockCommand): Promise<CadObject>;
  listObjects(): Promise<CadObject[]>;
  moveObject(command: MoveObjectCommand): Promise<CadObject>;
}
