#!/usr/bin/env node

/**
 * Tool Export Validation Script
 * Validates that all tool files are properly exported with required structure
 * Run: node scripts/validateTools.mjs (after npm run build)
 */

import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(__dirname, "..");

const toolsDir = resolve(projectRoot, "src/tools");

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

console.log("\n" + "=".repeat(70));
console.log("🔍 TOOL EXPORT VALIDATION AUDIT");
console.log("=".repeat(70) + "\n");

// 1. Find all tool files
console.log("📁 Scanning src/tools/ directory...\n");
let toolFiles = [];

try {
  toolFiles = readdirSync(toolsDir)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => f.replace(".ts", ""))
    .sort();
} catch (error) {
  console.error("❌ Error reading tools directory:", error);
  process.exit(1);
}

console.log(`Found ${toolFiles.length} tool files:`);
toolFiles.forEach((f) => console.log(`  • ${f}`));

// 2. Compare with expected
console.log("\n" + "-".repeat(70));
console.log("📊 COMPARISON\n");

const missing = expectedTools.filter((t) => !toolFiles.includes(t));
const extra = toolFiles.filter((t) => !expectedTools.includes(t));

let hasIssues = false;

if (missing.length > 0) {
  console.log(`❌ Missing ${missing.length} tools:`);
  missing.forEach((t) => console.log(`  ✗ ${t}`));
  hasIssues = true;
} else {
  console.log(`✅ All expected tools present`);
}

if (extra.length > 0) {
  console.log(`\n⚠️  ${extra.length} extra tools found:`);
  extra.forEach((t) => console.log(`  + ${t}`));
}

// 3. Check each tool file for required exports in source
console.log("\n" + "-".repeat(70));
console.log("📝 SOURCE CODE ANALYSIS\n");

let allValid = true;

for (const toolName of expectedTools) {
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

    const isValid = hasFunction && hasSchema && hasDescription;

    if (isValid) {
      console.log(`✅ ${toolName}`);
      if (hasFunction) console.log(`   ✓ export function ${toolName}`);
      if (hasSchema) console.log(`   ✓ export const ${toolName}Schema`);
      if (hasDescription) console.log(`   ✓ export const ${toolName}Description`);
    } else {
      console.log(`❌ ${toolName}`);
      if (!hasFunction) console.log(`   ✗ MISSING: export function ${toolName}`);
      if (!hasSchema) console.log(`   ✗ MISSING: export const ${toolName}Schema`);
      if (!hasDescription) console.log(`   ✗ MISSING: export const ${toolName}Description`);
      allValid = false;
      hasIssues = true;
    }
  } catch (error) {
    console.log(`❌ ${toolName}`);
    console.log(`   ✗ Error reading file: ${error instanceof Error ? error.message : String(error)}`);
    allValid = false;
    hasIssues = true;
  }
}

// 4. Check server.ts for imports
console.log("\n" + "-".repeat(70));
console.log("🔗 SERVER REGISTRATION CHECK\n");

const serverPath = resolve(projectRoot, "src/server.ts");

try {
  const serverContent = readFileSync(serverPath, "utf-8");

  const importRegex = /import\s+\{\s*(\w+),\s+(\w+),\s+(\w+)\s*\}\s+from\s+['"]\.\/tools\/(\w+)/g;
  const importedTools = [];
  let match;

  while ((match = importRegex.exec(serverContent)) !== null) {
    importedTools.push(match[4]);
  }

  console.log(`server.ts imports ${importedTools.length} tools:\n`);

  const registeredTools = [
    "getUserStories",
    "createTestCase",
    "updateWorkItem",
    "getTestCasesForStory",
    "createBug",
    "getSprintCoverage",
    "getChildWorkItems",
    "createChildTask",
    "assignWorkItem",
    "getWorkItem",
    "linkWorkItems",
    "getTeamMembers",
    "bulkAssignWorkItems",
    "getTestRuns",
  ];

  registeredTools.forEach((tool) => {
    const imported = importedTools.includes(tool);
    const status = imported ? "✓" : "✗";
    console.log(`  ${status} ${tool}`);
    if (!imported) {
      hasIssues = true;
    }
  });

  const unregistered = importedTools.filter(
    (t) => !registeredTools.includes(t)
  );
  if (unregistered.length > 0) {
    console.log(`\n⚠️  Imported but not registered: ${unregistered.join(", ")}`);
  }
} catch (error) {
  console.log(`❌ Error reading server.ts: ${error instanceof Error ? error.message : String(error)}`);
  hasIssues = true;
}

// 5. Check for server.tool() registrations
console.log("\n" + "-".repeat(70));
console.log("📡 TOOL REGISTRATION IN SERVER\n");

try {
  const serverContent = readFileSync(serverPath, "utf-8");

  const toolRegex = /server\.tool\(\s*["'](\w+)/g;
  const registeredInServer = [];
  let match;

  while ((match = toolRegex.exec(serverContent)) !== null) {
    registeredInServer.push(match[1]);
  }

  console.log(`${registeredInServer.length} tools registered via server.tool():\n`);

  registeredInServer.forEach((tool) => {
    console.log(`  • ${tool}`);
  });

  if (registeredInServer.length < 14) {
    console.log(
      `\n⚠️  WARNING: Only ${registeredInServer.length}/14 tools registered in server.tool()`
    );
    hasIssues = true;
  }
} catch (error) {
  console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
}

// Summary
console.log("\n" + "=".repeat(70));
if (hasIssues) {
  console.log("❌ VALIDATION FAILED - Issues found above");
  process.exit(1);
} else {
  console.log("✅ ALL VALIDATIONS PASSED");
}
console.log("=".repeat(70) + "\n");
