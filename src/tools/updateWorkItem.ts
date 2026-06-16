import { z } from "zod";
import { getClient } from "../lib/adoClient.js";
import type { PatchOperation, WorkItem } from "../types.js";

export const updateWorkItemSchema = {
  project:    z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  workItemId: z.number().describe("The numeric ID of the work item to update"),
  state:      z.string().optional().describe("New state e.g. Active, Resolved, Closed, Ready for Test"),
  title:      z.string().optional().describe("New title for the work item"),
  comment:    z.string().optional().describe("Comment to add to the discussion / history"),
  priority:   z.number().min(1).max(4).optional().describe("Updated priority 1–4"),
  iterationPath: z.string().optional().describe("Move the item to this Sprint/Iteration path e.g. 'MyProject\\Iteration 1'"),
};

export const updateWorkItemDescription =
  "Update the state, title, priority, iteration/sprint path, or add a comment to any Azure DevOps work item (User Story, Test Case, Bug, Task) by its numeric ID.";

export async function updateWorkItem(input: {
  project?:   string;
  workItemId: number;
  state?:     string;
  title?:     string;
  comment?:   string;
  priority?:  number;
  iterationPath?: string;
}): Promise<string> {
  const { project, workItemId, state, title, comment, priority, iterationPath } = input;

  const ops: PatchOperation[] = [
    ...(state    ? [{ op: "add" as const, path: "/fields/System.State",                    value: state    }] : []),
    ...(title    ? [{ op: "add" as const, path: "/fields/System.Title",                    value: title    }] : []),
    ...(comment  ? [{ op: "add" as const, path: "/fields/System.History",                  value: comment  }] : []),
    ...(priority ? [{ op: "add" as const, path: "/fields/Microsoft.VSTS.Common.Priority",  value: priority }] : []),
    ...(iterationPath ? [{ op: "add" as const, path: "/fields/System.IterationPath",       value: iterationPath }] : []),
  ];

  if (ops.length === 0) {
    return "No fields provided to update. Please specify at least one of: state, title, comment, priority, iterationPath.";
  }

  const res = await getClient(project).patch<WorkItem>(
    `/wit/workitems/${workItemId}?api-version=7.0`,
    ops,
    { headers: { "Content-Type": "application/json-patch+json" } }
  );

  return JSON.stringify({
    success:    true,
    workItemId,
    newState:   res.data.fields["System.State"],
    title:      res.data.fields["System.Title"],
    iterationPath: res.data.fields["System.IterationPath"],
    updatedFields: ops.map(o => o.path),
    url:        res.data._links?.html.href,
  }, null, 2);
}
