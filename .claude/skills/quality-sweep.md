---
description: Run validation agents in parallel for pre-deploy quality checks. Usage: /quality-sweep [scope]
user_invocable: true
---

# Quality Sweep

Run multiple project-specific validation agents in parallel to catch issues before deploying. Returns a unified pass/fail summary.

## Input

Optional scope argument (default: `all`):
- **`all`** — Full sweep: accessibility, cross-page consistency, SEO, performance budgets, SLDS compliance
- **`content`** — Content-focused: content reviewer, cross-page consistency, SEO
- **`css`** — CSS-focused: SLDS compliance, performance budgets, UI/UX review
- **`deploy`** — Pre-deploy essentials: accessibility, cross-page consistency, SEO, performance budgets

## Steps

1. **Determine scope** from the user's argument (default to `all` if none provided)

2. **Launch agents in parallel** based on scope. Use the Agent tool with the appropriate `subagent_type` for each:

   | Scope | Agents to launch |
   |-------|-----------------|
   | `all` | accessibility-auditor, cross-page-consistency, seo-auditor, performance-budget-monitor, slds-compliance-checker |
   | `content` | content-reviewer, cross-page-consistency, seo-auditor |
   | `css` | slds-compliance-checker, performance-budget-monitor, uiux-reviewer |
   | `deploy` | accessibility-auditor, cross-page-consistency, seo-auditor, performance-budget-monitor |

   Each agent prompt should instruct it to:
   - Run its standard validation checks against the current state of the project
   - Report findings categorized by severity (critical, warning, info)
   - Keep the report concise — summary + actionable items only

3. **Collect results** from all agents

4. **Present unified summary** to the user:
   ```
   Quality Sweep Results ({scope})

   Agent                      | Status | Critical | Warnings
   ---------------------------|--------|----------|----------
   accessibility-auditor      | PASS   | 0        | 2
   cross-page-consistency     | FAIL   | 1        | 3
   ...

   Critical Issues:
   1. [agent] description of issue — file:line

   Deploy Recommendation: HOLD / PROCEED WITH CAUTION / CLEAR
   ```

## Notes

- All agents are defined in `.claude/agents/` and are invoked via the Agent tool with `subagent_type` matching the agent filename (without `.md`)
- Launch all agents in a SINGLE message with multiple Agent tool calls for true parallel execution
- If any agent fails to run, note it in the summary but don't block the rest
- The `php-security-reviewer`, `business-analyst`, and `technical-architect` agents are excluded from sweeps — they're for targeted reviews, not routine validation
