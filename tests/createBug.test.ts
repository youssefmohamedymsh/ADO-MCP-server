import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }));

vi.mock("../src/lib/adoClient.js", () => ({
  getClient:      () => ({ post: mockPost }),
  resolveProject: (p?: string) => p ?? "test-project",
  ADO_ORG:        "test-org",
  ADO_PROJECT:    "test-project",
}));

import { createBug } from "../src/tools/createBug.js";

const mockResponse = {
  data: {
    id: 321,
    fields: {
      "System.Title":         "Login fails",
      "System.IterationPath": "test-project\\Iteration 1",
      "System.AreaPath":      "test-project",
    },
    _links: { html: { href: "https://dev.azure.com/org/project/_workitems/edit/321" } },
  },
};

const baseInput = {
  title:          "Login fails",
  reproSteps:     "Open login page and submit",
  expectedResult: "User logs in",
  actualResult:   "Error 500",
};

describe("createBug", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends System.IterationPath when iterationPath is provided", async () => {
    vi.mocked(mockPost).mockResolvedValue(mockResponse as any);

    await createBug({ ...baseInput, iterationPath: "test-project\\Iteration 1" });

    const ops = vi.mocked(mockPost).mock.calls[0][1] as any[];
    const iterationOp = ops.find((op: any) => op.path === "/fields/System.IterationPath");
    expect(iterationOp).toBeDefined();
    expect(iterationOp.value).toBe("test-project\\Iteration 1");
  });

  it("omits System.IterationPath when iterationPath is not provided", async () => {
    vi.mocked(mockPost).mockResolvedValue(mockResponse as any);

    await createBug(baseInput);

    const ops = vi.mocked(mockPost).mock.calls[0][1] as any[];
    const iterationOp = ops.find((op: any) => op.path === "/fields/System.IterationPath");
    expect(iterationOp).toBeUndefined();
  });

  it("returns the iteration path from the created bug", async () => {
    vi.mocked(mockPost).mockResolvedValue(mockResponse as any);

    const result = await createBug({ ...baseInput, iterationPath: "test-project\\Iteration 1" });
    const parsed = JSON.parse(result);

    expect(parsed.success).toBe(true);
    expect(parsed.bugId).toBe(321);
    expect(parsed.iterationPath).toBe("test-project\\Iteration 1");
  });
});
