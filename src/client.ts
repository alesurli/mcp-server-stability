import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { StabilityResponse } from "./types.js";

const BASE_URL = "https://api.stability.ai/v2beta";

export class StabilityClient {
  constructor(private readonly apiKey: string) {}

  async request(
    endpoint: string,
    fields: Record<string, string | number>,
    files?: Record<string, { path: string; fieldName: string }>
  ): Promise<StabilityResponse> {
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

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
      body: form,
    });

    if (response.status === 429) {
      throw new Error("Rate limit exceeded (150 req/10s). Please retry in about 60 seconds.");
    }
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Stability API error ${response.status}: ${body}`);
    }

    return response.json() as Promise<StabilityResponse>;
  }

  async startCreativeUpscale(
    imagePath: string,
    prompt: string,
    extraFields?: Record<string, string | number>
  ): Promise<string> {
    const form = new FormData();
    const data = await readFile(imagePath);
    form.append("image", new Blob([data]), basename(imagePath));
    form.append("prompt", prompt);
    if (extraFields) {
      for (const [key, value] of Object.entries(extraFields)) {
        form.append(key, String(value));
      }
    }

    const response = await fetch(`${BASE_URL}/stable-image/upscale/creative`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
      body: form,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Creative upscale start failed ${response.status}: ${body}`);
    }

    const { id } = (await response.json()) as { id: string };
    return id;
  }

  async pollCreativeUpscale(id: string): Promise<StabilityResponse> {
    const url = `${BASE_URL}/stable-image/upscale/creative/result/${id}`;
    const deadline = Date.now() + 5 * 60 * 1000;

    while (Date.now() < deadline) {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
      });

      if (response.status === 200) {
        return response.json() as Promise<StabilityResponse>;
      }
      if (response.status === 202) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }

      const body = await response.text();
      throw new Error(`Creative upscale poll failed ${response.status}: ${body}`);
    }

    throw new Error(`Creative upscale timed out after 5 minutes (id: ${id})`);
  }
}
