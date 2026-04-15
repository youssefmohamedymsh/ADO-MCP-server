import { z } from "zod";
import { getClient, ADO_ORG, resolveProject } from "../lib/adoClient.js";
import type { PatchOperation, WorkItem } from "../types.js";

export const createChildTaskSchema = {
  project:     z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  parentId:    z.number().describe("The numeric ID of the parent work item"),
  title:       z.string().min(1).describe("Title of the new child task"),
  assignedTo:  z.string().optional().describe("Display name or email of the user to assign the task to"),
  description: z.string().optional().describe("Optional description for the task"),
};

export const createChildTaskDescription =
  "Create a child Task under a parent work item (e.g. a user story), with optional assignee and description.";

export async function createChildTask(input: {
  project?:     string;
  parentId:     number;
  title:        string;
  assignedTo?:  string;
  description?: string;
}): Promise<string> {
  const { project, parentId, title, assignedTo, description } = input;
  const projectName = resolveProject(project);

  const patchDoc: PatchOperation[] = [
    { op: "add", path: "/fields/System.Title",   value: title },
    { op: "add", path: "/fields/System.History", value: "Task created by AI MCP Server." },
    {
      op: "add",
      path: "/relations/-",
      value: {
        rel: "System.LinkTypes.Hierarchy-Reverse",
        url: `https://dev.azure.com/${ADO_ORG}/${projectName}/_apis/wit/workitems/${parentId}`,
        attributes: { comment: "Child task created by MCP server" },
      },
    },
    ...(assignedTo  ? [{ op: "add" as const, path: "/fields/System.AssignedTo",  value: assignedTo  }] : []),
    ...(description ? [{ op: "add" as const, path: "/fields/System.Description", value: description }] : []),
  ];

  const res = await getClient(project).post<WorkItem>(
    `/wit/workitems/$Task?api-version=7.1`,
    patchDoc,
    { headers: { "Content-Type": "application/json-patch+json" } }
  );

  const f = res.data.fields as Record<string, any>;
  return JSON.stringify({
    success:    true,
    taskId:     res.data.id,
    title:      f["System.Title"],
    parentId,
    assignedTo: f["System.AssignedTo"]?.displayName ?? "Unassigned",
    url:        res.data._links?.html.href,
  }, null, 2);
}
