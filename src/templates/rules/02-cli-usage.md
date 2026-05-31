# Flow Orchestrator CLI Usage

> Command-line tool for using reusable coding skills inside Roo Code and Kilo Code

Available commands: `list`, `read`, `search`, `generate-index`, `sync-index`, `init`

---

## Prerequisites

Before using CLI commands, verify installation:

```bash
# Check if flow-orchestrator is installed
which flow-orchestrator

# If not installed, inform user to install
npm install -g flow-orchestrator
```

**Skills directory locations:**
- Default: `~/.claude/skills/`
- Custom: Use `--source <path>` flag with any command

---

## Command Reference

### list - Show All Available Skills

**Purpose**: Display all skills from skills directory with descriptions and keywords

**Syntax**:
```bash
flow-orch list
flow-orch list --verbose
flow-orch list --source ~/custom/skills
```

**Options**:
- `--verbose, -v` - Show full descriptions and details
- `--source <path>, -s` - Use custom skills directory

**Output Format**:
```
📚 Available Skills (62)
Source: /home/user/.claude/skills

  skill-name
    Brief description...
    Keywords: keyword1, keyword2, keyword3
    📄 N template files
```

**Use When**: User asks "what skills are available" or before starting implementation

---

### read - Output Skill Content

**Purpose**: Read and output full SKILL.md content for a specific skill

**Syntax**:
```bash
flow-orch read <skill-name>
flow-orch read "Cloudflare D1 Database"
flow-orch read cloudflare-d1 --raw
```

**Options**:
- `--raw, -r` - Output plain markdown without formatting (for piping)
- `--source <path>, -s` - Use custom skills directory

**Output Format** (default):
```
📄 Skill Name
Path: /path/to/SKILL.md
─────────────────────────────────────────────

[Full SKILL.md markdown content]

─────────────────────────────────────────────
Keywords: keyword1, keyword2
Templates: N files
```

**Output Format** (--raw):
```
[Raw SKILL.md markdown content only]
```

**Fuzzy Matching**: Supports case-insensitive partial matching
- "cloudflare d1" matches "Cloudflare D1 Database"
- "tailwind" matches "Tailwind v4 + shadcn/ui Stack"

**Use When**: After identifying relevant skill from index or search results

---

### search - Find Skills by Keyword

**Purpose**: Search skills by keyword across name, description, and keywords fields

**Syntax**:
```bash
flow-orch search <keyword>
flow-orch search database
flow-orch search "cloudflare workers"
flow-orch search ai --verbose
```

**Options**:
- `--verbose, -v` - Show full descriptions
- `--source <path>, -s` - Use custom skills directory

**Output Format**:
```
🔍 Search Results for "keyword" (N)
Source: /home/user/.claude/skills

  skill-name
    Description...
    Keywords: matching, keywords, highlighted
```

**Scoring Algorithm**: Results sorted by relevance
- Exact name match: highest priority
- Keyword field match: high priority
- Description match: medium priority
- Fuzzy match: low priority

**Use When**: User mentions technology name or need (e.g., "database", "auth", "AI")

---

### generate-index - Create Skills Index

**Purpose**: Generate categorized markdown index of all skills for custom instructions

**Syntax**:
```bash
flow-orch generate-index
flow-orch generate-index --output custom/path.md
flow-orch generate-index --source ~/custom/skills
```

**Options**:
- `--output <path>, -o` - Custom output path (default: `.roo/rules/01-skills-index.md`)
- `--source <path>, -s` - Use custom skills directory

**Output**:
- Creates `.roo/rules/01-skills-index.md` (299 lines)
- Categorizes skills into 7 groups (AI, Cloudflare, Frontend, etc.)
- Includes usage instructions section
- Creates `.roo/rules/` directory if missing

**Use When**:
- Initial project setup
- After adding/removing skills from ~/.claude/skills/
- Manually (typically done once, then use sync-index)

---

### sync-index - Update Existing Index

**Purpose**: Regenerate skills index to reflect current skills directory state

**Syntax**:
```bash
flow-orch sync-index
flow-orch sync-index --output custom/path.md
```

**Options**:
- `--output <path>, -o` - Custom output path (default: `.roo/rules/01-skills-index.md`)
- `--source <path>, -s` - Use custom skills directory

**Output**: Overwrites existing index file with fresh content

**Use When**:
- Skills added/removed/updated in ~/.claude/skills/
- After git pull of skills repository
- Periodic refresh (weekly/monthly)

**Difference from generate-index**: None functionally - sync-index is an alias for clarity

---

### init - Initialize Flow Orchestrator

**Purpose**: Set up Flow Orchestrator system in current project

**Syntax**:
```bash
flow-orch init
```

**Output**: Creates complete `.roo/` structure:
```
.roo/
  rules/
    01-skills-index.md
    02-cli-usage.md (this file)
    03-skill-patterns.md
  rules-flow-orchestrator/
    00-core-identity.md
    01-orchestration.md
    02-skill-routing.md
  commands/
    [slash command files]
.roomodes (Flow Orchestrator mode definition)
```

**Use When**: First-time setup in new project

**Note**: Available in Phase 9 (not yet implemented in Phase 5)

---

## Global Flags

All commands support these flags:

- `--source <path>, -s` - Use custom skills directory instead of `~/.claude/skills/`
- `--verbose, -v` - Show detailed output (list and search commands)
- `--raw, -r` - Output plain markdown (read command only)
- `--output <path>, -o` - Custom output path (generate-index and sync-index)

---

## Troubleshooting

### Skills Directory Not Found

**Error**: `Skills directory ~/.claude/skills/ does not exist`

**Solutions**:
1. Install Claude Code (creates directory automatically)
2. Clone skills repository:
   ```bash
   git clone https://github.com/jezweb/claude-skills ~/.claude/skills
   ```
3. Use `--source` flag to point to custom location:
   ```bash
   flow-orch list --source /path/to/skills
   ```

### Skill Not Found

**Error**: `Skill not found: skill-name`

**Solutions**:
1. Check exact name in skills index:
   ```bash
   cat .roo/rules/01-skills-index.md | grep -i "skill-name"
   ```
2. Use fuzzy search:
   ```bash
   flow-orch search skill-name
   ```
3. List all available skills:
   ```bash
   flow-orch list
   ```

CLI supports case-insensitive fuzzy matching, but exact names work best.

### Command Not Found

**Error**: `flow-orchestrator: command not found`

**Solutions**:
1. Install globally:
   ```bash
   npm install -g flow-orchestrator
   ```
2. Use npx (no installation needed):
   ```bash
   npx flow-orchestrator list
   ```
3. Check installation:
   ```bash
   which flow-orchestrator
   npm list -g flow-orchestrator
   ```

### Empty Output

**Possible causes**:
- Skills directory is empty (no SKILL.md files found)
- Skills have malformed YAML frontmatter (check logs)
- Using wrong skills directory path

**Debug**:
```bash
# Check skills directory contents
ls -la ~/.claude/skills/

# Verify skills have SKILL.md files
find ~/.claude/skills/ -name "SKILL.md"
```

---

## Integration Workflow

Typical workflow for using flow-orchestrator CLI:

1. **Check skills index**: Read `.roo/rules/01-skills-index.md`
2. **Identify relevant skill**: Match user request to skill keywords
3. **Load skill**: Run `flow-orch read <skill-name>`
4. **Parse output**: Full SKILL.md content appears in stdout
5. **Apply knowledge**: Use patterns, templates, gotchas in implementation

**Example**:
```
User: "Set up Cloudflare D1 database"

1. Check index: Find "Cloudflare D1 Database" skill
2. Match keywords: "d1", "database", "cloudflare", "sql"
3. Load: `flow-orch read "Cloudflare D1 Database"`
4. Parse: Read wrangler.toml binding syntax, migration patterns, Drizzle integration
5. Apply: Use proven patterns instead of trial-and-error
```

---

## Command Output Handling

All commands output to stdout, suitable for:
- Direct reading by AI agents
- Piping to other tools: `flow-orch read cloudflare-d1 | grep "wrangler"`
- Saving to files: `flow-orch list > skills-list.txt`

**Output formatting**:
- Default: Colored, formatted for terminal display
- `--raw` flag: Plain markdown without ANSI codes (for parsing)

---

*This file is part of Flow Orchestrator v9.0.0 - See .roo/rules/03-skill-patterns.md for when to use skills*
