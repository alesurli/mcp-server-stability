import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { StabilityClient } from "../client.js";
import { saveAndReturn } from "../output.js";
import type { ToolResult } from "../types.js";

const aspectRatios = ["16:9", "1:1", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16", "9:21"] as const;
const outputFormats = ["png", "jpeg", "webp"] as const;

// ── SD3.5 ──────────────────────────────────────────────────────────────────

const Sd3Schema = z.object({
  prompt: z.string().describe("Text description of the image to generate"),
  negative_prompt: z.string().optional().describe("Elements to avoid in the image"),
  model: z
    .enum(["sd3.5-large", "sd3.5-large-turbo", "sd3.5-medium"])
    .optional()
    .default("sd3.5-large")
    .describe("sd3.5-large: best quality (~$0.065) | sd3.5-large-turbo: faster (~$0.04) | sd3.5-medium: balanced (~$0.035)"),
  aspect_ratio: z.enum(aspectRatios).optional().default("1:1"),
  seed: z.number().int().min(0).max(4294967295).optional().describe("0 or omit for random"),
  output_format: z.enum(outputFormats).optional().default("png"),
});

export const generateSd3Tool: Tool = {
  name: "generate_image_sd3",
  description:
    "Generate an image with Stability AI SD3.5. Best overall quality, supports negative prompts. Cost: ~$0.035–$0.065.",
  inputSchema: zodToJsonSchema(Sd3Schema) as Tool["inputSchema"],
};

export async function generateSd3Handler(
  client: StabilityClient,
  args: unknown
): Promise<ToolResult> {
  const input = Sd3Schema.parse(args);
  const fields: Record<string, string | number> = {
    prompt: input.prompt,
    model: input.model ?? "sd3.5-large",
    aspect_ratio: input.aspect_ratio ?? "1:1",
    output_format: input.output_format ?? "png",
  };
  if (input.negative_prompt) fields.negative_prompt = input.negative_prompt;
  if (input.seed !== undefined) fields.seed = input.seed;

  const response = await client.request("/stable-image/generate/sd3", fields);
  return saveAndReturn(response.artifacts[0], "generate_sd3", input.output_format ?? "png");
}

// ── Core ───────────────────────────────────────────────────────────────────

const stylePresets = [
  "3d-model", "analog-film", "anime", "cinematic", "comic-book", "digital-art",
  "enhance", "fantasy-art", "isometric", "line-art", "low-poly", "modeling-compound",
  "neon-punk", "origami", "photographic", "pixel-art", "tile-texture",
] as const;

const CoreSchema = z.object({
  prompt: z.string().describe("Text description of the image to generate"),
  negative_prompt: z.string().optional(),
  aspect_ratio: z.enum(aspectRatios).optional().default("1:1"),
  style_preset: z.enum(stylePresets).optional().describe("Artistic style preset"),
  seed: z.number().int().min(0).max(4294967295).optional(),
  output_format: z.enum(outputFormats).optional().default("png"),
});

export const generateCoreTool: Tool = {
  name: "generate_image_core",
  description:
    "Generate an image with Stability AI Core. Fast and cost-effective, supports style presets. Cost: ~$0.03.",
  inputSchema: zodToJsonSchema(CoreSchema) as Tool["inputSchema"],
};

export async function generateCoreHandler(
  client: StabilityClient,
  args: unknown
): Promise<ToolResult> {
  const input = CoreSchema.parse(args);
  const fields: Record<string, string | number> = {
    prompt: input.prompt,
    aspect_ratio: input.aspect_ratio ?? "1:1",
    output_format: input.output_format ?? "png",
  };
  if (input.negative_prompt) fields.negative_prompt = input.negative_prompt;
  if (input.style_preset) fields.style_preset = input.style_preset;
  if (input.seed !== undefined) fields.seed = input.seed;

  const response = await client.request("/stable-image/generate/core", fields);
  return saveAndReturn(response.artifacts[0], "generate_core", input.output_format ?? "png");
}

// ── Ultra ──────────────────────────────────────────────────────────────────

const UltraSchema = z.object({
  prompt: z.string().describe("Text description of the image to generate"),
  negative_prompt: z.string().optional(),
  aspect_ratio: z.enum(aspectRatios).optional().default("1:1"),
  seed: z.number().int().min(0).max(4294967295).optional(),
  output_format: z.enum(outputFormats).optional().default("png"),
});

export const generateUltraTool: Tool = {
  name: "generate_image_ultra",
  description:
    "Generate an image with Stability AI Ultra. Highest photorealistic quality. Cost: ~$0.08.",
  inputSchema: zodToJsonSchema(UltraSchema) as Tool["inputSchema"],
};

export async function generateUltraHandler(
  client: StabilityClient,
  args: unknown
): Promise<ToolResult> {
  const input = UltraSchema.parse(args);
  const fields: Record<string, string | number> = {
    prompt: input.prompt,
    aspect_ratio: input.aspect_ratio ?? "1:1",
    output_format: input.output_format ?? "png",
  };
  if (input.negative_prompt) fields.negative_prompt = input.negative_prompt;
  if (input.seed !== undefined) fields.seed = input.seed;

  const response = await client.request("/stable-image/generate/ultra", fields);
  return saveAndReturn(response.artifacts[0], "generate_ultra", input.output_format ?? "png");
}
