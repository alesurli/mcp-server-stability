import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { StabilityClient } from "../client.js";
import { saveAndReturn } from "../output.js";
import type { ToolResult } from "../types.js";

const SearchRecolorSchema = z.object({
  image_path: z.string().describe("Absolute path to the source image"),
  select_prompt: z.string().describe("Description of the object to recolor"),
  prompt: z.string().describe("New color or appearance description (e.g. 'matte black finish')"),
  negative_prompt: z.string().optional(),
  seed: z.number().int().min(0).max(4294967295).optional(),
  output_format: z.enum(["png", "jpeg", "webp"]).optional().default("png"),
});

export const searchRecolorTool: Tool = {
  name: "search_and_recolor",
  description:
    "Change the color of a specific object in an image by description — no mask needed. Cost: ~$0.04.",
  inputSchema: zodToJsonSchema(SearchRecolorSchema) as Tool["inputSchema"],
};

export async function searchRecolorHandler(
  client: StabilityClient,
  args: unknown
): Promise<ToolResult> {
  const input = SearchRecolorSchema.parse(args);
  const fields: Record<string, string | number> = {
    select_prompt: input.select_prompt,
    prompt: input.prompt,
    output_format: input.output_format ?? "png",
  };
  if (input.negative_prompt) fields.negative_prompt = input.negative_prompt;
  if (input.seed !== undefined) fields.seed = input.seed;

  const response = await client.request(
    "/stable-image/edit/search-and-recolor",
    fields,
    { image: { path: input.image_path, fieldName: "image" } }
  );
  return saveAndReturn(response.artifacts[0], "search_and_recolor", input.output_format ?? "png");
}
