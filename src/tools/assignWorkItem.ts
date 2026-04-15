import { z } from "zod";
import { getClient } from "../lib/adoClient.js";
import type { PatchOperation, WorkItem } from "../types.js";

export const assignWorkItemSchema = {
  project:    z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  workItemId: z.number().describe("The numeric ID of the work item to assign"),
  assignedTo: z.string().describe("Display name or email of the user (e.g. 'Eman Hedia' or 'eman@example.com')"),
};

export const assignWorkItemDescription =
  "Assign any work item to a user by display name or email address.";

export async function assignWorkItem(input: {
  project?:   string;
  workItemId: number;
  assignedTo: string;
}): Promise<string> {
  const { project, workItemId, assignedTo } = input;

  const patchDoc: PatchOperation[] = [
    { op: "add", path: "/fields/System.AssignedTo", value: assignedTo },
  ];

  const res = await getClient(project).patch<WorkItem>(
    `/wit/workitems/${workItemId}?api-version=7.1`,
    patchDoc,
    { headers: { "Content-Type": "application/json-patch+json" } }
  );

  const f = res.data.fields as Record<string, any>;
  return JSON.stringify({
    success:    true,
    workItemId: res.data.id,
    title:      f["System.Title"],
    assignedTo: f["System.AssignedTo"]?.displayName ?? assignedTo,
    url:        res.data._links?.html.href,
  }, null, 2);
}
