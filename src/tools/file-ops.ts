import { execFile } from "node:child_process";
import { unlink } from "node:fs/promises";
import { promisify } from "node:util";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { StabilityClient } from "../client.js";
import { getOutputDir, resolveImagePath } from "../output.js";
import type { ToolResult } from "../types.js";

const execFileAsync = promisify(execFile);

// ─── reveal_in_finder ────────────────────────────────────────────────────────

const RevealSchema = z.object({
  image_path: z
    .string()
    .optional()
    .describe("File to reveal — absolute path or bare filename. Omit to open the output folder."),
});

export const revealInFinderTool: Tool = {
  name: "reveal_in_finder",
  description:
    "Open the output folder in Finder, or reveal a specific image file. macOS only. No API cost.",
  inputSchema: zodToJsonSchema(RevealSchema) as Tool["inputSchema"],
};

export async function revealInFinderHandler(
  _client: StabilityClient,
  args: unknown
): Promise<ToolResult> {
  if (process.platform !== "darwin") {
    throw new Error("reveal_in_finder is only supported on macOS.");
  }

  const input = RevealSchema.parse(args);

  if (input.image_path) {
    const resolved = await resolveImagePath(input.image_path);
    await execFileAsync("open", ["-R", resolved]);
    return { content: [{ type: "text", text: `Revealed in Finder: ${resolved}` }] };
  } else {
    const dir = getOutputDir();
    await execFileAsync("open", [dir]);
    return { content: [{ type: "text", text: `Opened folder in Finder: ${dir}` }] };
  }
}

// ─── delete_image ─────────────────────────────────────────────────────────────

const DeleteSchema = z.object({
  image_path: z
    .string()
    .describe("File to delete — absolute path or bare filename (use list_images to find files)"),
});

export const deleteImageTool: Tool = {
  name: "delete_image",
  description:
    "Permanently delete an image file. Use list_images first to confirm the filename. No API cost.",
  inputSchema: zodToJsonSchema(DeleteSchema) as Tool["inputSchema"],
};

export async function deleteImageHandler(
  _client: StabilityClient,
  args: unknown
): Promise<ToolResult> {
  const input = DeleteSchema.parse(args);
  const resolved = await resolveImagePath(input.image_path);
  await unlink(resolved);
  return { content: [{ type: "text", text: `Deleted: ${resolved}` }] };
}
