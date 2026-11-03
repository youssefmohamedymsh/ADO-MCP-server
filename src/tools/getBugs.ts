import { z } from "zod";
import { runWiqlQuery } from "../lib/wiql.js";

export const getBugsSchema = {
  project:       z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  iterationPath: z.string().optional().describe("Sprint path e.g. 'MyProject\\Sprint 3'"),
  state:         z.string().optional().describe("Filter by state: New, Active, Resolved, Closed"),
  severity:      z.string().optional().describe("Filter by severity e.g. '1 - Critical', '2 - High', '3 - Medium', '4 - Low'"),
  assignedTo:    z.string().optional().describe("Filter by assigned user display name or email"),
  areaPath:      z.string().optional().describe("Filter by area path e.g. 'MyProject\\Backend'"),
  top:           z.number().min(1).max(100).optional().describe("Max results to return (default 20, max 100)"),
};

export const getBugsDescription =
  "Fetch bugs from Azure DevOps. Supports filtering by sprint, state, severity, assignee, and area path. Returns title, severity, repro steps, and assignment info.";

export async function getBugs(input: {
  project?: string;
  iterationPath?: string;
  state?: string;
  severity?: string;
  assignedTo?: string;
  areaPath?: string;
  top?: number;
}): Promise<string> {
  const { project, iterationPath, state, severity, assignedTo, areaPath, top = 20 } = input;

  const conditions: string[] = ["[System.WorkItemType] = 'Bug'"];
  if (state)         conditions.push(`[System.State] = '${state}'`);
  if (severity)      conditions.push(`[Microsoft.VSTS.Common.Severity] = '${severity}'`);
  if (assignedTo)    conditions.push(`[System.AssignedTo] = '${assignedTo}'`);
  if (iterationPath) conditions.push(`[System.IterationPath] = '${iterationPath}'`);
  if (areaPath)      conditions.push(`[System.AreaPath] UNDER '${areaPath}'`);

  const items = await runWiqlQuery(
    conditions.join(" AND "),
    top,
    ["Microsoft.VSTS.Common.Severity", "Microsoft.VSTS.TCM.ReproSteps", "System.AssignedTo"],
    project,
  );

  if (items.length === 0) {
    return "No bugs found matching the given filters.";
  }

  const bugs = items.map((w) => {
    const f = w.fields as Record<string, any>;
    return {
      id:            w.id,
      title:         f["System.Title"],
      state:         f["System.State"],
      severity:      f["Microsoft.VSTS.Common.Severity"] ?? "Not set",
      priority:      f["Microsoft.VSTS.Common.Priority"] ?? null,
      assignedTo:    f["System.AssignedTo"]?.displayName ?? "Unassigned",
      reproSteps:    f["Microsoft.VSTS.TCM.ReproSteps"] ?? "No repro steps provided.",
      iterationPath: f["System.IterationPath"],
      areaPath:      f["System.AreaPath"],
    };
  });

  return JSON.stringify(bugs, null, 2);
}
