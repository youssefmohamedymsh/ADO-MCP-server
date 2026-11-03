import { z } from "zod";
import { getClient, ADO_ORG, resolveProject } from "../lib/adoClient.js";
import type { PatchOperation, WorkItem } from "../types.js";

export const createBugSchema = {
  project:         z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  title:           z.string().min(1).describe("Bug title — be concise and specific"),
  reproSteps:      z.string().describe("Step-by-step reproduction steps (HTML or plain text)"),
  expectedResult:  z.string().describe("What should have happened"),
  actualResult:    z.string().describe("What actually happened"),
  severity:        z.enum(["1 - Critical", "2 - High", "3 - Medium", "4 - Low"]).optional()
                    .describe("Severity of the bug, default '3 - Medium'"),
  linkedTestCaseId: z.number().optional().describe("Test case ID that surfaced this bug"),
  iterationPath:   z.string().optional().describe("Sprint/Iteration path e.g. 'MyProject\\Iteration 1'"),
  areaPath:        z.string().optional().describe("Area path for this bug"),
};

export const createBugDescription =
  "Log a Bug work item in Azure DevOps with reproduction steps, expected vs actual results, and optionally link it to the test case that found it.";

export async function createBug(input: {
  project?:         string;
  title:            string;
  reproSteps:       string;
  expectedResult:   string;
  actualResult:     string;
  severity?:        string;
  linkedTestCaseId?: number;
  iterationPath?:   string;
  areaPath?:        string;
}): Promise<string> {
  const {
    project, title, reproSteps, expectedResult, actualResult,
    severity = "3 - Medium", linkedTestCaseId, iterationPath, areaPath,
  } = input;
  const projectName = resolveProject(project);

  const fullReproSteps = `
    <div><b>Reproduction Steps:</b><br/>${reproSteps}</div>
    <br/>
    <div><b>Expected Result:</b><br/>${expectedResult}</div>
    <br/>
    <div><b>Actual Result:</b><br/>${actualResult}</div>
  `;

  const patchDoc: PatchOperation[] = [
    { op: "add", path: "/fields/System.Title",                                value: title },
    { op: "add", path: "/fields/Microsoft.VSTS.TCM.ReproSteps",              value: fullReproSteps },
    { op: "add", path: "/fields/Microsoft.VSTS.Common.Severity",             value: severity },
    { op: "add", path: "/fields/System.History",                             value: "Bug logged by AI MCP Server." },
    ...(iterationPath ? [{ op: "add" as const, path: "/fields/System.IterationPath", value: iterationPath }] : []),
    ...(areaPath ? [{ op: "add" as const, path: "/fields/System.AreaPath",  value: areaPath }] : []),
    ...(linkedTestCaseId ? [{
      op: "add" as const,
      path: "/relations/-",
      value: {
        rel: "Microsoft.VSTS.Common.TestedBy-Reverse",
        url: `https://dev.azure.com/${ADO_ORG}/${projectName}/_apis/wit/workItems/${linkedTestCaseId}`,
        attributes: { comment: "Bug found during test execution" },
      },
    }] : []),
  ];

  const res = await getClient(project).post<WorkItem>(
    `/wit/workitems/$Bug?api-version=7.0`,
    patchDoc,
    { headers: { "Content-Type": "application/json-patch+json" } }
  );

  return JSON.stringify({
    success:          true,
    bugId:            res.data.id,
    title:            res.data.fields["System.Title"],
    severity,
    iterationPath:    res.data.fields["System.IterationPath"],
    areaPath:         res.data.fields["System.AreaPath"],
    linkedTestCaseId: linkedTestCaseId ?? null,
    url:              res.data._links?.html.href,
  }, null, 2);
}
