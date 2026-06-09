import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { StabilityResponse } from "./types.js";

const BASE_URL = "https://api.stability.ai/v2beta";

function normalizeResponse(raw: Record<string, unknown>): StabilityResponse {
  // v2beta returns either:
  //   { image: "<base64>", finish_reason: "SUCCESS", seed: 123 }   ← most endpoints
  //   { artifacts: [{ base64: "...", finishReason: "SUCCESS", seed: 123 }] }  ← legacy
  if (typeof raw.image === "string") {
    return {
      artifacts: [{
        base64: raw.image,
        seed: typeof raw.seed === "number" ? raw.seed : 0,
        finishReason: raw.finish_reason === "CONTENT_FILTERED" ? "CONTENT_FILTERED"
                    : raw.finish_reason === "ERROR"            ? "ERROR"
                    : "SUCCESS",
      }],
    };
  }
  if (Array.isArray(raw.artifacts) && raw.artifacts.length > 0) {
    return raw as unknown as StabilityResponse;
  }
  const preview = JSON.stringify(raw).slice(0, 200);
  throw new Error(`Unexpected API response format: ${preview}`);
}

export class StabilityClient {
  constructor(private readonly apiKey: string) {}

  private async buildForm(
    fields: Record<string, string | number>,
    files?: Record<string, { path: string; fieldName: string }>
  ): Promise<FormData> {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      form.append(key, String(value));
    }
    if (files) {
      for (const { path, fieldName } of Object.values(files)) {
        const data = await readFile(path);
        form.append(fieldName, new Blob([data]), basename(path));
      }
    }
    return form;
  }

  async request(
    endpoint: string,
    fields: Record<string, string | number>,
    files?: Record<string, { path: string; fieldName: string }>
  ): Promise<StabilityResponse> {
    const form = await this.buildForm(fields, files);

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
      body: form,
    });

    if (response.status === 401) {
      throw new Error("Invalid API key. Check your STABILITY_API_KEY at https://platform.stability.ai/account/keys");
    }
    if (response.status === 429) {
      throw new Error("Rate limit exceeded (150 req/10s). Please retry in about 60 seconds.");
    }
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Stability API error ${response.status}: ${body}`);
    }

    const raw = (await response.json()) as Record<string, unknown>;
    const data = normalizeResponse(raw);
    if (data.artifacts[0].finishReason === "ERROR") {
      throw new Error("Generation failed: Stability API returned finishReason ERROR.");
    }
    if (data.artifacts[0].finishReason === "CONTENT_FILTERED") {
      throw new Error("Generation blocked by content filter. Try a different prompt.");
    }
    return data;
  }

  async startJob(
    endpoint: string,
    fields: Record<string, string | number>,
    files?: Record<string, { path: string; fieldName: string }>
  ): Promise<string> {
    const form = await this.buildForm(fields, files);

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
      body: form,
    });

    if (response.status === 401) {
      throw new Error("Invalid API key. Check your STABILITY_API_KEY at https://platform.stability.ai/account/keys");
    }
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please retry in about 60 seconds.");
    }
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Stability API error ${response.status}: ${body}`);
    }

    const { id } = (await response.json()) as { id: string };
    return id;
  }

  async pollJob(resultEndpoint: string, id: string): Promise<StabilityResponse> {
    const url = `${BASE_URL}${resultEndpoint}/${id}`;
    const deadline = Date.now() + 5 * 60 * 1000;

    while (Date.now() < deadline) {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
      });

      if (response.status === 200) {
        const raw = (await response.json()) as Record<string, unknown>;
        return normalizeResponse(raw);
      }
      if (response.status === 202) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }

      const body = await response.text();
      throw new Error(`Job poll failed ${response.status}: ${body}`);
    }

    throw new Error(`Job timed out after 5 minutes (id: ${id})`);
  }
}
