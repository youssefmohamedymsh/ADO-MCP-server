import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";

/**
 * Validates tool wiring using static source analysis (vitest restricts the
 * dynamic imports needed for runtime checks).
 *
 * Rather than hardcoding a tool count, this asserts internal consistency:
 * every file in src/tools exports the expected trio, is imported by server.ts,
 * and is registered with server.tool(). Adding a new tool does not require
 * editing this test — only following the established pattern.
 */

describe("Tool Export Validation (Static Analysis)", () => {
  const toolsDir = resolve(process.cwd(), "src/tools");
  const toolFiles = readdirSync(toolsDir)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => f.replace(".ts", ""))
    .sort();

  const serverContent = readFileSync(resolve(process.cwd(), "src/server.ts"), "utf-8");

  it("has at least the original 14 tools", () => {
    expect(toolFiles.length).toBeGreaterThanOrEqual(14);
  });

  it("each tool file exports a function, Schema, and Description", () => {
    const errors: string[] = [];

    toolFiles.forEach((toolName) => {
      const content = readFileSync(resolve(toolsDir, `${toolName}.ts`), "utf-8");

      const hasFunction = new RegExp(`export\\s+(async\\s+)?function\\s+${toolName}\\s*\\(`).test(content);
      const hasSchema = new RegExp(`export\\s+const\\s+${toolName}Schema\\s*=`).test(content);
      const hasDescription = new RegExp(`export\\s+const\\s+${toolName}Description\\s*=`).test(content);

      const missing: string[] = [];
      if (!hasFunction) missing.push("function");
      if (!hasSchema) missing.push("Schema");
      if (!hasDescription) missing.push("Description");
      if (missing.length) errors.push(`${toolName}: missing ${missing.join(", ")}`);
    });

    expect(errors).toEqual([]);
  });

  it("imports every tool file in server.ts", () => {
    const missing = toolFiles.filter(
      (toolName) => !new RegExp(`from\\s+["']\\./tools/${toolName}\\.js["']`).test(serverContent)
    );
    expect(missing).toEqual([]);
  });

  it("registers exactly one server.tool() per tool file", () => {
    const registrations = [...serverContent.matchAll(/server\.tool\(\s*["'](\w+)/g)];
    expect(registrations.length).toBe(toolFiles.length);
  });
});
