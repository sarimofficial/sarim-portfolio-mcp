# sarim-portfolio-mcp

Portfolio MCP server for **Muhammad Sarim** — exposes his verified
profile and projects through exactly 3 tools. It runs in two modes
that share the same server code (`src/portfolio.ts`):

- **Local stdio** (`src/stdio.ts`) — for Claude Code / Claude Desktop
  on your own machine. This is the original mode and still works
  exactly as before.
- **Streamable HTTP** (`api/mcp.ts`) — for the live Vercel deployment,
  in stateless mode (Vercel serverless functions keep no state between
  requests). `src/http.ts` is the same HTTP server for local testing.

The server is **not deployed yet** — the live URL is created by the
Vercel deploy step below. Until then, only the local modes work.

## Tools (exactly 3)

| Tool | What it does |
| --- | --- |
| `get_profile` | Returns his verified profile: name, title, location, contact links, experience (~2 years), skills. |
| `list_projects` | Returns the verified projects list (id, name, short description). |
| `get_project` | Takes a project id or name and returns that project's full details. Returns a clear error for an unknown id. Takes the argument `project` (not `id`). |

Projects live in `src/projects.ts` (the only place the list lives).
Current list (user-confirmed 9 Nov 2026): Core X App and Admin Panel
(https://simple-landing-page-gym.vercel.app/), WebNexAI
(https://webnexai.vercel.app/), BiteCraft
(https://snack-store-six.vercel.app/). No invented experience,
clients, results, or links are included.

## Install / build / run (local stdio)

```bash
cd ~/workspace/mcp-servers/sarim-portfolio-mcp
npm install
npm run build
npm start
```

`npm start` runs the server over stdio (`node dist/stdio.js`). It prints
nothing to stdout except MCP protocol messages; the startup line goes to
stderr. Stop it with Ctrl+C.

## Use in Claude Code (local stdio)

```bash
claude mcp add sarim-portfolio -- node /home/hatch/workspace/mcp-servers/sarim-portfolio-mcp/dist/stdio.js
```

Then restart Claude Code (or run `/mcp` inside it) and ask it, e.g.
"Use the sarim-portfolio MCP server to show Muhammad Sarim's profile"
or "List his projects, then get the details for Core X".

## Use in Claude Desktop (local stdio)

Add this to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "sarim-portfolio": {
      "command": "node",
      "args": ["/home/hatch/workspace/mcp-servers/sarim-portfolio-mcp/dist/stdio.js"]
    }
  }
}
```

Then restart Claude Desktop.

## HTTP mode (local test of the live version)

```bash
npm run build
npm run start:http          # listens on http://localhost:3000
PORT=3100 npm run start:http
```

Endpoints:

- `POST /mcp` — MCP Streamable HTTP (`initialize`, `tools/list`,
  `tools/call`). Stateless: every request is independent, no session
  is kept between requests.
- `GET /` and `GET /mcp` — health/info JSON.

Test it with curl (each POST is a separate, independent request):

```bash
curl -s http://localhost:3000/
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "MCP-Protocol-Version: 2024-11-05" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"curl","version":"1.0"}}}'
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_projects","arguments":{}}}'
```

Responses come back as SSE (`text/event-stream`) when the `Accept`
header includes it — one `event: message` carrying the JSON-RPC result.

## Deploy to Vercel (live)

The live endpoint is `api/mcp.ts` → `POST https://<your-project>.vercel.app/api/mcp`.
No push or deploy has been done from this folder yet — these steps are
done separately, by a human, in the browser:

1. **Push to GitHub** — create a public repo (planned name:
   `sarim-portfolio-mcp`, account `sarimofficial`) and push this whole
   folder to it. Do not push `node_modules/` or `dist/` (both are
   git-ignored — check `.gitignore` covers them before pushing).
2. **Import into Vercel** — in Vercel, "Add New → Project", import the
   GitHub repo. No framework preset is needed; no environment variables
   are needed; no secrets are needed.
3. **Deploy** — Vercel builds (`npm run build`) and deploys. The API
   route `api/mcp.ts` becomes the live endpoint.
4. **Verify the live URL** — check `GET https://<your-project>.vercel.app/api/mcp`
   returns the info JSON (`status: "ok"`, tools list), then POST an
   `initialize` request the same way as in the local curl test above.
5. **Use it from an MCP client** — point the client at the live URL
   as a Streamable HTTP MCP server, e.g. in Claude Code:
   `claude mcp add --transport http sarim-portfolio https://<your-project>.vercel.app/api/mcp`
   (check the exact flag for the Claude Code version in use).

After the deploy, update `EASTWOOD-DESCRIPTION.md` — it currently says
the server is local and not deployed, which stops being true once the
live link exists.

Note: the live endpoint is public — anyone with the URL can call the
three tools. That is fine here: the server only returns public profile
and project information, no secrets and no private data.

## Test

See `TEST-RESULTS.md` for the recorded tests: the original end-to-end
stdio test, the BiteCraft update, and the HTTP version tests
(stdio regression, local HTTP curl checks, and the compiled Vercel
entry check).
