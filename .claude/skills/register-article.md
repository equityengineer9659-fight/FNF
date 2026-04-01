---
description: Register a blog article in all required files and run sync scripts. Usage: /register-article {slug}
user_invocable: true
---

# Register Blog Article

Register a blog article HTML file in all required configuration files and run the build/sync scripts.

## Input

The user provides a blog article slug (e.g., `my-new-article`). The article should already exist at `blog/{slug}.html`.

## Steps

1. **Verify the article exists** at `blog/{slug}.html`. If not, stop and tell the user.

2. **Update `build-components.js`** — add the slug to BOTH arrays:
   - `resourcesSubpages` array (around line 14–39) — add `'{slug}'` as a string entry
   - `articlePages` array (around line 194–213) — add `'{slug}'` as a string entry

3. **Update `scripts/generate-sitemap.js`** — add to the `pages` array:
   ```js
   { path: 'blog/{slug}.html', priority: '0.7', changefreq: 'monthly' }
   ```

4. **Update `.pa11yci.json`** — add to the `urls` array:
   ```
   http://localhost:4173/blog/{slug}.html
   ```

5. **Run build scripts** (in sequence):
   ```bash
   node build-components.js
   node scripts/sync-blog.js
   ```
   The first injects nav/footer/scripts into the article. The second rebuilds the blog.html card grid.

6. **Report results** with a checklist:
   - [ ] Slug added to `resourcesSubpages` in build-components.js
   - [ ] Slug added to `articlePages` in build-components.js
   - [ ] Slug added to `pages` in generate-sitemap.js
   - [ ] URL added to `.pa11yci.json`
   - [ ] `build-components.js` ran successfully
   - [ ] `sync-blog.js` ran successfully

## Important Notes

- The slug format is kebab-case with no `.html` extension (e.g., `ai-reshaping-food-banks`)
- If the slug already exists in any file, skip that file and note it
- The scraper tool (`npm run admin`) handles all this automatically — this skill is for manually added articles only
