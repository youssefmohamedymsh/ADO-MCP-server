import { z } from "zod";
import { getClient, ADO_ORG, resolveProject } from "../lib/adoClient.js";

export const getAreaPathsSchema = {
  project: z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  depth:   z.number().min(1).max(10).optional().describe("How many levels deep to fetch (default 3)"),
};

export const getAreaPathsDescription =
  "List area paths for a project. Returns the full tree of areas — useful for discovering valid areaPath values for filtering and assigning work items.";

interface AreaNode {
  name: string;
  path: string;
  children?: AreaNode[];
}

function flattenNodes(node: any, prefix: string): AreaNode[] {
  const path = prefix ? `${prefix}\\${node.name}` : node.name;
  const result: AreaNode[] = [{ name: node.name, path }];
  if (node.children) {
    for (const child of node.children) {
      result.push(...flattenNodes(child, path));
    }
  }
  return result;
}

export async function getAreaPaths(input: {
  project?: string;
  depth?: number;
}): Promise<string> {
  const { project, depth = 3 } = input;
  const projectName = resolveProject(project);

  const res = await getClient(project).get<any>(
    `/wit/classificationnodes/Areas?$depth=${depth}&api-version=7.1`,
    { baseURL: `https://dev.azure.com/${ADO_ORG}/${projectName}/_apis` }
  );

  const areas = flattenNodes(res.data, "");

  return JSON.stringify({
    project: projectName,
    areaCount: areas.length,
    areas,
  }, null, 2);
}
