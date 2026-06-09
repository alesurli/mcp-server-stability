import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { StabilityClient } from "../client.js";
import { saveAndReturn, resolveImagePath } from "../output.js";
import type { ToolResult } from "../types.js";

const OutpaintSchema = z
  .object({
    image_path: z.string().describe("Absolute path or bare filename (use list_images to find files)"),
    left: z.number().int().min(0).max(2000).optional().default(0).describe("Pixels to extend left"),
    right: z.number().int().min(0).max(2000).optional().default(0).describe("Pixels to extend right"),
    up: z.number().int().min(0).max(2000).optional().default(0).describe("Pixels to extend up"),
    down: z.number().int().min(0).max(2000).optional().default(0).describe("Pixels to extend down"),
    prompt: z.string().optional().describe("Guides what is generated in the extended area"),
    creativity: z
      .number()
      .min(0.1)
      .max(1.0)
      .optional()
      .describe("How creative the fill is (0.1–1.0, default 0.5)"),
    seed: z.number().int().min(0).max(4294967295).optional(),
    output_format: z.enum(["png", "jpeg", "webp"]).optional().default("png"),
  })
  .refine(
    (d) => (d.left ?? 0) + (d.right ?? 0) + (d.up ?? 0) + (d.down ?? 0) > 0,
    { message: "At least one direction (left, right, up, down) must be greater than 0" }
  );

export const outpaintTool: Tool = {
  name: "outpaint",
  description:
    "Extend an image beyond its borders in any direction. Useful for changing aspect ratios or expanding a scene. Cost: $0.04.",
  inputSchema: zodToJsonSchema(OutpaintSchema) as Tool["inputSchema"],
};

export async function outpaintHandler(
  client: StabilityClient,
  args: unknown
): Promise<ToolResult> {
  const input = OutpaintSchema.parse(args);
  const imagePath = await resolveImagePath(input.image_path);
  const fields: Record<string, string | number> = {
    output_format: input.output_format ?? "png",
  };
  if ((input.left ?? 0) > 0) fields.left = input.left!;
  if ((input.right ?? 0) > 0) fields.right = input.right!;
  if ((input.up ?? 0) > 0) fields.up = input.up!;
  if ((input.down ?? 0) > 0) fields.down = input.down!;
  if (input.prompt) fields.prompt = input.prompt;
  if (input.creativity !== undefined) fields.creativity = input.creativity;
  if (input.seed !== undefined) fields.seed = input.seed;

  const response = await client.request(
    "/stable-image/edit/outpaint",
    fields,
    { image: { path: imagePath, fieldName: "image" } }
  );
  return saveAndReturn(response.artifacts[0], "outpaint", input.output_format ?? "png");
}
