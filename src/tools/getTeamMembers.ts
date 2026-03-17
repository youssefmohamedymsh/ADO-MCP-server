import { z } from "zod";
import { adoClient, ADO_ORG, ADO_PROJECT } from "../lib/adoClient.js";

export const getTeamMembersSchema = {
  teamName: z.string().optional().describe("Team name to fetch members for — defaults to the project's default team"),
};

export const getTeamMembersDescription =
  "List all members of a project team. Useful for finding display names and emails for assignment.";

export async function getTeamMembers(input: {
  teamName?: string;
}): Promise<string> {
  const { teamName } = input;

  const team = teamName ?? `${ADO_PROJECT} Team`;

  const res = await adoClient.get<{ value: any[] }>(
    `/projects/${ADO_PROJECT}/teams/${encodeURIComponent(team)}/members?api-version=7.1`,
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
