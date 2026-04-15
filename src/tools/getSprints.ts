import { z } from "zod";
import { getClient, ADO_ORG, resolveProject } from "../lib/adoClient.js";

export const getSprintsSchema = {
  project:  z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  teamName: z.string().optional().describe("Team name — defaults to '<ProjectName> Team'"),
};

export const getSprintsDescription =
  "List all sprints/iterations for a project team, including dates and timeframe (past, current, future). Useful for discovering valid iterationPath values.";

export async function getSprints(input: {
  project?: string;
  teamName?: string;
}): Promise<string> {
  const { project, teamName } = input;
  const projectName = resolveProject(project);
  const team = teamName ?? `${projectName} Team`;

  const res = await getClient(project).get<{ value: any[]; count: number }>(
    `/work/teamsettings/iterations?api-version=7.1`,
    { baseURL: `https://dev.azure.com/${ADO_ORG}/${projectName}/${encodeURIComponent(team)}/_apis` }
  );

  const sprints = res.data.value.map((s: any) => ({
    name:      s.name,
    path:      s.path,
    timeFrame: s.attributes?.timeFrame ?? "unknown",
    startDate: s.attributes?.startDate ?? null,
    endDate:   s.attributes?.finishDate ?? null,
  }));

  return JSON.stringify({
    project: projectName,
    team,
    sprintCount: sprints.length,
    sprints,
  }, null, 2);
}
