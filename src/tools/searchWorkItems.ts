import { z } from "zod";
import { runWiqlQuery } from "../lib/wiql.js";

export const searchWorkItemsSchema = {
  project:      z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  workItemType: z.string().optional().describe("Filter by type: 'User Story', 'Bug', 'Task', 'Test Case', 'Epic', 'Feature'"),
  state:        z.string().optional().describe("Filter by state: New, Active, Resolved, Closed"),
  assignedTo:   z.string().optional().describe("Filter by assigned user display name or email"),
  areaPath:     z.string().optional().describe("Filter by area path e.g. 'MyProject\\Backend'"),
  iterationPath: z.string().optional().describe("Filter by iteration/sprint path"),
  titleContains: z.string().optional().describe("Search for work items whose title contains this text"),
  tags:          z.string().optional().describe("Filter by tag e.g. 'UI'"),
  top:           z.number().min(1).max(200).optional().describe("Max results to return (default 50, max 200)"),
};

export const searchWorkItemsDescription =
  "Search and filter work items across types (bugs, stories, tasks, etc.) with flexible criteria. Use this for custom queries that other specific tools don't cover.";

export async function searchWorkItems(input: {
  project?: string;
  workItemType?: string;
  state?: string;
  assignedTo?: string;
  areaPath?: string;
  iterationPath?: string;
  titleContains?: string;
  tags?: string;
  top?: number;
}): Promise<string> {
  const { project, workItemType, state, assignedTo, areaPath, iterationPath, titleContains, tags, top = 50 } = input;

  const conditions: string[] = [];
  if (workItemType)   conditions.push(`[System.WorkItemType] = '${workItemType}'`);
  if (state)          conditions.push(`[System.State] = '${state}'`);
  if (assignedTo)     conditions.push(`[System.AssignedTo] = '${assignedTo}'`);
  if (areaPath)       conditions.push(`[System.AreaPath] UNDER '${areaPath}'`);
  if (iterationPath)  conditions.push(`[System.IterationPath] = '${iterationPath}'`);
  if (titleContains)  conditions.push(`[System.Title] CONTAINS '${titleContains}'`);
  if (tags)           conditions.push(`[System.Tags] CONTAINS '${tags}'`);

  if (conditions.length === 0) {
    return "Please provide at least one filter criterion (workItemType, state, assignedTo, areaPath, iterationPath, titleContains, or tags).";
  }

  const items = await runWiqlQuery(
    conditions.join(" AND "),
    top,
    ["Microsoft.VSTS.Common.Severity", "System.AssignedTo", "System.Tags"],
    project,
  );

  if (items.length === 0) {
    return "No work items found matching the given filters.";
  }

  const results = items.map((w) => {
    const f = w.fields as Record<string, any>;
    return {
      id:            w.id,
      type:          f["System.WorkItemType"],
      title:         f["System.Title"],
      state:         f["System.State"],
      assignedTo:    f["System.AssignedTo"]?.displayName ?? "Unassigned",
      priority:      f["Microsoft.VSTS.Common.Priority"] ?? null,
      iterationPath: f["System.IterationPath"],
      areaPath:      f["System.AreaPath"],
    };
  });

  return JSON.stringify({ resultCount: results.length, results }, null, 2);
}
