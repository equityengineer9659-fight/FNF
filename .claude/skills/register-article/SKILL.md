---
name: register-article
description: Register a blog article by running build scripts (auto-discovered from filesystem). Usage: /register-article {slug}
user_invocable: true
---

# Register Blog Article

Run the build/sync scripts for a blog article that was manually added to `blog/`.

All configuration files (`build-components.js`, `generate-sitemap.js`, `.pa11yci.json`) auto-discover articles from the `blog/` directory — no manual file edits needed.

## Input

The user provides a blog article slug (e.g., `my-new-article`). The article should already exist at `blog/{slug}.html`.

## Steps

1. **Verify the article exists** at `blog/{slug}.html`. If not, stop and tell the user.

2. **Run build scripts** (in sequence):
   ```bash
   node build-components.js
   node scripts/sync-blog.js
   ```
   The first injects nav/footer/scripts into the article (auto-discovers it from `blog/`). The second rebuilds the blog.html card grid.

3. **Report results** with a checklist:
   - [ ] Article file exists at `blog/{slug}.html`
   - [ ] `build-components.js` ran successfully (nav/footer injected)
   - [ ] `sync-blog.js` ran successfully (blog listing updated)

## Important Notes

- The slug format is kebab-case with no `.html` extension (e.g., `ai-reshaping-food-banks`)
- No config file edits needed — all files auto-discover articles via glob
- The scraper tool (`npm run admin`) also handles this automatically
