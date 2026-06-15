# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An MCP (Model Context Protocol) server that wraps the Azure DevOps REST API, exposing ~26 tools (query/create/manage work items, test cases, bugs, sprints) to MCP clients like Claude Desktop. It runs over **stdio** — there is no HTTP server. The entry point is `src/server.ts`, which the MCP host launches as a subprocess.

## Commands

```bash
npm run dev         # Run the server with hot reload (tsx src/server.ts)
npm run build       # Compile TypeScript to dist/
npm run typecheck   # tsc --noEmit (run this after edits — there is no linter)
npm test            # vitest run (all tests)
npm run test:watch  # vitest in watch mode

# Run a single test file or test:
npx vitest run tests/projectContext.test.ts
npx vitest run -t "resolveProject precedence"

# Static tool-wiring audit (also runs in CI, after build):
node scripts/validateTools.mjs
```

CI (`.github/workflows/test.yml`) runs, in order: `typecheck` → `build` → `validateTools.mjs` → `test`, on Node 18 and 20.

## Module system gotchas (NodeNext ESM)

- This is a pure-ESM project (`"type": "module"`, `moduleResolution: NodeNext`). **All relative imports must use the `.js` extension even though the source is `.ts`** (e.g. `import { getClient } from "../lib/adoClient.js"`). Omitting it breaks the build.
- `tsconfig.json` **excludes `tests/`** from the build; tests are run by vitest directly, not compiled to `dist/`.

## Architecture

### The tool convention (most important pattern)
Every file in `src/tools/` exports exactly three things, named after the file (`foo.ts` → `foo`, `fooSchema`, `fooDescription`):
- `export async function foo(input): Promise<string>` — does the work, returns a string (usually `JSON.stringify`'d).
- `export const fooSchema = { ... }` — a **raw Zod shape object** (not `z.object(...)`), passed straight to `server.tool()`.
- `export const fooDescription = "..."` — the human/LLM-facing description.

To add a tool: create the file with this trio, then in `src/server.ts` (a) add the 3-name import, (b) add a `server.tool("snake_case_name", desc, schema, handler)` registration where the handler wraps the result as `{ content: [{ type: "text", text: await foo(input) }] }`, and (c) append the snake_case name to the `toolsRegistered` array (used only for the startup log line).

`tests/toolExportValidation.test.ts` enforces that tool files, server imports, and `server.tool()` registrations stay consistent — it derives counts dynamically, so you don't update a magic number. Note `scripts/validateTools.mjs` is more lenient (it only hard-requires the original 14 tools and warns on extras), which is why CI tolerates new tools.

### The ADO client layer (`src/lib/adoClient.ts`)
All HTTP to Azure DevOps goes through here — **never create raw axios instances in tools.**
- `getClient(project?)` returns a per-project, cached axios instance with PAT auth, base URL `https://dev.azure.com/{org}/{project}/_apis`, and a response interceptor that turns 401/403/404 into actionable messages.
- `resolveProject(project?)` decides which project a call targets, in priority order: **explicit `project` argument → session selection (`set_project`) → `ADO_PROJECT` env var**, throwing if none is set.
- Because `getClient` calls `resolveProject` internally, a tool gets full dynamic-project support just by accepting an optional `project` and calling `getClient(project)`. No other wiring is needed.
- **Org-level endpoints** (listing projects, verifying a project in `set_project`) require overriding the project-scoped base URL per-request: pass `{ baseURL: \`https://dev.azure.com/${ADO_ORG}/_apis\` }` to the axios call.

### Dynamic project navigation (`src/lib/projectContext.ts` + `src/tools/setProject.ts`)
`projectContext.ts` holds a module-level "currently selected project" for the session. The `set_project` tool verifies the project exists and stores it there; `resolveProject` reads it. This lets users pick a project once instead of passing `project` on every call.

### Other lib helpers
- `src/lib/wiql.ts` — `runWiqlQuery(whereClause, top, extraFields?, project?)` abstracts ADO's mandatory two-step query flow (run WIQL to get IDs, then batch-fetch full work-item details). Tools that list/search work items go through this.
- `src/lib/formatSteps.ts` — `formatStepsAsXml()` converts test steps into the XML that ADO's `Microsoft.VSTS.TCM.Steps` field requires, with XML escaping. Used by test-case creation.
- `src/types.ts` — shared types (`WorkItem`, `PatchOperation`, `TestStep`, `AdoClientConfig`, etc.).

## Environment & testing notes

- Required env vars: **`ADO_ORG`** and **`ADO_PAT`**. `ADO_PROJECT` is optional now that `set_project` exists. `adoClient.ts` **throws at module-load time** if `ADO_ORG` or `ADO_PAT` is missing.
- Consequence for tests: importing anything that transitively imports `adoClient.ts` runs that check. Tests either **set `process.env.ADO_ORG`/`ADO_PAT` before the import** (see `tests/projectContext.test.ts`) or **`vi.mock("../src/lib/adoClient.js", ...)`** the module entirely (see `tests/createTestCase.test.ts`, which mocks `getClient`/`resolveProject`). When mocking with shared spies, use `vi.hoisted()` so the spy exists before the hoisted `vi.mock` factory runs.
