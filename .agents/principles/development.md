# Development Principles

## Hydro Docker Deployment

This project is deployed through Docker. Functional changes must be made in
source-controlled files and verified locally before rebuilding Docker images.

- Do not edit files inside a running container as a way to implement features or
  fixes.
- Keep deployment-relevant configuration in source where possible.
- Rebuild from source with `docker compose build` and restart with
  `docker compose up -d` from `install/docker` when deployment validation is
  needed.
- Treat `install/docker/data/**` and `install/docker/judge/judge.yaml` as local
  runtime state or secrets, not commit material.

## Code Change Discipline

- Read the nearest existing implementation before changing code.
- Prefer local project patterns over new conventions.
- Keep changes small, cohesive, and easy to review.
- Separate broad refactors from behavior changes unless the refactor is
  required to make the behavior change safely.
- Make failure modes explicit and keep user-facing behavior predictable.

## Testing

- Run the smallest relevant verification first.
- Add or update focused tests for changed behavior.
- Use broader checks when the change crosses package boundaries, affects build
  behavior, or touches deployment files.
- If a check cannot be run, record why and state the residual risk.

## Review Standards

General review priorities:

- Correctness: the change does what it claims.
- Maintainability: the next engineer can understand and modify it.
- Security: secrets, permissions, user input, and sandbox boundaries remain
  protected.
- Compatibility: existing workflows and data are not broken accidentally.
- Simplicity: prefer a clear boring solution over a clever fragile one.

These principles are adapted from common practices in Google Engineering
Practices, GitLab iteration and code review guidance, and Kubernetes
contribution guidance.

