import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { StabilityClient } from "../client.js";
import { saveImage } from "../output.js";
import type { ToolResult } from "../types.js";

const ReplaceBgSchema = z.object({
  image_path: z.string().describe("Absolute path to the subject image (works with solid or transparent background)"),
  background_prompt: z.string().describe("Description of the new background to generate"),
  foreground_prompt: z.string().optional().describe("Description of the subject, helps integration"),
  negative_prompt: z.string().optional(),
  light_source_direction: z
    .enum(["above", "below", "left", "right"])
    .optional()
    .describe("Direction of the dominant light source for relighting"),
  light_source_strength: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Strength of relighting effect (0–1)"),
  preserve_original_subject: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("How much to preserve original subject appearance (0–1)"),
  seed: z.number().int().min(0).max(4294967295).optional(),
  output_format: z.enum(["png", "jpeg", "webp"]).optional().default("png"),
});

export const replaceBgTool: Tool = {
  name: "replace_background",
  description:
    "Replace and relight the background of an image. Works on photos with solid or transparent backgrounds. Excellent for product shots. Cost: ~$0.04.",
  inputSchema: zodToJsonSchema(ReplaceBgSchema) as Tool["inputSchema"],
};

export async function replaceBgHandler(
  client: StabilityClient,
  args: unknown
): Promise<ToolResult> {
  const input = ReplaceBgSchema.parse(args);
  const fields: Record<string, string | number> = {
    background_prompt: input.background_prompt,
    output_format: input.output_format ?? "png",
  };
  if (input.foreground_prompt) fields.foreground_prompt = input.foreground_prompt;
  if (input.negative_prompt) fields.negative_prompt = input.negative_prompt;
  if (input.light_source_direction) fields.light_source_direction = input.light_source_direction;
  if (input.light_source_strength !== undefined) fields.light_source_strength = input.light_source_strength;
  if (input.preserve_original_subject !== undefined) fields.preserve_original_subject = input.preserve_original_subject;
  if (input.seed !== undefined) fields.seed = input.seed;

  const response = await client.request(
    "/stable-image/edit/replace-background-and-relight",
    fields,
    { subject_image: { path: input.image_path, fieldName: "subject_image" } }
  );
  const saved = await saveImage(response.artifacts[0], "replace_background");
  return {
    content: [{ type: "text", text: `Image saved to: ${saved.filePath}\nSeed: ${saved.seed}` }],
  };
}
