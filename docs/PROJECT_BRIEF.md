# Flow Orchestrator v9: Project Brief

**Project Name**: Flow Orchestrator v9 - Claude Skills Bridge
**Repository**: https://github.com/yunona037-source/orchestrator (v9 branch)
**Target Audience**: Roo Code VS Code extension users
**Project Type**: CLI Tool + Custom Mode + Marketplace Package
**Timeline**: 28-36 hours (~28-36 minutes human time)

---

## Executive Summary

Flow Orchestrator v9 is a complete rebuild that solves the "skills for Roo Code" problem identified by the community. It brings Claude Code's 68 production-tested skills to Roo Code users through a lightweight CLI tool, intelligent orchestrator mode, and shared knowledge system.

**Core Innovation**: Instead of converting skills to modes (complex handoffs), Flow Orchestrator teaches ALL Roo modes how to dynamically load skill knowledge via CLI, then delegates work to appropriate built-in modes (Code, Architect, Debug).

---

## Problem Statement

### Original Challenge (6 months ago)
Flow Orchestrator v8.1 was attempting to build a "dense knowledge base" system but struggled with:
- How to structure reusable knowledge
- Token efficiency in multi-agent orchestration
- Complex handoff rules between modes
- Maintenance overhead

### Community Need (21 days ago)
Reddit post on r/RooCode asked: "Has anyone set up a 'Claude Skills' like system for Roo Code?"
- Community wants Claude Code's skill system
- No comprehensive solution exists yet
- Manual workarounds only ("ghetto MCP")
- Token efficiency is a key concern

### The Insight
**Claude Code skills ARE the dense knowledge base we were seeking.** We've built 68 production-tested skills with:
- Evidence-based documentation
- Known issues prevented
- Token efficiency metrics (60-87% savings)
- Proven patterns and templates

**New approach**: Don't recreate the wheel. Build a bridge.

---

## Solution Architecture

### Three-Part System

#### 1. CLI Tool (`flow-orchestrator`)
**Purpose**: Read skills from `~/.claude/skills/` and make them accessible to Roo Code

**Commands**:
- `flow-orch list` - Show all 68 skills with descriptions
- `flow-orch read <skill>` - Output skill content to stdout
- `flow-orch search <keyword>` - Find skills by keyword
- `flow-orch generate-index` - Create skills index for custom instructions
- `flow-orch init` - Set up complete Flow Orchestrator system
- `flow-orch sync-index` - Update skills index after changes

**Tech Stack**: TypeScript, Commander.js, Node.js

#### 2. Custom Instructions (`.roo/rules/`)
**Purpose**: Teach ALL Roo modes about skills system (shared knowledge)

**Files**:
- `01-skills-index.md` - Auto-generated list of 68 skills with keywords (ALL modes see this)
- `02-cli-usage.md` - How to use flow-orchestrator CLI
- `03-skill-patterns.md` - When to check skills before implementing

**Key Insight**: Custom instructions load into ALL modes automatically, so Code/Architect/Debug modes inherit skill awareness.

#### 3. Flow Orchestrator Mode (`.roomodes` + `.roo/rules-flow-orchestrator/`)
**Purpose**: Lightweight orchestrator that analyzes requests and delegates to built-in modes

**Responsibilities**:
- Analyze user request for keywords
- Match keywords to skills (via skills index)
- Delegate to appropriate mode (Code/Architect/Debug) with instructions to load skill
- Track progress and coordinate multi-skill workflows
- Stay lightweight (workflow tools only, no execution)

**Mode Config**:
- Tool groups: `workflow` only (new_task, switch_mode, attempt_completion)
- No read/edit/command access (forces delegation to execution modes)

---

## Key Design Decisions

### Why CLI Instead of MCP?
**Decision**: Use CLI tool, not MCP server
**Rationale**:
- Simpler architecture (no background process)
- Explicit control (sync when needed)
- Easier debugging (just files)
- Lighter weight (no server overhead)
- Manual sync acceptable (skills don't change every session)

### Why Not Convert Skills to Modes?
**Decision**: Keep skills in Claude Code format, load dynamically
**Rationale**:
- No complex mode handoff rules
- Single source of truth (no duplication)
- All modes can access skills (via CLI)
- No maintenance burden (68 mode files to maintain)
- Context stays in proper execution modes

### Why Global Rules for Skills Index?
**Decision**: Put skills index in `.roo/rules/` not `.roo/rules-flow-orchestrator/`
**Rationale**:
- ALL modes need skill awareness (not just Flow Orchestrator)
- User might be in Code mode and want to check skills
- Shared knowledge reduces duplication
- Easier to keep in sync (one file)

### Why Port Slash Commands?
**Decision**: Include session management + planning commands
**Rationale**:
- Proven workflows from Claude Code
- Reduces learning curve for Claude Code users
- Enables hybrid Claude Code → Roo Code workflows
- Commands provide structure even without automation

---

## User Workflows

### Workflow 1: New Roo Code User Discovers Skills

```
1. User installs CLI: npm install -g flow-orchestrator
2. User installs Flow Orchestrator from marketplace (one-click)
3. User runs in project: flow-orch init
4. System generates:
   - .roo/rules/01-skills-index.md (68 skills)
   - .roo/rules/02-cli-usage.md
   - .roo/rules/03-skill-patterns.md
   - .roo/rules-flow-orchestrator/ (mode rules)
   - .roomodes entry
   - .roo/commands/ (9 slash commands)
5. User asks Flow Orchestrator: "Set up Cloudflare D1"
6. Flow Orchestrator:
   - Checks skills index → finds cloudflare-d1
   - Delegates to Code mode with message:
     "Load skill: flow-orch read cloudflare-d1, then implement D1 setup"
7. Code mode:
   - Runs CLI command
   - Loads skill knowledge
   - Implements with proven patterns
8. User gets production-tested setup (no trial and error)
```

### Workflow 2: Claude Code User Migrates to Roo Code

```
1. User already has ~/.claude/skills/ (68 skills)
2. User already knows /plan-project, /wrap-session workflows
3. Installs Flow Orchestrator
4. Runs: flow-orch init
5. System detects existing skills, uses them
6. Slash commands work similarly (but as instruction templates)
7. Shared conventions: SESSION.md, IMPLEMENTATION_PHASES.md work across both tools
8. Hybrid workflow:
   - Use Claude Code for heavy planning (/plan-project with automation)
   - Switch to Flow Orchestrator for execution (VS Code integration)
   - Both reference same planning docs
```

### Workflow 3: Power User with Custom Skills

```
1. User has custom skills in ~/.claude/skills/my-custom-skill/
2. User runs: flow-orch sync-index
3. Skills index updates to include custom skill
4. All Roo modes can now access custom skill
5. Flow Orchestrator routes to it based on keywords
```

---

## Slash Commands: Adaptation Strategy

### Direct Ports (Minimal Changes)

**`/wrap-session`**:
- Remove: Skill invocations (TodoWrite)
- Keep: SESSION.md update instructions, git checkpoint flow
- Add: Frontmatter (description, argument-hint)
- Result: Manual SESSION.md management with structured guidance

**`/continue-session`**:
- Remove: None (pure instruction set)
- Keep: Read SESSION.md → resume from "Next Action"
- Add: Frontmatter
- Result: Direct port, works identically

**`/list-skills`**:
- New command specific to Flow Orchestrator
- Instruction: Run `flow-orch list`, format output
- Simple wrapper around CLI

**`/load-skill`**:
- New command specific to Flow Orchestrator
- Instruction: Run `flow-orch read <skill>`, load into context
- Accepts skill name as parameter

### Adapted Ports (Significant Changes)

**`/plan-project`**:
- Remove: project-planning skill invocation (heavy automation)
- Keep: Question flow, planning structure
- Add: Templates for IMPLEMENTATION_PHASES.md (user fills in)
- Result: Guided planning instead of automated generation
- Note: Users may prefer Claude Code for initial planning

**`/plan-feature`**:
- Remove: Automated phase insertion
- Keep: Feature requirements gathering, phase template
- Add: Manual phase addition instructions
- Result: Structured feature planning with manual integration

**`/explore-idea`**:
- Remove: Explore subagent, AskUserQuestion automation
- Keep: Research questions, validation framework
- Add: Manual research checklist
- Result: Guided exploration instead of automated research

**`/github-release`**:
- Keep: Checklist flow (tag, release notes, publish)
- Minimal changes (already instruction-based)
- Result: Near-identical to Claude Code version

**`/release`**:
- Keep: General release checklist
- Minimal changes
- Result: Near-identical to Claude Code version

---

## Technical Specifications

### CLI Tool Architecture

**Package**: `flow-orchestrator`
**Language**: TypeScript
**Build**: TSC to CommonJS
**Distribution**: npm (global install)

**Project Structure**:
```
flow-orchestrator/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/
│   │   ├── list.ts           # List skills
│   │   ├── read.ts           # Read skill content
│   │   ├── search.ts         # Search skills
│   │   ├── generate-index.ts # Generate skills index
│   │   ├── init.ts           # Initialize Flow Orchestrator
│   │   └── sync-index.ts     # Update skills index
│   ├── parser/
│   │   ├── skill-parser.ts   # Parse SKILL.md files
│   │   └── types.ts          # TypeScript interfaces
│   └── templates/
│       ├── rules/            # Custom instructions templates
│       ├── rules-flow-orchestrator/  # Mode-specific rules
│       ├── commands/         # Slash commands
│       └── roomodes.yaml     # Mode configuration
├── package.json
├── tsconfig.json
└── README.md
```

**Dependencies**:
- `commander` - CLI framework
- `yaml` - YAML parsing
- `gray-matter` - Frontmatter extraction
- `chalk` - Terminal colors
- `ora` - Progress spinners
- `fs-extra` - File system utilities

### Custom Instructions Format

**Location**: `.roo/rules/`
**Format**: Markdown with H1/H2 structure
**Naming**: Numbered prefixes (01-, 02-, 03-) for load order

**Skills Index Structure**:
```markdown
# Flow Orchestrator Skills Index

## AI & LLM Integration (8 skills)
- **claude-api**: Claude API integration patterns [Keywords: claude, anthropic, api]
- **openai-api**: OpenAI API integration patterns [Keywords: openai, gpt, api]
[...]

## Cloudflare Platform (15 skills)
- **cloudflare-worker-base**: Base Worker setup [Keywords: cloudflare, workers, vite]
[...]

## Usage
To load a skill: run `/load-skill <skill-name>` or `flow-orch read <skill-name>`
To list all skills: run `/list-skills` or `flow-orch list`
```

### Mode Configuration

**File**: `.roomodes`
**Format**: YAML

```yaml
customModes:
  - slug: flow-orchestrator
    name: 🪃 Flow Orchestrator
    description: Intelligent orchestrator that routes tasks to specialized modes with skill knowledge
    roleDefinition: |
      You are Flow Orchestrator, a strategic orchestrator for complex development tasks.
      Your primary role is to analyze requests, identify relevant skills, and delegate
      to appropriate execution modes (Code, Architect, Debug) with skill knowledge.

      You do NOT implement code yourself. You coordinate.
    whenToUse: Use for complex projects requiring multiple skills or coordination across modes
    groups:
      - workflow
    customInstructions: |
      Before delegating:
      1. Check .roo/rules/01-skills-index.md for relevant skills
      2. Include skill loading instructions in delegation message
      3. Specify clear deliverables and success criteria
```

---

## Success Metrics

### Technical Metrics
- ✅ All 68 skills readable via CLI
- ✅ Skills index auto-generates accurately
- ✅ Init command creates complete setup (< 30 seconds)
- ✅ All 9 slash commands functional
- ✅ Flow Orchestrator mode delegates correctly
- ✅ Zero handoff errors or context loss

### Community Metrics
- ✅ Marketplace submission accepted
- ✅ Reddit post gets positive engagement (> 10 upvotes)
- ✅ At least 3 users report successful setup
- ✅ No critical bugs in first week
- ✅ GitHub stars (target: 20+)

### User Experience Metrics
- ✅ Installation takes < 5 minutes
- ✅ Users can find relevant skills easily
- ✅ Skill loading workflow is intuitive
- ✅ Documentation is clear and complete
- ✅ Hybrid Claude Code + Roo Code workflow works seamlessly

---

## Risks & Mitigations

### Risk 1: Skills Directory Not Found
**Impact**: CLI can't find skills, user experience broken
**Mitigation**:
- Detect missing directory during init
- Offer to clone github.com/jezweb/claude-skills
- Provide clear error messages with resolution steps

### Risk 2: Marketplace Submission Rejected
**Impact**: Harder distribution, lower adoption
**Mitigation**:
- Follow marketplace guidelines exactly
- Test export/import flow thoroughly
- Have GitHub distribution as backup
- Engage with Roo Code maintainers early

### Risk 3: CLI Installation Friction
**Impact**: Users abandon before trying
**Mitigation**:
- Clear installation instructions
- Support npx (no install): `npx flow-orchestrator`
- Video walkthrough
- One-command setup: `npx flow-orchestrator init`

### Risk 4: Slash Commands Feel Broken
**Impact**: Users expect automation, get manual instructions
**Mitigation**:
- Clear documentation: "Instruction templates, not automation"
- Set expectations in README
- Highlight benefits (structure, proven workflows)
- Link to Claude Code for heavy automation needs

### Risk 5: Skills Index Gets Out of Sync
**Impact**: Outdated skill list, user confusion
**Mitigation**:
- `sync-index` command easy to run
- Git tracks changes (team visibility)
- Warning if skills modified > 7 days ago
- Optional: Auto-sync on init

---

## Out of Scope (Future Versions)

### MCP Server Version
- Real-time skill discovery (no manual sync)
- More complex architecture
- Consider for v10 if demand exists

### Skill Conversion to Modes
- Full mode generation per skill
- Complex handoff rules
- Decided against for v9 (too complex)

### Automated Planning
- Keep heavy automation in Claude Code
- Flow Orchestrator focuses on execution
- Hybrid workflow is the solution

### Custom Skill Creation UI
- In-app skill editor/generator
- Nice-to-have but not essential
- Users can create skills in Claude Code format

---

## Dependencies & Prerequisites

### For CLI Development
- Node.js >= 18
- TypeScript
- npm/pnpm

### For Users
- Roo Code VS Code extension installed
- Node.js >= 18 (for CLI)
- Git (for skill cloning fallback)
- Optional: Existing `~/.claude/skills/` directory

### External Services
- npm registry (for package distribution)
- GitHub (for skill repository)
- Roo Code marketplace (for mode distribution)

---

## Timeline & Milestones

### Week 1: Core CLI (Phases 1-2)
- Basic commands functional
- Skill parser working
- Index generation working

### Week 2: Templates & Mode (Phases 3-4)
- Custom instructions templates
- Flow Orchestrator mode complete
- Orchestration patterns defined

### Week 3: Slash Commands (Phases 5-7)
- All 9 commands ported/adapted
- Testing with real workflows
- Refinement based on testing

### Week 4: Integration & Release (Phases 8-11)
- Init command complete
- Documentation complete
- Marketplace submission
- Community launch

**Total**: 4 weeks at ~1 hour/day = 28 hours
**Human time with Claude Code**: ~28 minutes of active supervision

---

## Next Steps

1. ✅ Create PROJECT_BRIEF.md (this document)
2. ⏭️ Generate IMPLEMENTATION_PHASES.md from project-planning skill
3. ⏭️ Create SESSION.md to track progress
4. ⏭️ Start Phase 1: CLI Tool - Core Commands

---

## References

- Reddit discussion: https://www.reddit.com/r/RooCode/comments/1o9kxr2/skills_for_roo_code/
- Flow Orchestrator v8.1: https://github.com/yunona037-source/orchestrator/tree/v8.1
- Claude Skills repository: https://github.com/jezweb/claude-skills
- Roo Code documentation: https://docs.roocode.com
- Claude Code skills (local): ~/.claude/skills/

---

**Document Version**: 1.0
**Last Updated**: 2025-11-08
**Status**: Ready for Implementation Planning
