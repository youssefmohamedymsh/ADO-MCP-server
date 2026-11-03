import { z } from "zod";
import { getClient, ADO_ORG, resolveProject } from "../lib/adoClient.js";

export const getTestRunsSchema = {
  project: z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  top:     z.number().min(1).max(50).optional().describe("Max number of test runs to return (default 10)"),
  state:   z.enum(["NotStarted", "InProgress", "Completed", "Aborted", "Waiting"]).optional()
            .describe("Filter by test run state"),
};

export const getTestRunsDescription =
  "Fetch recent test runs for the project, including pass/fail counts and completion status.";

export async function getTestRuns(input: {
  project?: string;
  top?:     number;
  state?:   string;
}): Promise<string> {
  const { project, top = 10, state } = input;
  const projectName = resolveProject(project);

  const stateParam = state ? `&state=${state}` : "";

  const res = await getClient(project).get<{ value: any[]; count: number }>(
    `/test/runs?api-version=7.1&$top=${top}${stateParam}`,
    { baseURL: `https://dev.azure.com/${ADO_ORG}/${projectName}` }
  );

  const runs = res.data.value.map((r: any) => ({
    id:           r.id,
    name:         r.name,
    state:        r.state,
    totalTests:   r.totalTests,
    passedTests:  r.passedTests,
    failedTests:  r.unanalyzedTests + (r.notApplicableTests ?? 0),
    startedDate:  r.startedDate  ?? "N/A",
    completedDate: r.completedDate ?? "N/A",
    url:          r.webAccessUrl,
  }));

  return JSON.stringify({
    totalRuns: res.data.count,
    runs,
  }, null, 2);
}
