import "dotenv/config";
import axios, { type AxiosInstance, type AxiosError, type AxiosResponse } from "axios";
import type { AdoClientConfig } from "../types.js";
import { getCurrentProject } from "./projectContext.js";

/**
 * Creates a pre-configured Axios instance for Azure DevOps REST API calls.
 * Handles PAT authentication, base URL construction, and default headers.
 * Import and use this in every tool file — never create raw axios instances.
 */
function createAdoClient(config: AdoClientConfig): AxiosInstance {
  const { org, project, pat } = config;

  // ADO uses HTTP Basic auth with an empty username and the PAT as password
  const encodedPat = Buffer.from(`:${pat}`).toString("base64");

  const client = axios.create({
    baseURL: `https://dev.azure.com/${org}/${project}/_apis`,
    headers: {
      Authorization: `Basic ${encodedPat}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 15000,
  });

  // Response interceptor — surface useful error messages
  client.interceptors.response.use(
    (res: AxiosResponse) => res,
    (err: AxiosError) => {
      const status  = err.response?.status;
      const message = (err.response?.data as any)?.message || err.message;

      if (status === 401) throw new Error(`Azure DevOps auth failed. Check your PAT is valid and has the required scopes. (${message})`);
      if (status === 403) throw new Error(`Permission denied. Ensure your PAT has Work Items (Read & Write) and Test Plans (Read & Write) scopes. (${message})`);
      if (status === 404) throw new Error(`Resource not found. Check your org name, project name, and work item IDs. (${message})`);

      throw new Error(`Azure DevOps API error ${status}: ${message}`);
    }
  );

  return client;
}

// Read environment variables set by the MCP host
const ADO_ORG_ENV     = process.env.ADO_ORG     ?? "";
const ADO_PROJECT_ENV = process.env.ADO_PROJECT ?? "";
const ADO_PAT_ENV     = process.env.ADO_PAT     ?? "";

if (!ADO_ORG_ENV || !ADO_PAT_ENV) {
  throw new Error("Missing required environment variables: ADO_ORG, ADO_PAT");
}

export const ADO_ORG     = ADO_ORG_ENV;
export const ADO_PROJECT = ADO_PROJECT_ENV;

// Cache clients per project to avoid re-creating axios instances
const clientCache = new Map<string, AxiosInstance>();

if (ADO_PROJECT) {
  clientCache.set(ADO_PROJECT, createAdoClient({ org: ADO_ORG, project: ADO_PROJECT, pat: ADO_PAT_ENV }));
}

/**
 * Returns an Axios client scoped to the given project.
 * Falls back to the default project from env if none is provided.
 * Clients are cached per project name.
 */
export function getClient(project?: string): AxiosInstance {
  const p = resolveProject(project);
  if (!clientCache.has(p)) {
    clientCache.set(p, createAdoClient({ org: ADO_ORG, project: p, pat: ADO_PAT_ENV }));
  }
  return clientCache.get(p)!;
}

/**
 * Resolves the project name in priority order:
 *   1. an explicit `project` argument (per-call override)
 *   2. the project selected this session via the `set_project` tool
 *   3. the ADO_PROJECT environment variable
 * Throws if none is available.
 */
export function resolveProject(project?: string): string {
  const p = project ?? getCurrentProject() ?? process.env.ADO_PROJECT;
  if (!p) {
    throw new Error(
      "No project selected. Use the 'set_project' tool to choose a project, pass a 'project' argument, or set the ADO_PROJECT environment variable."
    );
  }
  return p;
}

// Default client for backward compatibility
export const adoClient = ADO_PROJECT
  ? clientCache.get(ADO_PROJECT)!
  : (null as unknown as AxiosInstance);
