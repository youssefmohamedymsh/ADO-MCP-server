import { z } from "zod";
import { getClient, ADO_ORG, resolveProject } from "../lib/adoClient.js";
import { formatStepsAsXml } from "../lib/formatSteps.js";
import type { PatchOperation, WorkItem } from "../types.js";

export const createTestCaseSchema = {
  project:       z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  title:         z.string().min(1).describe("Test case title — be specific e.g. 'Verify login fails with invalid password'"),
  steps:         z.array(z.object({
                   action:   z.string().describe("What the tester does"),
                   expected: z.string().describe("Expected result of that action"),
                 })).min(1).describe("Ordered list of test steps"),
  linkedStoryId: z.number().optional().describe("User story ID to link this test case to (recommended)"),
  areaPath:      z.string().optional().describe("Area path for this test case — defaults to project root"),
  priority:      z.number().min(1).max(4).optional().describe("Priority 1 (highest) to 4 (lowest), default 2"),
  iterationPath: z.string().optional().describe("Sprint/Iteration path e.g. 'Congora\\Sprint 4 - Lighthouse'"),
};

export const createTestCaseDescription =
  "Create a new Test Case work item in Azure DevOps with formatted steps, and optionally link it to a User Story. Returns the new test case ID and URL.";

export async function createTestCase(input: {
  project?: string;
  title: string;
  steps: Array<{ action: string; expected: string }>;
  linkedStoryId?: number;
  areaPath?: string;
  priority?: number;
  iterationPath?: string;
}): Promise<string> {
  const { project, title, steps, linkedStoryId, areaPath, priority = 2, iterationPath } = input;
  const projectName = resolveProject(project);

  const stepsXml = formatStepsAsXml(steps);

  const patchDoc: PatchOperation[] = [
    { op: "add", path: "/fields/System.Title",                     value: title },
    { op: "add", path: "/fields/Microsoft.VSTS.TCM.Steps",        value: stepsXml },
    { op: "add", path: "/fields/Microsoft.VSTS.Common.Priority",  value: priority },
    ...(areaPath ? [{ op: "add" as const, path: "/fields/System.AreaPath", value: areaPath }] : []),
    ...(iterationPath ? [{ op: "add" as const, path: "/fields/System.IterationPath", value: iterationPath }] : []),
    // Link to user story via "Tested By" relation
    ...(linkedStoryId ? [{
      op: "add" as const,
      path: "/relations/-",
      value: {
        rel: "Microsoft.VSTS.Common.TestedBy-Reverse",
        url: `https://dev.azure.com/${ADO_ORG}/${projectName}/_apis/wit/workItems/${linkedStoryId}`,
        attributes: { comment: "Linked by AI MCP Server" },
      },
    }] : []),
  ];

  const res = await getClient(project).post<WorkItem>(
    `/wit/workitems/$Test%20Case?api-version=7.0`,
    patchDoc,
    { headers: { "Content-Type": "application/json-patch+json" } }
  );

  const tc = res.data;
  return JSON.stringify({
    success:       true,
    testCaseId:    tc.id,
    title:         tc.fields["System.Title"],
    state:         tc.fields["System.State"],
    linkedStoryId: linkedStoryId ?? null,
    url:           tc._links?.html.href,
    stepsCount:    steps.length,
  }, null, 2);
}
