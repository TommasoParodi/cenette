# Smart Commit

You are responsible for creating a clean git commit.

Follow this workflow:

1) Check repository status
Run:
git status

2) If there are unstaged changes:
stage all relevant files (avoid node_modules, dist, build artifacts, lockfile noise if untouched)

3) Analyze the staged diff
Run:
git diff --staged

4) Write a high quality commit message using Conventional Commits

Rules:
- Format: type(scope): summary
- Types: feat, fix, refactor, perf, docs, style, test, chore, build, ci
- Imperative mood
- Max 72 char title
- Add scope if meaningful
- Add body only if it explains WHY
- Do not mention filenames
- Do not be generic
- Prefer semantic intent over literal changes

5) Show me the commit message BEFORE committing

6) After confirmation:
Run:
git commit -m "<generated_message>"

NEVER push.
NEVER run git push.
