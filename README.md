# mcp-stability-ai

[![npm version](https://img.shields.io/npm/v/mcp-stability-ai)](https://www.npmjs.com/package/mcp-stability-ai)
[![CI](https://github.com/alesurli/mcp-stability-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/alesurli/mcp-stability-ai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A Claude MCP server for [Stability.ai](https://stability.ai) image generation and editing — always maintained and up to date with the v2beta API.

Generate, edit, upscale, and manage images entirely through natural language inside Claude. No manual file paths required.

---
## Why this exists

I built this because I needed a maintained Claude Desktop MCP workflow for Stability.ai image generation/editing, local file handling, and occasional cover/product-shot work without owning a capable GPU or maintaining a local ComfyUI stack.
This is not meant to replace local-first tools like ComfyUI or Automatic1111. It is an open-source integration for users who specifically want Claude Desktop + MCP + Stability.ai in one conversational workflow.

## Tools

### Generation

| Tool | Description | Cost |
|---|---|---|
| `generate_image_sd3` | SD3.5 — best overall quality, supports negative prompts | ~$0.035–$0.065 |
| `generate_image_core` | Core — fast generation with style presets | ~$0.03 |
| `generate_image_ultra` | Ultra — highest photorealistic quality | ~$0.08 |

### Editing

| Tool | Description | Cost |
|---|---|---|
| `remove_background` | Remove background, returns transparent PNG | $0.02 |
| `replace_background` | Replace + relight background — great for product shots | ~$0.04 |
| `inpaint` | Edit a masked region using a prompt | ~$0.03 |
| `search_and_replace` | Find an object by description and replace it, no mask needed | $0.04 |
| `search_and_recolor` | Recolor a specific object by description, no mask needed | ~$0.04 |
| `outpaint` | Extend the canvas in any direction | $0.04 |

### Upscaling

| Tool | Description | Cost |
|---|---|---|
| `upscale_fast` | 4x upscale, preserves original appearance | $0.01 |
| `upscale_creative` | 4x upscale with AI artistic enhancement | ~$0.25 |

### File management (no API cost)

| Tool | Description |
|---|---|
| `list_images` | List images in output/input directories with sizes and dates |
| `use_clipboard_image` | Save clipboard image to file for use in the next tool (macOS) |
| `reveal_in_finder` | Open the output folder or reveal a file in Finder (macOS) |
| `delete_image` | Permanently delete an image file |

---

## Installation

### 1. Get a Stability API key

Sign up at [platform.stability.ai](https://platform.stability.ai/account/keys) and copy your API key.

### 2. Add the server to Claude Desktop

Open the Claude Desktop config file and add the `stability` block inside `mcpServers`:

**macOS** — `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows** — `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux** — `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "stability": {
      "command": "npx",
      "args": ["-y", "mcp-stability-ai"],
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

> *"Generate a cinematic photo of a red panda on a mossy log in a rainy forest, 16:9"*

### Product photo pipeline (remove → replace → upscale)

> *"Take the photo at /Users/me/dragon.jpg, remove the background, place it on a dark dramatic studio background with top lighting, then upscale 4x."*

Claude chains the tools automatically:
1. `remove_background` → isolates subject, saves PNG
2. `replace_background` → dark studio background + relighting
3. `upscale_fast` → 4x resolution boost

### Use the clipboard instead of a file path

> *"Use the image I just copied, remove the background, then replace it with a blurred workshop background."*

1. Copy an image to clipboard (⌘C in any app)
2. Claude calls `use_clipboard_image` → saves to file
3. `remove_background` → `replace_background` automatically

### Work with short filenames

After the first tool runs, Claude knows the output filename. You can reference files naturally:

> *"Now upscale the remove_background result"* or *"List my images and upscale the latest one"*

`list_images` shows all available files — Claude can pick the right one without you typing a path.

### Recolor an object

> *"In /Users/me/device.jpg, recolor the plastic housing to matte black."*

### Extend a portrait to widescreen

> *"Outpaint /Users/me/portrait.jpg by 600px left and 600px right, prompt: continuation of the blurred background."*

---

## Output files

Results are saved to `~/Downloads/stability-ai/` by default (created automatically).

Filename format: `{tool}_{YYYY-MM-DD}_{HH-MM-SS}_{seed}.{ext}`  
Example: `replace-background_2026-06-09_11-36-20_2847291838.png`

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `STABILITY_API_KEY` | *(required)* | Your Stability AI API key |
| `STABILITY_OUTPUT_DIR` | `~/Downloads/stability-ai` | Where generated images are saved |
| `STABILITY_INPUT_DIR` | *(unset)* | Folder Claude searches for input images by short name |

Configure in Claude Desktop:

```json
"env": {
  "STABILITY_API_KEY": "sk-...",
  "STABILITY_OUTPUT_DIR": "/Users/you/Pictures/stability",
  "STABILITY_INPUT_DIR": "/Users/you/Pictures/input"
}
```

With `STABILITY_INPUT_DIR` set, you can pass bare filenames like `"dragon.jpg"` instead of full paths — Claude resolves them automatically.

---

## Development

```bash
git clone https://github.com/alesurli/mcp-stability-ai.git
cd mcp-stability-ai
npm install
npm run build
```

Point Claude Desktop at your local build:

```json
{
  "mcpServers": {
    "stability": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-stability-ai/dist/index.js"],
      "env": {
        "STABILITY_API_KEY": "sk-YOUR_KEY_HERE"
      }
    }
  }
}
```

Requires **Node.js 22+**.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT
