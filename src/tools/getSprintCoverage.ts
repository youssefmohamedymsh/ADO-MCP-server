import { z } from "zod";
import { getClient } from "../lib/adoClient.js";
import { runWiqlQuery } from "../lib/wiql.js";
import type { SprintCoverage, WorkItem } from "../types.js";

export const getSprintCoverageSchema = {
  project:       z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  iterationPath: z.string().describe("Sprint path e.g. 'MyProject\\Sprint 3'"),
};

export const getSprintCoverageDescription =
  "Calculate the test coverage percentage for a sprint: how many user stories have at least one linked test case vs. those with none. Returns a coverage report with a list of uncovered stories.";

export async function getSprintCoverage(input: { project?: string; iterationPath: string }): Promise<string> {
  const { project, iterationPath } = input;
  const client = getClient(project);

  // Get all user stories in the sprint
  const stories = await runWiqlQuery(
    `[System.WorkItemType] = 'User Story' AND [System.IterationPath] = '${iterationPath}'`,
    100,
    undefined,
    project,
  );

  if (stories.length === 0) {
    return JSON.stringify({
      sprint:         iterationPath,
      totalStories:   0,
      message:        "No user stories found for this sprint path.",
    }, null, 2);
  }

  // For each story, check if it has linked test cases
  const coverageChecks = await Promise.all(
    stories.map(async (story): Promise<{ story: WorkItem; hasCoverage: boolean }> => {
      try {
        const res = await client.get<WorkItem>(
          `/wit/workitems/${story.id}?$expand=relations&api-version=7.0`
        );
        const relations = res.data.relations ?? [];
        const hasTestCases = relations.some(
          (r) => r.rel === "Microsoft.VSTS.Common.TestedBy"
        );
        return { story, hasCoverage: hasTestCases };
      } catch {
        return { story, hasCoverage: false };
      }
    })
  );

  const covered   = coverageChecks.filter((c) => c.hasCoverage);
  const uncovered = coverageChecks.filter((c) => !c.hasCoverage);

  const coverage: SprintCoverage = {
    sprint:               iterationPath,
    totalStories:         stories.length,
    storiesWithTests:     covered.length,
    storiesWithoutTests:  uncovered.length,
    coveragePercent:      Math.round((covered.length / stories.length) * 100),
    uncoveredStories:     uncovered.map((c) => ({
      id:    c.story.id,
      title: c.story.fields["System.Title"],
    })),
  };

  return JSON.stringify(coverage, null, 2);
}
