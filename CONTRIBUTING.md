# Contributing

## Development setup

```bash
git clone https://github.com/alesurli/mcp-server-stability.git
cd mcp-server-stability
npm install
npm run build
```

Point Claude Desktop at your local build (see README Development section) and reload.

## Adding a new tool

Each tool lives in its own file under `src/tools/`. Follow the existing pattern:

1. Define a Zod input schema
2. Export a `Tool` object using `zodToJsonSchema(schema)` for `inputSchema`
3. Export an async handler function `(client: StabilityClient, args: unknown) => Promise<ToolResult>`
4. Register both exports in `src/tools/index.ts`

The handler receives raw `args: unknown` and must call `Schema.parse(args)` as the first step — this validates input and gives you typed data. Errors thrown from the handler are caught in `src/index.ts` and returned as tool errors to Claude.

## Commit style

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When to use | Version bump |
|---|---|---|
| `fix:` | Bug fix | patch (1.0.x) |
| `feat:` | New tool or feature | minor (1.x.0) |
| `feat!:` or `BREAKING CHANGE:` | Breaking API change | major (x.0.0) |
| `chore:` / `docs:` / `refactor:` | Everything else | none |

## Release process

Releases are triggered by pushing a version tag. Maintainer steps:

1. Update `CHANGELOG.md`
2. Bump version in `package.json`
3. Commit: `git commit -m "chore: release vX.Y.Z"`
4. Tag: `git tag vX.Y.Z && git push --tags`

GitHub Actions will build and publish to npm automatically.
