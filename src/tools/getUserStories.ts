import { z } from "zod";
import { runWiqlQuery } from "../lib/wiql.js";
import type { UserStory } from "../types.js";

export const getUserStoriesSchema = {
  iterationPath: z.string().optional().describe("Sprint path e.g. 'MyProject\\Sprint 3'"),
  state:         z.string().optional().describe("Filter by state: Active, New, Resolved, Closed"),
  areaPath:      z.string().optional().describe("Filter by area path e.g. 'MyProject\\Backend'"),
  top:           z.number().min(1).max(100).optional().describe("Max results to return (default 20, max 100)"),
};

export const getUserStoriesDescription =
  "Fetch user stories from Azure DevOps. Supports filtering by sprint (iterationPath), state, and area path. Returns title, description, and acceptance criteria for each story.";

export async function getUserStories(input: {
  iterationPath?: string;
  state?: string;
  areaPath?: string;
  top?: number;
}): Promise<string> {
  const { iterationPath, state, areaPath, top = 20 } = input;

  const conditions: string[] = ["[System.WorkItemType] = 'User Story'"];
  if (state)         conditions.push(`[System.State] = '${state}'`);
  if (iterationPath) conditions.push(`[System.IterationPath] = '${iterationPath}'`);
  if (areaPath)      conditions.push(`[System.AreaPath] UNDER '${areaPath}'`);

  const items = await runWiqlQuery(conditions.join(" AND "), top);

  if (items.length === 0) {
    return "No user stories found matching the given filters.";
  }

  const stories: UserStory[] = items.map((w) => ({
    id:                 w.id,
    title:              w.fields["System.Title"],
    state:              w.fields["System.State"],
    description:        w.fields["System.Description"]                          || "No description provided.",
    acceptanceCriteria: w.fields["Microsoft.VSTS.Common.AcceptanceCriteria"]    || "No acceptance criteria defined.",
    iterationPath:      w.fields["System.IterationPath"],
    areaPath:           w.fields["System.AreaPath"],
  }));

  return JSON.stringify(stories, null, 2);
}
