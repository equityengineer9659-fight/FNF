---
name: test-fix
description: Systematic code review with test-first fixes. Explores codebase, finds bugs, writes failing tests, then fixes one issue at a time. Usage: /test-fix [scope]
disable-model-invocation: true
---

# Test-Fix: Systematic Code Review with Test-First Fixes

Find bugs, write failing tests that prove them, fix one at a time, verify green before moving on.

## Input

Optional scope argument:
- **A file path** (e.g., `src/js/effects/`) — review only that file or directory
- **A category** (e.g., `security`, `performance`, `tests`) — focus on that area
- **No argument** — full codebase review

## Phase 1: Discovery

1. **Launch up to 3 parallel Explore agents** to scan the codebase (or scoped area):
   - Agent 1: JS modules — logic errors, race conditions, async issues, memory leaks, dead code
   - Agent 2: Backend/build/config — security vulnerabilities, build fragility, CI/CD issues
   - Agent 3: HTML/CSS/tests — accessibility gaps, test coverage holes, data quality

2. **Compile raw findings** from all agents into a single list

3. **Verify each finding** by reading the actual source code:
   - **Confirmed** — code clearly has the bug
   - **Likely** — strong evidence but needs test to prove
   - **False positive** — drop it with explicit reasoning

4. **Classify each confirmed/likely finding:**

   | Field | Values |
   |-------|--------|
   | Severity | critical / high / medium / low |
   | Category | bug, security, performance, memory-leak, race-condition, test-gap, dead-code |
   | Location | exact file:line |
   | Cascading risk | what else could break |

## Phase 2: Plan

1. **Present the issue table** to the user:

   ```
   Codebase Quality Assessment

   Overall risk: HIGH / MEDIUM / LOW
   Strongest areas: ...
   Weakest areas: ...

   | ID | Severity | Confidence | Category | Location | Description | Action |
   |----|----------|------------|----------|----------|-------------|--------|

   False positives dropped:
   | Finding | Reason |
   ```

2. **Order issues** by severity and cascading risk (fix the thing that causes other bugs first)

3. **Get user approval** before touching any code — use ExitPlanMode

## Phase 3: Execute (One Issue at a Time)

For EACH issue, follow this exact sequence:

### Step 1: Write the failing test
- Add a test that demonstrates the bug exists
- The test MUST assert the correct behavior (what it SHOULD do)
- Place the test in the appropriate test file (extend existing or create new)

### Step 2: Run the test — confirm it FAILS
```
npx vitest run path/to/test.js
```
- If the test passes, the bug hypothesis is wrong — re-examine the finding
- If the test fails for the wrong reason, fix the test first

### Step 3: Implement the smallest safe fix
- Change only what's needed to fix the bug
- No refactoring, no cleanup, no feature additions
- No changes to code you didn't read

### Step 4: Run the test — confirm it PASSES
```
npx vitest run path/to/test.js
```

### Step 5: Run the broader test suite — confirm no regressions
```
npx vitest run
```

### Step 6: Run the build — confirm production output is clean
```
npm run build
```

### Step 7: Mark complete, move to next issue
- Update the TodoWrite task list
- Do NOT start the next issue until all tests are green

### Three-Strike Rule
If a fix fails 3 times on the same issue:
1. Stop attempting fixes
2. Explain the root cause
3. Explain why each attempt failed
4. Explain what assumption was wrong
5. Move to the next issue

## Phase 4: Verify & Ship

After all issues are fixed:

1. **Run full verification:**
   ```
   npm run lint
   npx vitest run
   npm run build
   ```

2. **Commit with specific files** (never `git add .` or `git add -A`):
   - Stage only the files you changed
   - Write a descriptive commit message listing each fix
   - Verify the commit landed: `git show HEAD` (lint-staged can silently revert)

3. **Push** to the current branch

4. **Report summary:**
   ```
   Files changed: X
   Tests added: Y
   Issues fixed: Z
   Issues deferred: N (with reasons)
   Residual risks: ...
   ```

## Key Principles

- **Test first, fix second** — never fix without a failing test proving the bug
- **One issue at a time** — no batching unrelated fixes
- **Evidence over guesswork** — read the code before concluding anything
- **Smallest safe fix** — no refactoring, no feature creep, no drive-by cleanup
- **Green before moving on** — never start the next issue with failing tests
- **Label uncertainty** — if you can't prove it, say so instead of forcing a risky change
- **Check for cascading patterns** — after finding a bug, search for the same pattern elsewhere

## Scope-Specific Guidance

When a **category** scope is given, focus the exploration:

| Category | Focus areas |
|----------|-------------|
| `security` | XSS, injection, CSRF gaps, secrets exposure, input validation, auth bypasses |
| `performance` | O(n²) algorithms, memory leaks, unbounded growth, expensive selectors, bundle size |
| `tests` | Coverage gaps, missing edge cases, flaky tests, untested modules |
| `bugs` | Logic errors, race conditions, null/undefined handling, type coercion, async ordering |
| `dead-code` | Unreachable branches, unused exports, stale helpers, commented-out code |
