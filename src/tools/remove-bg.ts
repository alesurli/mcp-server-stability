import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { StabilityClient } from "../client.js";
import { saveAndReturn, resolveImagePath } from "../output.js";
import type { ToolResult } from "../types.js";

const RemoveBgSchema = z.object({
  image_path: z.string().describe("Absolute path or bare filename (use list_images to find files)"),
  output_format: z.enum(["png", "webp"]).optional().default("png"),
});

export const removeBgTool: Tool = {
  name: "remove_background",
  description:
    "Remove the background from an image, returning the subject with a transparent background. Cost: $0.02.",
  inputSchema: zodToJsonSchema(RemoveBgSchema) as Tool["inputSchema"],
};

export async function removeBgHandler(
  client: StabilityClient,
  args: unknown
): Promise<ToolResult> {
  const input = RemoveBgSchema.parse(args);
  const imagePath = await resolveImagePath(input.image_path);
  const response = await client.request(
    "/stable-image/edit/remove-background",
    { output_format: input.output_format ?? "png" },
    { image: { path: imagePath, fieldName: "image" } }
  );
  return saveAndReturn(response.artifacts[0], "remove_background", input.output_format ?? "png");
}
