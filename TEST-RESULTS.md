# Test results — sarim-portfolio-mcp

Date: 9 Nov 2026, ~09:26 PKT
Environment: Node v24.22.1, npm 10.9.4, @modelcontextprotocol/sdk 1.32.2
(installed; package.json requires ^1.17.0), TypeScript 5.6.x.
Test harness: `/tmp/test-mcp.mjs` — spawns `node dist/index.js` and
drives it over stdio with JSON-RPC requests.

## What was run

1. `npm install` — completed (52 MB node_modules, package-lock.json
   created). Note: the first `npm install && npm run build` command was
   interrupted by a service restart while it was running; on re-check,
   `node_modules` and the lockfile were present and complete, and
   `npm run build` was re-run cleanly afterwards. Nothing was faked.
2. `npm run build` — exit 0, `tsc` produced `dist/index.js` and
   `dist/projects.js`. `node --check dist/index.js` passed.
3. End-to-end stdio test (`node /tmp/test-mcp.mjs`, exit 0):

| Step | Result |
| --- | --- |
| `initialize` | PASS — serverInfo `{ name: "sarim-portfolio-mcp", version: "1.0.0" }`, protocolVersion `2024-11-05` |
| `tools/list` | PASS — exactly 3 tools: `get_profile`, `list_projects`, `get_project` |
| `tools/call get_profile` | PASS — returned Muhammad Sarim, Forward Deployed Engineer / Full Stack Engineer, Karachi, Pakistan, mrsarimofficial@gmail.com, LinkedIn / portfolio / GitHub links, Elevatech Solutions Mar 2025–Present, App Vertices Sep 2024–Sep 2025, ~2 years, 8 skills |
| `tools/call list_projects` | PASS — exactly 2 projects: `core-x` (Core X App and Admin Panel) and `webnexai` (WebNexAI). No other projects listed. |
| `tools/call get_project` (`core-x`) | PASS — returned full Core X details, including "36 passing automated tests" |
| `tools/call get_project` (`unknown-project`) | PASS — clean error, `isError: true`, text: `Unknown project: "unknown-project". Valid project ids are: core-x, webnexai.` |

Server stderr on startup: `sarim-portfolio-mcp running over stdio` (stderr
only; stdout carries protocol messages only).

## Actual outputs (excerpts)

`initialize` response:

```json
{
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { "tools": { "listChanged": true } },
    "serverInfo": { "name": "sarim-portfolio-mcp", "version": "1.0.0" }
  },
  "jsonrpc": "2.0",
  "id": 1
}
```

`list_projects` returned text:

```json
[
  {
    "id": "core-x",
    "name": "Core X App and Admin Panel",
    "description": "Personal training platform for class/session bookings, member orders and administration; booking, cancellation and refund workflows for member app and admin portal; Apple/Google login, Firebase users, FCM alerts, SMTP email and OTP delivery; refund and photo-evidence workflows validated with 36 passing automated tests."
  },
  {
    "id": "webnexai",
    "name": "WebNexAI",
    "description": "Web & Mobile Application Development, AI Solutions, Cloud Application Development, UI/UX Design."
  }
]
```

`get_project` for an unknown id returned:

```json
{
  "result": {
    "content": [
      { "type": "text", "text": "Unknown project: \"unknown-project\". Valid project ids are: core-x, webnexai." }
    ],
    "isError": true
  },
  "jsonrpc": "2.0",
  "id": 6
}
```

Assertions in the harness: `ALL CHECKS PASSED`, exit code 0.

## What was NOT tested

- No GitHub push, no deployment, no live hosting — none was done.
- No Claude Code / Claude Desktop integration test was run (config
  snippets are in README.md; the user runs Claude Code himself).
- `get_project` for `webnexai` was not called in this run; its data is
  the same code path as `core-x` and it appears correctly in
  `list_projects`.

## Update — 9 Nov 2026 ~09:34 PKT (BiteCraft added)

- User chose "Sirf BiteCraft add karo": BiteCraft added to `src/projects.ts`
  (id `bitecraft`, link https://snack-store-six.vercel.app/); Vynote NOT added.
- `npm run build` — exit 0.
- Re-test: `list_projects` returns exactly 3 — `core-x`, `webnexai`,
  `bitecraft`. `get_project` (`bitecraft`) returns full BiteCraft details
  with the live link. `get_project` (`vynote`) returns a clean error:
  `Unknown project: "vynote". Valid project ids are: core-x, webnexai, bitecraft.`
- Note: `get_project` takes the argument name `project`, not `id`.

## Update — 9 Nov 2026 ~10:05 PKT (HTTP version for Vercel)

User approved: build an HTTP version so the server can go live on
Vercel, without breaking the local stdio version. No push to GitHub
and no Vercel deploy was done in this step — deployment is a separate
browser step afterwards.

### What changed

- `src/server.ts` (NEW) — shared factory `createPortfolioServer()`
  with the profile + all 3 tools. Both transports use it, so the tool
  definitions exist exactly once. Also fixes the old `get_project`
  description, which still said "Valid ids: core-x, webnexai" — it now
  lists all three ids (core-x, webnexai, bitecraft).
- `src/index.ts` — now a thin stdio wrapper around
  `createPortfolioServer()`; behaviour unchanged.
- `src/http.ts` (NEW) — local HTTP entry (`npm run start:http`,
  port 3000 or `$PORT`): POST /mcp (Streamable HTTP, stateless),
  GET / and GET /mcp return a health/info JSON.
- `api/mcp.ts` (NEW) — Vercel serverless function: POST /api/mcp
  (Streamable HTTP, stateless), GET /api/mcp returns info JSON.
  Handles both Vercel's pre-parsed `req.body` and a raw request stream.
- `vercel.json` (NEW) — schema only; no rewrites, no env vars, no secrets.
- `.gitignore` (NEW) — `node_modules/`, `dist/`, `.vercel/`, logs;
  added so the GitHub push step does not include build artifacts.
- `package.json` — added script `start:http` (`node dist/http.js`);
  description updated to mention both transports.
- `src/projects.ts` — only the comments were fixed (the old "two
  projects" note); the project list itself is unchanged (exactly 3).

### Build

- `npm run build` — exit 0. `dist/` now contains `index.js`,
  `server.js`, `http.js`, `projects.js`.
- `npx tsc --noEmit` on `api/mcp.ts` — passed (type-check OK).
- No forbidden project names in `src/` or `api/` (grep clean).

### Stdio regression test (after the refactor)

Harness: `/tmp/test-stdio-recheck.mjs` — spawns `node dist/index.js`.
ALL CHECKS PASSED (exit 0):

| Step | Result |
| --- | --- |
| `initialize` | PASS — serverInfo `{ name: "sarim-portfolio-mcp", version: "1.0.0" }` |
| `tools/list` | PASS — exactly 3 tools: `get_profile`, `list_projects`, `get_project` |
| `tools/call list_projects` | PASS — exactly 3: `core-x`, `webnexai`, `bitecraft` |
| `tools/call get_project` (`bitecraft`) | PASS — link `https://snack-store-six.vercel.app/` returned |
| `tools/call get_project` (`unknown-project`) | PASS — clean error, `isError: true`, valid ids `core-x, webnexai, bitecraft` |

### Local HTTP test (src/http.ts, port 3100)

Harness: `/tmp/run-http-test.sh` — starts `PORT=3100 node dist/http.js`,
runs curl against it, then stops the server. All requests below are
separate HTTP requests (stateless mode: no session is kept between
requests). MCP POST responses come back as SSE (`text/event-stream`)
because curl sends `Accept: application/json, text/event-stream`;
each body is one `event: message` with the JSON-RPC result. ALL PASSED:

| # | Request | Result |
| --- | --- | --- |
| 01 | GET / | HTTP 200, JSON: `{"status":"ok","name":"sarim-portfolio-mcp","version":"1.0.0","transport":"streamable-http (stateless)","mcpEndpoint":"/mcp","tools":["get_profile","list_projects","get_project"]}` |
| 02 | POST /mcp `initialize` | HTTP 200 — `protocolVersion: "2024-11-05"`, serverInfo `sarim-portfolio-mcp 1.0.0` |
| 03 | POST /mcp `tools/list` | HTTP 200 — exactly 3 tools: `get_profile`, `list_projects`, `get_project` |
| 04 | POST /mcp `tools/call get_profile` | HTTP 200 — full verified profile (Muhammad Sarim, Karachi, Elevatech Mar 2025–Present, App Vertices Sep 2024–Sep 2025, ~2 years, 8 skills) |
| 05 | POST /mcp `tools/call list_projects` | HTTP 200 — exactly 3 projects: `core-x`, `webnexai`, `bitecraft` |
| 06 | POST /mcp `tools/call get_project bitecraft` | HTTP 200 — full BiteCraft details, link `https://snack-store-six.vercel.app/` |
| 07 | POST /mcp `tools/call get_project unknown-project` | HTTP 200 with `isError: true` — `Unknown project: "unknown-project". Valid project ids are: core-x, webnexai, bitecraft.` |
| 08 | POST /mcp invalid JSON `{not json` | HTTP 400 — `{"jsonrpc":"2.0","error":{"code":-32700,"message":"Parse error: body is not valid JSON"},"id":null}` |

Server log: `sarim-portfolio-mcp HTTP listening on http://localhost:3100 (POST /mcp)`.

### Vercel entry test (api/mcp.ts, compiled to /tmp/mcp-vc)

The entry was compiled with `tsc` to a temp dir (`/tmp/mcp-vc`,
`api/mcp.js` + `src/server.js` + `src/projects.js`, with the
`../src/server.js` import resolving correctly) and wrapped in a plain
`node:http` server (harness `/tmp/test-vercel-entry.mjs`). ALL PASSED:

| Request | Result |
| --- | --- |
| GET /api/mcp | HTTP 200, JSON info (`mcpEndpoint: "/api/mcp"`, tools list) |
| POST /api/mcp `initialize` (raw stream body) | HTTP 200 — serverInfo `sarim-portfolio-mcp 1.0.0` |
| POST /api/mcp `tools/list` (pre-parsed `req.body`, as Vercel provides) | HTTP 200 — exactly 3 tools |
| POST /api/mcp `tools/call get_project core-x` (raw stream body) | HTTP 200 — full Core X details, link `https://simple-landing-page-gym.vercel.app/` |

### What was NOT tested

- No GitHub push, no Vercel deploy — none was done in this step.
  The live URL does not exist yet; it is created by the separate
  deploy step (see README.md). The Vercel bundler's own resolution of
  the `../src/server.js` import was verified by the local `tsc`
  compile above, not by an actual Vercel build.
- No Claude Code / Claude Desktop integration test for the HTTP
  transport; the stdio integration is unchanged and still the local
  route (see README.md).
