import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import type { StabilityArtifact, SavedImageResult, ToolResult } from "./types.js";

const MIME_TYPES: Record<string, string> = {
  png:  "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

function getOutputDir(): string {
  const env = process.env.STABILITY_OUTPUT_DIR;
  if (env) return env.replace(/^~/, homedir());
  return join(homedir(), "Downloads", "stability-ai");
}

function formatDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

export async function saveImage(
  artifact: StabilityArtifact,
  toolName: string,
  outputFormat = "png"
): Promise<SavedImageResult> {
  const outputDir = getOutputDir();
  await mkdir(outputDir, { recursive: true });
  const ext = outputFormat === "jpeg" ? "jpg" : outputFormat;
  const slug = toolName.replace(/_/g, "-");
  const fileName = `${slug}_${formatDate(new Date())}_${artifact.seed}.${ext}`;
  const filePath = join(outputDir, fileName);
  await writeFile(filePath, Buffer.from(artifact.base64, "base64"));
  return { filePath, seed: artifact.seed };
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
