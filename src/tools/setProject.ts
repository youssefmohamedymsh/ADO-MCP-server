import { z } from "zod";
import { getClient, ADO_ORG } from "../lib/adoClient.js";
import { setCurrentProject } from "../lib/projectContext.js";

export const setProjectSchema = {
  project: z.string().min(1).describe("The name or ID of the Azure DevOps project to work with"),
};

export const setProjectDescription =
  "Select which Azure DevOps project subsequent tools operate on, so you don't pass 'project' on every call. " +
  "Run list_projects first to discover available names. The selection persists for the session and overrides the " +
  "default ADO_PROJECT; you can still pass an explicit 'project' argument to any tool to override it for a single call.";

export async function setProject(input: { project: string }): Promise<string> {
  const { project } = input;

  // Verify the project exists via the org-level projects endpoint before storing it.
  const res = await getClient(project).get<{ name: string; id: string; state: string }>(
    `/projects/${encodeURIComponent(project)}?api-version=7.1`,
    { baseURL: `https://dev.azure.com/${ADO_ORG}/_apis` }
  );

  // Store the canonical project name returned by the API.
  setCurrentProject(res.data.name);

  return `✅ Project **${res.data.name}** selected. All subsequent tools will use it unless you pass an explicit "project" argument. Run set_project again to switch.`;
}
