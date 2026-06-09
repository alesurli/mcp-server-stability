# mcp-server-stability

[![npm version](https://img.shields.io/npm/v/mcp-server-stability)](https://www.npmjs.com/package/mcp-server-stability)
[![CI](https://github.com/alesurli/mcp-server-stability/actions/workflows/ci.yml/badge.svg)](https://github.com/alesurli/mcp-server-stability/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A Claude Desktop MCP server for [Stability.ai](https://stability.ai) image generation and editing — always up to date with the v2beta API.

Generate images, remove backgrounds, replace backgrounds with relighting, inpaint, outpaint, upscale, and more — all from natural language inside Claude.

---

## Tools

| Tool | Description | Cost |
|---|---|---|
| `generate_image_sd3` | Generate with SD3.5 — best overall quality | ~$0.035–$0.065 |
| `generate_image_core` | Generate with Core — fast, supports style presets | ~$0.03 |
| `generate_image_ultra` | Generate with Ultra — highest photorealistic quality | ~$0.08 |
| `remove_background` | Remove background, return transparent PNG | $0.02 |
| `replace_background` | Replace + relight background, great for product shots | ~$0.04 |
| `inpaint` | Edit a masked region using a prompt | ~$0.03 |
| `search_and_replace` | Find an object by description and replace it, no mask needed | $0.04 |
| `outpaint` | Extend the canvas in any direction | $0.04 |
| `search_and_recolor` | Recolor a specific object by description, no mask needed | ~$0.04 |
| `upscale_fast` | 4x upscale, preserves original appearance | $0.01 |
| `upscale_creative` | 4x upscale with AI artistic enhancement | ~$0.25 |

Output images are saved to `~/stability-output/` with filenames that include the tool name, timestamp, and seed.

---

## Installation

### 1. Get a Stability API key

Sign up at [platform.stability.ai](https://platform.stability.ai/account/keys) and copy your API key.

### 2. Add the server to Claude Desktop

Open the Claude Desktop config file for your OS and add the `stability` block inside `mcpServers`:

**macOS** — `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows** — `%APPDATA%\Claude\claude_desktop_config.json`

**Linux** — `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "stability": {
      "command": "npx",
      "args": ["-y", "mcp-server-stability"],
      "env": {
        "STABILITY_API_KEY": "sk-YOUR_KEY_HERE"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

The Stability AI tools will appear automatically.

---

## Usage examples

### Generate an image

> *"Generate a cinematic photo of a red panda sitting on a mossy log in a rainy forest, 16:9"*

### Remove and replace a background (product shot pipeline)

> *"Take the photo at /Users/me/part.jpg, remove its background, then place it on a dark dramatic studio background with top lighting, then upscale it 4x."*

Claude will chain the three tools automatically:
1. `remove_background` → isolates the subject
2. `replace_background` → dark studio bg + relighting
3. `upscale_fast` → 4x resolution boost

### Recolor an object

> *"In /Users/me/device.jpg, recolor the plastic housing to matte black."*

### Extend a portrait to landscape

> *"Outpaint /Users/me/portrait.jpg by 600px left and 600px right to make it widescreen, prompt: continuation of the blurred background."*

---

## Output files

Results are saved to `~/Downloads/stability-ai/` by default (created automatically).

To use a different folder, set `STABILITY_OUTPUT_DIR` in the Claude Desktop config:

```json
"env": {
  "STABILITY_API_KEY": "sk-...",
  "STABILITY_OUTPUT_DIR": "/Users/you/Pictures/stability"
}
```

Filename format: `{tool}_{YYYY-MM-DD}_{HH-MM-SS}_{seed}.{ext}`

Example: `replace-background_2026-06-09_11-36-20_2847291838.png`

Pass any output path directly to the next tool — Claude handles the chaining.

---

## Development

```bash
git clone https://github.com/alesurli/mcp-server-stability.git
cd mcp-server-stability
npm install
npm run build
```

To use your local build with Claude Desktop, point the config at the compiled file:

```json
{
  "mcpServers": {
    "stability": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-stability/dist/index.js"],
      "env": {
        "STABILITY_API_KEY": "sk-YOUR_KEY_HERE"
      }
    }
  }
}
```

Requires **Node.js 22+** (uses native `fetch` and `FormData`).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT
