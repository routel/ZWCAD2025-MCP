#!/usr/bin/env node
import { DrawingService } from "./application/drawingService.js";
import { InMemoryCadGateway } from "./infrastructure/inMemoryCadGateway.js";
import { ZwcadComGateway } from "./infrastructure/zwcadComGateway.js";
import { runStdioServer } from "./mcp/server.js";

const createGateway = () => {
  const mode = process.env.ZWCAD_MCP_MODE ?? "com";

  if (mode === "memory") {
    return new InMemoryCadGateway();
  }

  return new ZwcadComGateway({
    programId: process.env.ZWCAD_COM_PROGRAM_ID ?? "ZWCAD.Application",
  });
};

await runStdioServer(new DrawingService(createGateway()));
