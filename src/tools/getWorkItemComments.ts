import { z } from "zod";
import { getClient } from "../lib/adoClient.js";

export const getWorkItemCommentsSchema = {
  project:    z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  workItemId: z.number().describe("The numeric ID of the work item"),
  top:        z.number().min(1).max(50).optional().describe("Max number of comments to return (default 20)"),
};

export const getWorkItemCommentsDescription =
  "Fetch the discussion comments/history for a work item. Shows who said what and when — useful for understanding context and decisions.";

export async function getWorkItemComments(input: {
  project?: string;
  workItemId: number;
  top?: number;
}): Promise<string> {
  const { project, workItemId, top = 20 } = input;
  const client = getClient(project);

  const res = await client.get<{ totalCount: number; comments: any[] }>(
    `/wit/workItems/${workItemId}/comments?api-version=7.1-preview.4&$top=${top}&order=desc`
  );

  const comments = res.data.comments.map((c: any) => ({
    id:        c.id,
    text:      c.text,
    author:    c.createdBy?.displayName ?? "Unknown",
    createdAt: c.createdDate,
    modifiedAt: c.modifiedDate,
  }));

  return JSON.stringify({
    workItemId,
    totalComments: res.data.totalCount,
    comments,
  }, null, 2);
}
