#!/usr/bin/env node
/**
 * sarim-portfolio-mcp — local stdio entry point.
 *
 * Runs the shared Portfolio MCP server (see ./portfolio.ts) over stdio
 * for Claude Code / Claude Desktop. The tools and data live in
 * ./portfolio.ts and ./projects.ts — this file only wires up the
 * stdio transport.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createPortfolioServer } from "./portfolio.js";

async function main(): Promise<void> {
  const server = createPortfolioServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log only to stderr — stdout is reserved for the MCP protocol.
  console.error("sarim-portfolio-mcp running over stdio");
}

main().catch((error: unknown) => {
  console.error("sarim-portfolio-mcp failed to start:", error);
  process.exit(1);
});
