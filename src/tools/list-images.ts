import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import sharp from "sharp";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { StabilityClient } from "../client.js";
import { getOutputDir, getInputDir } from "../output.js";
import type { ToolResult } from "../types.js";

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const MAX_GALLERY = 12;

interface FileEntry {
  name: string;
  path: string;
  size: number;
  mtime: Date;
  label: string;
}

export const listImagesTool: Tool = {
  name: "list_images",
  description:
    "List image files in the output and input directories with thumbnails. Use before other tools to find files by short name. No API cost.",
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
      const path = join(dir, name);
      const info = await stat(path);
      entries.push({ name, path, size: info.size, mtime: info.mtime, label });
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

function buildGallery(items: (FileEntry & { thumb: string })[]): string {
  const cards = items.map((f) => `
    <div style="display:inline-block;margin:8px;vertical-align:top;width:160px;font-family:sans-serif">
      <img src="data:image/webp;base64,${f.thumb}"
           style="width:160px;height:160px;object-fit:cover;border-radius:6px;display:block">
      <div style="font-size:10px;margin-top:5px;word-break:break-all;color:#ccc">${f.name}</div>
      <div style="font-size:9px;color:#888;margin-top:2px">${fmtSize(f.size)} · ${fmtDate(f.mtime)}</div>
      <div style="font-size:9px;color:#666;margin-top:1px">${f.label}</div>
    </div>`).join("");

  return `<!DOCTYPE html><html><body style="background:#1a1a1a;margin:0;padding:12px">${cards}</body></html>`;
}

export async function listImagesHandler(
  _client: StabilityClient,
  _args: unknown
): Promise<ToolResult> {
  const outputDir = getOutputDir();
  const inputDir = getInputDir();

  const outputFiles = await scanDir(outputDir, "output");
  const inputFiles = inputDir ? await scanDir(inputDir, "input") : [];
  const allFiles = [...outputFiles, ...inputFiles];

  // text listing
  const lines: string[] = [];
  if (outputFiles.length === 0) {
    lines.push(`Output (${outputDir}): no images`);
  } else {
    lines.push(`Output (${outputDir}):`);
    for (const f of outputFiles) lines.push(`  ${f.name}  (${fmtSize(f.size)}, ${fmtDate(f.mtime)})`);
  }
  if (inputDir) {
    lines.push("");
    if (inputFiles.length === 0) {
      lines.push(`Input (${inputDir}): no images`);
    } else {
      lines.push(`Input (${inputDir}):`);
      for (const f of inputFiles) lines.push(`  ${f.name}  (${fmtSize(f.size)}, ${fmtDate(f.mtime)})`);
    }
  }
  lines.push("\nPass any filename above directly as image_path — no full path needed.");

  if (allFiles.length === 0) {
    return { content: [{ type: "text", text: lines.join("\n") }] };
  }

  // thumbnail gallery (most recent MAX_GALLERY files)
  const galleryFiles = allFiles.slice(0, MAX_GALLERY);
  const withThumbs = await Promise.all(
    galleryFiles.map(async (f) => {
      const data = await readFile(f.path);
      const thumb = await sharp(data)
        .resize(160, 160, { fit: "cover" })
        .webp({ quality: 65 })
        .toBuffer();
      return { ...f, thumb: thumb.toString("base64") };
    })
  );

  const html = buildGallery(withThumbs);

  return {
    content: [
      { type: "text", text: lines.join("\n") },
      {
        type: "resource" as const,
        resource: {
          uri: "mcp://stability/gallery",
          mimeType: "text/html;profile=mcp-app",
          text: html,
        },
      },
    ],
  };
}
