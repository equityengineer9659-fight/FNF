# /ship

Ship all pending changes: lint, build, commit, and push.

## Steps

1. Run `npm run lint` — fix any errors before proceeding
2. Run `npm run build` — fix any errors before proceeding
3. Run `git status` to identify all changed and untracked files
4. Stage files by name (`git add <file> ...`) — never use `git add -A` or `git add .`
   - Skip files that likely contain secrets (`.env`, credentials, API keys)
   - If unsure whether a file should be included, ask the user
5. Create a commit with a descriptive message:
   - If on a `KAN-XX-*` branch, prefix the message with the issue key (e.g., `KAN-82 Add admin notification`)
   - Summarize the "why" not the "what"
   - End with the `Co-Authored-By` trailer
6. Push to the current remote branch (`git push` or `git push -u origin <branch>` if no upstream is set)
7. Report: commit hash, branch name, files committed, and confirm push succeeded
