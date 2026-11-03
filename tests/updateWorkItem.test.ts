import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPatch } = vi.hoisted(() => ({ mockPatch: vi.fn() }));

vi.mock("../src/lib/adoClient.js", () => ({
  getClient:      () => ({ patch: mockPatch }),
  resolveProject: (p?: string) => p ?? "test-project",
  ADO_ORG:        "test-org",
  ADO_PROJECT:    "test-project",
}));

import { updateWorkItem } from "../src/tools/updateWorkItem.js";

const mockResponse = {
  data: {
    id: 200,
    fields: { "System.State": "Resolved", "System.Title": "My story" },
    _links: { html: { href: "https://dev.azure.com/org/project/_workitems/edit/200" } },
  },
};

describe("updateWorkItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates state successfully", async () => {
    vi.mocked(mockPatch).mockResolvedValue(mockResponse as any);
    const result = await updateWorkItem({ workItemId: 200, state: "Resolved" });
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.newState).toBe("Resolved");
  });

  it("returns friendly message when no fields are provided", async () => {
    const result = await updateWorkItem({ workItemId: 200 });
    expect(result).toContain("No fields provided");
    expect(mockPatch).not.toHaveBeenCalled();
  });

  it("only sends patch ops for provided fields", async () => {
    vi.mocked(mockPatch).mockResolvedValue(mockResponse as any);
    await updateWorkItem({ workItemId: 200, state: "Active" });
    const ops = vi.mocked(mockPatch).mock.calls[0][1] as any[];
    expect(ops).toHaveLength(1);
    expect(ops[0].path).toContain("State");
  });
});
