import { z } from "zod";
import { getClient } from "../lib/adoClient.js";
import type { PatchOperation, WorkItem } from "../types.js";

export const createEpicOrFeatureSchema = {
  project:       z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  type:          z.enum(["Epic", "Feature"]).describe("Work item type to create"),
  title:         z.string().min(1).describe("Title of the Epic or Feature"),
  description:   z.string().optional().describe("Detailed description (supports HTML)"),
  iterationPath: z.string().optional().describe("Sprint/Iteration path e.g. 'MyProject\\Release 1'"),
  areaPath:      z.string().optional().describe("Area path e.g. 'MyProject\\Backend'"),
  assignedTo:    z.string().optional().describe("Display name or email of the user to assign to"),
  priority:      z.number().min(1).max(4).optional().describe("Priority 1 (highest) to 4 (lowest)"),
  tags:          z.string().optional().describe("Comma-separated tags e.g. 'Q2, Backend'"),
};

export const createEpicOrFeatureDescription =
  "Create an Epic or Feature work item in Azure DevOps. Epics are top-level containers; Features sit under Epics and above User Stories in the hierarchy.";

export async function createEpicOrFeature(input: {
  project?: string;
  type: "Epic" | "Feature";
  title: string;
  description?: string;
  iterationPath?: string;
  areaPath?: string;
  assignedTo?: string;
  priority?: number;
  tags?: string;
}): Promise<string> {
  const { project, type, title, description, iterationPath, areaPath, assignedTo, priority, tags } = input;

  const patchDoc: PatchOperation[] = [
    { op: "add", path: "/fields/System.Title",   value: title },
    { op: "add", path: "/fields/System.History", value: `${type} created by AI MCP Server.` },
    ...(description   ? [{ op: "add" as const, path: "/fields/System.Description",                       value: description   }] : []),
    ...(iterationPath ? [{ op: "add" as const, path: "/fields/System.IterationPath",                     value: iterationPath }] : []),
    ...(areaPath      ? [{ op: "add" as const, path: "/fields/System.AreaPath",                          value: areaPath      }] : []),
    ...(assignedTo    ? [{ op: "add" as const, path: "/fields/System.AssignedTo",                        value: assignedTo    }] : []),
    ...(priority      ? [{ op: "add" as const, path: "/fields/Microsoft.VSTS.Common.Priority",           value: priority      }] : []),
    ...(tags          ? [{ op: "add" as const, path: "/fields/System.Tags",                              value: tags          }] : []),
  ];

  const encodedType = encodeURIComponent(type);
  const res = await getClient(project).post<WorkItem>(
    `/wit/workitems/$${encodedType}?api-version=7.1`,
    patchDoc,
    { headers: { "Content-Type": "application/json-patch+json" } }
  );

  const f = res.data.fields as Record<string, any>;
  return JSON.stringify({
    success:       true,
    type,
    id:            res.data.id,
    title:         f["System.Title"],
    state:         f["System.State"],
    iterationPath: f["System.IterationPath"],
    areaPath:      f["System.AreaPath"],
    assignedTo:    f["System.AssignedTo"]?.displayName ?? "Unassigned",
    url:           res.data._links?.html.href,
  }, null, 2);
}
