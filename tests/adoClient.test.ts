import { describe, it, expect } from "vitest";
import { formatStepsAsXml } from "../src/lib/formatSteps.js";

// Testing the formatSteps utility since adoClient requires live env vars
describe("formatStepsAsXml", () => {
  it("generates valid XML structure with correct step count", () => {
    const steps = [
      { action: "Open the app",       expected: "App loads"         },
      { action: "Click Login button", expected: "Login form appears" },
    ];
    const xml = formatStepsAsXml(steps);
    expect(xml).toContain('<steps id="0" last="2">');
    expect(xml).toContain('<step id="1"');
    expect(xml).toContain('<step id="2"');
  });

  it("escapes XML special characters in action and expected fields", () => {
    const steps = [{ action: "Enter <script>alert('xss')</script>", expected: "Input & output sanitized" }];
    const xml = formatStepsAsXml(steps);
    expect(xml).not.toContain("<script>");
    expect(xml).toContain("&lt;script&gt;");
    expect(xml).toContain("&amp;");
  });

  it("handles a single step correctly", () => {
    const xml = formatStepsAsXml([{ action: "Do thing", expected: "Thing done" }]);
    expect(xml).toContain('last="1"');
    expect(xml).toContain("Do thing");
    expect(xml).toContain("Thing done");
  });
});
