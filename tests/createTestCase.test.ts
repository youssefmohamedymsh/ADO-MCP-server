import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/lib/adoClient.js", () => ({
  adoClient:   { post: vi.fn() },
  ADO_ORG:     "test-org",
  ADO_PROJECT: "test-project",
}));

import { createTestCase } from "../src/tools/createTestCase.js";
import { adoClient } from "../src/lib/adoClient.js";

const mockResponse = {
  data: {
    id: 999,
    fields: {
      "System.Title": "Login test",
      "System.State": "Design",
    },
    _links: { html: { href: "https://dev.azure.com/org/project/_workitems/edit/999" } },
  },
};

describe("createTestCase", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a test case and returns its ID and URL", async () => {
    vi.mocked(adoClient.post).mockResolvedValue(mockResponse as any);

    const result = await createTestCase({
      title: "Login test",
      steps: [
        { action: "Navigate to /login", expected: "Login page is visible" },
        { action: "Enter valid credentials", expected: "User is redirected to home" },
      ],
    });

    const parsed = JSON.parse(result);
    expect(parsed.testCaseId).toBe(999);
    expect(parsed.success).toBe(true);
    expect(parsed.stepsCount).toBe(2);
  });

  it("includes linked story relation when linkedStoryId is provided", async () => {
    vi.mocked(adoClient.post).mockResolvedValue(mockResponse as any);

    await createTestCase({
      title: "Login test",
      steps: [{ action: "Do something", expected: "Something happens" }],
      linkedStoryId: 42,
    });

    const callArgs = vi.mocked(adoClient.post).mock.calls[0][1] as any[];
    const relationOp = callArgs.find((op: any) => op.path === "/relations/-");
    expect(relationOp).toBeDefined();
    expect(relationOp.value.url).toContain("42");
  });

  it("formats steps as XML in the patch document", async () => {
    vi.mocked(adoClient.post).mockResolvedValue(mockResponse as any);

    await createTestCase({
      title: "Steps test",
      steps: [{ action: "Click button", expected: "Modal appears" }],
    });

    const callArgs = vi.mocked(adoClient.post).mock.calls[0][1] as any[];
    const stepsOp = callArgs.find((op: any) => op.path.includes("TCM.Steps"));
    expect(stepsOp?.value).toContain("<steps");
    expect(stepsOp?.value).toContain("Click button");
  });
});
