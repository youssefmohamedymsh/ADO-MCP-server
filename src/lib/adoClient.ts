import "dotenv/config";
import axios, { type AxiosInstance, type AxiosError, type AxiosResponse } from "axios";
import type { AdoClientConfig } from "../types.js";

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

// Singleton — reads from environment variables set by the MCP host
const config: AdoClientConfig = {
  org:     process.env.ADO_ORG     ?? "",
  project: process.env.ADO_PROJECT ?? "",
  pat:     process.env.ADO_PAT     ?? "",
};

if (!config.org || !config.project || !config.pat) {
  throw new Error("Missing required environment variables: ADO_ORG, ADO_PROJECT, ADO_PAT");
}

export const adoClient = createAdoClient(config);
export const ADO_ORG     = config.org;
export const ADO_PROJECT = config.project;
