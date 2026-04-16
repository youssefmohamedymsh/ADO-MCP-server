# ADO MCP Server - Complete Project Explanation

## Table of Contents
1. [Project Overview](#project-overview)
2. [What is MCP?](#what-is-mcp)
3. [Architecture & Design](#architecture--design)
4. [Core Components](#core-components)
5. [Tool Implementation Pattern](#tool-implementation-pattern)
6. [Configuration & Setup](#configuration--setup)
7. [Example Workflows](#example-workflows)
8. [Development & Testing](#development--testing)

---

## Project Overview

**ADO MCP Server** is a Node.js application that bridges Azure DevOps with AI assistants (Claude, GitHub Copilot, etc.) via the Model Context Protocol (MCP).

### Purpose
- Enable conversational interaction with Azure DevOps work items
- Allow AI to query stories, create test cases, log bugs, and manage assignments
- Provide 24 specialized tools for QA and project management workflows
- Maintain full type safety with TypeScript and Zod validation

### What You Can Do
- **Query**: Search stories, tasks, bugs, test cases, team members
- **Create**: Generate test cases, bugs, user stories, child tasks, epics
- **Manage**: Update states, assign work, link items, add comments
- **Report**: Get sprint coverage %, test run results, board columns

### Technology Stack
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.4
- **HTTP Client**: Axios 1.7 (for Azure DevOps API)
- **Validation**: Zod 3.23 (schema validation)
- **MCP SDK**: @modelcontextprotocol/sdk 1.0
- **Testing**: Vitest 1.6
- **Dev Tool**: tsx (TypeScript execution)

---

## What is MCP?

### Model Context Protocol
MCP is a **standardized protocol** that allows AI assistants to interact with external tools and data sources.

### How It Works (3 Steps)
```
Claude Desktop (Client) 
         ↓ (stdio connection)
ADO MCP Server (Your app)
         ↓ (HTTP REST calls)
Azure DevOps API
```

1. **Claude Desktop** opens your MCP server as a subprocess
2. **Your server** describes available tools (name, description, input schema)
3. **Claude** calls tools by name with arguments → server processes → returns JSON
4. **Claude** shows results in chat

### Why MCP?
- **Standardized**: Works with any MCP-compatible AI (Claude, Copilot, etc.)
- **Secure**: No API keys exposed to Claude — only your app connects
- **Fast**: Direct stdio communication, no network overhead
- **Type-safe**: Zod schemas enforce input validation

---

## Architecture & Design

### High-Level Flow
```
┌─────────────────────────────────────────────────────────────┐
│ Claude Desktop                                              │
│ User: "Create a test case for story 123"                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ JSON-RPC over stdio
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ ADO MCP Server (dist/server.js)                             │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ MCP Server (from SDK)                                │   │
│ │ - Receives tool call from Claude                     │   │
│ │ - Validates input with Zod schema                    │   │
│ │ - Routes to appropriate tool handler                 │   │
│ └────────────┬─────────────────────────────────────────┘   │
│              │                                               │
│ ┌────────────▼─────────────────────────────────────────┐   │
│ │ Tools (src/tools/*.ts)                               │   │
│ │ - createTestCase()                                   │   │
│ │ - updateWorkItem()                                   │   │
│ │ - linkWorkItems()                                    │   │
│ │ - ... 21 more tools                                  │   │
│ └────────────┬─────────────────────────────────────────┘   │
│              │                                               │
│ ┌────────────▼─────────────────────────────────────────┐   │
│ │ Library (src/lib/)                                   │   │
│ │ - adoClient: Axios wrapper with auth                │   │
│ │ - wiql: Query builder & executor                    │   │
│ │ - formatSteps: XML conversion for test steps        │   │
│ └────────────┬─────────────────────────────────────────┘   │
└────────────────┼────────────────────────────────────────────┘
                 │ HTTPS REST calls
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ Azure DevOps REST API                                       │
│ https://dev.azure.com/{org}/{project}/_apis/...            │
│                                                              │
│ - Work items endpoints (/wit/...)                           │
│ - Test case & run endpoints (/tcm/...)                      │
│ - Sprint & iteration endpoints (/work/...)                  │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure & Purpose

```
ado-mcp-server/
│
├── src/
│   ├── server.ts              ← Main MCP server entry point
│   ├── types.ts               ← TypeScript interfaces (WorkItem, TestCase, etc.)
│   │
│   ├── lib/
│   │   ├── adoClient.ts       ← Axios wrapper, handles auth & errors
│   │   ├── wiql.ts            ← Work Item Query Language executor
│   │   └── formatSteps.ts     ← Converts test steps to ADO XML format
│   │
│   └── tools/                 ← 24 tool implementations
│       ├── getUserStories.ts
│       ├── createTestCase.ts
│       ├── updateWorkItem.ts
│       ├── linkWorkItems.ts
│       └── ... (21 more)
│
├── dist/                      ← Compiled JavaScript (after npm run build)
├── config/
│   └── claude_desktop_config.json  ← MCP server registration
├── scripts/
│   └── validateTools.mjs      ← CI/CD validation script
├── tests/                     ← Unit tests (Vitest)
├── package.json               ← Dependencies & scripts
└── tsconfig.json              ← TypeScript configuration
```

---

## Core Components

### 1. **server.ts** - MCP Server & Tool Registration

This is the **entry point** that:
1. Initializes the MCP server
2. **Imports all 24 tools** and their schemas
3. **Registers each tool** with the MCP server
4. **Starts the server** on stdio

**Key Pattern:**
```typescript
import { getUserStories, getUserStoriesSchema, getUserStoriesDescription } 
  from "./tools/getUserStories.js";

// For each tool:
server.tool("get_user_stories", getUserStoriesDescription, getUserStoriesSchema, 
  async (input) => ({
    content: [{ type: "text", text: await getUserStories(input) }],
  })
);
```

Each tool registration requires **3 things**:
- **Name**: String ID used by Claude (e.g., `"get_user_stories"`)
- **Description**: Human-readable text explaining what it does
- **Schema**: Zod schema defining input parameters and validation
- **Handler**: Async function that executes the tool

**Tool Startup:**
```bash
npm run dev
# Starts stdio server, MCP SDK handles protocol
# Claude sends JSON-RPC calls over stdin
# Server sends results back over stdout
```

---

### 2. **types.ts** - Data Models

Defines all TypeScript interfaces that map to Azure DevOps REST API responses.

**Key Interfaces:**

```typescript
interface WorkItemFields {
  "System.Id": number;                    // Work item ID
  "System.Title": string;                 // Title
  "System.State": string;                 // Active, Closed, etc.
  "System.WorkItemType": string;          // User Story, Task, Bug, etc.
  "System.Description"?: string;          // Description text
  "Microsoft.VSTS.Common.AcceptanceCriteria"?: string;  // For stories
  "Microsoft.VSTS.TCM.Steps"?: string;    // XML-formatted test steps
  "Microsoft.VSTS.Common.Priority"?: number;  // 1-4
  "System.IterationPath"?: string;        // Sprint path
  "System.AreaPath"?: string;             // Team area
}

interface WorkItem {
  id: number;                 // e.g. 1234
  url: string;                // ADO REST endpoint URL
  fields: WorkItemFields;     // All field values
  relations?: WorkItemRelation[];  // Links to other items
  _links?: {
    html: { href: string };   // Link to ADO web UI
  };
}

interface UserStory extends Partial<WorkItem> {
  id: number;
  title: string;
  state: string;
  description: string;
  acceptanceCriteria: string;
  iterationPath?: string;
  areaPath?: string;
}

interface TestCase extends Partial<WorkItem> {
  id: number;
  title: string;
  state: string;
  linkedStoryId?: number;
}
```

**Why This Matters:**
- TypeScript prevents runtime errors by catching mismatched field names
- Interfaces document the shape of data returned to Claude
- Tools return JSON that safely maps to these types

---

### 3. **adoClient.ts** - Axios HTTP Wrapper

This is the **central HTTP client** for all Azure DevOps API calls.

**What It Does:**
1. **Creates an Axios instance** with:
   - Base URL: `https://dev.azure.com/{org}/{project}/_apis`
   - Auth: HTTP Basic (empty username + PAT as password)
   - Headers: Content-Type, Accept, etc.
   - Timeout: 15 seconds

2. **Handles authentication**:
   ```typescript
   const encodedPat = Buffer.from(`:${pat}`).toString("base64");
   // ADO expects: Authorization: Basic base64(":PAT")
   ```

3. **Caches clients per project**:
   ```typescript
   const clientCache = new Map<string, AxiosInstance>();
   // Reuse same Axios instance for multiple API calls
   // Avoid recreating connections
   ```

4. **Surfaces helpful error messages**:
   ```typescript
   if (status === 401) throw new Error("Azure DevOps auth failed. Check PAT...");
   if (status === 403) throw new Error("Permission denied. PAT needs scopes...");
   if (status === 404) throw new Error("Resource not found. Check org/project...");
   ```

**How Tools Use It:**
```typescript
import { getClient } from "../lib/adoClient.js";

export async function createTestCase(input) {
  const client = getClient(project);  // Get cached client
  const res = await client.post("/wit/workitems/$Test%20Case?api-version=7.0", patchDoc);
  return res.data;
}
```

**Environment Variables:**
```bash
ADO_ORG="intcorecompany"           # Azure DevOps organization
ADO_PROJECT="Congora"              # Default project name
ADO_PAT="B2KH07iXXXXXXXXXXXXXXXX"  # Personal Access Token (secret)
```

These are loaded from `.env` or from `claude_desktop_config.json`.

---

### 4. **wiql.ts** - Work Item Query Language

Azure DevOps uses **WIQL** (Work Item Query Language) — SQL-like syntax for querying.

**The Problem:**
Azure DevOps requires **two API calls** to get work items:
1. Query IDs via WIQL: `POST /wit/wiql`
2. Fetch full details: `GET /wit/workitems?ids=...`

**The Solution:**
`wiql.ts` abstracts both steps:

```typescript
export async function runWiqlQuery(
  whereClause: string,
  top: number = 20,
  extraFields?: string[],
  project?: string,
): Promise<WorkItem[]> {
  const client = getClient(project);

  // Step 1: Query for IDs
  const wiqlBody = {
    query: `SELECT [System.Id] FROM WorkItems WHERE ${whereClause} 
            ORDER BY [System.CreatedDate] DESC`,
  };
  const queryRes = await client.post("/wit/wiql?api-version=7.0&$top=${top}", wiqlBody);
  const ids = queryRes.data.workItems.map(w => w.id);

  // Step 2: Fetch full details
  const detailRes = await client.get(
    `/wit/workitems?ids=${ids.join(",")}&fields=${fields}&api-version=7.0`
  );

  return detailRes.data.value;  // Array of WorkItem objects
}
```

**Example WIQL Clauses:**
```typescript
// All user stories
"[System.WorkItemType] = 'User Story'"

// Active stories in Sprint 3
"[System.WorkItemType] = 'User Story' AND [System.State] = 'Active' 
 AND [System.IterationPath] = 'MyProject\\Sprint 3'"

// Bugs under the Backend area
"[System.WorkItemType] = 'Bug' AND [System.AreaPath] UNDER 'MyProject\\Backend'"
```

This abstraction means tools can focus on business logic without duplicating API call logic.

---

### 5. **formatSteps.ts** - Test Step XML Converter

Azure DevOps stores test steps as **XML** inside the `Microsoft.VSTS.TCM.Steps` field.

**Input** (from Claude):
```typescript
[
  { action: "Navigate to login page", expected: "Login page displayed" },
  { action: "Enter invalid credentials", expected: "Error message shown" }
]
```

**Output** (XML for ADO):
```xml
<steps id="0" last="2">
  <step id="1" type="ActionStep">
    <parameterizedString isformatted="true">Navigate to login page</parameterizedString>
    <parameterizedString isformatted="true">Login page displayed</parameterizedString>
    <description/>
  </step>
  <step id="2" type="ActionStep">
    <parameterizedString isformatted="true">Enter invalid credentials</parameterizedString>
    <parameterizedString isformatted="true">Error message shown</parameterizedString>
    <description/>
  </step>
</steps>
```

**Key Function - XML Escaping:**
```typescript
function escapeXml(raw: string): string {
  return raw
    .replace(/&/g,  "&amp;")   // Replace & with &amp;
    .replace(/</g,  "&lt;")    // Replace < with &lt;
    .replace(/>/g,  "&gt;")    // Replace > with &gt;
    .replace(/"/g,  "&quot;")  // Replace " with &quot;
    .replace(/'/g,  "&apos;"); // Replace ' with &apos;
}
```

This prevents malformed XML if test steps contain special characters like `<`, `>`, `&`.

---

## Tool Implementation Pattern

All 24 tools follow the **same exact pattern**. Here's `createTestCase.ts` as the template:

### Structure
```typescript
import { z } from "zod";
import { getClient, ADO_ORG, resolveProject } from "../lib/adoClient.js";
import { formatStepsAsXml } from "../lib/formatSteps.js";
import type { PatchOperation, WorkItem } from "../types.js";

// ─────────────────────────────────────────────────────────────────
// 1. DEFINE ZOD SCHEMA (Input validation)
// ─────────────────────────────────────────────────────────────────
export const createTestCaseSchema = {
  project: z.string().optional().describe("Azure DevOps project name"),
  title: z.string().min(1).describe("Test case title"),
  steps: z.array(z.object({
    action: z.string().describe("What the tester does"),
    expected: z.string().describe("Expected result"),
  })).min(1).describe("Ordered list of test steps"),
  linkedStoryId: z.number().optional().describe("User story ID to link"),
  priority: z.number().min(1).max(4).optional().describe("Priority 1-4"),
};

// ─────────────────────────────────────────────────────────────────
// 2. DESCRIPTION (Shown to Claude)
// ─────────────────────────────────────────────────────────────────
export const createTestCaseDescription =
  "Create a new Test Case work item in Azure DevOps with formatted steps, "
  + "and optionally link it to a User Story. Returns the new test case ID and URL.";

// ─────────────────────────────────────────────────────────────────
// 3. ASYNC HANDLER FUNCTION
// ─────────────────────────────────────────────────────────────────
export async function createTestCase(input: {
  project?: string;
  title: string;
  steps: Array<{ action: string; expected: string }>;
  linkedStoryId?: number;
  priority?: number;
}): Promise<string> {
  const { project, title, steps, linkedStoryId, priority = 2 } = input;
  const projectName = resolveProject(project);

  // Convert plain steps to XML
  const stepsXml = formatStepsAsXml(steps);

  // Build a "patch document" — ADO's JSON-Patch format
  // Used for creating or updating work items
  const patchDoc: PatchOperation[] = [
    { op: "add", path: "/fields/System.Title", value: title },
    { op: "add", path: "/fields/Microsoft.VSTS.TCM.Steps", value: stepsXml },
    { op: "add", path: "/fields/Microsoft.VSTS.Common.Priority", value: priority },
    
    // If linking to a story, add a relation
    ...(linkedStoryId ? [{
      op: "add" as const,
      path: "/relations/-",  // "-" means append to relations array
      value: {
        rel: "Microsoft.VSTS.Common.TestedBy-Reverse",
        url: `https://dev.azure.com/${ADO_ORG}/${projectName}/_apis/wit/workItems/${linkedStoryId}`,
        attributes: { comment: "Linked by AI MCP Server" },
      },
    }] : []),
  ];

  // Make API call
  const res = await getClient(project).post<WorkItem>(
    `/wit/workitems/$Test%20Case?api-version=7.0`,
    patchDoc,
    { headers: { "Content-Type": "application/json-patch+json" } }
  );

  // Return success response
  return JSON.stringify({
    success: true,
    testCaseId: res.data.id,
    title: res.data.fields["System.Title"],
    linkedStoryId,
    url: res.data._links?.html.href,
  }, null, 2);
}
```

### The Three Exports That server.ts Uses

Every tool **exports exactly 3 things**:

```typescript
export const createTestCaseSchema = { /* Zod schema */ };
export const createTestCaseDescription = "...";
export async function createTestCase(input) { /* logic */ }
```

In `server.ts`, they're imported and registered:
```typescript
import { createTestCase, createTestCaseSchema, createTestCaseDescription } 
  from "./tools/createTestCase.js";

server.tool("create_test_case", createTestCaseDescription, createTestCaseSchema, 
  async (input) => ({
    content: [{ type: "text", text: await createTestCase(input) }],
  })
);
```

### Request/Response Flow for `createTestCase`

```
Claude Desktop
│ User: "Create a test case for story 123 with steps..."
├─ Calls tool: create_test_case
│  Args: {
│    title: "Verify login with invalid password",
│    steps: [
│      { action: "Go to login", expected: "Form displayed" },
│      { action: "Submit invalid", expected: "Error shown" }
│    ],
│    linkedStoryId: 123
│  }
│
├─ server.ts receives JSON-RPC call
├─ Zod validates schema ✓
├─ Calls createTestCase(input) function
│
├─ function:
│  ├─ formatStepsAsXml(steps) → converts to XML
│  ├─ builpatch document with fields & relations
│  ├─ getClient().post() → HTTPS to ADO API
│  │  POST /wit/workitems/$Test%20Case
│  │  Content-Type: application/json-patch+json
│  │  [{ op: "add", path: "/fields/System.Title", value: "..." }, ...]
│  │
│  └─ ADO API creates test case #456
│
├─ function returns JSON:
│  {
│    "success": true,
│    "testCaseId": 456,
│    "title": "Verify login with invalid password",
│    "linkedStoryId": 123,
│    "url": "https://dev.azure.com/..._workitems/edit/456"
│  }
│
├─ server.ts wraps in MCP response format & sends to Claude
│
└─ Claude displays: "✓ Created test case #456"
```

---

## Configuration & Setup

### File: `claude_desktop_config.json`

This file tells Claude Desktop where to find your MCP server and what environment variables to use.

```json
{
  "mcpServers": {
    "azure-devops-qc": {
      "command": "node",
      "args": [
        "D:\\ado-mcp-server\\dist\\server.js"
      ],
      "env": {
        "ADO_ORG": "intcorecompany",
        "ADO_PROJECT": "Congora",
        "ADO_PAT": "***REMOVED***"
      }
    }
  }
}
```

**How It Works:**
1. Claude Desktop **reads this file on startup**
2. For each `mcpServer`, it runs: `node D:\ado-mcp-server\dist\server.js`
3. Sets environment variables in that process
4. Connects to server via **stdio** (stdin/stdout)
5. Server registers all tools
6. Claude can now use ADO tools in the chat

**Key Values:**
- `ADO_ORG`: Your Azure DevOps organization (e.g., "intcorecompany")
- `ADO_PROJECT`: Default project (e.g., "Congora")
- `ADO_PAT`: Personal Access Token with scopes:
  - ✓ Work Items (Read & Write)
  - ✓ Test Plans (Read & Write)

### Setup Steps for Your Juniors

1. **Clone the repo**:
   ```bash
   git clone <your-repo> ado-mcp-server
   cd ado-mcp-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build TypeScript**:
   ```bash
   npm run build
   ```

4. **Update `config/claude_desktop_config.json`**:
   ```json
   {
     "mcpServers": {
       "azure-devops-qc": {
         "command": "node",
         "args": ["C:\\path\\to\\dist\\server.js"],  // ← Update path
         "env": {
           "ADO_ORG": "your-org",
           "ADO_PROJECT": "your-project",
           "ADO_PAT": "your-pat"                    // ← Update PAT
         }
       }
     }
   }
   ```

5. **Install Claude Desktop config**:
   - **Windows**: Copy to `%APPDATA%\Claude\claude_desktop_config.json`
   - **Mac**: Copy to `~/Library/Application Support/Claude/claude_desktop_config.json`

6. **Restart Claude Desktop**

7. **Verify**:
   ```
   Claude: "Show me all sprints in the Congora project"
   ```

---

## Example Workflows

### Workflow 1: Create a Test Case from a User Story

**Command**:
```
Claude: "Create a test case for user story 123 with the following test steps:
1. Navigate to the login page → Login form is displayed
2. Enter valid credentials → Dashboard is shown"
```

**Behind the Scenes**:
1. Claude calls `create_test_case` tool with:
   ```json
   {
     "linkedStoryId": 123,
     "title": "Verify login credentials",
     "steps": [
       { "action": "Navigate to the login page", "expected": "Login form is displayed" },
       { "action": "Enter valid credentials", "expected": "Dashboard is shown" }
     ]
   }
   ```

2. `createTestCase()` function:
   - Converts steps to XML: `<steps><step id="1">...</step></steps>`
   - Builds patch doc with fields and relations
   - POSTs to `/wit/workitems/$Test%20Case`

3. Azure DevOps creates:
   - New Test Case #456
   - Title: "Verify login credentials"
   - Steps field (XML-formatted)
   - TestedBy relation linking to Story #123

4. Returns:
   ```json
   {
     "success": true,
     "testCaseId": 456,
     "linkedStoryId": 123,
     "url": "https://dev.azure.com/.../workitems/edit/456"
   }
   ```

5. Claude displays confirmation to user

---

### Workflow 2: Find Stories Without Tests & Create Tests

**Command**:
```
Claude: "Show me all active stories in Sprint 3 that don't have test cases, 
then create a basic test case for each"
```

**Steps**:
1. `get_user_stories(iterationPath="Congora\\Sprint 3", state="Active")`
   - WIQL query: `SELECT [System.Id] FROM WorkItems WHERE 
     [System.WorkItemType] = 'User Story' AND [System.State] = 'Active' 
     AND [System.IterationPath] = 'Congora\\Sprint 3'`
   - Returns array of user stories

2. For each story, `get_test_cases_for_story(storyId)`
   - Query relations: Story → TestedBy → Test Cases

3. Claude identifies stories with no test cases

4. For each uncovered story, `create_test_case()`
   - Creates new test case linked to story

---

### Workflow 3: Update Work Item State & Add Comment

**Command**:
```
Claude: "Update story 123 to state 'Ready for Test' and add comment: 
'Test cases approved by QA lead'"
```

**API Call**:
```typescript
updateWorkItem({
  workItemId: 123,
  state: "Ready for Test",
  comment: "Test cases approved by QA lead"
})
```

**Patch Document**:
```json
[
  { "op": "add", "path": "/fields/System.State", "value": "Ready for Test" },
  { "op": "add", "path": "/fields/System.History", "value": "Test cases approved by QA lead" }
]
```

**PATCH** `/wit/workitems/123?api-version=7.0` with the patch document.

**Response**:
```json
{
  "success": true,
  "workItemId": 123,
  "newState": "Ready for Test",
  "updatedFields": ["/fields/System.State", "/fields/System.History"],
  "url": "https://dev.azure.com/.../workitems/edit/123"
}
```

---

## Development & Testing

### Scripts

Open `package.json` to see all available scripts:

```bash
npm install              # Install dependencies
npm run dev             # Run with hot reload (tsx watches for changes)
npm run build           # Compile TypeScript → dist/
npm start               # Run compiled dist/server.js
npm run typecheck       # Type checking without emitting files
npm test                # Run all tests (Vitest)
npm run test:watch      # Run tests in watch mode (re-run on file change)
```

### Development Workflow

1. **Make changes** to `src/tools/myTool.ts` or `src/lib/myLib.ts`
2. **Run in dev mode**: `npm run dev`
3. **Test immediately** in Claude (changes auto-reload via tsx)
4. **Review logs** in terminal

### Testing

Tests are in `tests/` using **Vitest** (fast Jest alternative).

**Example test file** (`tests/createTestCase.test.ts`):
```typescript
import { describe, it, expect, vi } from "vitest";
import { createTestCase } from "../src/tools/createTestCase";

// Mock the ADO client
vi.mock("../src/lib/adoClient", () => ({
  getClient: vi.fn(() => ({
    post: vi.fn().mockResolvedValue({
      data: { id: 123, fields: { "System.Title": "Test Case" } }
    })
  }))
}));

describe("createTestCase", () => {
  it("should create a test case with steps", async () => {
    const result = await createTestCase({
      title: "Login Test",
      steps: [{ action: "Go to login", expected: "Form shown" }]
    });
    
    expect(result).toContain("123");  // Check ID in response
  });
});
```

**Run tests**:
```bash
npm test          # Run once
npm run test:watch # Watch mode
```

### Validation Script

Before pushing code, run the validation script:

```bash
node scripts/validateTools.mjs
```

This checks:
- ✓ All tool files exist (`src/tools/*.ts`)
- ✓ Each tool exports: `schema`, `description`, handler function
- ✓ All exports are registered in `server.ts`
- ✓ TypeScript compiles without errors

### Build & Deploy

```bash
# 1. Compile TypeScript to JavaScript
npm run build

# 2. Check for errors
npm run typecheck

# 3. Run tests
npm test

# 4. Distribute dist/ folder to your juniors/deployment
```

---

## Common Patterns & Design Decisions

### Pattern 1: Why Cache Axios Clients?

```typescript
const clientCache = new Map<string, AxiosInstance>();

export function getClient(project?: string): AxiosInstance {
  const p = resolveProject(project);
  if (!clientCache.has(p)) {
    clientCache.set(p, createAdoClient({ org: ADO_ORG, project: p, pat: ADO_PAT_ENV }));
  }
  return clientCache.get(p)!;
}
```

**Why?**
- Axios instances maintain connection pooling
- Re-creating them for each request is wasteful
- One instance per project is efficient
- Tools just call `getClient()` and get a ready client

### Pattern 2: JSON-Patch for Updates

Azure DevOps uses **JSON Patch** format (RFC 6902) for updates:

```typescript
const patchDoc: PatchOperation[] = [
  { op: "add", path: "/fields/System.State", value: "Active" },
  { op: "replace", path: "/fields/System.Title", value: "New Title" },
  { op: "remove", path: "/fields/System.Description" }  // Not common
];

client.patch("/wit/workitems/123", patchDoc, {
  headers: { "Content-Type": "application/json-patch+json" }
});
```

**Why?**
- Allows atomic updates (multiple fields at once)
- Prevents partial updates if one field fails
- Standard format across Azure DevOps APIs

### Pattern 3: Type-Safe Schemas with Zod

Every tool parameter is validated at runtime with Zod:

```typescript
export const getUserStoriesSchema = {
  iterationPath: z.string().optional().describe("Sprint path"),
  state: z.string().optional().describe("Active, Closed, etc."),
  top: z.number().min(1).max(100).optional()
};

// Zod automatically:
// - Validates parameter types
// - Rejects invalid values
// - Generates JSON schema for Claude
// - Provides auto-complete hints in UI
```

### Pattern 4: HTML Hrefs in Responses

All responses include URLs to ADO web UI:

```typescript
return JSON.stringify({
  success: true,
  testCaseId: 456,
  url: res.data._links?.html.href  // ← Clickable link in Claude chat
}, null, 2);
```

This lets users click through to verify changes in Azure DevOps.

---

## Troubleshooting Guide for Juniors

### Issue: "Cannot find module 'ADO_PAT'"
**Solution**: Create `.env` file or add to `claude_desktop_config.json`:
```
ADO_PAT=your_pat_token_here
```

### Issue: "401 Unauthorized"
**Cause**: Invalid PAT or expired token
**Solution**: 
1. Go to `https://dev.azure.com/{org}/_usersSettings/tokens`
2. Create new token (Work Items + Test Plans scopes)
3. Update `claude_desktop_config.json`

### Issue: "404 Resource not found"
**Cause**: Wrong org name, project name, or work item ID
**Solution**: 
- Verify `ADO_ORG` and `ADO_PROJECT` in config
- Check work item IDs exist in Azure DevOps
- Check iteration paths and area paths are spelled correctly

### Issue: Tool not available in Claude
**Solution**:
1. Run `npm run build` (ensure compiled)
2. Restart Claude Desktop
3. Check `claude_desktop_config.json` path is correct
4. Check terminal for errors: `npm run dev`

### Issue: "Test case created but not linked to story"
**Cause**: Incorrect `linkedStoryId` or story doesn't exist
**Solution**:
- Verify story ID is numeric and exists
- Check story isn't deleted
- Try `get_user_stories` to list valid IDs

---

## Architecture Recap

| Layer | Role | Technologies |
|-------|------|--------------|
| **Claude Desktop** | User interface & AI | UI frontend |
| **MCP Protocol** | Standardized communication | JSON-RPC over stdio |
| **MCP Server** | Tool registration & dispatch | @modelcontextprotocol/sdk |
| **Tools** | Business logic | TypeScript functions, Zod |
| **Libraries** | Shared utilities | Axios, WIQL, formatSteps |
| **Azure DevOps API** | External service | HTTPS REST API |

---

## Summary for Your Juniors

### What This Project Does
ado-mcp-server is a **bridge** between Claude and Azure DevOps.

### How It's Built
1. **Node.js + TypeScript** for type safety
2. **Axios** for HTTP calls to Azure DevOps
3. **Zod** for input validation
4. **MCP SDK** for communicating with Claude

### How to Add a New Tool
1. Create `src/tools/myNewTool.ts`
2. Export schema, description, and handler function
3. Import and register in `server.ts`
4. Run `node scripts/validateTools.mjs`
5. Build: `npm run build`

### How to Deploy
1. `npm install` → Install dependencies
2. `npm run build` → Compile to `dist/`
3. Update `claude_desktop_config.json` with path & credentials
4. Restart Claude Desktop
5. Test in chat

### Key Takeaway
This project demonstrates how to wrap any external API (Azure DevOps, Jira, GitHub, etc.) as an MCP server so AI assistants can interact with it conversationally. The same patterns apply to any REST API.

