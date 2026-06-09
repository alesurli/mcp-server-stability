#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { StabilityClient } from "./client.js";
import { allTools, toolHandlers } from "./tools/index.js";

const apiKey = process.env.STABILITY_API_KEY;
if (!apiKey) {
  process.stderr.write(
    "Error: STABILITY_API_KEY environment variable is required.\n" +
    "Get your key at https://platform.stability.ai/account/keys\n"
  );
  process.exit(1);
}

const client = new StabilityClient(apiKey);

const server = new Server(
  { name: "mcp-server-stability", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: allTools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const handler = toolHandlers[request.params.name];
  if (!handler) {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }
  try {
    return await handler(client, request.params.arguments ?? {});
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
