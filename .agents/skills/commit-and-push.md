# Skill: Commit And Push

Use this checklist before staging, committing, or pushing changes.

## Required Checks

1. Inspect the worktree:

   ```sh
   git status --short
   ```

2. Do not stage or commit local data or judge secrets:

   ```sh
   git diff --name-only --cached
   ```

   The staged list must not include:

   - `install/docker/data/**`
   - `install/docker/judge/judge.yaml`

3. If either path appears in the staged list, stop and unstage it before
   committing.

4. Keep the commit scoped to the requested work. Do not sweep in unrelated user
   edits.

5. Mention the relevant verification in the commit or final summary.

## Push Guidance

- Push only after the intended commit exists and the excluded data paths are not
  part of it.
- If pushing a branch for agent work, use the `codex/` branch prefix unless the
  user requested another branch name.

