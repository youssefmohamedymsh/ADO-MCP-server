import "./lib/loadEnv.js";
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
import { getBugs,              getBugsSchema,               getBugsDescription               } from "./tools/getBugs.js";
import { listProjects,         listProjectsSchema,          listProjectsDescription          } from "./tools/listProjects.js";
import { getSprints,           getSprintsSchema,            getSprintsDescription            } from "./tools/getSprints.js";
import { searchWorkItems,      searchWorkItemsSchema,       searchWorkItemsDescription       } from "./tools/searchWorkItems.js";
import { getWorkItemComments,  getWorkItemCommentsSchema,   getWorkItemCommentsDescription   } from "./tools/getWorkItemComments.js";
import { getAreaPaths,         getAreaPathsSchema,          getAreaPathsDescription          } from "./tools/getAreaPaths.js";
import { addAttachment,        addAttachmentSchema,         addAttachmentDescription         } from "./tools/addAttachment.js";
import { getWorkItemUpdates,   getWorkItemUpdatesSchema,    getWorkItemUpdatesDescription    } from "./tools/getWorkItemUpdates.js";
import { createEpicOrFeature,  createEpicOrFeatureSchema,   createEpicOrFeatureDescription   } from "./tools/createEpicOrFeature.js";
import { getBoardColumns,      getBoardColumnsSchema,       getBoardColumnsDescription       } from "./tools/getBoardColumns.js";
import { setProject,          setProjectSchema,            setProjectDescription            } from "./tools/setProject.js";

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

server.tool("get_bugs",                 getBugsDescription,               getBugsSchema,               async (input) => ({
  content: [{ type: "text", text: await getBugs(input) }],
}));

server.tool("list_projects",            listProjectsDescription,          listProjectsSchema,          async (input) => ({
  content: [{ type: "text", text: await listProjects(input) }],
}));

server.tool("get_sprints",              getSprintsDescription,            getSprintsSchema,            async (input) => ({
  content: [{ type: "text", text: await getSprints(input) }],
}));

server.tool("search_work_items",        searchWorkItemsDescription,       searchWorkItemsSchema,       async (input) => ({
  content: [{ type: "text", text: await searchWorkItems(input) }],
}));

server.tool("get_work_item_comments",   getWorkItemCommentsDescription,   getWorkItemCommentsSchema,   async (input) => ({
  content: [{ type: "text", text: await getWorkItemComments(input) }],
}));

server.tool("get_area_paths",           getAreaPathsDescription,          getAreaPathsSchema,          async (input) => ({
  content: [{ type: "text", text: await getAreaPaths(input) }],
}));

server.tool("add_attachment",            addAttachmentDescription,         addAttachmentSchema,         async (input) => ({
  content: [{ type: "text", text: await addAttachment(input) }],
}));

server.tool("get_work_item_updates",     getWorkItemUpdatesDescription,    getWorkItemUpdatesSchema,    async (input) => ({
  content: [{ type: "text", text: await getWorkItemUpdates(input) }],
}));

server.tool("create_epic_or_feature",    createEpicOrFeatureDescription,   createEpicOrFeatureSchema,   async (input) => ({
  content: [{ type: "text", text: await createEpicOrFeature(input) }],
}));

server.tool("get_board_columns",         getBoardColumnsDescription,       getBoardColumnsSchema,       async (input) => ({
  content: [{ type: "text", text: await getBoardColumns(input) }],
}));

server.tool("set_project",               setProjectDescription,            setProjectSchema,            async (input) => ({
  content: [{ type: "text", text: await setProject(input) }],
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
  "get_bugs",
  "list_projects",
  "get_sprints",
  "search_work_items",
  "get_work_item_comments",
  "get_area_paths",
  "add_attachment",
  "get_work_item_updates",
  "create_epic_or_feature",
  "get_board_columns",
  "set_project",
];

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[ado-mcp-server] Running — ${toolsRegistered.length} tools registered: ${toolsRegistered.join(", ")}`);
