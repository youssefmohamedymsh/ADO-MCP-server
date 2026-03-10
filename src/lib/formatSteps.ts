import type { TestStep } from "../types.js";

/**
 * Converts a plain array of test steps into the XML format required by
 * Azure DevOps TCM (Test Case Management). ADO stores test steps as XML
 * inside the Microsoft.VSTS.TCM.Steps field.
 *
 * Example output:
 * <steps id="0" last="2">
 *   <step id="1" type="ActionStep">
 *     <parameterizedString isformatted="true">Navigate to login page</parameterizedString>
 *     <parameterizedString isformatted="true">Login page is displayed</parameterizedString>
 *     <description/>
 *   </step>
 * </steps>
 */
export function formatStepsAsXml(steps: TestStep[]): string {
  const stepElements = steps
    .map(
      (step, index) => `
    <step id="${index + 1}" type="ActionStep">
      <parameterizedString isformatted="true">${escapeXml(step.action)}</parameterizedString>
      <parameterizedString isformatted="true">${escapeXml(step.expected)}</parameterizedString>
      <description/>
    </step>`
    )
    .join("");

  return `<steps id="0" last="${steps.length}">${stepElements}
</steps>`;
}

/**
 * Escapes special XML characters to prevent malformed step XML.
 */
function escapeXml(raw: string): string {
  return raw
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&apos;");
}
