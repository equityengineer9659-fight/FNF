---
name: create-illustration
description: Create an SVG illustration for a blog article. Usage: /create-illustration {slug}
user_invocable: true
---

# Create Article Illustration

Create a purpose-built SVG illustration for the blog article specified by the user.

## Input

The user provides a blog article slug (e.g., `data-migration-food-bank-modernization`). The article lives at `blog/{slug}.html`.

## Steps

1. **Read the article** at `blog/{slug}.html`. Extract:
   - The article title and subtitle
   - Key themes, concepts, and arguments
   - Any specific processes, comparisons, or data flows described
   - The article category (AI & Innovation, Tech Strategy, Case Studies, Implementation, Industry Insights)

2. **Design the illustration** as a conceptual diagram that directly reflects the article's specific content. Do NOT create generic stock-art — the illustration should be meaningful to someone who has read the article.

3. **Write the SVG** to `src/assets/images/illustrations/{slug}.svg`

4. **Verify** the article's `<figure>` tag references the correct path: `/src/assets/images/illustrations/{slug}.svg`

## SVG Style Guide

Every illustration MUST follow this exact style to maintain visual consistency across all 44+ existing illustrations:

### Structure
- `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" role="img" aria-label="{descriptive alt text}">`
- Use `fill="none"` on the root SVG element
- Define gradients and filters in `<defs>`
- Use unique gradient/filter IDs prefixed with the article topic to avoid SVG conflicts (e.g., `id="migG"` not `id="grad1"`)
- Target 50–180 lines of SVG

### Color Palette (brand gradients)
- **Sky blue**: `#0ea5e9` → `#06b6d4`
- **Indigo/purple**: `#6366f1` → `#8b5cf6` (lighter: `#c4b5fd`)
- **Emerald/green**: `#10b981` → `#059669` (lighter: `#6ee7b7`)
- **Amber/warning**: `#f59e0b` → `#d97706` (lighter: `#fbbf24`)
- **Red/legacy**: `#ef4444` → `#dc2626` (lighter: `#fca5a5`)
- **Salesforce blue**: `#0176d3` → `#0b5cab`
- **Cyan accent**: `#06b6d4`, `#67e8f9`

### Background
- Dark gradient background: `#0f1923` → `#1a1040` (or solid `rgba(15,23,42,0.5)`)
- Optional subtle grid lines at low opacity (`opacity="0.04"`)

### Elements
- Semi-transparent fills: `fill-opacity="0.1"` to `0.15` with colored strokes at `0.6` opacity
- Rounded rectangles: `rx="8"` for containers, `rx="4"` for small elements
- Flow arrows with markers for process diagrams
- Simple geometric icons (circles, rectangles, paths) — no complex illustrations
- Text labels using `font-family="system-ui,sans-serif"` at sizes 7–13px
- Section titles in `font-weight="700"` with `letter-spacing="0.06em"`

### What NOT to do
- No external fonts or images
- No `<image>` tags or base64 data
- No CSS `<style>` blocks (inline attributes only)
- No animations or JavaScript
- Avoid long text passages — keep labels short (1–3 words)
- Do NOT use generic gradient IDs like `grad1`, `grad2` — they will conflict with other SVGs on the page
