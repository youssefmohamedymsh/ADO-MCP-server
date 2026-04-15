import { z } from "zod";
import { getClient } from "../lib/adoClient.js";
import type { PatchOperation, WorkItem } from "../types.js";

export const addAttachmentSchema = {
  project:    z.string().optional().describe("Azure DevOps project name — defaults to the configured project"),
  workItemId: z.number().describe("The numeric ID of the work item to attach to"),
  fileName:   z.string().describe("Name for the attachment file e.g. 'screenshot.png'"),
  content:    z.string().describe("Base64-encoded file content, or plain text content for .txt/.md files"),
  comment:    z.string().optional().describe("Optional comment describing the attachment"),
};

export const addAttachmentDescription =
  "Upload an attachment to an Azure DevOps work item. Provide file content as base64 (for binary files) or plain text. The attachment is uploaded then linked to the work item.";

export async function addAttachment(input: {
  project?: string;
  workItemId: number;
  fileName: string;
  content: string;
  comment?: string;
}): Promise<string> {
  const { project, workItemId, fileName, content, comment } = input;
  const client = getClient(project);

  // Step 1: Upload the attachment to ADO's attachment store
  const buffer = Buffer.from(content, "base64");

  const uploadRes = await client.post<{ id: string; url: string }>(
    `/wit/attachments?fileName=${encodeURIComponent(fileName)}&api-version=7.1`,
    buffer,
    { headers: { "Content-Type": "application/octet-stream" } }
  );

  const attachmentUrl = uploadRes.data.url;

  // Step 2: Link the attachment to the work item
  const patchDoc: PatchOperation[] = [
    {
      op: "add",
      path: "/relations/-",
      value: {
        rel: "AttachedFile",
        url: attachmentUrl,
        attributes: { comment: comment ?? `Attached ${fileName} via MCP Server` },
      },
    },
  ];

  const res = await client.patch<WorkItem>(
    `/wit/workitems/${workItemId}?api-version=7.1`,
    patchDoc,
    { headers: { "Content-Type": "application/json-patch+json" } }
  );

  return JSON.stringify({
    success:      true,
    workItemId:   res.data.id,
    fileName,
    attachmentId: uploadRes.data.id,
    url:          res.data._links?.html.href,
  }, null, 2);
}
