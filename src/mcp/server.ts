import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { DrawingService } from "../application/drawingService.js";
import {
  addLineSchema,
  analyzeDrawingSchema,
  insertBlockSchema,
  listObjectsSchema,
  resolveOverlapsSchema,
} from "./schemas.js";

const jsonResult = (value: unknown): CallToolResult => ({
  content: [
    {
      type: "text",
      text: JSON.stringify(value, null, 2),
    },
  ],
});

const pointJsonSchema = {
  type: "object",
  properties: { x: { type: "number" }, y: { type: "number" }, z: { type: "number", default: 0 } },
  required: ["x", "y"],
} as const;

const tools: Tool[] = [
  {
    name: "zwcad_add_line",
    description: "ZWCADの現在図面に線分を追加します。例: start=(0,0,0), end=(100,0,0)",
    inputSchema: {
      type: "object",
      properties: {
        start: pointJsonSchema,
        end: pointJsonSchema,
        layer: { type: "string" },
      },
      required: ["start", "end"],
    },
  },
  {
    name: "zwcad_insert_block",
    description: "ZWCADの現在図面にブロックを挿入します。例: 1,1,0 座標に指定ブロックを追加します。",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        insertionPoint: pointJsonSchema,
        scale: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" }, z: { type: "number" } },
        },
        rotation: { type: "number", default: 0 },
        layer: { type: "string" },
      },
      required: ["name", "insertionPoint"],
    },
  },
  {
    name: "zwcad_list_objects",
    description: "現在図面のオブジェクト一覧を取得します。kind、layer、limitで絞り込みできます。",
    inputSchema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["line", "block", "circle", "polyline", "text", "unknown"] },
        layer: { type: "string" },
        limit: { type: "number", minimum: 1, maximum: 1000 },
      },
    },
  },
  {
    name: "zwcad_analyze_drawing",
    description: "現在図面のオブジェクト数、種別、レイヤー、重なり候補を分析します。",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "zwcad_resolve_overlaps",
    description: "重なっているオブジェクトを重ならないように移動する案を作成します。apply=trueで実際に移動します。",
    inputSchema: {
      type: "object",
      properties: {
        spacing: { type: "number", default: 10 },
        apply: { type: "boolean", default: false },
      },
    },
  },
];

export const createMcpServer = (drawingService: DrawingService): Server => {
  const server = new Server(
    {
      name: "zwcad2025-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const args = request.params.arguments ?? {};

    switch (request.params.name) {
      case "zwcad_add_line":
        return jsonResult(await drawingService.addLine(addLineSchema.parse(args)));
      case "zwcad_insert_block":
        return jsonResult(await drawingService.insertBlock(insertBlockSchema.parse(args)));
      case "zwcad_list_objects":
        return jsonResult(await drawingService.listObjects(listObjectsSchema.parse(args)));
      case "zwcad_analyze_drawing":
        analyzeDrawingSchema.parse(args);
        return jsonResult(await drawingService.analyzeDrawing());
      case "zwcad_resolve_overlaps": {
        const input = resolveOverlapsSchema.parse(args);
        const plan = input.apply
          ? await drawingService.resolveOverlaps(input.spacing)
          : await drawingService.createResolveOverlapPlan(input.spacing);
        return jsonResult(plan);
      }
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  });

  return server;
};

export const runStdioServer = async (drawingService: DrawingService): Promise<void> => {
  const server = createMcpServer(drawingService);
  const transport = new StdioServerTransport();
  await server.connect(transport);
};
