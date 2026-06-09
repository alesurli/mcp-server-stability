import { readdir, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { StabilityClient } from "../client.js";
import { getOutputDir, getInputDir } from "../output.js";
import type { ToolResult } from "../types.js";

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

interface FileEntry {
  name: string;
  size: number;
  mtime: Date;
  label: string;
}

export const listImagesTool: Tool = {
  name: "list_images",
  description:
    "List image files in the output and input directories. Use before other tools to find files by short name instead of specifying a full path. No API cost.",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

async function scanDir(dir: string, label: string): Promise<FileEntry[]> {
  try {
    const names = await readdir(dir);
    const entries: FileEntry[] = [];
    for (const name of names) {
      if (!IMAGE_EXTS.has(extname(name).toLowerCase())) continue;
      const info = await stat(join(dir, name));
      entries.push({ name, size: info.size, mtime: info.mtime, label });
    }
    return entries.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  } catch {
    return [];
  }
}

function fmtSize(bytes: number): string {
  return bytes > 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export async function listImagesHandler(
  _client: StabilityClient,
  _args: unknown
): Promise<ToolResult> {
  const outputDir = getOutputDir();
  const inputDir = getInputDir();

  const outputFiles = await scanDir(outputDir, "output");
  const inputFiles = inputDir ? await scanDir(inputDir, "input") : [];

  const lines: string[] = [];

  if (outputFiles.length === 0) {
    lines.push(`Output (${outputDir}): no images`);
  } else {
    lines.push(`Output (${outputDir}):`);
    for (const f of outputFiles) {
      lines.push(`  ${f.name}  (${fmtSize(f.size)}, ${fmtDate(f.mtime)})`);
    }
  }

  if (inputDir) {
    lines.push("");
    if (inputFiles.length === 0) {
      lines.push(`Input (${inputDir}): no images`);
    } else {
      lines.push(`Input (${inputDir}):`);
      for (const f of inputFiles) {
        lines.push(`  ${f.name}  (${fmtSize(f.size)}, ${fmtDate(f.mtime)})`);
      }
    }
  }

  lines.push("\nPass any filename above directly as image_path — no full path needed.");

  return {
    content: [{ type: "text", text: lines.join("\n") }],
  };
}
