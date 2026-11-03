import { z } from "zod";
import { getClient } from "../lib/adoClient.js";
import type { WorkItem } from "../types.js";

export const getWorkItemSchema = {
  project:    z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  workItemId: z.number().describe("The numeric ID of the work item to fetch"),
};

export const getWorkItemDescription =
  "Fetch full details of a single work item by its ID — including title, description, acceptance criteria, state, assignee, and type.";

export async function getWorkItem(input: {
  project?: string;
  workItemId: number;
}): Promise<string> {
  const { project, workItemId } = input;

  const res = await getClient(project).get<WorkItem>(
    `/wit/workitems/${workItemId}?$expand=all&api-version=7.1`
  );

  const f = res.data.fields as Record<string, any>;

  return JSON.stringify({
    id:                 res.data.id,
    type:               f["System.WorkItemType"],
    title:              f["System.Title"],
    state:              f["System.State"],
    assignedTo:         f["System.AssignedTo"]?.displayName ?? "Unassigned",
    areaPath:           f["System.AreaPath"],
    iterationPath:      f["System.IterationPath"],
    description:        f["System.Description"] ?? "No description.",
    acceptanceCriteria: f["Microsoft.VSTS.Common.AcceptanceCriteria"] ?? "No acceptance criteria defined.",
    priority:           f["Microsoft.VSTS.Common.Priority"] ?? null,
    url:                res.data._links?.html.href,
  }, null, 2);
}
