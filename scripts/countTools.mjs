import fs from "fs";

// Count the registered tools by parsing server.ts
const serverContent = fs.readFileSync(new URL("../src/server.ts", import.meta.url), "utf-8");
const matches = serverContent.match(/server\.tool\(/g) || [];
console.log(`Total tools registered in server.ts: ${matches.length}`);

// List them
const toolMatches = serverContent.match(/server\.tool\("([^"]+)"/g) || [];
console.log("\nRegistered tools:");
toolMatches.forEach((match) => {
  const toolName = match.match(/"([^"]+)"/)[1];
  console.log(`  - ${toolName}`);
});
