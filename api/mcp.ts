/**
 * Vercel Serverless Function entry for the Portfolio MCP server.
 *
 * Serves the SAME shared Portfolio MCP server (see ../src/server.ts)
 * over Streamable HTTP at /api/mcp, in stateless mode — Vercel
 * serverless functions keep no state between invocations, so every
 * request gets a fresh server + transport (sessionIdGenerator:
 * undefined). No secrets, no env vars, no network calls.
 *
 * How Vercel runs this file:
 *   - Files in api/ become serverless functions; this one maps to
 *     POST /api/mcp (and GET /api/mcp for a health/info response).
 *   - Vercel bundles the relative import ../src/server.js together
 *     with this file (the .js extension is the NodeNext convention
 *     for importing the ../src/server.ts source).
 *   - Vercel parses JSON request bodies automatically and puts the
 *     result on req.body; if a body was not pre-parsed, the raw
 *     request stream is read instead.
 *
 * The stdio version (src/index.ts) is untouched — this file only adds
 * the HTTP transport for the live deployment.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  createPortfolioServer,
  SERVER_NAME,
  SERVER_VERSION,
} from "../src/server.js";

/** Vercel's Node request: a standard IncomingMessage, plus a parsed
 *  JSON body on `body` when Vercel's body parser ran. */
type VercelRequest = IncomingMessage & { body?: unknown };

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const text = Buffer.concat(chunks).toString("utf-8");
  if (!text.trim()) return undefined;
  return JSON.parse(text);
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function infoBody() {
  return {
    status: "ok",
    name: SERVER_NAME,
    version: SERVER_VERSION,
    transport: "streamable-http (stateless)",
    mcpEndpoint: "/api/mcp",
    tools: ["get_profile", "list_projects", "get_project"],
  };
}

export default async function handler(
  req: VercelRequest,
  res: ServerResponse,
): Promise<void> {
  if (req.method === "GET") {
    sendJson(res, 200, infoBody());
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method not allowed" });
    return;
  }

  let parsedBody: unknown;
  try {
    // Vercel pre-parses JSON bodies onto req.body; otherwise read the stream.
    parsedBody =
      req.body !== undefined ? req.body : await readJsonBody(req);
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
