---
description: Interactive guide to project workflow commands and lifecycle stages
argument-hint: none
workflow-stage: navigation
part-of: project-workflow lifecycle
---

# Workflow Guide

Interactive navigation guide for the project workflow lifecycle. Shows available commands, current project state, and recommendations.

---

## Your Task

Present the project workflow system in an accessible, interactive way. Help users understand:
1. Where they are in the project lifecycle
2. What workflow commands are available
3. Which command makes sense for their current context

---

## Workflow System Overview

Show the user this visual lifecycle map:

```
PROJECT LIFECYCLE
=================

EXPLORATION → PLANNING → EXECUTION → WRAP → RESUME → FEATURE → RELEASE
     ↓            ↓           ↓          ↓        ↓         ↓         ↓
/explore-idea  /plan-     (work in    /wrap-  /continue-  /plan-   /release
              project     phases)    session  session    feature
```

---

## Current Project State Detection

**Automatically detect project state** and show relevant information:

### Check 1: Does SESSION.md exist?

**If YES:**
```
📋 Current Project State
========================

Project: [Extract from SESSION.md]
Current Phase: Phase [N] - [Name]
Stage: [Implementation/Verification/Debugging]
Last Checkpoint: [hash] ([date])

Progress:
✅ [completed tasks]
🔄 [current task] ← YOU ARE HERE
⏸️ [pending tasks]

Next Action: [specific file + line + task]
```

**If NO:**
```
📋 Current Project State
========================

No SESSION.md found - either:
• Not using workflow system yet
• New/simple project
• Haven't run /plan-project yet

Recommendation: For projects >2 hours, use /plan-project to structure work.
```

### Check 2: Does IMPLEMENTATION_PHASES.md exist?

**If YES**: Project uses phased development
**If NO**: Simple project or planning not done yet

### Check 3: Recent git activity

Run `git log --oneline -3` to show recent commits

---

## Available Workflow Commands

Present commands grouped by lifecycle stage:

### 🔍 Exploration Stage

**`/explore-idea`** - Research and validate project ideas

**When to use:**
- Have a rough idea but unsure about feasibility
- Multiple tech options, need to pick best fit
- Want research before committing to implementation
- Need scope management to prevent feature creep

**Time saved:** 10-15 minutes per project idea

**What it does:**
- Guided conversation to understand your vision
- Heavy research (Explore agents, WebSearch, MCP tools)
- Validates tech stack and architecture
- Challenges assumptions
- Creates PROJECT_BRIEF.md with decisions
- Recommends: Proceed/Pause/Pivot

---

### 📐 Planning Stage

**`/plan-project`** - Generate implementation phases for new projects

**When to use:**
- Starting a new project
- After `/explore-idea` recommends "proceed"
- Need to break work into context-safe chunks
- Want clear structure before coding

**Time saved:** 8-12 minutes per project

**What it generates:**
- IMPLEMENTATION_PHASES.md (roadmap with 2-4 hour phases)
- SESSION.md (progress tracker)
- Other planning docs as needed (ARCHITECTURE.md, DATABASE_SCHEMA.md, etc.)

---

### ➕ Feature Addition Stage

**`/plan-feature`** - Add features to existing projects properly

**When to use:**
- Adding features to existing phased projects
- Project has SESSION.md + IMPLEMENTATION_PHASES.md
- Want to integrate new feature without disrupting structure

**Time saved:** 5-8 minutes per feature

**What it does:**
- Breaks feature into phases (data, API, UI, integration)
- Adds phases to IMPLEMENTATION_PHASES.md
- Updates SESSION.md
- Maintains phase dependencies

---

### 💾 Session Management (Wrap)

**`/wrap-session`** - Checkpoint progress before context clear

**When to use:**
- Context >70% full (140k+ tokens)
- Phase complete
- Need to pause work
- Before potentially destructive operations

**Time saved:** 15-25 minutes avoiding lost context

**What it does:**
- Updates SESSION.md with current progress
- Creates git commit with checkpoint message
- Documents Next Action (file + line + task)
- Lists known issues

**IMPORTANT**: Run this BEFORE clearing context to preserve your work!

---

### 🔄 Session Management (Resume)

**`/continue-session`** - Resume from checkpoint

**When to use:**
- New session starting
- Need to pick up where you left off
- Want to see what you were working on

**Time saved:** 8-12 minutes recreating context

**What it shows:**
- Current phase and progress
- Next Action to continue from
- Recent checkpoint history (last 5 commits)
- Known issues to address

---

### 🚀 Release Stage

**`/release <version>`** - Safety checks before publishing

**When to use:**
- Ready to publish/deploy
- Creating a release
- Want to verify everything is ready

**Time saved:** 10-20 minutes catching issues

**What it checks:**
- ✅ No secrets in code (.env, keys, tokens)
- ✅ Documentation up to date
- ✅ Build succeeds
- ✅ Tests passing
- ✅ Git remote configured
- ✅ Version bumped
- ✅ Release notes prepared

---

## Context-Aware Recommendations

Based on detected state, provide specific recommendations:

### If SESSION.md exists AND context >70%:
```
⚠️ RECOMMENDATION

Context: [X]% full ([tokens])
Current: Phase [N] in progress

You should use /wrap-session soon to checkpoint your work.
This prevents losing progress if context fills up.

Run /wrap-session? (y/n)
```

### If no SESSION.md AND conversation >30 minutes:
```
💡 SUGGESTION

This conversation has been running for 30+ minutes.

For longer projects, consider /plan-project to:
• Break into context-safe phases
• Track progress in SESSION.md
• Enable checkpoint/resume workflow

Would that help? (y/n)
```

### If  SESSION.md exists AND user just started session:
```
👋 WELCOME BACK

I see SESSION.md exists. You were working on:
• Phase [N] - [Name]
• Next Action: [task]

Use /continue-session to load full context and continue.

Resume? (y/n)
```

### If asking about releases:
```
📦 RELEASE CHECKLIST

Before publishing, use /release to verify:
• No secrets leaked
• Documentation current
• Build succeeds
• Tests pass

This prevents common release disasters.

Run /release? (y/n)
```

---

## Interactive Navigation

After showing the overview, ask:

```
Which stage are you in?

1. 🔍 Exploration - Validating an idea
2. 📐 Planning - Structuring a new project
3. 💻 Execution - Working through implementation
4. 💾 Wrap - Saving progress/checkpointing
5. 🔄 Resume - Continuing from previous session
6. ➕ Feature - Adding to existing project
7. 🚀 Release - Publishing/deploying

Enter number (or 'all' for full details):
```

Based on their choice, provide detailed guidance for that specific stage.

---

## Quick Reference Card

Always include this at the end:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WORKFLOW QUICK REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stage              Command             When
──────────────────────────────────────────────
Exploration        /explore-idea       New project idea
Planning           /plan-project       Structure project
Feature Add        /plan-feature       Add to existing
Checkpoint         /wrap-session       Save progress
Resume             /continue-session   Load context
Release            /release           Before publish
Guide              /workflow          Show this guide

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Time Savings: 35-55 minutes per project lifecycle

For detailed docs: https://github.com/jezweb/claude-skills/tree/main/skills/project-workflow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Examples

### Example 1: User types /workflow with no context

**Your Response:**
```
# 🧭 Project Workflow Guide

Projects follow a 7-stage lifecycle that saves 35-55 minutes through automation.

┌─────────────────────────────────────────────────────┐
│  EXPLORATION → PLANNING → EXECUTION → WRAP          │
│       ↓           ↓           ↓          ↓          │
│  /explore-   /plan-      (work in    /wrap-        │
│    idea      project      phases)    session       │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  RESUME → FEATURE → RELEASE                         │
│    ↓        ↓         ↓                             │
│  /continue- /plan-   /release                       │
│   session   feature                                 │
└─────────────────────────────────────────────────────┘

📋 Current Project State
========================
No SESSION.md found - not using workflow system yet.

Available Commands:
-------------------

🔍 /explore-idea     - Validate project ideas (10-15 min saved)
📐 /plan-project     - Generate phases (8-12 min saved)
➕ /plan-feature     - Add to existing project (5-8 min saved)
💾 /wrap-session     - Checkpoint progress (15-25 min saved)
🔄 /continue-session - Resume from checkpoint (8-12 min saved)
🚀 /release          - Safety checks (10-20 min saved)

Which stage are you in? (1-7 or 'all'):
```

### Example 2: User types /workflow during active work

**Your Response:**
```
# 🧭 Project Workflow Guide

📋 Current Project State
========================
Project: Flow Orchestrator v9
Current Phase: Phase 12 - Workflow Integration
Stage: Implementation
Context: 58% full (116k tokens)

Progress:
✅ Create workflow orchestration rules
✅ Update skill routing
✅ Add command metadata
🔄 Create /workflow command ← YOU ARE HERE
⏸️ Build and test
⏸️ Update documentation

⚠️ Context Notice: 58% full. Consider /wrap-session after this phase.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RELEVANT COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 /wrap-session     - Checkpoint after phase complete
🔄 /continue-session - Resume in next session
➕ /plan-feature     - Add more workflow features

Continue working or need guidance? (Enter 'continue' or stage number):
```

---

## Success Criteria

✅ User understands the 7-stage lifecycle
✅ User knows which command to use when
✅ Context-aware recommendations provided
✅ Quick reference always shown
✅ Interactive and helpful, not overwhelming
