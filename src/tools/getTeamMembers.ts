import { z } from "zod";
import { getClient, ADO_ORG, resolveProject } from "../lib/adoClient.js";

export const getTeamMembersSchema = {
  project:  z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  teamName: z.string().optional().describe("Team name to fetch members for — defaults to the project's default team"),
};

export const getTeamMembersDescription =
  "List all members of a project team. Useful for finding display names and emails for assignment.";

export async function getTeamMembers(input: {
  project?: string;
  teamName?: string;
}): Promise<string> {
  const { project, teamName } = input;
  const projectName = resolveProject(project);

  const team = teamName ?? `${projectName} Team`;

  const res = await getClient(project).get<{ value: any[] }>(
    `/projects/${projectName}/teams/${encodeURIComponent(team)}/members?api-version=7.1`,
    { baseURL: `https://dev.azure.com/${ADO_ORG}` }
  );

  const members = res.data.value.map((m: any) => ({
    displayName: m.identity?.displayName ?? m.displayName,
    email:       m.identity?.uniqueName  ?? m.uniqueName,
    id:          m.identity?.id          ?? m.id,
  }));

  return JSON.stringify({
    team,
    memberCount: members.length,
    members,
  }, null, 2);
}
