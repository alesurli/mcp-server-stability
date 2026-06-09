import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { StabilityArtifact, SavedImageResult } from "./types.js";

const OUTPUT_DIR = join(homedir(), "stability-output");

export async function saveImage(
  artifact: StabilityArtifact,
  toolName: string
): Promise<SavedImageResult> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const timestamp = Date.now();
  const seed = artifact.seed;
  const fileName = `${toolName}_${timestamp}_${seed}.png`;
  const filePath = join(OUTPUT_DIR, fileName);
  const buffer = Buffer.from(artifact.base64, "base64");
  await writeFile(filePath, buffer);
  return { filePath, seed };
}
