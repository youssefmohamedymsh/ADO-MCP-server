import { describe, it, expect } from "vitest";
import { readdirSync } from "fs";
import { resolve } from "path";

/**
 * This test validates that all tool files in src/tools/ are properly exported
 * with the required structure: function, schema, and description
 */

describe("Tool Export Validation", () => {
  // List all tool files
  const toolsDir = resolve(process.cwd(), "src/tools");
  const toolFiles = readdirSync(toolsDir).filter((f) => f.endsWith(".ts"));

  // Expected exports for each tool
  const expectedExports = {
    getUserStories: ["getUserStories", "getUserStoriesSchema", "getUserStoriesDescription"],
    createTestCase: ["createTestCase", "createTestCaseSchema", "createTestCaseDescription"],
    updateWorkItem: ["updateWorkItem", "updateWorkItemSchema", "updateWorkItemDescription"],
    getTestCasesForStory: ["getTestCasesForStory", "getTestCasesForStorySchema", "getTestCasesForStoryDescription"],
    createBug: ["createBug", "createBugSchema", "createBugDescription"],
    getSprintCoverage: ["getSprintCoverage", "getSprintCoverageSchema", "getSprintCoverageDescription"],
    getChildWorkItems: ["getChildWorkItems", "getChildWorkItemsSchema", "getChildWorkItemsDescription"],
    createChildTask: ["createChildTask", "createChildTaskSchema", "createChildTaskDescription"],
    assignWorkItem: ["assignWorkItem", "assignWorkItemSchema", "assignWorkItemDescription"],
    getWorkItem: ["getWorkItem", "getWorkItemSchema", "getWorkItemDescription"],
    linkWorkItems: ["linkWorkItems", "linkWorkItemsSchema", "linkWorkItemsDescription"],
    getTeamMembers: ["getTeamMembers", "getTeamMembersSchema", "getTeamMembersDescription"],
    bulkAssignWorkItems: ["bulkAssignWorkItems", "bulkAssignWorkItemsSchema", "bulkAssignWorkItemsDescription"],
    getTestRuns: ["getTestRuns", "getTestRunsSchema", "getTestRunsDescription"],
  };

  it("should have 14 tool files in src/tools/", () => {
    expect(toolFiles).toHaveLength(14);
  });

  it("should validate all tool files have .ts extension", () => {
    toolFiles.forEach((file) => {
      expect(file).toMatch(/\.ts$/);
    });
  });

  it("should list all tool files found", () => {
    console.log("Tool files found:");
    toolFiles.sort().forEach((file) => {
      console.log(`  - ${file}`);
    });
    expect(toolFiles.length).toBeGreaterThan(0);
  });

  it("should have matching tool files for each expected export", () => {
    const expectedToolNames = Object.keys(expectedExports);
    const foundToolNames = toolFiles.map((f) => f.replace(".ts", ""));

    console.log("\nExpected tools:", expectedToolNames.length);
    console.log("Found tool files:", foundToolNames.length);

    const missing = expectedToolNames.filter(
      (name) => !foundToolNames.includes(name)
    );
    const extra = foundToolNames.filter(
      (name) => !expectedToolNames.includes(name)
    );

    if (missing.length > 0) {
      console.log("\n❌ Missing tool files:");
      missing.forEach((m) => console.log(`  - ${m}.ts`));
    }

    if (extra.length > 0) {
      console.log("\n⚠️  Extra tool files (not in expectedExports):");
      extra.forEach((e) => console.log(`  - ${e}.ts`));
    }

    expect(missing).toHaveLength(0);
  });

  // Dynamic imports and validation
  describe("Dynamic Export Validation", () => {
    Object.entries(expectedExports).forEach(([toolName, exports]) => {
      it(`should have all exports for ${toolName} (function, schema, description)`, async () => {
        try {
          // Dynamically import the tool file
          const module = await import(`../src/tools/${toolName}.js`);

          console.log(`\n✓ ${toolName}:`);

          exports.forEach((exp) => {
            const hasExport = exp in module;
            const status = hasExport ? "✓" : "✗";
            console.log(`  ${status} ${exp}: ${hasExport ? "exported" : "MISSING"}`);

            if (hasExport) {
              const value = module[exp];
              if (exp.endsWith("Schema")) {
                expect(value).toBeDefined();
                console.log(`    └─ Type: ${typeof value}`);
              } else if (exp.endsWith("Description")) {
                expect(value).toBeDefined();
                expect(typeof value).toBe("string");
                console.log(`    └─ Description length: ${value.length} chars`);
              } else {
                expect(value).toBeDefined();
                expect(typeof value).toBe("function");
                console.log(`    └─ Function`);
              }
            }
          });

          // Verify all exports are present
          exports.forEach((exp) => {
            expect(module[exp]).toBeDefined();
          });
        } catch (error) {
          console.error(`\n✗ ${toolName} - Import failed:`, error);
          throw error;
        }
      });
    });
  });

  // Test server.ts imports all tools
  describe("Server Registration", () => {
    it("should verify server.ts can access all required imports", async () => {
      try {
        const server = await import("../src/server.js");
        console.log(`\n✓ server.js imported successfully`);
        expect(server).toBeDefined();
      } catch (error) {
        console.error(`\n✗ server.js import failed:`, error);
        throw error;
      }
    });
  });
});

describe("Tool File Structure Audit", () => {
  it("should provide detailed audit of each tool file", async () => {
    const toolsDir = resolve(process.cwd(), "src/tools");
    const toolFiles = readdirSync(toolsDir).filter((f) => f.endsWith(".ts"));

    console.log("\n" + "=".repeat(60));
    console.log("TOOL FILE STRUCTURE AUDIT");
    console.log("=".repeat(60));

    let successCount = 0;
    let failureCount = 0;

    for (const file of toolFiles.sort()) {
      const toolName = file.replace(".ts", "");
      try {
        const module = await import(`../src/tools/${toolName}.js`);

        const hasFunction = typeof module[toolName] === "function";
        const hasSchema = module[`${toolName}Schema`] !== undefined;
        const hasDescription = typeof module[`${toolName}Description`] === "string";

        if (hasFunction && hasSchema && hasDescription) {
          console.log(`✓ ${toolName}`);
          console.log(
            `  ├─ Function: yes`
          );
          console.log(
            `  ├─ Schema: yes`
          );
          console.log(
            `  └─ Description: yes (${module[`${toolName}Description`].substring(0, 50)}...)`
          );
          successCount++;
        } else {
          console.log(`✗ ${toolName}`);
          console.log(
            `  ├─ Function: ${hasFunction ? "yes" : "NO"}`
          );
          console.log(
            `  ├─ Schema: ${hasSchema ? "yes" : "NO"}`
          );
          console.log(
            `  └─ Description: ${hasDescription ? "yes" : "NO"}`
          );
          failureCount++;
        }
      } catch (error) {
        console.log(`✗ ${toolName}`);
        console.log(`  └─ Import error: ${error instanceof Error ? error.message : String(error)}`);
        failureCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`Results: ${successCount} ✓ | ${failureCount} ✗`);
    console.log("=".repeat(60) + "\n");

    expect(failureCount).toBe(0);
  });
});
