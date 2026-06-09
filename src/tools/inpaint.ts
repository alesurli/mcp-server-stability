import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { StabilityClient } from "../client.js";
import { saveAndReturn } from "../output.js";
import type { ToolResult } from "../types.js";

const InpaintSchema = z.object({
  image_path: z.string().describe("Absolute path to the source image"),
  mask_path: z.string().describe(
    "Absolute path to the mask image — white pixels define the area to inpaint, black pixels are kept. Must be the same dimensions as the source image."
  ),
  prompt: z.string().describe("What to generate in the masked area"),
  negative_prompt: z.string().optional(),
  seed: z.number().int().min(0).max(4294967295).optional(),
  output_format: z.enum(["png", "jpeg", "webp"]).optional().default("png"),
});

export const inpaintTool: Tool = {
  name: "inpaint",
  description:
    "Edit a specific region of an image using a binary mask. White mask = area to replace, black mask = area to keep. Cost: ~$0.03.",
  inputSchema: zodToJsonSchema(InpaintSchema) as Tool["inputSchema"],
};

export async function inpaintHandler(
  client: StabilityClient,
  args: unknown
): Promise<ToolResult> {
  const input = InpaintSchema.parse(args);
  const fields: Record<string, string | number> = {
    prompt: input.prompt,
    output_format: input.output_format ?? "png",
  };
  if (input.negative_prompt) fields.negative_prompt = input.negative_prompt;
  if (input.seed !== undefined) fields.seed = input.seed;

  const response = await client.request(
    "/stable-image/edit/inpaint",
    fields,
    {
      image: { path: input.image_path, fieldName: "image" },
      mask: { path: input.mask_path, fieldName: "mask" },
    }
  );
  return saveAndReturn(response.artifacts[0], "inpaint", input.output_format ?? "png");
}
