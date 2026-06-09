import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { StabilityClient } from "../client.js";
import { getOutputDir, getInputDir, formatDate } from "../output.js";
import type { ToolResult } from "../types.js";

const execFileAsync = promisify(execFile);

export const useClipboardImageTool: Tool = {
  name: "use_clipboard_image",
  description:
    "Save the current clipboard image to a file and return its path for use with other tools. macOS only. Copy an image first, then call this tool.",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

export async function useClipboardImageHandler(
  _client: StabilityClient,
  _args: unknown
): Promise<ToolResult> {
  if (process.platform !== "darwin") {
    throw new Error("use_clipboard_image is only supported on macOS.");
  }

  const dir = getInputDir() ?? getOutputDir();
  await mkdir(dir, { recursive: true });

  const fileName = `clipboard_${formatDate(new Date())}.png`;
  const targetPath = join(dir, fileName);

  // osascript coerces clipboard to PNG and writes the raw bytes
  const script = [
    `set f to POSIX file "${targetPath}"`,
    `set d to (the clipboard as «class PNGf»)`,
    `set ref to (open for access f with write permission)`,
    `write d to ref`,
    `close access ref`,
  ].join("\n");

  try {
    await execFileAsync("osascript", ["-e", script]);
  } catch {
    throw new Error(
      "Clipboard does not contain an image. Copy an image first, then call use_clipboard_image."
    );
  }

  return {
    content: [
      { type: "text", text: `Clipboard image saved to: ${targetPath}\n\nUse "${fileName}" as image_path in the next tool.` },
    ],
  };
}
