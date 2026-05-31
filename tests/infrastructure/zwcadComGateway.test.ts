import { describe, expect, it } from "vitest";
import { point } from "../../src/domain/geometry.js";
import { ZwcadComGateway } from "../../src/infrastructure/zwcadComGateway.js";

describe("ZwcadComGateway", () => {
  it("fails clearly when COM factory is not configured", async () => {
    const gateway = new ZwcadComGateway();

    await expect(gateway.listObjects()).rejects.toThrow("COM factory is not configured");
  });

  it("delegates AddLine to ZWCAD model space", async () => {
    const calls: unknown[] = [];
    const gateway = new ZwcadComGateway({
      comFactory: () => ({
        ActiveDocument: {
          ModelSpace: {
            AddLine: (start: number[], end: number[]) => {
              calls.push({ start, end });
              return { Handle: "42", ObjectName: "AcDbLine", Layer: "0" };
            },
          },
        },
      }),
    });

    const result = await gateway.addLine({ start: point(1, 2, 0), end: point(3, 4, 0) });

    expect(calls).toEqual([{ start: [1, 2, 0], end: [3, 4, 0] }]);
    expect(result.id).toBe("42");
    expect(result.kind).toBe("line");
  });
});
