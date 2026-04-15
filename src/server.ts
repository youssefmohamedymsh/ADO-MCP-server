import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ── Tool imports ──────────────────────────────────────────────────────────────
import { getUserStories,        getUserStoriesSchema,        getUserStoriesDescription        } from "./tools/getUserStories.js";
import { createTestCase,        createTestCaseSchema,        createTestCaseDescription        } from "./tools/createTestCase.js";
import { updateWorkItem,        updateWorkItemSchema,        updateWorkItemDescription        } from "./tools/updateWorkItem.js";
import { getTestCasesForStory,  getTestCasesForStorySchema,  getTestCasesForStoryDescription  } from "./tools/getTestCasesForStory.js";
import { createBug,             createBugSchema,             createBugDescription             } from "./tools/createBug.js";
import { getSprintCoverage,     getSprintCoverageSchema,     getSprintCoverageDescription     } from "./tools/getSprintCoverage.js";
import { getChildWorkItems,     getChildWorkItemsSchema,     getChildWorkItemsDescription     } from "./tools/getChildWorkItems.js";
import { createChildTask,       createChildTaskSchema,       createChildTaskDescription       } from "./tools/createChildTask.js";
import { assignWorkItem,        assignWorkItemSchema,        assignWorkItemDescription        } from "./tools/assignWorkItem.js";
import { getWorkItem,           getWorkItemSchema,           getWorkItemDescription           } from "./tools/getWorkItem.js";
import { linkWorkItems,         linkWorkItemsSchema,         linkWorkItemsDescription         } from "./tools/linkWorkItems.js";
import { getTeamMembers,        getTeamMembersSchema,        getTeamMembersDescription        } from "./tools/getTeamMembers.js";
import { bulkAssignWorkItems,   bulkAssignWorkItemsSchema,   bulkAssignWorkItemsDescription   } from "./tools/bulkAssignWorkItems.js";
import { getTestRuns,           getTestRunsSchema,           getTestRunsDescription           } from "./tools/getTestRuns.js";
import { createUserStory,       createUserStorySchema,       createUserStoryDescription       } from "./tools/createUserStory.js";

// ── Create MCP server ─────────────────────────────────────────────────────────
const server = new McpServer({
  name:    "ado-qc-server",
  version: "1.0.0",
});

// ── Register tools ────────────────────────────────────────────────────────────
server.tool("get_user_stories",         getUserStoriesDescription,        getUserStoriesSchema,        async (input) => ({
  content: [{ type: "text", text: await getUserStories(input) }],
}));

server.tool("create_test_case",         createTestCaseDescription,        createTestCaseSchema,        async (input) => ({
  content: [{ type: "text", text: await createTestCase(input) }],
}));

server.tool("update_work_item",         updateWorkItemDescription,        updateWorkItemSchema,        async (input) => ({
  content: [{ type: "text", text: await updateWorkItem(input) }],
}));

server.tool("get_test_cases_for_story", getTestCasesForStoryDescription,  getTestCasesForStorySchema,  async (input) => ({
  content: [{ type: "text", text: await getTestCasesForStory(input) }],
}));

server.tool("create_bug",               createBugDescription,             createBugSchema,             async (input) => ({
  content: [{ type: "text", text: await createBug(input) }],
}));

server.tool("get_sprint_coverage",      getSprintCoverageDescription,     getSprintCoverageSchema,     async (input) => ({
  content: [{ type: "text", text: await getSprintCoverage(input) }],
}));

server.tool("get_child_work_items",     getChildWorkItemsDescription,     getChildWorkItemsSchema,     async (input) => ({
  content: [{ type: "text", text: await getChildWorkItems(input) }],
}));

server.tool("create_child_task",        createChildTaskDescription,       createChildTaskSchema,       async (input) => ({
  content: [{ type: "text", text: await createChildTask(input) }],
}));

server.tool("assign_work_item",         assignWorkItemDescription,        assignWorkItemSchema,        async (input) => ({
  content: [{ type: "text", text: await assignWorkItem(input) }],
}));

server.tool("get_work_item",            getWorkItemDescription,           getWorkItemSchema,           async (input) => ({
  content: [{ type: "text", text: await getWorkItem(input) }],
}));

server.tool("link_work_items",          linkWorkItemsDescription,         linkWorkItemsSchema,         async (input) => ({
  content: [{ type: "text", text: await linkWorkItems(input) }],
}));

server.tool("get_team_members",         getTeamMembersDescription,        getTeamMembersSchema,        async (input) => ({
  content: [{ type: "text", text: await getTeamMembers(input) }],
}));

server.tool("bulk_assign_work_items",   bulkAssignWorkItemsDescription,   bulkAssignWorkItemsSchema,   async (input) => ({
  content: [{ type: "text", text: await bulkAssignWorkItems(input) }],
}));

server.tool("get_test_runs",            getTestRunsDescription,           getTestRunsSchema,           async (input) => ({
  content: [{ type: "text", text: await getTestRuns(input) }],
}));

server.tool("create_user_story",        createUserStoryDescription,       createUserStorySchema,       async (input: {
  project?: string; title: string; description?: string; acceptanceCriteria?: string; iterationPath?: string;
  areaPath?: string; assignedTo?: string; priority?: number; tags?: string;
}) => ({
  content: [{ type: "text", text: await createUserStory(input) }],
}));

// ── Start server ──────────────────────────────────────────────────────────────
const toolsRegistered = [
  "get_user_stories",
  "create_test_case",
  "update_work_item",
  "get_test_cases_for_story",
  "create_bug",
  "get_sprint_coverage",
  "get_child_work_items",
  "create_child_task",
  "assign_work_item",
  "get_work_item",
  "link_work_items",
  "get_team_members",
  "bulk_assign_work_items",
  "get_test_runs",
  "create_user_story",
];

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[ado-mcp-server] Running — ${toolsRegistered.length} tools registered: ${toolsRegistered.join(", ")}`);
