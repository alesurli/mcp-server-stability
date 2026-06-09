import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { StabilityClient } from "../client.js";
import { saveAndReturn, resolveImagePath } from "../output.js";
import type { ToolResult } from "../types.js";

const UpscaleCreativeSchema = z.object({
  image_path: z.string().describe("Absolute path or bare filename (use list_images to find files)"),
  prompt: z.string().describe("Guides the creative enhancement — describe the desired final look"),
  negative_prompt: z.string().optional(),
  creativity: z
    .number()
    .min(0.1)
    .max(0.5)
    .optional()
    .describe("How much creative interpretation to apply (0.1–0.5)"),
  seed: z.number().int().min(0).max(4294967295).optional(),
  output_format: z.enum(["png", "jpeg", "webp"]).optional().default("png"),
});

export const upscaleCreativeTool: Tool = {
  name: "upscale_creative",
  description:
    "Upscale an image with AI-driven artistic enhancement. Adds detail and style but may alter the original. Use upscale_fast when fidelity matters. Async operation — may take up to a few minutes. Cost: ~$0.25.",
  inputSchema: zodToJsonSchema(UpscaleCreativeSchema) as Tool["inputSchema"],
};

export async function upscaleCreativeHandler(
  client: StabilityClient,
  args: unknown
): Promise<ToolResult> {
  const input = UpscaleCreativeSchema.parse(args);
  const imagePath = await resolveImagePath(input.image_path);

  const fields: Record<string, string | number> = {
    prompt: input.prompt,
    output_format: input.output_format ?? "png",
  };
  if (input.negative_prompt) fields.negative_prompt = input.negative_prompt;
  if (input.creativity !== undefined) fields.creativity = input.creativity;
  if (input.seed !== undefined) fields.seed = input.seed;

  const id = await client.startJob(
    "/stable-image/upscale/creative",
    fields,
    { image: { path: imagePath, fieldName: "image" } }
  );
  const response = await client.pollJob("/stable-image/upscale/creative/result", id);
  return saveAndReturn(response.artifacts[0], "upscale_creative", input.output_format ?? "png");
}
