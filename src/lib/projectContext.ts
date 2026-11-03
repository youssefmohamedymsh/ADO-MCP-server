/**
 * Holds the Azure DevOps project selected for the current session.
 *
 * This enables dynamic project navigation: instead of passing `project` to
 * every tool (or relying solely on the ADO_PROJECT env var), the `set_project`
 * tool stores a selection here that all tools pick up via `resolveProject`.
 *
 * State is module-level and lives for the lifetime of the server process.
 */

let currentProject: string | null = null;

/** Set the project that subsequent tools should operate on. */
export function setCurrentProject(project: string): void {
  currentProject = project;
}

/** Returns the selected project, or null if none has been chosen this session. */
export function getCurrentProject(): string | null {
  return currentProject;
}

/** Clears the session selection, reverting to the ADO_PROJECT env fallback. */
export function resetProject(): void {
  currentProject = null;
}

/** True when a project has been explicitly selected this session. */
export function isProjectSelected(): boolean {
  return currentProject !== null;
}
