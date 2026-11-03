import { getClient } from "./adoClient.js";
import type { WiqlQueryResult, WorkItem } from "../types.js";

const WORK_ITEM_FIELDS = [
  "System.Id",
  "System.Title",
  "System.State",
  "System.WorkItemType",
  "System.Description",
  "System.AreaPath",
  "System.IterationPath",
  "Microsoft.VSTS.Common.AcceptanceCriteria",
  "Microsoft.VSTS.Common.Priority",
].join(",");

/**
 * Executes a WIQL (Work Item Query Language) query and returns full work item
 * details. ADO requires two steps: (1) run the query to get IDs, then
 * (2) fetch full details for those IDs. This helper abstracts both steps.
 */
export async function runWiqlQuery(
  whereClause: string,
  top: number = 20,
  extraFields?: string[],
  project?: string,
): Promise<WorkItem[]> {
  const client = getClient(project);

  const wiqlBody = {
    query: `SELECT [System.Id] FROM WorkItems WHERE ${whereClause} ORDER BY [System.CreatedDate] DESC`,
  };

  // Step 1: Get IDs via WIQL
  const queryRes = await client.post<WiqlQueryResult>(
    `/wit/wiql?api-version=7.0&$top=${top}`,
    wiqlBody
  );

  const ids = queryRes.data.workItems.map((w) => w.id);
  if (ids.length === 0) return [];

  // Step 2: Fetch full details
  const fields = extraFields
    ? `${WORK_ITEM_FIELDS},${extraFields.join(",")}`
    : WORK_ITEM_FIELDS;

  const detailRes = await client.get<{ value: WorkItem[] }>(
    `/wit/workitems?ids=${ids.join(",")}&fields=${fields}&api-version=7.0`
  );

  return detailRes.data.value;
}
