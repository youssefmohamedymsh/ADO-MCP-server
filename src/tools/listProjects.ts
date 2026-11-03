import { z } from "zod";
import { getClient, ADO_ORG } from "../lib/adoClient.js";

export const listProjectsSchema = {};

export const listProjectsDescription =
  "List all projects in the Azure DevOps organization. Useful for discovering available project names to pass to other tools.";

export async function listProjects(_input: Record<string, never>): Promise<string> {
  const client = getClient();

  const res = await client.get<{ value: any[]; count: number }>(
    `/projects?api-version=7.0`,
    { baseURL: `https://dev.azure.com/${ADO_ORG}/_apis` }
  );

  const projects = res.data.value.map((p: any) => ({
    name:        p.name,
    id:          p.id,
    state:       p.state,
    description: p.description ?? null,
  }));

  return JSON.stringify({
    organization: ADO_ORG,
    projectCount: projects.length,
    projects,
  }, null, 2);
}
