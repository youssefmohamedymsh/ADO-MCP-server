import { z } from "zod";
import { adoClient } from "../lib/adoClient.js";
import type { WorkItem } from "../types.js";

export const getTestCasesForStorySchema = {
  storyId: z.number().describe("The numeric ID of the user story"),
};

export const getTestCasesForStoryDescription =
  "Return all test cases linked to a specific user story via the 'Tested By' relation. Shows test case IDs, titles, and current states.";

export async function getTestCasesForStory(input: { storyId: number }): Promise<string> {
  const { storyId } = input;

  // Fetch the story with its relations
  const storyRes = await adoClient.get<WorkItem>(
    `/wit/workitems/${storyId}?$expand=relations&api-version=7.0`
  );

  const relations = storyRes.data.relations ?? [];
  const tcRelations = relations.filter(
    (r) => r.rel === "Microsoft.VSTS.Common.TestedBy"
  );

  if (tcRelations.length === 0) {
    return JSON.stringify({
      storyId,
      storyTitle:    storyRes.data.fields["System.Title"],
      testCaseCount: 0,
      testCases:     [],
      message:       "No test cases are linked to this user story yet.",
    }, null, 2);
  }

  // Extract IDs from relation URLs
  const tcIds = tcRelations.map((r) => r.url.split("/").pop()).join(",");

  const tcRes = await adoClient.get<{ value: WorkItem[] }>(
    `/wit/workitems?ids=${tcIds}&fields=System.Id,System.Title,System.State,Microsoft.VSTS.Common.Priority&api-version=7.0`
  );

  return JSON.stringify({
    storyId,
    storyTitle:    storyRes.data.fields["System.Title"],
    testCaseCount: tcRes.data.value.length,
    testCases:     tcRes.data.value.map((w) => ({
      id:       w.id,
      title:    w.fields["System.Title"],
      state:    w.fields["System.State"],
      priority: w.fields["Microsoft.VSTS.Common.Priority"] ?? "—",
    })),
  }, null, 2);
}
