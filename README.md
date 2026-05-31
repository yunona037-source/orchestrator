# Flow Orchestrator

Flow Orchestrator is a helper for your AI coding assistant. It teaches your assistant to use ready-made guides called skills. A skill is a short, tested recipe for one coding job. You keep these recipes in one place and reuse them.

This project is a fork. A fork is a fresh copy of an older project that goes its own way. We renamed it and gave it a cleaner job. The older project linked coding guides to an AI editor tool. Flow Orchestrator keeps that idea and makes it simpler to use.

The goal is plain and small. Your assistant should check for a known recipe before it guesses. Good recipes save time, money, and mistakes. That is the whole point.

## What It Does

Flow Orchestrator makes your AI coding assistant "skill-aware". Skill-aware means it knows which recipes exist and when to use them.

Here is what it gives you, in plain words:

- Finds the right recipe. Before writing code, it checks if a matching skill exists.
- Lets you browse recipes. You can list, search, and read skills from the command line.
- Adds a planning mode. A mode is a way your assistant behaves. This mode plans work and hands jobs to other modes.
- Tracks your progress. It saves where you stopped so you can pick up later.

A command line is a text window where you type commands instead of clicking buttons. Do not worry if it feels new. The steps below tell you exactly what to type.

## Who It's For

This tool is for people who code with an AI assistant and want better results.

You will like Flow Orchestrator if:

- You use Roo Code or Kilo Code, two AI coding helpers for the VS Code editor, and want them to follow proven patterns.
- You are new to AI coding and want safe, tested guidance instead of random answers.
- You build apps and reuse the same setups, like a database or a login screen.
- You want your assistant to plan first and then do the work in small, clear steps.

You do not need to be an expert. If you can open a terminal and copy a command, you can use this.

## How To Start

Getting started takes two short stages. First you install the tool. Then you run it the first time. Follow the numbered steps in order.

### Install The Tool

1. Open a terminal. A terminal is the text window where you type commands.
2. Type `npm install -g flow-orchestrator` and press Enter. This installs the tool for every project.
3. Wait until the install finishes and the terminal is ready again.
4. Type `flow-orch list` and press Enter to check that it works.

### Run It The First Time

1. Open the folder of the project you want to work on.
2. Type `flow-orch init` and press Enter. This sets up the tool inside your editor.
3. Reload your editor window so it can see the new mode.
4. Pick the `flow-orchestrator` mode in your editor and ask it for help.

That is it. Your assistant can now find and use skills while it helps you build.

## Commands You Can Use

These are the main commands. Run them in your terminal after the install.

```bash
flow-orch list              # Show all the skills you have
flow-orch search ai         # Find skills by a keyword
flow-orch read "skill-name" # Print one skill so you can read it
flow-orch generate-index    # Build a list of all skills
flow-orch init              # Set up Flow Orchestrator in a project
```

Each command does one small job. You can mix and match them as you work.

## What Are Skills

A skill is a small guide that solves one coding task the right way. Think of it like a recipe card for cooking. It has tested steps, common mistakes to avoid, and short notes. Using a skill is faster and safer than searching the web and guessing.

Flow Orchestrator ships with many skills for popular tools. They cover areas like AI models, cloud services, web front ends, and logins. You can also point the tool at your own folder of skills.

## Where To Learn More

- [Architecture](docs/ARCHITECTURE.md) explains how the parts fit together.
- [Implementation Phases](docs/IMPLEMENTATION_PHASES.md) shows the build plan.
- [Project Brief](docs/PROJECT_BRIEF.md) gives the short story of the project.
- [Changelog](CHANGELOG.md) lists what changed in each version.

## License

MIT

---

<sub>A fork of [@jezweb/roo-commander](https://github.com/jezweb/roo-commander).</sub>
