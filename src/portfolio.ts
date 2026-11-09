/**
 * sarim-portfolio-mcp — shared MCP server factory.
 *
 * This module creates the McpServer with the three tools
 * (get_profile, list_projects, get_project) and ALL of the verified
 * data. It is shared by every transport so the tools are defined
 * exactly once:
 *   - src/stdio.ts  — local stdio transport (Claude Code / Desktop)
 *   - src/http.ts   — local HTTP transport (testing the live version)
 *   - api/mcp.ts    — Vercel serverless function (Streamable HTTP)
 *
 * Data rules: ONLY verified facts about Muhammad Sarim. No 4+ years,
 * no degree, no invented clients, results or metrics. The projects
 * list lives ONLY in ./projects.ts — this file never hard-codes it.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PROJECTS, type Project } from "./projects.js";

export const SERVER_NAME = "sarim-portfolio-mcp";
export const SERVER_VERSION = "1.0.0";

export const PROFILE = {
  name: "Muhammad Sarim",
  title: "Forward Deployed Engineer / Full Stack Engineer",
  location: "Karachi, Pakistan",
  email: "mrsarimofficial@gmail.com",
  linkedin: "https://linkedin.com/in/muhammadsarimofficial",
  portfolio: "https://sarimportfolios-ktbk.vercel.app",
  github: "https://github.com/sarimofficial",
  experience: {
    total: "~2 years",
    current: {
      role: "Forward Deployed Engineer / Full Stack Engineer",
      company: "Elevatech Solutions",
      period: "Mar 2025–Present",
    },
    previous: {
      role: "Mobile Application Developer",
      company: "App Vertices",
      period: "Sep 2024–Sep 2025",
    },
  },
  skills: [
    "React / Next.js",
    "React Native / Expo",
    "Node.js / Express",
    "Python / FastAPI",
    "OpenAI SDK",
    "Stripe",
    "Firebase",
    "Docker / CI-CD",
  ],
} as const;

// Projects data lives in ./projects.ts (the ONLY place the list lives),
// so the list can be swapped in one edit without touching server logic.
function findProject(query: string): Project | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return PROJECTS.find(
    (p) => p.id.toLowerCase() === q || p.name.toLowerCase() === q,
  );
}

function textResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * Create a fresh McpServer instance. A new instance is needed per
 * transport connection — in particular, the stateless HTTP transport
 * creates one server per incoming request.
 */
export function createPortfolioServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  server.tool(
    "get_profile",
    "Returns Muhammad Sarim's verified profile: name, title, location, contact links, experience and skills.",
    {},
    async () => textResult(PROFILE),
  );

  server.tool(
    "list_projects",
    "Returns the list of Muhammad Sarim's verified projects (id, name and short description). Use get_project with an id to get full details.",
    {},
    async () =>
      textResult(
        PROJECTS.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          ...(p.status ? { status: p.status } : {}),
        })),
      ),
  );

  const validIds = PROJECTS.map((p) => p.id).join(", ");
  server.tool(
    "get_project",
    `Returns full details for one project by id or name. Valid ids: ${validIds}.`,
    {
      project: z
        .string()
        .min(1, "project must be a non-empty id or name")
        .describe(
          "Project id or name, e.g. 'core-x' or 'Core X App and Admin Panel'",
        ),
    },
    async ({ project }) => {
      const found = findProject(project);
      if (!found) {
        throw new Error(
          `Unknown project: "${project}". Valid project ids are: ${validIds}.`,
        );
      }
      return textResult(found);
    },
  );

  return server;
}
