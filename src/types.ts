export interface StabilityArtifact {
  base64: string;
  seed: number;
  finishReason: "SUCCESS" | "ERROR" | "CONTENT_FILTERED";
}

export interface StabilityResponse {
  artifacts: StabilityArtifact[];
}

export interface SavedImageResult {
  filePath: string;
  seed: number;
}

export type { CallToolResult as ToolResult } from "@modelcontextprotocol/sdk/types.js";
