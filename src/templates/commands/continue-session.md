---
description: Resume work from SESSION.md after context clear
argument-hint: none
workflow-stage: execution
part-of: project-workflow lifecycle
---

# Continue Session

Quickly resume work by loading context from SESSION.md, showing current state, and continuing from "Next Action".

---

## Your Task

Follow these steps to load session context and resume work efficiently.

### Step 1: Load Session Context

**Read SESSION.md** from project root.

Extract:
- Current phase number and name
- Current stage (Implementation/Verification/Debugging)
- Last checkpoint hash and date
- Next Action (file + line + what to do)
- Known issues
- Progress (completed and pending tasks)
- Planning docs mentioned

**If SESSION.md doesn't exist**:
- Output: "❌ No SESSION.md found. Is this a new project?"
- Suggest: "Run project-planning to set up session management."
- Stop here

**If IMPLEMENTATION_PHASES.md mentioned**:
- Read relevant section for current phase
- Extract verification criteria for current phase
- Note: If file doesn't exist, continue with SESSION.md only

### Step 2: Check Git Status

Run `git status` to check for uncommitted changes.

**If uncommitted changes exist**:
```
⚠️ WARNING: Uncommitted changes detected!

Uncommitted files:
[list files from git status]

These changes weren't checkpointed. Continue anyway? (y/n)
```

**If user says no**:
- Output: "Stopping. Run /wrap-session to checkpoint changes first."
- Stop here

**If user says yes**:
- Output: "⚠️ Proceeding with uncommitted changes. Remember to checkpoint later."
- Continue

### Step 3: Show Recent Git History

Run `git log --oneline -5` for context.

Output:
```
📜 Recent Commits (last 5):

[hash] [commit message line 1]
[hash] [commit message line 1]
[hash] [commit message line 1]
[hash] [commit message line 1]
[hash] [commit message line 1]

Current checkpoint: [hash from SESSION.md] ([date])
```

### Step 4: Display Session Summary

Format and output comprehensive session state:

```
═══════════════════════════════════════════════
   WELCOME BACK TO [PROJECT NAME]
═══════════════════════════════════════════════

📋 Current Phase: Phase [N] - [Phase Name] ([Status emoji])
📍 Current Stage: [Implementation/Verification/Debugging]
💾 Last Checkpoint: [hash] ([date])

───────────────────────────────────────────────
PROGRESS THIS PHASE:
───────────────────────────────────────────────

✅ [completed task]
✅ [completed task]
✅ [completed task]
🔄 [current pending task] ← CURRENT
⏸️ [future pending task]
⏸️ [future pending task]

───────────────────────────────────────────────
KNOWN ISSUES:
───────────────────────────────────────────────

• [issue 1]
• [issue 2]
[or "None" if no issues]

───────────────────────────────────────────────
NEXT ACTION:
───────────────────────────────────────────────

[Concrete next action from SESSION.md]
File: [file path]
Line: [line number] (if applicable)
Task: [specific action to take]

───────────────────────────────────────────────
PLANNING DOCS AVAILABLE:
───────────────────────────────────────────────

✅ SESSION.md (loaded)
✅ IMPLEMENTATION_PHASES.md (current phase loaded)
• [other docs from SESSION.md] (available)

═══════════════════════════════════════════════
```

### Step 5: Stage-Specific Context

**If current stage is "Verification"**:
- Read verification criteria from IMPLEMENTATION_PHASES.md
- Output checklist:
  ```
  ───────────────────────────────────────────────
  VERIFICATION CHECKLIST (Current Phase):
  ───────────────────────────────────────────────

  [ ] [verification item 1]
  [ ] [verification item 2]
  [ ] [verification item 3]

  Check these items before marking phase complete.
  ───────────────────────────────────────────────
  ```

**If current stage is "Debugging"**:
- Emphasize known issues
- Output:
  ```
  🐛 Currently debugging. Focus on resolving known issues above.
  ```

**If current stage is "Implementation"**:
- No special output (normal flow)

### Step 6: Offer to Load Planning Docs

Check if SESSION.md references other planning docs (ARCHITECTURE.md, API_ENDPOINTS.md, DATABASE_SCHEMA.md, etc.)

If any referenced:
```
Additional planning docs available:
• ARCHITECTURE.md
• API_ENDPOINTS.md
• [others...]

Would you like me to load any of these? (Enter doc names or 'none'):
```

**If user specifies docs**:
- Read the specified docs
- Output: "✅ Loaded [doc list]"

**If user says "none"**:
- Output: "Continuing with loaded context only."

### Step 7: Offer to Open Next Action File

Extract file path from "Next Action".

Ask user:
```
Next Action file: [file path]

Would you like me to open this file? (y/n)
```

**If yes**:
- Use Read tool to open the file
- If line number specified, focus on that area (use offset/limit)
- Output: "✅ Opened [file] at line [line]"

**If no**:
- Output: "File not opened. You can request it when ready."

### Step 8: Offer to Proceed

Ask user:
```
Ready to proceed with Next Action?

Next Action: [action description]

Options:
1. Yes - proceed with this action
2. No - I'll tell you what to do instead
3. Context only - just keep loaded context, don't execute yet

Your choice (1/2/3):
```

**If choice 1 (Yes)**:
- Output: "Proceeding with: [Next Action]"
- Begin executing the Next Action
- Use appropriate tools (Edit, Write, Bash, etc.)

**If choice 2 (No)**:
- Output: "What would you like to do instead?"
- Wait for user to specify new direction

**If choice 3 (Context only)**:
- Output: "Context loaded. Ready when you are."
- Wait for user instructions

### Step 9: Confirm Success

Output:
```
✨ Session resumed successfully!

Current context loaded:
• Phase [N] progress
• Next Action ready
• [X] planning docs loaded

Ready to continue work.
```

---

## Error Handling

**SESSION.md doesn't exist**:
- Output: "❌ No SESSION.md found. Is this a new project?"
- Suggest: "Create SESSION.md manually or run project-planning."
- Stop

**IMPLEMENTATION_PHASES.md missing**:
- Warning only, continue with SESSION.md
- Output: "⚠️ IMPLEMENTATION_PHASES.md not found. Limited context available."

**Next Action is vague or missing**:
- Output: "⚠️ Next Action is unclear or missing in SESSION.md."
- Output: "Please update SESSION.md with specific: [file] + [line] + [action]"
- Offer to help: "Would you like me to help you define the Next Action? (y/n)"

**File from Next Action doesn't exist**:
- Output: "⚠️ File [path] from Next Action not found."
- Ask: "Has it been moved or renamed? Should I search for it? (y/n)"

**Git commands fail**:
- Output: "⚠️ Git history unavailable. Continuing without it."
- Show SESSION.md context only

---

## Best Practices

### DO

✅ **Load SESSION.md first** (source of truth for current state)
✅ **Show complete progress** (what's done, what's next)
✅ **Check git status** (warn about uncommitted changes)
✅ **Load relevant planning docs** (IMPLEMENTATION_PHASES for current phase)
✅ **Make Next Action visible** (file + line + task)
✅ **Offer to open file** (saves user a step)

### DON'T

❌ **Don't skip git status check** (uncommitted changes cause confusion)
❌ **Don't proceed without Next Action** (need clear starting point)
❌ **Don't load all planning docs** (only what's needed)
❌ **Don't assume Next Action is clear** (verify it's specific)
❌ **Don't start work without user confirmation** (present context first)

---

## Quick Reference

**Typical workflow**:
1. Read SESSION.md → extract state
2. Check git status → warn if uncommitted
3. Show recent commits → provide context
4. Display session summary → full state visible
5. Offer to load docs → get additional context
6. Offer to open file → prepare for work
7. Offer to proceed → start or wait

**Next Action format expected**:
- "Do [specific task] in [file]:[line]"
- Must be actionable

**Stage-specific actions**:
- Implementation: Continue building
- Verification: Check verification criteria
- Debugging: Focus on known issues

---

*This command is part of Flow Orchestrator v9.0.0 - Use /wrap-session before ending your session*
