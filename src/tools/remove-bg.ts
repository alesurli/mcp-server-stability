import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { StabilityClient } from "../client.js";
import { saveImage } from "../output.js";
import type { ToolResult } from "../types.js";

const RemoveBgSchema = z.object({
  image_path: z.string().describe("Absolute path to the source image (PNG, JPEG, or WebP)"),
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
  const response = await client.request(
    "/stable-image/edit/remove-background",
    { output_format: input.output_format ?? "png" },
    { image: { path: input.image_path, fieldName: "image" } }
  );
  const saved = await saveImage(response.artifacts[0], "remove_background");
  return {
    content: [{ type: "text", text: `Image saved to: ${saved.filePath}\nSeed: ${saved.seed}` }],
  };
}
