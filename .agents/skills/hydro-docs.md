# Skill: Hydro Docs Lookup

Use this skill when the user asks about Hydro usage, administration, deployment,
plugins, judge configuration, users, domains, test data, upgrades, or system
management.

## Lookup Flow

1. Open `.agents/hydro-docs/INDEX.md`.
2. Pick the most specific topic entry.
3. Open the linked Markdown page under `.agents/hydro-docs/pages/`.
4. Answer from the local page first, and include the source URL when useful.
5. If the local snapshot is missing the topic or seems stale, check the live
   Hydro docs at `https://hydro.js.org/zh/docs/Hydro`.

## Notes

- The local snapshot stores Markdown text and remote image links only.
- For this repository's Docker deployment, also check
  `.agents/hydro-docs/docker-local.md` and `install/docker/README.md`.
- Do not recommend changing files inside Docker containers for source-level
  fixes.

