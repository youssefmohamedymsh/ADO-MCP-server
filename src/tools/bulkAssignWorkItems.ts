import { z } from "zod";
import { getClient } from "../lib/adoClient.js";
import type { PatchOperation, WorkItem } from "../types.js";

export const bulkAssignWorkItemsSchema = {
  project:     z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  workItemIds: z.array(z.number()).min(1).describe("List of numeric work item IDs to assign"),
  assignedTo:  z.string().describe("Display name or email of the user to assign all items to (e.g. 'Jane Doe')"),
};

export const bulkAssignWorkItemsDescription =
  "Assign multiple work items to a user in one call. Returns a summary of successes and any failures.";

export async function bulkAssignWorkItems(input: {
  project?:    string;
  workItemIds: number[];
  assignedTo:  string;
}): Promise<string> {
  const { project, workItemIds, assignedTo } = input;
  const client = getClient(project);

  const results: { id: number; title?: string; success: boolean; error?: string }[] = [];

  for (const id of workItemIds) {
    try {
      const patchDoc: PatchOperation[] = [
        { op: "add", path: "/fields/System.AssignedTo", value: assignedTo },
      ];

      const res = await client.patch<WorkItem>(
        `/wit/workitems/${id}?api-version=7.1`,
        patchDoc,
        { headers: { "Content-Type": "application/json-patch+json" } }
      );

      const f = res.data.fields as Record<string, any>;
      results.push({ id, title: f["System.Title"], success: true });
    } catch (err: any) {
      results.push({ id, success: false, error: err.message });
    }
  }

  const succeeded = results.filter(r => r.success).length;
  const failed    = results.filter(r => !r.success).length;

  return JSON.stringify({
    assignedTo,
    total:     workItemIds.length,
    succeeded,
    failed,
    results,
  }, null, 2);
}
