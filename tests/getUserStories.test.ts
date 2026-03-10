import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserStories } from "../src/tools/getUserStories.js";

// Mock the ADO client and wiql helper
vi.mock("../src/lib/wiql.js", () => ({
  runWiqlQuery: vi.fn(),
}));

import { runWiqlQuery } from "../src/lib/wiql.js";

const mockStories = [
  {
    id: 101,
    url: "https://dev.azure.com/org/project/_apis/wit/workItems/101",
    fields: {
      "System.Id": 101,
      "System.Title": "User can log in with valid credentials",
      "System.State": "Active",
      "System.WorkItemType": "User Story",
      "System.Description": "As a user, I want to log in...",
      "System.AreaPath": "MyProject\\Auth",
      "System.IterationPath": "MyProject\\Sprint 3",
      "Microsoft.VSTS.Common.AcceptanceCriteria": "Given valid creds, when I submit, then I am redirected to home.",
    },
    relations: [],
  },
];

describe("getUserStories", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns parsed stories when ADO returns results", async () => {
    vi.mocked(runWiqlQuery).mockResolvedValue(mockStories as any);
    const result = await getUserStories({ state: "Active" });
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe(101);
    expect(parsed[0].title).toBe("User can log in with valid credentials");
  });

  it("returns a friendly message when no stories are found", async () => {
    vi.mocked(runWiqlQuery).mockResolvedValue([]);
    const result = await getUserStories({ state: "Resolved" });
    expect(result).toContain("No user stories found");
  });

  it("passes iterationPath filter correctly to WIQL", async () => {
    vi.mocked(runWiqlQuery).mockResolvedValue(mockStories as any);
    await getUserStories({ iterationPath: "MyProject\\Sprint 3" });
    expect(runWiqlQuery).toHaveBeenCalledWith(
      expect.stringContaining("System.IterationPath"),
      expect.any(Number)
    );
  });
});
