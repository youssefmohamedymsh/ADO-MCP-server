/**
 * Loads environment variables from the project-root `.env` file.
 *
 * Unlike a bare `import "dotenv/config"`, this resolves `.env` relative to this
 * module's own location rather than `process.cwd()`. The MCP host launches the
 * server as a subprocess whose working directory is not guaranteed to be the
 * project root, so a cwd-relative lookup would silently find nothing.
 *
 * Import this module *first* in any entry point that reads ADO_* env vars
 * (notably `adoClient.ts`, which throws at load time if they are missing).
 *
 * Note: dotenv does not override variables already present in `process.env`,
 * so values injected by the MCP host (the `env` block in the host config)
 * still take precedence over the `.env` file.
 */
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// Compiled location is dist/lib/loadEnv.js, so the project root is two levels up.
config({ path: resolve(here, "../../.env") });
