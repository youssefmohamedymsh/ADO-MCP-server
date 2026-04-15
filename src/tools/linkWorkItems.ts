import { z } from "zod";
import { getClient, ADO_ORG, resolveProject } from "../lib/adoClient.js";
import type { PatchOperation, WorkItem } from "../types.js";

export const linkWorkItemsSchema = {
  project:   z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  sourceId:  z.number().describe("The numeric ID of the source work item"),
  targetId:  z.number().describe("The numeric ID of the target work item to link to"),
  linkType:  z.enum([
    "System.LinkTypes.Hierarchy-Forward",
    "System.LinkTypes.Hierarchy-Reverse",
    "System.LinkTypes.Related",
    "Microsoft.VSTS.Common.TestedBy-Forward",
    "Microsoft.VSTS.Common.TestedBy-Reverse",
  ]).describe(
    "Relation type: Hierarchy-Forward (parent→child), Hierarchy-Reverse (child→parent), Related, TestedBy-Forward (story tested by test case), TestedBy-Reverse (test case tests story)"
  ),
  comment: z.string().optional().describe("Optional comment describing the link"),
};

export const linkWorkItemsDescription =
  "Create a link between any two work items (e.g. parent-child, related, tested-by). Use TestedBy-Forward to link a story to its test case.";

export async function linkWorkItems(input: {
  project?: string;
  sourceId: number;
  targetId: number;
  linkType: string;
  comment?: string;
}): Promise<string> {
  const { project, sourceId, targetId, linkType, comment } = input;
  const projectName = resolveProject(project);

  const patchDoc: PatchOperation[] = [
    {
      op: "add",
      path: "/relations/-",
      value: {
        rel: linkType,
        url: `https://dev.azure.com/${ADO_ORG}/${projectName}/_apis/wit/workitems/${targetId}`,
        attributes: { comment: comment ?? "Linked by AI MCP Server." },
      },
    },
  ];

  const res = await getClient(project).patch<WorkItem>(
    `/wit/workitems/${sourceId}?api-version=7.1`,
    patchDoc,
    { headers: { "Content-Type": "application/json-patch+json" } }
  );

  const f = res.data.fields as Record<string, any>;

  return JSON.stringify({
    success:  true,
    sourceId: res.data.id,
    targetId,
    linkType,
    title:    f["System.Title"],
    url:      res.data._links?.html.href,
  }, null, 2);
}
