# Changelog

All notable changes to this project will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — 2026-06-09

### Added
- **15 tools** covering the full Stability AI v2beta API surface
- Generation: `generate_image_sd3`, `generate_image_core`, `generate_image_ultra`
- Editing: `remove_background`, `replace_background`, `inpaint`, `search_and_replace`, `search_and_recolor`, `outpaint`
- Upscaling: `upscale_fast`, `upscale_creative`
- File management (no API cost): `list_images`, `use_clipboard_image`, `reveal_in_finder`, `delete_image`
- `STABILITY_INPUT_DIR` env var — set an input folder so Claude resolves bare filenames (e.g. `"dragon.jpg"`) without full paths
- `resolveImagePath()` — all image-input tools accept bare filenames; searched in output dir then input dir
- `list_images` returns an HTML thumbnail gallery (`text/html;profile=mcp-app`) alongside the text listing
- `use_clipboard_image` saves macOS clipboard image to file and returns the path for immediate chaining
- `reveal_in_finder` opens the output folder or reveals a specific file in macOS Finder
- `delete_image` permanently deletes an image file by name or path
- Compressed WebP inline preview in all generation/editing tool results (ready for when clients support `type: "image"`)
- Output files saved to `~/Downloads/stability-ai/` with readable filenames: `{tool}_{date}_{seed}.{ext}`
- Configurable output directory via `STABILITY_OUTPUT_DIR` env var

### Fixed
- `replace_background` and `upscale_creative` are async endpoints — now use correct `startJob()` / `pollJob()` pattern
- Async polling uses the correct generic endpoint `GET /v2beta/results/{id}` (not endpoint-specific paths that return 404)
- Async result response `{"result": "<base64>"}` now handled in `normalizeResponse()`
- API response normalization handles both `{image, finish_reason, seed}` (v2beta) and `{artifacts: [...]}` (legacy) formats
- Error messages truncate base64 data to prevent multi-MB error strings
