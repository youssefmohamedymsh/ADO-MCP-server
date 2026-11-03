import { z } from "zod";
import { getClient, ADO_ORG, resolveProject } from "../lib/adoClient.js";

export const getBoardColumnsSchema = {
  project:   z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  teamName:  z.string().optional().describe("Team name — defaults to '<ProjectName> Team'"),
  boardName: z.string().optional().describe("Board name e.g. 'Stories', 'Epics', 'Bugs' — defaults to 'Stories'"),
};

export const getBoardColumnsDescription =
  "Get the board column definitions (kanban columns) for a team board. Shows column names, order, WIP limits, and state mappings — useful for understanding the team's workflow.";

export async function getBoardColumns(input: {
  project?: string;
  teamName?: string;
  boardName?: string;
}): Promise<string> {
  const { project, teamName, boardName = "Stories" } = input;
  const projectName = resolveProject(project);
  const team = teamName ?? `${projectName} Team`;

  const res = await getClient(project).get<{ columns: any[] }>(
    `/work/boards/${encodeURIComponent(boardName)}?api-version=7.1`,
    { baseURL: `https://dev.azure.com/${ADO_ORG}/${projectName}/${encodeURIComponent(team)}/_apis` }
  );

  const columns = res.data.columns.map((c: any) => ({
    name:         c.name,
    columnType:   c.columnType,
    wipLimit:     c.itemLimit ?? null,
    stateMappings: c.stateMappings ?? {},
    isSplit:      c.isSplit ?? false,
  }));

  return JSON.stringify({
    project: projectName,
    team,
    board: boardName,
    columnCount: columns.length,
    columns,
  }, null, 2);
}
