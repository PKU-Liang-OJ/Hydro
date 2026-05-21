# Agent Workspace

This directory holds project-local instructions and reference material for
agents working on this Hydro OJ repository.

## Where To Start

- `../AGENTS.md`: top-level operating instructions.
- `principles/development.md`: development, test, deployment, and review
  principles.
- `skills/commit-and-push.md`: required checks before staging, committing, or
  pushing.
- `skills/hydro-docs.md`: how to answer Hydro usage and administration
  questions from the local docs snapshot.
- `hydro-docs/INDEX.md`: searchable entry point for Hydro documentation.

## Rules Of Thumb

- Source changes must be made in this repository, not in running containers.
- Docker deployment validation must rebuild images from source.
- Do not commit `install/docker/data/**` or
  `install/docker/judge/judge.yaml`.
- Preserve unrelated user changes in the worktree.

