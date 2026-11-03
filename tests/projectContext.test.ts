import { describe, it, expect, beforeEach, vi } from "vitest";

// adoClient validates env at module load, and ESM imports are hoisted above
// plain statements, so the env must be set inside vi.hoisted() to run first.
vi.hoisted(() => {
  process.env.ADO_ORG = "test-org";
  process.env.ADO_PAT = "test-pat";
  delete process.env.ADO_PROJECT;
});

import {
  setCurrentProject,
  getCurrentProject,
  resetProject,
  isProjectSelected,
} from "../src/lib/projectContext.js";
import { resolveProject } from "../src/lib/adoClient.js";

describe("projectContext", () => {
  beforeEach(() => {
    resetProject();
    delete process.env.ADO_PROJECT;
  });

  it("starts with no project selected", () => {
    expect(getCurrentProject()).toBeNull();
    expect(isProjectSelected()).toBe(false);
  });

  it("stores and returns the selected project", () => {
    setCurrentProject("Alpha");
    expect(getCurrentProject()).toBe("Alpha");
    expect(isProjectSelected()).toBe(true);
  });

  it("resets the selected project", () => {
    setCurrentProject("Alpha");
    resetProject();
    expect(getCurrentProject()).toBeNull();
    expect(isProjectSelected()).toBe(false);
  });
});

describe("resolveProject precedence", () => {
  beforeEach(() => {
    resetProject();
    delete process.env.ADO_PROJECT;
  });

  it("prefers an explicit argument over the session selection and env", () => {
    setCurrentProject("Session");
    process.env.ADO_PROJECT = "EnvProj";
    expect(resolveProject("Explicit")).toBe("Explicit");
  });

  it("falls back to the session selection when no argument is given", () => {
    setCurrentProject("Session");
    process.env.ADO_PROJECT = "EnvProj";
    expect(resolveProject()).toBe("Session");
  });

  it("falls back to ADO_PROJECT when nothing is selected", () => {
    process.env.ADO_PROJECT = "EnvProj";
    expect(resolveProject()).toBe("EnvProj");
  });

  it("throws when no project is available anywhere", () => {
    expect(() => resolveProject()).toThrow(/set_project|ADO_PROJECT/);
  });
});
