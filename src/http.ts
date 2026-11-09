#!/usr/bin/env node
/**
 * sarim-portfolio-mcp — local HTTP entry point.
 *
 * Runs the SAME shared Portfolio MCP server (see ./portfolio.ts) over
 * Streamable HTTP, in stateless mode — the mode Vercel serverless
 * functions need, because they keep no state between requests.
 * A fresh server + transport is created for every POST request.
 *
 * This is for local testing of the live (Vercel) version only.
 * The stdio version in ./stdio.ts is untouched and still the way
 * Claude Code / Claude Desktop use the server locally.
 *
 * Usage:
 *   npm run build
 *   npm run start:http          # listens on http://localhost:3000
 *   PORT=3100 npm run start:http
 *
 * Endpoints:
 *   POST /mcp  — MCP Streamable HTTP (initialize, tools/list, tools/call)
 *   GET  /     — health/info JSON
 *   GET  /mcp  — same info JSON (stateless mode has no SSE stream)
 */

import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  createPortfolioServer,
  SERVER_NAME,
  SERVER_VERSION,
} from "./portfolio.js";

const PORT = Number(process.env.PORT ?? 3000);

function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function infoBody() {
  return {
    status: "ok",
    name: SERVER_NAME,
    version: SERVER_VERSION,
    transport: "streamable-http (stateless)",
    mcpEndpoint: "/mcp",
    tools: ["get_profile", "list_projects", "get_project"],
  };
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const text = Buffer.concat(chunks).toString("utf-8");
  if (!text.trim()) return undefined;
  return JSON.parse(text);
}

async function handleMcp(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  let parsedBody: unknown;
  try {
    parsedBody = await readJsonBody(req);
  } catch {
    sendJson(res, 400, {
      jsonrpc: "2.0",
      error: { code: -32700, message: "Parse error: body is not valid JSON" },
      id: null,
    });
    return;
  }

  try {
    const server = createPortfolioServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless mode (Vercel-compatible)
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, parsedBody);
  } catch (error: unknown) {
    console.error("MCP HTTP request failed:", error);
    if (!res.headersSent) {
      sendJson(res, 500, {
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal error" },
        id: null,
      });
    } else {
      res.end();
    }
  }
}

const httpServer = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  if (req.method === "POST" && url.pathname === "/mcp") {
    void handleMcp(req, res);
    return;
  }
  if (
    req.method === "GET" &&
    (url.pathname === "/" || url.pathname === "/mcp")
  ) {
    sendJson(res, 200, infoBody());
    return;
  }
  sendJson(res, 404, { error: "not found" });
});

httpServer.listen(PORT, () => {
  console.error(
    `sarim-portfolio-mcp HTTP listening on http://localhost:${PORT} (POST /mcp)`,
  );
});
