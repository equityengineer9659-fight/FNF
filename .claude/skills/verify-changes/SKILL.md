---
name: verify-changes
description: After writing or modifying production code, write tests and verify the build passes. Use when source files (JS, PHP, HTML, CSS) are created or changed.
user-invocable: false
paths: src/**/*.js, public/api/*.php, *.html, src/css/**/*.css, scripts/*.js, build-components.js
---

# Verify Changes

After writing or modifying production code, follow this sequence before considering the work done.

## When to Apply

Apply this workflow when you have just:
- Created or modified a JavaScript module in `src/js/`
- Created or modified a PHP endpoint in `public/api/`
- Changed build scripts (`build-components.js`, `scripts/*.js`)
- Made structural changes to HTML pages
- Modified CSS that could affect layout or functionality

Do NOT apply for:
- Documentation-only changes (markdown, comments)
- Configuration file edits (`.json`, `.yml`) unless they affect build behavior
- Reading or exploring files without making changes

## Step 1: Write or Update Tests

For every production code change, ensure test coverage exists:

- **New function or module** → Create a test file (follow existing pattern: `module-name.test.js` in same directory)
- **Bug fix** → Write a regression test that would have caught the bug
- **Changed behavior** → Update existing tests to match the new behavior
- **New edge case handled** → Add an edge case test

Test file conventions for this project:
- Unit tests: Vitest, co-located as `*.test.js` next to source
- E2E tests: Playwright, in `tools/testing/tests/*.spec.js`
- Mocking: Use `vi.mock()` for module mocks, `vi.fn()` for function mocks
- DOM: jsdom environment (automatic in Vitest config)

## Step 2: Run the Tests

```bash
# Run specific test file first (fast feedback)
npx vitest run path/to/changed.test.js

# Then run full suite to catch regressions
npx vitest run
```

If tests fail:
1. Read the error — is it your code or your test?
2. Fix the issue
3. Re-run until green
4. Do not move on with failing tests

## Step 3: Verify the Build

```bash
npm run build
```

If the build fails:
1. Read the error output
2. Fix the issue (usually import/export problems or lint errors)
3. Re-run until clean

## Step 4: Run Lint (if JS/CSS changed)

```bash
npm run lint
```

Fix any errors before considering work complete.

## Summary

The sequence is always: **code → test → run → build → lint**. Never skip the test step. If you're unsure what to test, test the public API of what you changed — inputs, outputs, and error cases.
