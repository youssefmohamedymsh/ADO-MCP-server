import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ── Tool imports ──────────────────────────────────────────────────────────────
import { getUserStories,          getUserStoriesSchema,          getUserStoriesDescription          } from "./tools/getUserStories.js";
import { createTestCase,          createTestCaseSchema,          createTestCaseDescription          } from "./tools/createTestCase.js";
import { updateWorkItem,          updateWorkItemSchema,          updateWorkItemDescription          } from "./tools/updateWorkItem.js";
import { getTestCasesForStory,    getTestCasesForStorySchema,    getTestCasesForStoryDescription    } from "./tools/getTestCasesForStory.js";
import { createBug,               createBugSchema,               createBugDescription               } from "./tools/createBug.js";
import { getSprintCoverage,       getSprintCoverageSchema,       getSprintCoverageDescription       } from "./tools/getSprintCoverage.js";
// import { getChildWorkItems,       getChildWorkItemsSchema,       getChildWorkItemsDescription       } from "./tools/getChildWorkItems.js";
import { createChildTask,         createChildTaskSchema,         createChildTaskDescription         } from "./tools/createChildTask.js";
import { assignWorkItem,          assignWorkItemSchema,          assignWorkItemDescription          } from "./tools/assignWorkItem.js";

// ── Create MCP server ─────────────────────────────────────────────────────────
const server = new McpServer({
  name:    "ado-qc-server",
  version: "1.0.0",
});

// ── Register tools ────────────────────────────────────────────────────────────
server.tool("get_user_stories",         getUserStoriesDescription,         getUserStoriesSchema,         async (input) => ({
  content: [{ type: "text", text: await getUserStories(input) }],
}));

server.tool("create_test_case",         createTestCaseDescription,         createTestCaseSchema,         async (input) => ({
  content: [{ type: "text", text: await createTestCase(input) }],
}));

server.tool("update_work_item",         updateWorkItemDescription,         updateWorkItemSchema,         async (input) => ({
  content: [{ type: "text", text: await updateWorkItem(input) }],
}));

server.tool("get_test_cases_for_story", getTestCasesForStoryDescription,   getTestCasesForStorySchema,   async (input) => ({
  content: [{ type: "text", text: await getTestCasesForStory(input) }],
}));

server.tool("create_bug",               createBugDescription,               createBugSchema,              async (input) => ({
  content: [{ type: "text", text: await createBug(input) }],
}));

server.tool("get_sprint_coverage",      getSprintCoverageDescription,      getSprintCoverageSchema,      async (input) => ({
  content: [{ type: "text", text: await getSprintCoverage(input) }],
}));

// server.tool("get_child_work_items",     getChildWorkItemsDescription,      getChildWorkItemsSchema,      async (input) => ({
//   content: [{ type: "text", text: await getChildWorkItems(input) }],
// }));

server.tool("create_child_task",        createChildTaskDescription,        createChildTaskSchema,        async (input) => ({
  content: [{ type: "text", text: await createChildTask(input) }],
}));

server.tool("assign_work_item",         assignWorkItemDescription,         assignWorkItemSchema,         async (input) => ({
  content: [{ type: "text", text: await assignWorkItem(input) }],
}));

// ── Start server ──────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[ado-mcp-server] Running — ${Object.keys(server).length} tools registered.`);
