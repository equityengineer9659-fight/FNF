# Release Process

How code goes from your machine to production at food-n-force.com.

## The Release Pipeline

| Step | What Happens | Who/What Does It | Where |
|------|-------------|-------------------|-------|
| **1. Commit** | Code changes are saved locally with a message | You or Claude Code | Your machine |
| **2. Push** | Commits are uploaded to GitHub | `git push` | Your machine → GitHub |
| **3. CI/CD runs automatically** | GitHub Actions triggers the pipeline on push | GitHub Actions | GitHub cloud |
| **3a. HTML Validation** | Checks all 63 HTML files for syntax errors | `htmlhint` | GitHub Actions |
| **3b. CSS Linting** | Checks CSS for style/syntax issues | `stylelint` | GitHub Actions |
| **3c. JS Linting** | Checks JavaScript for errors and style | `eslint` | GitHub Actions |
| **3d. Unit Tests** | Runs all 286 vitest tests | `npm test` | GitHub Actions |
| **3e. Build** | Vite compiles everything into `dist/` (minified, tree-shaken) | `npm run build` | GitHub Actions |
| **3f. Accessibility** | Scans pages for WCAG 2.1 AA violations | `pa11y-ci` (sample mode) | GitHub Actions |
| **4. PR created** | A pull request is opened against master | You or Claude Code via `gh pr create` | GitHub |
| **5. CI runs again** | Same pipeline re-runs on the PR (ensures merge is safe) | GitHub Actions | GitHub cloud |
| **6. Review** | You check the PR diff, CI status, and description | You | GitHub PR page |
| **7. Merge** | You click "Squash and merge" — commits land on master | You | GitHub PR page |
| **8. Deploy triggers** | Merge to master triggers the deploy job in CI/CD | GitHub Actions | GitHub cloud |
| **8a. SSH to SiteGround** | GitHub Actions connects to your hosting server | SSH key (in GitHub Secrets) | GitHub → SiteGround |
| **8b. rsync** | `dist/` folder is synced to `public_html/` on the server | `rsync --delete` | SiteGround |
| **8c. PHP copied** | `public/api/*.php` files are deployed alongside the build | rsync | SiteGround |
| **9. Live** | Changes are live at food-n-force.com | SiteGround serves the files | Production |
| **10. Jira updated** | If the branch had a `KAN-XX` key, the story moves to Done | GitHub Actions (Jira workflow) | Jira |

## The Short Version

| Phase | Summary |
|-------|---------|
| **Code** | Commit → Push → PR |
| **Verify** | Lint → Test → Build → Accessibility (all automatic) |
| **Ship** | Merge to master → rsync to SiteGround → Live |
| **Track** | Jira story auto-moves to Done |

## Key Things to Know

| Rule | Why |
|------|-----|
| Never commit directly to master | CI/CD must run before code goes live |
| Squash merge preferred | Keeps master history clean (1 commit per PR) |
| HTML is never cached | `public/.htaccess` ensures users always get the latest |
| Assets are hash-named | `main-Ce63eOv4.js` — browser cache busts automatically on new builds |
| `rsync --delete` removes old files | Stale assets from previous builds get cleaned up |
| Deploy only runs on master merge | Pushing to feature branches only runs CI, not deploy |
