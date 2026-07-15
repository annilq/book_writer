import { describe, it, expect } from "vitest";
import { parseOutlineToChapterInputs } from "@/utils/agent/outline";

const sample = `Here is the outline:
\`\`\`json
[
  {
    "id": "chap01",
    "title": "Introduction",
    "description": "A sufficiently long description explaining the purpose of this intro chapter.",
    "children": [
      {
        "id": "chap01a",
        "title": "Background",
        "description": "A sufficiently long description providing necessary background context for readers.",
        "children": []
      }
    ]
  }
]
\`\`\``;

describe("parseOutlineToChapterInputs", () => {
  it("parses a markdown json outline into a ChapterInput tree", () => {
    const result = parseOutlineToChapterInputs(sample);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Introduction");
    expect(result[0].position).toBe("");
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children?.[0].title).toBe("Background");
  });

  it("throws when no json block is present", () => {
    expect(() => parseOutlineToChapterInputs("no outline here")).toThrow();
  });

  it("validates min description length", () => {
    const bad = `\`\`\`json\n[{"id":"x","title":"T","description":"short","children":[]}]\n\`\`\``;
    expect(() => parseOutlineToChapterInputs(bad)).toThrow();
  });
});
