import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { StabilityClient } from "../client.js";
import type { ToolResult } from "../types.js";

import {
  generateSd3Tool, generateSd3Handler,
  generateCoreTool, generateCoreHandler,
  generateUltraTool, generateUltraHandler,
} from "./generate.js";
import { removeBgTool, removeBgHandler } from "./remove-bg.js";
import { replaceBgTool, replaceBgHandler } from "./replace-bg.js";
import { inpaintTool, inpaintHandler } from "./inpaint.js";
import { searchReplaceTool, searchReplaceHandler } from "./search-replace.js";
import { outpaintTool, outpaintHandler } from "./outpaint.js";
import { searchRecolorTool, searchRecolorHandler } from "./search-recolor.js";
import { upscaleFastTool, upscaleFastHandler } from "./upscale-fast.js";
import { upscaleCreativeTool, upscaleCreativeHandler } from "./upscale-creative.js";
import { listImagesTool, listImagesHandler } from "./list-images.js";
import { useClipboardImageTool, useClipboardImageHandler } from "./clipboard.js";

export const allTools: Tool[] = [
  generateSd3Tool,
  generateCoreTool,
  generateUltraTool,
  removeBgTool,
  searchReplaceTool,
  inpaintTool,
  replaceBgTool,
  outpaintTool,
  searchRecolorTool,
  upscaleFastTool,
  upscaleCreativeTool,
  listImagesTool,
  useClipboardImageTool,
];

export const toolHandlers: Record<
  string,
  (client: StabilityClient, args: unknown) => Promise<ToolResult>
> = {
  generate_image_sd3:    (c, a) => generateSd3Handler(c, a),
  generate_image_core:   (c, a) => generateCoreHandler(c, a),
  generate_image_ultra:  (c, a) => generateUltraHandler(c, a),
  remove_background:     (c, a) => removeBgHandler(c, a),
  search_and_replace:    (c, a) => searchReplaceHandler(c, a),
  inpaint:               (c, a) => inpaintHandler(c, a),
  replace_background:    (c, a) => replaceBgHandler(c, a),
  outpaint:              (c, a) => outpaintHandler(c, a),
  search_and_recolor:    (c, a) => searchRecolorHandler(c, a),
  upscale_fast:          (c, a) => upscaleFastHandler(c, a),
  upscale_creative:      (c, a) => upscaleCreativeHandler(c, a),
  list_images:           (c, a) => listImagesHandler(c, a),
  use_clipboard_image:   (c, a) => useClipboardImageHandler(c, a),
};
