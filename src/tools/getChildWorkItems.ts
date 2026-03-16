import { z } from "zod";
import { adoClient, ADO_ORG, ADO_PROJECT } from "../lib/adoClient.js";
import type { WorkItem } from "../types.js";

export const getChildWorkItemsSchema = {
  parentId: z.number().describe("The numeric ID of the parent work item"),
};

export const getChildWorkItemsDescription =
  "Get all child work items (tasks, test cases, etc.) of a given parent work item.";

export async function getChildWorkItems(input: {
  parentId: number;
}): Promise<string> {
  const { parentId } = input;

  // Fetch parent with relations expanded
  const parentRes = await adoClient.get<WorkItem>(
    `/wit/workitems/${parentId}?$expand=relations&api-version=7.1`
  );

  const relations = parentRes.data.relations ?? [];
  const childRelations = relations.filter(
    (r: any) => r.rel === "System.LinkTypes.Hierarchy-Forward"
  );

  if (childRelations.length === 0) {
    return JSON.stringify({ parentId, children: [], message: "No child work items found." }, null, 2);
  }

  const childIds = childRelations
    .map((r: any) => r.url.split("/").pop())
    .join(",");

  const batchRes = await adoClient.get<{ value: WorkItem[] }>(
    `/wit/workitems?ids=${childIds}&api-version=7.1`
  );

  const children = batchRes.data.value.map((item: any) => {
    const f = item.fields as Record<string, any>;
    return {
      id:         item.id,
      title:      f["System.Title"],
      type:       f["System.WorkItemType"],
      state:      f["System.State"],
      assignedTo: f["System.AssignedTo"]?.displayName ?? "Unassigned",
    };
  });

  return JSON.stringify({ parentId, childCount: children.length, children }, null, 2);
}
