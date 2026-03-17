import { z } from "zod";
import { adoClient, ADO_ORG, ADO_PROJECT } from "../lib/adoClient.js";

export const getTestRunsSchema = {
  top:   z.number().min(1).max(50).optional().describe("Max number of test runs to return (default 10)"),
  state: z.enum(["NotStarted", "InProgress", "Completed", "Aborted", "Waiting"]).optional()
          .describe("Filter by test run state"),
};

export const getTestRunsDescription =
  "Fetch recent test runs for the project, including pass/fail counts and completion status.";

export async function getTestRuns(input: {
  top?:   number;
  state?: string;
}): Promise<string> {
  const { top = 10, state } = input;

  const stateParam = state ? `&state=${state}` : "";

  const res = await adoClient.get<{ value: any[]; count: number }>(
    `/test/runs?api-version=7.1&$top=${top}${stateParam}`,
    { baseURL: `https://dev.azure.com/${ADO_ORG}/${ADO_PROJECT}` }
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
