import { z } from "zod";
import { getClient } from "../lib/adoClient.js";

export const getWorkItemUpdatesSchema = {
  project:    z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  workItemId: z.number().describe("The numeric ID of the work item"),
  top:        z.number().min(1).max(100).optional().describe("Max number of updates to return (default 20)"),
};

export const getWorkItemUpdatesDescription =
  "Fetch the full field-level change history for a work item — who changed which fields, when, and what the old/new values were. More detailed than comments.";

export async function getWorkItemUpdates(input: {
  project?: string;
  workItemId: number;
  top?: number;
}): Promise<string> {
  const { project, workItemId, top = 20 } = input;
  const client = getClient(project);

  const res = await client.get<{ value: any[]; count: number }>(
    `/wit/workitems/${workItemId}/updates?api-version=7.1&$top=${top}`
  );

  const updates = res.data.value
    .filter((u: any) => u.fields) // skip updates with no field changes
    .map((u: any) => {
      const changes: Record<string, { oldValue: any; newValue: any }> = {};
      for (const [field, delta] of Object.entries(u.fields as Record<string, any>)) {
        changes[field] = {
          oldValue: delta.oldValue ?? null,
          newValue: delta.newValue ?? null,
        };
      }
      return {
        revision:  u.rev,
        changedBy: u.revisedBy?.displayName ?? "Unknown",
        changedAt: u.revisedDate,
        fields:    changes,
      };
    });

  return JSON.stringify({
    workItemId,
    totalRevisions: res.data.count,
    updates,
  }, null, 2);
}
