# AGENTS.md

This repository is Hydro OJ. The current deployment path is Docker based, with
the compose file at `install/docker/docker-compose.yml`.

## First Rules

- Change source code, not running containers. Do not fix business logic,
  configuration behavior, dependencies, or UI by editing files inside Docker
  containers.
- Local verification comes first. Read the relevant code and docs, make the
  source change, run the smallest useful local test or build, then rebuild and
  redeploy Docker.
- Docker redeploy means rebuilding from zero with source-controlled changes:
  use `docker compose build` and `docker compose up -d` from `install/docker`
  when deployment validation is required.
- Never commit runtime data or local judge secrets. In particular, do not commit
  `install/docker/data/**` or `install/docker/judge/judge.yaml`.
- Never commit problem packages, statements, solutions, generated problem assets,
  or test data unless the user explicitly asks for a private distribution commit.
  In particular, do not commit `problem-packages/**`; keep assignment test cases
  out of the repository so students cannot inspect hidden samples.
- Preserve user changes already present in the worktree. Inspect before editing
  and do not revert unrelated changes.

## Project Map

- `packages/hydrooj`: core Hydro server package.
- `packages/hydrojudge`: judge package and sandbox orchestration.
- `packages/ui-default`: default Hydro UI.
- `packages/*`: official plugins and shared packages.
- `framework/*`: shared framework utilities.
- `install/docker`: Docker deployment assets for this project.
- `.agents`: agent operating notes, skills, principles, and local Hydro docs.

## Development Workflow

1. Start by reading the nearest source, tests, config, and `.agents` notes.
2. Prefer the existing architecture and local helper APIs over new abstractions.
3. Keep changes small and reviewable; split unrelated work into separate
   changes.
4. Add or update focused tests when behavior changes.
5. Run the smallest relevant verification first, then broader checks if the
   change crosses package or deployment boundaries.
6. For Docker deployment validation, rebuild from source instead of patching a
   live container.

Useful commands:

```sh
yarn test
yarn build
yarn lint:ci
cd install/docker && docker compose build && docker compose up -d
```

Use the command that matches the change; not every task needs every command.

## Engineering Principles

These notes adapt common practices from widely used engineering guides:

- From Google Engineering Practices: prioritize long-term code health, clear
  design, correctness, maintainability, and tests.
- From GitLab iteration guidance: ship the smallest complete change that solves
  the problem; keep merge requests easy to review.
- From GitLab code review guidance: code should be effective, understandable,
  maintainable, and secure.
- From Kubernetes contributing guidance: follow project conventions, write good
  commit messages, and break large changes into logical smaller patches.

Practical defaults for this repo:

- Simple, boring solutions beat clever ones.
- Match existing style before introducing a new pattern.
- Keep refactors separate unless they are required for the requested change.
- Prefer explicit source-controlled configuration over manual server state.
- Treat data, credentials, judge configs, and deployment state as sensitive.

## Agent Skills

- Commit and push: read `.agents/skills/commit-and-push.md` before staging,
  committing, or pushing.
- Hydro documentation lookup: read `.agents/skills/hydro-docs.md` before
  answering Hydro usage, management, deployment, plugin, judge, or admin
  questions.

## Local Hydro Docs

The local Hydro documentation snapshot lives in `.agents/hydro-docs`.
Start with `.agents/hydro-docs/INDEX.md` for fast topic lookup.
