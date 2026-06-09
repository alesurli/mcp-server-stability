import { readdir, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { StabilityClient } from "../client.js";
import { getOutputDir, getInputDir } from "../output.js";
import type { ToolResult } from "../types.js";

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

export const listImagesTool: Tool = {
  name: "list_images",
  description:
    "List image files available in the output and input directories. Use this before other tools to find files by short name instead of specifying a full path. No API cost.",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

async function listDir(dir: string, label: string): Promise<string[]> {
  const lines: string[] = [];
  try {
    const names = await readdir(dir);
    const entries: { name: string; size: number; mtime: Date }[] = [];
    for (const name of names) {
      if (!IMAGE_EXTS.has(extname(name).toLowerCase())) continue;
      const info = await stat(join(dir, name));
      entries.push({ name, size: info.size, mtime: info.mtime });
    }
    entries.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    if (entries.length === 0) {
      lines.push(`${label} — ${dir}: (no images)`);
    } else {
      lines.push(`${label} — ${dir}:`);
      for (const e of entries) {
        const size = e.size > 1_048_576
          ? `${(e.size / 1_048_576).toFixed(1)} MB`
          : `${Math.round(e.size / 1024)} KB`;
        const date = e.mtime.toISOString().slice(0, 16).replace("T", " ");
        lines.push(`  ${e.name}  (${size}, ${date})`);
      }
    }
  } catch {
    lines.push(`${label} — ${dir}: (directory not found)`);
  }
  return lines;
}

export async function listImagesHandler(
  _client: StabilityClient,
  _args: unknown
): Promise<ToolResult> {
  const outputDir = getOutputDir();
  const inputDir = getInputDir();

  const lines: string[] = [];
  lines.push(...(await listDir(outputDir, "Output")));
  if (inputDir) {
    lines.push("", ...(await listDir(inputDir, "Input")));
  }
  lines.push(
    "",
    "Pass any filename above directly as image_path — no full path needed."
  );

  return {
    content: [{ type: "text", text: lines.join("\n") }],
  };
}
