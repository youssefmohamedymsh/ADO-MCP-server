import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";

/**
 * This test validates tool file structure using static source code analysis
 * (no dynamic imports which vitest restricts for security)
 * 
 * For runtime validation, use: node scripts/validateTools.mjs
 */

describe("Tool Export Validation (Static Analysis)", () => {
  const toolsDir = resolve(process.cwd(), "src/tools");
  const toolFiles = readdirSync(toolsDir)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => f.replace(".ts", ""))
    .sort();

  const expectedTools = [
    "assignWorkItem",
    "bulkAssignWorkItems",
    "createBug",
    "createChildTask",
    "createTestCase",
    "getChildWorkItems",
    "getSprintCoverage",
    "getTeamMembers",
    "getTestCasesForStory",
    "getTestRuns",
    "getUserStories",
    "getWorkItem",
    "linkWorkItems",
    "updateWorkItem",
  ];

  it("should have exactly 14 tool files", () => {
    expect(toolFiles).toHaveLength(14);
  });

  it("should have all expected tools", () => {
    const missing = expectedTools.filter((t) => !toolFiles.includes(t));
    expect(missing).toHaveLength(0);
  });

  it("should validate each tool file has proper exports (source analysis)", () => {
    const results = {
      valid: 0,
      invalid: 0,
      errors: [] as string[],
    };

    expectedTools.forEach((toolName) => {
      const filePath = resolve(toolsDir, `${toolName}.ts`);

      try {
        const content = readFileSync(filePath, "utf-8");

        const hasFunction = new RegExp(
          `export\\s+(async\\s+)?function\\s+${toolName}\\s*\\(`
        ).test(content);
        const hasSchema = new RegExp(
          `export\\s+const\\s+${toolName}Schema\\s*=`
        ).test(content);
        const hasDescription = new RegExp(
          `export\\s+const\\s+${toolName}Description\\s*=`
        ).test(content);

        if (hasFunction && hasSchema && hasDescription) {
          results.valid++;
        } else {
          results.invalid++;
          const missing = [];
          if (!hasFunction) missing.push("function");
          if (!hasSchema) missing.push("Schema");
          if (!hasDescription) missing.push("Description");
          results.errors.push(`${toolName}: missing ${missing.join(", ")}`);
        }
      } catch (error) {
        results.invalid++;
        results.errors.push(`${toolName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    if (results.errors.length > 0) {
      console.log("\n❌ Invalid tool exports:");
      results.errors.forEach((e) => console.log(`  - ${e}`));
    }

    expect(results.invalid).toBe(0);
    expect(results.valid).toBe(14);
  });

  it("should verify server.ts imports all tools", () => {
    const serverPath = resolve(process.cwd(), "src/server.ts");
    const serverContent = readFileSync(serverPath, "utf-8");

    const importRegex = /import\s+\{\s*(\w+),\s+(\w+),\s+(\w+)\s*\}\s+from\s+['"]\.\/tools\/(\w+)/g;
    const importedTools = [];
    let match;

    while ((match = importRegex.exec(serverContent)) !== null) {
      importedTools.push(match[4]);
    }

    const missing = expectedTools.filter((t) => !importedTools.includes(t));

    if (missing.length > 0) {
      console.log("\n❌ Tools not imported in server.ts:");
      missing.forEach((t) => console.log(`  - ${t}`));
    }

    expect(importedTools.length).toBe(14);
    expect(missing).toHaveLength(0);
  });

  it("should verify all tools are registered in server.tool()", () => {
    const serverPath = resolve(process.cwd(), "src/server.ts");
    const serverContent = readFileSync(serverPath, "utf-8");

    const toolRegex = /server\.tool\(\s*["'](\w+)/g;
    const registeredTools = [];
    let match;

    while ((match = toolRegex.exec(serverContent)) !== null) {
      registeredTools.push(match[1]);
    }

    expect(registeredTools.length).toBe(14);
  });

  it("should have matching tool exports and registrations", () => {
    const serverPath = resolve(process.cwd(), "src/server.ts");
    const serverContent = readFileSync(serverPath, "utf-8");

    // Map from tool function names to registered names
    const toolToRegistered: Record<string, string> = {
      getUserStories: "get_user_stories",
      createTestCase: "create_test_case",
      updateWorkItem: "update_work_item",
      getTestCasesForStory: "get_test_cases_for_story",
      createBug: "create_bug",
      getSprintCoverage: "get_sprint_coverage",
      getChildWorkItems: "get_child_work_items",
      createChildTask: "create_child_task",
      assignWorkItem: "assign_work_item",
      getWorkItem: "get_work_item",
      linkWorkItems: "link_work_items",
      getTeamMembers: "get_team_members",
      bulkAssignWorkItems: "bulk_assign_work_items",
      getTestRuns: "get_test_runs",
    };

    Object.entries(toolToRegistered).forEach(([toolName, registeredName]) => {
      const hasRegistration = new RegExp(`server\\.tool\\(\\s*["']${registeredName}`).test(
        serverContent
      );
      expect(hasRegistration).toBe(true);
    });
  });
});
