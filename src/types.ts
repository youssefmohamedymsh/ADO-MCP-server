// ── Shared TypeScript interfaces for the ADO MCP Server ──────────────────────

export interface WorkItemFields {
  "System.Id": number;
  "System.Title": string;
  "System.State": string;
  "System.WorkItemType": string;
  "System.Description"?: string;
  "System.AreaPath"?: string;
  "System.IterationPath"?: string;
  "Microsoft.VSTS.Common.AcceptanceCriteria"?: string;
  "Microsoft.VSTS.TCM.Steps"?: string;
  "Microsoft.VSTS.Common.Priority"?: number;
  "System.History"?: string;
}

export interface WorkItem {
  id: number;
  url: string;
  fields: WorkItemFields;
  relations?: WorkItemRelation[];
  _links?: {
    html: { href: string };
    [key: string]: { href: string };
  };
}

export interface WorkItemRelation {
  rel: string;
  url: string;
  attributes?: {
    comment?: string;
    isLocked?: boolean;
  };
}

export interface WiqlQueryResult {
  workItems: Array<{ id: number; url: string }>;
}

export interface TestStep {
  action: string;
  expected: string;
}

export interface UserStory {
  id: number;
  title: string;
  state: string;
  description: string;
  acceptanceCriteria: string;
  iterationPath?: string;
  areaPath?: string;
}

export interface TestCase {
  id: number;
  title: string;
  state: string;
  linkedStoryId?: number;
}

export interface SprintCoverage {
  sprint: string;
  totalStories: number;
  storiesWithTests: number;
  storiesWithoutTests: number;
  coveragePercent: number;
  uncoveredStories: Array<{ id: number; title: string }>;
}

export interface PatchOperation {
  op: "add" | "replace" | "remove";
  path: string;
  value?: unknown;
}

export interface AdoClientConfig {
  org: string;
  project: string;
  pat: string;
}
