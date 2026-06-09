import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import type { StabilityArtifact, SavedImageResult, ToolResult } from "./types.js";

const OUTPUT_DIR = join(homedir(), "stability-output");

const MIME_TYPES: Record<string, string> = {
  png:  "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export async function saveImage(
  artifact: StabilityArtifact,
  toolName: string,
  outputFormat = "png"
): Promise<SavedImageResult> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const timestamp = Date.now();
  const seed = artifact.seed;
  const ext = outputFormat === "jpeg" ? "jpg" : outputFormat;
  const fileName = `${toolName}_${timestamp}_${seed}.${ext}`;
  const filePath = join(OUTPUT_DIR, fileName);
  await writeFile(filePath, Buffer.from(artifact.base64, "base64"));
  return { filePath, seed };
}

async function compressPreview(base64: string): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const preview = await sharp(buffer)
    .resize(768, 768, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  return preview.toString("base64");
}

export async function saveAndReturn(
  artifact: StabilityArtifact,
  toolName: string,
  outputFormat = "png"
): Promise<ToolResult> {
  const saved = await saveImage(artifact, toolName, outputFormat);
  const preview = await compressPreview(artifact.base64);
  return {
    content: [
      { type: "text", text: `Image saved to: ${saved.filePath}\nSeed: ${saved.seed}` },
      { type: "image", data: preview, mimeType: "image/webp" },
    ],
  };
}
