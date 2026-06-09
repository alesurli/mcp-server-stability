import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { StabilityClient } from "../client.js";
import { saveImage } from "../output.js";
import type { ToolResult } from "../types.js";

const UpscaleFastSchema = z.object({
  image_path: z.string().describe("Absolute path to the source image"),
  output_format: z.enum(["png", "jpeg", "webp"]).optional().default("png"),
});

export const upscaleFastTool: Tool = {
  name: "upscale_fast",
  description:
    "Upscale an image 4x while preserving its exact appearance. Safe for product shots and photos where fidelity matters. Cost: $0.01.",
  inputSchema: zodToJsonSchema(UpscaleFastSchema) as Tool["inputSchema"],
};

export async function upscaleFastHandler(
  client: StabilityClient,
  args: unknown
): Promise<ToolResult> {
  const input = UpscaleFastSchema.parse(args);
  const response = await client.request(
    "/stable-image/upscale/fast",
    { output_format: input.output_format ?? "png" },
    { image: { path: input.image_path, fieldName: "image" } }
  );
  const saved = await saveImage(response.artifacts[0], "upscale_fast");
  return {
    content: [{ type: "text", text: `Image saved to: ${saved.filePath}\nSeed: ${saved.seed}` }],
  };
}
