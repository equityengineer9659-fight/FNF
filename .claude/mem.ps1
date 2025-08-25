# Enhanced Agent Handoff Memory Creator with Milestone Detection
param(
    [string]$Task = $null,
    [string]$Focus = $null,
    [switch]$AllAgents = $false
)

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$gitStatus = git status --porcelain
$recentCommits = git log --oneline -3
$branch = git branch --show-current
$commit = git rev-parse --short HEAD

# Auto-detect project milestones and current state
$detectedTask = "Implementation in progress"
$detectedFocus = "General development"

# Check for completed phases in recovery document
if (Test-Path "REFACTORING-SESSION-RECOVERY.md") {
    $recoveryContent = Get-Content "REFACTORING-SESSION-RECOVERY.md" -Raw
    if ($recoveryContent -match "PHASE 1.*COMPLETED" -or $recoveryContent -match "Phase 1.*Complete") {
        $detectedTask = "Phase 1 JavaScript Consolidation COMPLETE"
        $detectedFocus = "Ready for Phase 2: SLDS Bundle Optimization (821KB → 100KB target)"
    }
    elseif ($recoveryContent -match "Phase 2.*Ready" -or $recoveryContent -match "SLDS.*Optimization") {
        $detectedTask = "Phase 2: SLDS Bundle Optimization"
        $detectedFocus = "Custom SLDS build implementation (87% bundle reduction)"
    }
}

# Check daily.md for status updates
if (Test-Path "docs/project/daily.md") {
    $dailyContent = Get-Content "docs/project/daily.md" -Raw
    if ($dailyContent -match "Phase 1.*complete|Phase 1.*COMPLETE|✅.*Phase 1") {
        $detectedTask = "Phase 1 JavaScript Consolidation COMPLETE"
        $detectedFocus = "Ready for Phase 2: SLDS Bundle Optimization"
    }
    elseif ($dailyContent -match "Phase 2.*active|Phase 2.*progress|SLDS.*optimization") {
        $detectedTask = "Phase 2: SLDS Bundle Optimization"
        $detectedFocus = "SLDS bundle reduction in progress"
    }
}

# Check plan.md for strategic status
if (Test-Path "docs/project/plan.md") {
    $planContent = Get-Content "docs/project/plan.md" -Raw
    if ($planContent -match "JavaScript Consolidation.*complete|Phase 1.*✅") {
        $detectedTask = "Phase 1 COMPLETE - Strategic Refactoring Success"
        $detectedFocus = "Agent coordination proven - Phase 2 ready"
    }
}

# Use provided parameters or fall back to detected values
$finalTask = if ($Task) { $Task } else { $detectedTask }
$finalFocus = if ($Focus) { $Focus } else { $detectedFocus }

# Find project files
$projectFiles = @()
if (Test-Path "docs/project/plan.md") { $projectFiles += "@plan.md" }
if (Test-Path "docs/project/daily.md") { $projectFiles += "@daily.md" }
if (Test-Path "REFACTORING-SESSION-RECOVERY.md") { $projectFiles += "@REFACTORING-SESSION-RECOVERY.md" }

$projectReads = if ($projectFiles.Count -gt 0) { $projectFiles -join ", " } else { "[No project files found]" }

$content = @"
# Agent Auto-Onboarding & Context Handoff - $timestamp

## SINGLE AGENT ONBOARDING:
Read @About the project.md, $projectReads, and @current-context-handoff.md for complete project context.

## ALL AGENTS ONBOARDING:
Launch specialized agents. Each reads @About the project.md, $projectReads, and @current-context-handoff.md.

## CURRENT CONTEXT
**Task:** $finalTask
**Focus:** $finalFocus
**Time:** $timestamp
**Branch:** $branch
**Commit:** $commit

## Modified Files
$gitStatus

## Recent Commits
$recentCommits

## Next Steps
1. Continue with current implementation
2. Test changes on all pages
3. Validate performance targets

---
Generated: $timestamp
"@

# Write file
$content | Out-File -FilePath ".claude\current-context-handoff.md" -Encoding UTF8

Write-Host "SUCCESS: Handoff memory created at .claude\current-context-handoff.md" -ForegroundColor Green
Write-Host ""
Write-Host "DETECTED STATUS:" -ForegroundColor Magenta
Write-Host "  Task: $finalTask" -ForegroundColor White
Write-Host "  Focus: $finalFocus" -ForegroundColor White
Write-Host ""

if ($AllAgents) {
    Write-Host "ALL AGENTS COMMAND:" -ForegroundColor Cyan
    Write-Host "Launch agents with: Read @About the project.md and @current-context-handoff.md" -ForegroundColor Yellow
} else {
    Write-Host "SINGLE AGENT COMMAND:" -ForegroundColor Cyan
    Write-Host "Read @About the project.md and @current-context-handoff.md" -ForegroundColor Yellow
}

# Show override options
Write-Host ""
Write-Host "MANUAL OVERRIDE OPTIONS:" -ForegroundColor Gray
Write-Host "  .\mem.bat -Task 'Custom task' -Focus 'Custom focus'" -ForegroundColor DarkGray