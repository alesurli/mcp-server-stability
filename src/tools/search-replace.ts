import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { StabilityClient } from "../client.js";
import { saveAndReturn } from "../output.js";
import type { ToolResult } from "../types.js";

const SearchReplaceSchema = z.object({
  image_path: z.string().describe("Absolute path to the source image"),
  search_prompt: z.string().describe("Description of the object to find and remove"),
  prompt: z.string().describe("Description of what to generate as replacement"),
  negative_prompt: z.string().optional(),
  seed: z.number().int().min(0).max(4294967295).optional(),
  output_format: z.enum(["png", "jpeg", "webp"]).optional().default("png"),
});

export const searchReplaceTool: Tool = {
  name: "search_and_replace",
  description:
    "Find an object in an image by description and replace it with something else — no mask needed, auto-segments the target. Cost: $0.04.",
  inputSchema: zodToJsonSchema(SearchReplaceSchema) as Tool["inputSchema"],
};

export async function searchReplaceHandler(
  client: StabilityClient,
  args: unknown
): Promise<ToolResult> {
  const input = SearchReplaceSchema.parse(args);
  const fields: Record<string, string | number> = {
    search_prompt: input.search_prompt,
    prompt: input.prompt,
    output_format: input.output_format ?? "png",
  };
  if (input.negative_prompt) fields.negative_prompt = input.negative_prompt;
  if (input.seed !== undefined) fields.seed = input.seed;

  const response = await client.request(
    "/stable-image/edit/search-and-replace",
    fields,
    { image: { path: input.image_path, fieldName: "image" } }
  );
  return saveAndReturn(response.artifacts[0], "search_and_replace", input.output_format ?? "png");
}
