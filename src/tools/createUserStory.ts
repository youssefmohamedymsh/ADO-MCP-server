import { z } from "zod";
import { adoClient, ADO_ORG, ADO_PROJECT } from "../lib/adoClient.js";
import type { PatchOperation, WorkItem } from "../types.js";

export const createUserStorySchema = {
  title:              z.string().min(1).describe("Title of the user story"),
  description:        z.string().optional().describe("Detailed description of the user story (supports HTML)"),
  acceptanceCriteria: z.string().optional().describe("Acceptance criteria for the user story (supports HTML)"),
  iterationPath:      z.string().optional().describe("Sprint/Iteration path e.g. 'Vento\\Iteration 1'"),
  areaPath:           z.string().optional().describe("Area path e.g. 'Vento\\Mobile App'"),
  assignedTo:         z.string().optional().describe("Display name or email of the user to assign the story to"),
  priority:           z.number().min(1).max(4).optional().describe("Priority 1 (highest) to 4 (lowest)"),
  tags:               z.string().optional().describe("Comma-separated tags e.g. 'UI, Backend, Sprint1'"),
};

export const createUserStoryDescription =
  "Create a new User Story work item in Azure DevOps with title, description, acceptance criteria, and optional sprint assignment.";

export async function createUserStory(input: {
  title:               string;
  description?:        string;
  acceptanceCriteria?: string;
  iterationPath?:      string;
  areaPath?:           string;
  assignedTo?:         string;
  priority?:           number;
  tags?:               string;
}): Promise<string> {
  const {
    title,
    description,
    acceptanceCriteria,
    iterationPath,
    areaPath,
    assignedTo,
    priority,
    tags,
  } = input;

  const patchDoc: PatchOperation[] = [
    { op: "add", path: "/fields/System.Title",   value: title },
    { op: "add", path: "/fields/System.History", value: "User Story created by AI MCP Server." },
    ...(description        ? [{ op: "add" as const, path: "/fields/System.Description",                        value: description        }] : []),
    ...(acceptanceCriteria ? [{ op: "add" as const, path: "/fields/Microsoft.VSTS.Common.AcceptanceCriteria",  value: acceptanceCriteria }] : []),
    ...(iterationPath      ? [{ op: "add" as const, path: "/fields/System.IterationPath",                      value: iterationPath      }] : []),
    ...(areaPath           ? [{ op: "add" as const, path: "/fields/System.AreaPath",                           value: areaPath           }] : []),
    ...(assignedTo         ? [{ op: "add" as const, path: "/fields/System.AssignedTo",                         value: assignedTo         }] : []),
    ...(priority           ? [{ op: "add" as const, path: "/fields/Microsoft.VSTS.Common.Priority",            value: priority           }] : []),
    ...(tags               ? [{ op: "add" as const, path: "/fields/System.Tags",                               value: tags               }] : []),
  ];

  const res = await adoClient.post<WorkItem>(
    `/wit/workitems/$User%20Story?api-version=7.1`,
    patchDoc,
    { headers: { "Content-Type": "application/json-patch+json" } }
  );

  const f = res.data.fields as Record<string, any>;
  return JSON.stringify({
    success:            true,
    userStoryId:        res.data.id,
    title:              f["System.Title"],
    state:              f["System.State"],
    iterationPath:      f["System.IterationPath"],
    areaPath:           f["System.AreaPath"],
    assignedTo:         f["System.AssignedTo"]?.displayName ?? "Unassigned",
    priority:           f["Microsoft.VSTS.Common.Priority"] ?? null,
    url:                res.data._links?.html.href,
  }, null, 2);
}
