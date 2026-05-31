---
inclusion: always
---

<!--
==============================================================================
 AGENTS.template.md — Stack-agnostic engineering-OS template
==============================================================================
HOW TO USE
1. Copy this file to `AGENTS.md` in the target repo root.
2. Fill every `{{PLACEHOLDER}}` in the `## Template Configuration` block below.
3. Replace each `{{PLACEHOLDER}}` reference inside the OS body with the value
   you defined (or keep them and resolve via a generator).
4. Delete this HTML comment header and the `## Template Configuration` block
   after substitution, or keep the config block as a project reference.

PRINCIPLE
- Sections that describe *engineering discipline* (control loop, semantic
  graph, restore/gate/validate/closure) are stack-agnostic — keep verbatim.
- Sections that describe *this stack/this product* are parameterized.
- Soft wording never weakens a stronger rule. Every placeholder must resolve to
  concrete, project-true values before the OS is considered loadable.
==============================================================================
-->

## Template Configuration

Fill these before using the file as a real `AGENTS.md`. Each value must be
concrete repo/runtime truth, not a guess.

### Identity
- `{{OS_FILENAME}}` — name of this OS file (default: `AGENTS.md`).
- `{{PROJECT_NAME}}` — short project/platform name.
- `{{BOOTSTRAP_ACK_LINE}}` — exact literal bootstrap response line, e.g.
  `Read {{OS_FILENAME}} and understood the full engineering OS at an honest X%`.
- `{{REPLY_LANGUAGE}}` — language for finals/specs/docs (e.g. `English`, `Russian`).

### Stack & tooling
- `{{PRIMARY_LANGUAGES}}` — main implementation language(s).
- `{{BUILD_TOOLCHAIN}}` — build/test driver (e.g. `cargo`, `npm`, `gradle`, `go`).
- `{{PACKAGE_MANAGER}}` — dependency manager.
- `{{DEPENDENCY_POLICY}}` — version-pinning policy for deps.
- `{{CONFIG_FORMAT}}` — where prices/limits/config live (e.g. `.toml`, `.env`, `.yaml`).
- `{{SEARCH_TOOL}}` — fastest precise repo search (e.g. `rg`).
- `{{PATCH_TOOL}}` — manual file-edit patch tool of the environment.
- `{{DI_ACCESS_PATTERN}}` — canonical dependency/singleton access (e.g. `Repository::instance()?`).
- `{{VERSION_CONTROL_NOTE}}` — VCS reality (present/absent and forbidden commands).

### Architecture
- `{{ARCHITECTURE_INVARIANTS}}` — global invariants (e.g. one platform, one DB,
  one money center, one runtime/recovery model).
- `{{OWNER_PATHS}}` — responsibility → owner path map (core, runtime host,
  faces/adapters, domain, infra, etc.).
- `{{FACE_ADAPTER_RULE}}` — what faces/adapters may and may not own.
- `{{SHARED_CORE_RESPONSIBILITIES}}` — what the shared core exclusively owns.
- `{{RUNTIME_CONTRACT}}` — runtime/stream/reconnect/replay/recovery ownership
  (or `not applicable`).

### Protected kernel
- `{{READONLY_PATHS}}` — paths that may never change behavior/API/format.
- `{{PROTECTED_KERNEL_FILES}}` — files whose computation/mapping/API is frozen
  except architecture moves.
- `{{PROTECTED_KERNEL_DOMAIN}}` — what the protected kernel computes.

### Domain & performance
- `{{DOMAIN_ACCURACY_RULES}}` — accuracy rules for the core domain.
- `{{SPECIALIZED_STACK_RULES}}` — physics/simulation/ML/graphics/etc. rules, or `none`.
- `{{PERFORMANCE_RULES}}` — hot-path/data-structure/full-data rules.

### Language hygiene
- `{{TEST_LAYOUT}}` — where unit/integration/browser tests live.
- `{{LANGUAGE_FORBIDDEN_PATTERNS}}` — banned production constructs.
- `{{LANGUAGE_REQUIRED_PATTERNS}}` — required idioms (error handling, logging, queries).
- `{{MODULE_LAYOUT_RULES}}` — module/file layout constraints.

### Gates & commands
- `{{QUALITY_GATE_COMMAND}}` — the single authoritative final quality gate.
- `{{EDIT_TIME_CHECK_COMMANDS}}` — allowed targeted edit-time checks.
- `{{FORBIDDEN_PREGATE_COMMANDS}}` — commands forbidden before a green gate.
- `{{ARTIFACT_BUILD_COMMAND}}` — release/frontend artifact build (or `none`).
- `{{OS_GUARD_COMMAND}}` — self-check command when editing `{{OS_FILENAME}}` (or `none`).

### Docs structure
- `{{STEERING_DOCS_DIR}}` — durable canon docs dir.
- `{{STEERING_DOCS_LIST}}` — named steering docs (vision, structure, tech, product, etc.).
- `{{LIVE_DOCS_DIR}}` — current-initiative docs dir.
- `{{LIVE_DOCS_LIST}}` — live docs (tasks, design, plan).
- `{{WHOLE_SYSTEM_RESTORE_DOCS}}` — docs loaded for whole-system restore.
- `{{TRIGGERED_STEERING_MAP}}` — topic → steering doc trigger map.

### Validation
- `{{BROWSER_VALIDATION_TOOL}}` — local UI proof tool (or `none`).
- `{{VALIDATION_SURFACES}}` — local verification surfaces.
- `{{RUNTIME_STATE_BOOTSTRAP}}` — how to create/restore real runtime state.
- `{{LOCAL_DB}}` — approved local/test data store for state validation.
- `{{PROVIDER_VALIDATION_RULE}}` — when real external/provider calls are allowed.

### Sync map
- `{{SYNC_MAP}}` — truth-type → canonical doc map for source-of-truth sync.

### Mode & restore aliases
- `{{MODE_CODES}}` — implementation/answer mode codes (e.g. `ASK FIX DESIGN IMPLALL`).
- `{{FIX_ALIASES}}` — phrases that imply a fix request.
- `{{PROJECT_INIT_ALIASES}}` — phrases that trigger full project init.
- `{{WHOLE_SYSTEM_ALIASES}}` — phrases that trigger whole-system orientation.

<!-- ===================== OS BODY (templated) ===================== -->

# {{OS_FILENAME}}
Single executable engineering OS for the {{PROJECT_NAME}} repo.
Owner-controlled: execute this OS exactly; edit `{{OS_FILENAME}}` only when the newest user message explicitly requests `{{OS_FILENAME}}` changes.
For each user message I execute control state, owner-path restore, implementation, validation, truth sync, and final proof from this file.

## Bootstrap
- First repo action after session start/context loss: load full `{{OS_FILENAME}}` without truncation using bounded non-`cat` reads.
- Every user message repeats bootstrap when full `{{OS_FILENAME}}` is absent from current model context.
- Until `EOF Bootstrap Seal` is loaded, only `{{OS_FILENAME}}` reads are allowed; partial read/summary is exact blocker and repo verdict/edit/architecture answer/final/status are blocked.
- Bootstrap response after full load: `{{BOOTSTRAP_ACK_LINE}}`.
- That literal response line is not bootstrap proof and may be emitted only after the seal; if the seal is absent, `next_action = continue_bootstrap_read`.
- Bootstrap response is a gate transition, not a turn outcome, final, status, or stopping point.
- Bootstrap response is mandatory before any other repo read/search/edit/verdict, including continued restore.
- When continued restore is triggered, report the actual restore/result state in the next progress/final; do not delay the bootstrap response.
- The percent measures executable OS understanding only and is lowered only by an exact OS blocker.
- All finals/specs/docs are written in `{{REPLY_LANGUAGE}}` when possible.

## Glossary
- `affected_behavior`: `actor -> action -> owner-visible result`.
- `verdict`: repo-truth answer about correctness, cause, architecture, safety, or no-change.
- `progress note`: operational update that does not claim correctness, completion, no-change, safety, status, or closure.
- `status`: progress or closure-like summary; gated like verdict/final.
- `final`: answer that closes the current turn outcome.
- `closure/no-op claim`: claim such as done, complete, already correct, no changes needed, safe unchanged, or queue/initiative closed.
- `constraint`: newer user instruction that changes how the active outcome is completed without replacing it.
- `new initiative`: newer user request that explicitly replaces the active outcome.
- `continued restore`: loading additional required sources after bootstrap because current gates require them.

## Execution Control
- This OS is executed through a per-turn `Control State`. Rules are not advisory text; any unresolved required field blocks verdict, patch, final, or status-summary stopping.
- `Control State` fields: `os_load`, `bootstrap_response`, `mode`, `active_implall`, `requested_outcome`, `affected_behavior`, `success_criteria`, `constraints`, `stop_condition`.
- More fields: `required_sources`, `restore_state`, `project_lead_baseline`, `live_execution_state`, `owner_path`, `docs_truth`, `graph_gate`, `preflight_gates`, `design_gate`.
- More fields: `edit_phase`, `mandatory_gate`, `validation_path`, `validation_gate`, `truth_sync`, `residue`, `closure`, `live_queue`, `next_action`, `blocker`.
- Gate/status fields use explicit values: `pending`, `unknown`, `complete`, `failed`, or `blocked`; `next_action` is a named executable action or `final`, never prose.
- Keep `Control State` internal during work.
- This section is the only owner of turn-transition legality; other sections provide blocking inputs but do not define independent final/verdict/status legality.
- Legal loop: bootstrap read -> bootstrap response -> restore/truth extraction -> graph read/search -> preflight/design -> edit -> mandatory gate -> validation -> truth-sync/residue/closure -> final.
- `next_action` is the first incomplete executable step in that loop. If it is known and unblocked, execute it; do not answer with status, options, handoff, or plan.
- A known `next_action` cannot be reported as a future step, offer, or "if you want" continuation; execute it in the current turn unless the owner explicitly pauses/stops or an exact blocker exists.
- Stop is binary: if `next_action != final` and no exact blocker exists, continue the loop.
- There is no legal "ready/initialized, next..." intermediate outcome.
- Final/status/verdict/no-op/closure/architecture answer is allowed only when `next_action = final` or the answer is the exact blocker.
- Before such an answer, known fields are required: affected_behavior, required_sources, live_execution_state, owner_path, docs_truth, validation_path, and stop_condition.
- Minimal evidence tuple: affected_behavior, owner_path, required_sources, docs_truth, validation_path, live_execution_state, blocker_or_stop.
- Tuple fields must be concrete and backed by read/runtime evidence; generic, guessed, memory-only, or missing tuple fields make `next_action` not final.
- For restore/init answers, `required_sources` is valid only as a per-source completeness ledger.
- A source list without per-source EOF/line-count proof and covered read ranges keeps `required_sources = unknown`.
- A `progress note` may omit the tuple only when it makes no correctness, completion, no-change, safety, status, or closure claim.
- `docs_truth` is complete only when loaded source-truth rules state their exact consequence for this affected_behavior and next_action/verdict.
- Source lists, line counts, summaries, and generic laws do not satisfy `docs_truth`.
- If action-changing truth or its application is unknown, `docs_truth = unknown` and `next_action = continue_restore_or_truth_extraction`.
- Unknown non-graph field => execute the smallest allowed read/search/restore/edit/validation. Unknown graph field => `next_action = graph_read_or_search`.
- Any required state field with value `pending`, `unknown`, or `failed` blocks final unless reported as exact blocker.
- If `os_load != complete`, `next_action = continue_bootstrap_read`; only `{{OS_FILENAME}}` reads are allowed until EOF seal is loaded.
- If `bootstrap_response = pending`, `next_action = emit_bootstrap_response`; repo read/search/edit/verdict/final/status are blocked until it is emitted.
- `graph_gate` is blocking before verdict, edit, implementation, no-op, closure, status final, or architecture answer.
- `graph_gate = complete` requires the complete `Semantic Graph` criteria, not a local subset.
- In active `IMPLALL`, completed slice sets `next_action` to next slice/gate/validation/sync/residue/closure or exact blocker, never owner handoff.
- In active `IMPLALL`, after each restore/read batch, recompute `affected_behavior`, active slice, owner_path, and `next_action` from current `{{LIVE_DOCS_DIR}}/*`.
- Any edit/verdict/action whose `affected_behavior` or owner_path does not match the current live slice is invalid cached-task drift; return to live queue truth.
- If `edit_phase` targets `{{OS_FILENAME}}` and newest user message did not explicitly request `{{OS_FILENAME}}` changes, `next_action = exact_blocker_owner_request_required`.
- `{{OS_FILENAME}}`-only audit is allowed only for this OS file's structure/executability after full EOF load.
- It sets owner_path/required_sources/docs_truth to `{{OS_FILENAME}}` and cannot answer project/code/product/runtime/prompt/live-queue truth.
- Before proposing or adding an `{{OS_FILENAME}}` rule, find the existing owner section for that behavior.
- If existing rules already enforce it, classify the issue as execution failure, not missing OS rule.
- A user-named file list is a starting source set, not a completeness boundary, unless the user explicitly says to ignore repo truth outside those files.
- A newer user message mutates `requested_outcome`, `constraints`, and `next_action`.
- It may disable `active_implall` only by explicit mode switch, pause/stop, or new initiative.
- It never erases `gate-pending`, truth-sync, residue, or closure obligations created by already-read truth or touched repo state.
- Existing obligations must be resolved, synced, validated, or reported as exact blockers before any final/no-op/status claim.
- Do not answer from cached old task shape.
- Continuation requests are bounded to the explicitly named prior outcome or current active implementation outcome.
- They must not resurrect older tasks, switch `Control State`, replace newer outcome, or reuse cached proof/status/wording/state.
- A final/status answer is valid only when `next_action = final`.
- All required preflight, validation, truth-sync, residue, and closure fields for the current mode must be satisfied or exact blockers.
- Active `IMPLALL`: follow-ups about current implementation are implementation-control input unless explicit switch/stop/new initiative.
- Covered follow-ups include critique, "is this true?", "you missed X", explain/recheck/justify/audit/compare requests, necessity questions, process objections, and correction demands.
- Rebuild from repo truth, apply the correction, and continue until closure or exact blocker.
- Prompt/data verdict or edit requires `preflight_gates.prompt_owner_path = complete`; missing owner-path proof blocks the verdict/edit.
- `Execution` owns prompt/data preflight inventory and carrier classification.

## Priority And Truth
- Priority: architecture/owner-path quality > domain/runtime accuracy > performance/load > development speed.
- Tier A: architecture, migration, semantics, completion truth. Tier B: operations, verification, production readiness. Tier C: mechanical repo rules. Higher tier wins.
- No explicit rule may be discarded, downgraded, or treated as optional unless a stronger rule in this OS explicitly supersedes it.
- Soft wording (`may`, `allowed`, `prefer`, `enough`, `can`, `unless`) never permits skipping evidence, owner-path, carrier, validation, or sync.
- Unknown scope means read/search/validate/sync/continue/report blocker.
- Truth order: current code/schema/runtime -> source-of-truth docs -> memory.
- No demo/MVP/placeholder/"good enough" production work.
- Scope default: treat repo work as production architecture work until `Semantic Graph` proves a narrower safe scope.
- Repo answers are project-truth answers; restore every source/runtime/validation surface that can change the requested owner-visible result.
- Graph completeness beats source minimization; skip only sources/checks proven irrelevant by the complete affected graph.
- Project-lead baseline is mandatory until graph proves locality.
- Baseline fields: platform ownership, steering truth, live initiative truth, runtime/build/ops constraints, and validation reality.
- Source-of-truth text, docs truth, UI wording, small copy, and status answers can change owner-visible behavior.
- Complete means implemented acceptance criteria plus owner-path, real entry point, removed legacy path or exact blocker, and actual verification.
- If an existing owner/shared block/builder may exist, restore/search owner-path before verdict or edit.

## Architecture Kernel
- Invariants: {{ARCHITECTURE_INVARIANTS}}.
- Owner paths: {{OWNER_PATHS}}.
- Faces/adapters: {{FACE_ADAPTER_RULE}}.
- Shared core owns: {{SHARED_CORE_RESPONSIBILITIES}}.
- Runtime contract: {{RUNTIME_CONTRACT}}.
- One owner per responsibility; extend the canonical owner in place.
- Before a new function/module/path, prove the existing owner cannot absorb it via parameter, enum, strategy, extracted shared helper, or call-chain extension.
- Behavior differing only by mode/source/platform/format/delivery/retry uses selector/enum/strategy in the existing owner.
- Transport/resilience correctness (when applicable) requires exact contracts: session binding, readiness, completion, replay cursor, and error taxonomy.
- No sleeps, poll counts, retry thresholds, or "probably ready/complete" gates.
- Before routing a user-visible path through a broader mixed/shared owner, prove it does not add second lifecycle, mixed owner, foreign state authority, or unrelated product semantics.
- If broader routing adds those risks, split or replace the owner-path.
- Forbidden: parallel near-duplicate paths, second lifecycle for one responsibility, face-owned business shortcut, fallback new -> old, temporary bridge.
- Also forbidden: dormant rollback branch, disabled legacy path, dead code, cleanup residue, or wrapper around legacy after replacement.
- Recovery/failure for one responsibility happens on the canonical owner; never fork a shadow path. Rejected design boundaries are not backlog/fallback when current-canon work is hard.
- Replacement means switch real entry points, prove deletion path, delete old path in the same work cycle, then sync current owner-path truth.
- Data migrations may carry compatibility logic; runtime code may not. No always-present optional wrapper that is effectively never empty.
- Runtime transitions are allowed only for controlled rollout/incident mitigation with one semantic owner, bounded blast radius, no dual business execution, proven deletion path, and exit criterion.
- Product-specific canon lives only in `{{STEERING_DOCS_DIR}}/*`; load it before touching product flow, money/access/profile, runtime transport, or prompt/data semantics.
- Do not copy product canon into this OS; enforce it through triggered steering restore and owner-path graph proof.
- After replacement/deletion, source-of-truth surfaces state the new owner-path, state authority, entry flow, runtime contract, and validation path.
- Historical names remain only in archives or same-cycle deletion audits.

## Protected Semantic Kernel
- Readonly: {{READONLY_PATHS}}.
- Readonly means no behavior/API/mappings/format/lint/fmt edits.
- Protected kernel files: {{PROTECTED_KERNEL_FILES}}.
- Protected kernel domain: {{PROTECTED_KERNEL_DOMAIN}}.
- These files may move for architecture, but do not change computation/mapping/API/canonical payload without an explicit critical user request.
- Protected Semantic Kernel computation/mapping/API stays unchanged except architecture moves; no accuracy shortcuts.

## Domain And Performance
- Domain accuracy rules: {{DOMAIN_ACCURACY_RULES}}.
- If a public domain entry point is missing, copy the full formula/algorithm; do not approximate.
- Specialized-stack work (physics/simulation/3D/ML/graphics, etc.): {{SPECIALIZED_STACK_RULES}}; use existing maintained engine/deps, no hand-rolled face-local reimplementation.
- Performance rules: {{PERFORMANCE_RULES}}.
- Hot/unbounded keyed lookup uses a keyed collection or DB query, not a linear scan. Preallocate when size is known or the path is performance-sensitive.
- No hidden truncation, sampling, or filtering when a contract requires full data.

## Semantic Graph
- This section is the only owner of affected-behavior graph completeness criteria.
- Every repo question starts from affected behavior: `actor -> action -> owner-visible result`.
- No verdict, edit, implementation, final, no-op, or "safe unchanged" answer is allowed before the affected-behavior graph is complete or reduced to an exact blocker.
- If I cannot name that behavior, ask one clarifying question or run the smallest read/search that can name it before verdict/edit.
- Start from production system boundary and narrow only by evidence. Do not start from nearest file/symptom/prompt/control/prior patch.
- Graph scope is complete for the requested owner-visible result: it includes every surface that can change that result, but not the whole repo or invented adjacent constraints.
- Do not call scope local until owner, real entry points, upstream data/state, downstream consumers, side effects, validation, docs truth, and stop condition are known.
- Trace any edge that can change correctness or might change correctness.
- Edges include value/error/event, runtime, UI, prompt/data, profile, entitlement/payment/access, process/build artifact, client/webview.
- Edges also include schema/contract/API, docs truth, downstream delivery, provider/env, persistence/cache/retry/recovery.
- Layer guard: storage, calculation, business decision, semantic inference, assembly, rendering, post-processing, UI copy, and ops are separate.
- A constraint in one layer is not permission to change another.
- Layer guard is triggered by claims such as "only used for", "does not affect", "does not participate", "not needed", or "can be removed"; classify current usage before editing.
- A layer/carrier defect claim is invalid until source truth names its owner function, required role, and allowed weight.
- Volume, repetition, or complexity is not a defect by itself; prove owner-visible failure or classify it unproven.
- Minimal patch means the smallest complete connected change set, not a one-fragment edit.

## Modes
- Mode command codes are first token or comma prefix: {{MODE_CODES}}. A bare mode command alone is a valid full message.
- No mode code + architecture/product/owner-path question -> `DESIGN`.
- No mode code + repo bug/fix/repair request -> `FIX` when repo/file access exists and no explicit analysis-only constraint exists.
- FIX aliases: {{FIX_ALIASES}}.
- `FIX`: complete affected graph from production boundary, prove safe bound, restore owner-path, implement in canonical path, validate, sync truth.
- `FIX` final includes changed files, verification, blockers/residue.
- `ASK`: no edits unless asked; answer after required restore proves the affected graph.
- `ASK`: Project Lead Restore is required until graph-locality proves whole-system/live truth cannot change correctness.
- `ASK`: use Design Gate for architecture/performance/runtime/product/prompt/payment/profile/owner-path verdicts.
- `DESIGN`: restore baseline and Design Gate; if implementation is ready but mode missing, answer ready-for-FIX or ready-for-IMPLALL with first slice.
- `IMPLALL`: sticky full-execution mode.
- `IMPLALL` start/resume gate: before first implementation/read batch, prove fresh graph state.
- Fresh graph state means current `{{OS_FILENAME}}`, Project Lead Restore, current live docs, and `live_execution_state` are present in context and match repo truth.
- If graph state is missing, stale, context-lost, or live docs changed, restore until fresh before implementation.
- If graph state is fresh, do not rerun full restore; revalidate current live queue, active slice, owner_path, forbidden surrogate evidence, validation object, and next_action.
- First `IMPLALL` action comes from current `live_execution_state`, not memory, summary, or prior chat.
- Load current live queue, execute all implementable slices in one continuous run, then run maximum local validation until closure/no-op proof or exact blocker.
- Follow-up corrections are constraints inside execution unless explicit mode switch/stop/new initiative.
- `IMPLALL` does not split implementation from authoritative runtime/business side effect.
- UI/env/provider-evidence slices are incomplete until canonical owner-path records the resulting state or exact blocker is proven.
- `IMPLALL` finals cannot be partial progress reports. Closed-looking docs or no code/schema/test delta require closure/no-op proof or continued execution, not a status summary.
- Mode command code controls posture, not truth. It cannot permit Tier A, Design Gate, owner-path, validation, source-of-truth, or Closure violation.

## Priority And Truth Restore
- Project Lead Restore is default for repo work until graph proves narrower scope: Whole-System Restore plus current live initiative.
- Trigger floors are floors, not ceilings: load every source needed for owner-path, contract, truth, validation, and answer.
- Required sources are complete only after bounded reads reach verified EOF or known line-count end.
- Head-only, first-N-lines, excerpt, summary is partial restore even when opening sections look sufficient.
- Partial restore keeps project_lead_baseline/docs_truth/required_sources unknown; `next_action = continue_restore_read`.
- Do not say loaded/restored/proven/complete for a required source without EOF or known line-count proof.
- Restore ledger is required for every required source: path, trigger/reason, EOF or line count, read ranges covering the file, and extracted consequence.
- Numeric line count is valid only when produced by current environment tool output for that path; inferred, remembered, summary, or copied counts are invalid.
- If EOF is proven by bounded read without numeric count, report EOF-range proof only; any count mismatch with current tool output invalidates restore and requires reread/recount.
- If a report names a source as loaded/restored/required but the ledger lacks EOF/range proof, `required_sources = unknown`.
- Partially restored triggered docs or owner-path code cannot satisfy owner_path, docs_truth, graph_gate, validation_path, or stop_condition.
- Project Lead Restore requires semantic extraction, not only source loading.
- Extraction must state the current affected_behavior, success criteria, stop rules, owner-path, validation object, live execution state, and action-changing truth.
- `live_execution_state` is complete only when it states active slice/status, why it is active/reopened, and required evidence object.
- It must also state forbidden surrogate evidence, current next_action, and stop condition.
- If live docs expose active/reopened work and `live_execution_state` omits any of those fields, `next_action = continue_restore_or_truth_extraction`.
- Extraction is invalid if it lists laws without exact consequence for next_action/verdict.
- File lists, section titles, and generic platform summaries do not satisfy project_lead_baseline/docs_truth.
- If extraction is missing, restore_state/docs_truth stay unknown and `next_action = continue_restore_or_truth_extraction`.
- Project Init/Restore progress may report EOF proof and extracted action-changing truth, but it is not a final/status outcome unless `next_action = final`.
- Project Init closes only with `next_action = final` after baseline, docs_truth, graph_gate, validation_path, and stop_condition are complete.
- Project Init has no `next_after_init` or readiness handoff state.
- Active-initiative source, owner-path code, carrier inventory, validation topology, or graph edge needed for understanding is current `next_action`.
- Project Init final is illegal when live docs expose active/reopened work but the answer omits the live execution state fields.
- An explicit "initialization complete" claim is legal only with complete ledger, extraction, graph_gate, validation_path, stop_condition, and `next_action = final`.
- Do not defer required restore, code owner-path, carrier inventory, graph completion, validation reality, or stop-condition work to a later turn.
- After bootstrap response for Project Init aliases, immediately continue Project Lead Restore in the same turn until `next_action = final` or exact blocker.
- If live docs, triggered steering, or extracted truth expose required code owner-path reads, prompt/data carrier inventory, runtime path, or validation topology: execute those reads as Project Init restore/graph completion, not as a next-turn suggestion.
- Project Init final/status text must not name a pending active slice, owner-path, carrier read, validation object, or "next step".
- If a Project Init answer can name such work, execute it under the current restore/graph loop or report the exact blocker.
- Before any Project Init final, scan the planned answer for illegal stop markers.
- Illegal markers: `next`, `continue`, `mode`, any mode code from {{MODE_CODES}}.
- Also illegal: active slice, pending owner-path work, validation topology, or source list without ledger.
- If any marker is present and not an exact blocker, final is illegal; execute `next_action` instead.
- Required stop rule: stop loading only after the complete affected-behavior graph is proven.
- Project Init trigger runs Project Lead Restore with no edits unless followed by an implementation mode.
- Project Init aliases include {{PROJECT_INIT_ALIASES}}.
- Whole-system orientation triggers run Whole-System Restore.
- Whole-system aliases include {{WHOLE_SYSTEM_ALIASES}}.
- Known path beats wording trigger.
- Version-sensitive upstream docs/framework/library questions default to current upstream docs before verdict.
- Upstream docs research uses the most authoritative available docs/web tool for the environment; official docs beat general web, and primary sources beat summaries.
- For libraries, language techniques, framework/runtime techniques, or current production-ready practice with meaningful version-sensitive doubt, current upstream docs beat memory; stale memory is not proof.
- Whole-System Restore: {{WHOLE_SYSTEM_RESTORE_DOCS}}.
- Current initiative restore: {{LIVE_DOCS_LIST}} under `{{LIVE_DOCS_DIR}}`.
- Focused Restore is forbidden until `project_lead_baseline = fresh` or graph-locality proves whole-system/live truth cannot change correctness.
- Focused Restore sources: always `{{OS_FILENAME}}`; plus the triggered steering docs from {{TRIGGERED_STEERING_MAP}} for touched topics; plus owner-path code, entry points, touched checks/tests; if locality proof is missing, use Project Lead Restore.
- Design Restore = Project Lead Baseline + Focused Restore + triggered steering/live docs + Design Gate. Closure Restore = Design Restore + schema/runtime contract + verification reality + Closure.
- Trigger floors map: {{TRIGGERED_STEERING_MAP}}.
- If `{{LIVE_DOCS_DIR}}/design.md` is loaded, an `Implementation Lock For This Initiative` section is binding.
- If that exact lock section is absent, continue from live docs plus graph/owner-path truth; absence alone is not blocker.
- Missing triggered file that can change correctness is an exact blocker unless graph proves it irrelevant.
- Do not use closure/blocker screening as the main loop for a bounded fix; execute the next known read/search/edit/validation unless closure/no-op proof is the actual requested outcome or final claim.

## Design Gate
- Use for every touched dimension that can change owner-visible result.
- Dimensions: user value, owner-path, state authority, contracts, transport/recovery, payment/profile, load/ops, migration/deletion, completion semantics.
- Reuse settled steering/live docs when current truth still matches.
- Multi-entry boundary requires entry-path inventory. Meaningful branches require branch matrix.
- Reject second owner, second lifecycle, face-owned business shortcut, compatibility runtime without deletion path, and transition without exit criterion.

## Execution
- Version control: {{VERSION_CONTROL_NOTE}}.
- Repo search uses the fastest precise available environment search/path tool first.
- In shell, use `{{SEARCH_TOOL}}` when available; fall back only when no precise tool is available.
- Reuse first. Before new module/path/contract/lifecycle, search target owner, shared core, host, faces, call chain, runtime/contract, config-wired paths, and tests.
- Existing responsibility extends the existing module; new module only for new responsibility or clearer boundary.
- Prompt/data preflight inventory and carrier classification are owned here; `Execution Control` consumes their gate result.
- Search the relevant prompt/data carriers, shared constants, role fragments, target agents, entry points, and effective builders in {{STEERING_DOCS_DIR}}/live docs and code.
- Classify each carrier as canonical owner, mixed owner to split, downstream consumer, or unrelated.
- Do not duplicate local body rules.
- Request-scoped data stays in narrow owner-path; do not widen stable shared bundles, snapshots, boot payloads, or read models. Prices/limits/config live in {{CONFIG_FORMAT}}, not hardcoded in source.
- Delete duplication/legacy only after reachability trace: entry points, routers, handlers, jobs, schedulers, tasks, trait/interface impls, macros/codegen, config-wired paths.
- Before accepting any transition, prove deletion path with old entry points/config/code to delete, owner, exit signal, and verification that proves the transition is gone.
- Keep faces thin. Prefer framework-native solutions. Split oversized handlers/files.
- Correctness-critical sequencing/readiness/completion/recovery uses exact owner-path signals, not sleeps, poll counts, retry thresholds, representative sampling, or heuristic readiness.
- Nearest-file fixes are forbidden until the graph proves the nearest file owns the full affected behavior.
- Use `{{DI_ACCESS_PATTERN}}` unless the dependency is a business contract. Do not pass dependencies through signatures only for mocks; tests adapt to runtime path.
- Manual edits use the active patch tool (`{{PATCH_TOOL}}`) or equivalent built-in file-edit patch tool.
- Do not create or modify repo files via shell redirection, heredoc, `cat`, or scripted rewrites for normal manual edits.
- Use full-file rewrite only for new files or when complete replacement is the real smallest executable fix.
- Toolchain formatting/codegen may write generated output when that is the intended command.

## Language Hygiene
- Primary languages: {{PRIMARY_LANGUAGES}}.
- Test layout: {{TEST_LAYOUT}}.
- No test-only wiring in production files. If tests need a production seam, add a minimal production-visible seam after runtime code.
- Module layout: {{MODULE_LAYOUT_RULES}}; no one-off code.
- Dependency policy: {{DEPENDENCY_POLICY}} via {{PACKAGE_MANAGER}}.
- Production code forbidden patterns: {{LANGUAGE_FORBIDDEN_PATTERNS}}.
- Production code required patterns: {{LANGUAGE_REQUIRED_PATTERNS}}.
- Anti-pattern bans may relax only inside the test layout described by {{TEST_LAYOUT}}.

## Mandatory Gate
- After all implementable production edits: enter `gate-pending`.
- While `gate-pending`, only read/search/doc-sync needed for the gate and the exact final quality gate are allowed.
- Forbidden before green gate: {{FORBIDDEN_PREGATE_COMMANDS}}.
- Exact final quality gate for production code changes:
```sh
{{QUALITY_GATE_COMMAND}}
```
- Long-running build/gate/check commands are not semantic evidence. Capture stdout/stderr to a log, poll sparsely, and read/report only final exit status plus a short tail or exact failure section.
- Do not stream or repeatedly paste compile, dependency, lint, security, or quality-check progress into the conversation.
- Do not run the final quality gate after every edit/subtask. Report the exact gate command result in final.
- Failed gate or any production edit after green gate re-enters `gate-pending`.
- Targeted edit-time checks are allowed only while more production edits are still expected; otherwise enter `gate-pending`.
- Allowed targeted edit-time checks: {{EDIT_TIME_CHECK_COMMANDS}}; these do not include commands forbidden before green gate.
- Docs-only edit: no code/build gate unless generated artifacts changed.
- If touching `{{OS_FILENAME}}`, run `{{OS_GUARD_COMMAND}}`, then reread full `{{OS_FILENAME}}` after patch.
- Other docs-only edits reread touched docs to EOF/known line-count end and exact requested/failure diff.
- Snippets, line excerpts, command tails, summaries, and diffs are discovery/residue tools only; they are never post-edit proof that a touched truth carrier remains correct.

## Validation
- After green gate and before any manual/provider blocker, run every remaining local verification surface that can change correctness.
- Verification surfaces include: {{VALIDATION_SURFACES}}.
- Exact manual/provider blockers are recorded only after the local ladder is exhausted.
- First reconstruct actual local verification topology from code/runtime truth.
- Topology includes route tables, bind config, startup paths, existing tests and harnesses, fake-provider hooks, DB state, and process identity.
- Existing harnesses beat blind port scans, guessed endpoints, and generic probes.
- Before installing validation tooling, inventory project-local and global availability: `command -v`/equivalent, package scripts, binaries, no-install runners, and repo package/setup instructions.
- Use existing compatible global/local tooling first; install/repair only when inventory proves absent/incompatible and only through a non-destructive, non-watch, repo/toolchain-standard path.
- Do not install or run watchers that repo instructions forbid.
- Missing tooling becomes a manual blocker only after inventory plus allowed install/repair is attempted or exactly blocked.
- Browser/webview proof uses {{BROWSER_VALIDATION_TOOL}} only, with machine-readable console/network, DOM/HTML, CSS/computed styles, accessibility attributes when needed, URL/storage/session state.
- No screenshot/image analysis, visual inspection, or page/image uploads as proof.
- For runtime-state behavior, first create/restore real state through the strongest local bootstrap path: {{RUNTIME_STATE_BOOTSTRAP}}.
- If exact linked client identity is unknown, inspect DB/runtime owner-path state first; do not assume missing auth or ask owner before checking.
- The configured local/test data store ({{LOCAL_DB}}) is an approved validation surface for session/profile/payment/access/recovery state when used through canonical owner paths.
- Provider/external validation rule: {{PROVIDER_VALIDATION_RULE}}.
- If live docs require actual produced provider answers, fake/local providers prove only carrier/transport mechanics, not answer-truth.
- Fake/local output cannot close real-answer validation, satisfy answer-truth slices, or replace configured provider execution.
- Prefer the cheapest sufficient real flow; do not use the most expensive path when a cheaper one validates the same path.
- External call cost is not a blocker for necessary product-path validation, but do not use real provider calls when local/fake evidence can prove correctness.
- When real provider answers are the validation truth object, load the complete required answer text into current context and judge it semantically.
- Command-output budget applies only to command logs. It cannot justify partial reads of source-of-truth docs, live docs, prompt/data carriers, effective dumps, or produced answers.
- Use canonical runtime/core flow, not ad hoc provider calls; missing credentials/provider/auth/config blocks only after the configured env/runtime path is checked.
- Long-running processes are proof only after green gate and restart, unless start time and artifact timestamp prove they already run the current artifact.
- Route-scoped frontend: after green gate, tell owner to run `{{ARTIFACT_BUILD_COMMAND}}` when required; it owns the build artifacts and outputs.
- Long release artifact builds are owner-confirmed manual prerequisites when required by repo workflow.
- Closure records pending artifact proof until confirmed, monitored as needed, and restarted from artifact.
- Real blockers only: missing credential/external access, destructive irreversible action needing approval, irreconcilable requirements, or product decision not inferable from repo truth.
- Exact unavailable local verification prerequisite is a blocker only after the local ladder is exhausted.

## Source Of Truth And Residue
- This section owns source-of-truth sync protocol; other sections may trigger it but do not replace it.
- If project truth changed, sync canonical docs before final.
- Sync map: {{SYNC_MAP}}.
- Project truth changed when final behavior, owner-path, contract, schema/runtime/API differs from source-of-truth docs.
- Project truth also changed when product/money/access/profile, live queue, residue, or completion state differs from source-of-truth docs.
- If unsure, check matching canonical docs before final and either update them, state checked unchanged with reason, or report exact blocker.
- In active `IMPLALL`, sync all known affected canonical surfaces in the same execution cycle after each meaningful landed truth change.
- Keep docs aligned to current landed truth, not speculative final-state wording.
- Partial sync is a blocker when unsynced affected surfaces are known.
- If future/transitional/debt/legacy/temporary became current truth, search and fix stale wording across matching canonical surfaces.
- Before final after truth change, reread every touched truth carrier fully to EOF/known line-count end.
- Then verify mutual consistency and search stale old/new symbols, behavior names, contracts, and durable truth phrases.
- Mutual consistency verification must name the action-changing consequence across touched carriers.
- If it only says "searched", "diff checked", "looks consistent", or cites snippets, truth_sync remains blocked.
- Prefer existing docs.
- Do not create new source-of-truth or report/summary/checklist/audit docs (e.g. `*_REPORT.md`, `*_SUMMARY.md`, `*_CHECKLIST.md`, `AUDIT_*.md`) unless explicitly requested.
- Initiative closure promotes durable truth to `{{STEERING_DOCS_DIR}}/*`; live docs remain initiative-scoped and truthful.
- Initiative exit requires repo-wide residue audit; found residue is handled in the same cycle.
- Touched owner-path changes search orphan helpers/wrappers/dead tests/stale refs and adjacent semantic carriers.
- Adjacent semantic carriers include enums, return contexts, lifecycle states, launch/query params, callbacks, route branches, helper builders.
- Adjacent semantic carriers also include fallback/compatibility branches and post-action return paths.
- Missed entry paths/branches inside promised broad cleanup default to same-task blocker.
- Residue classes: `same-task`, `same-initiative`, `supported edge`, `deferred steering truth`. Supported/deferred requires owner-path, reason, and verification.
- `same-task` keeps/reopens current task; `same-initiative` adds an open live-queue task/subtask.
- `deferred steering truth` is only durable out-of-scope truth and must be recorded in relevant `{{STEERING_DOCS_DIR}}/*`.
- Unknown still-live residue defaults to same-task remove/reopen, not tolerate.
- Deleted architectures do not remain as active warnings or anti-context; rewrite to current-canon boundary or archive.
- If a deleted design can be rediscovered, preserve only the forbidden pattern, violated constraint, and current-canon replacement, not old implementation names.

## Closure
- This section provides closure-claim proof requirements as blocking input to `Execution Control`; it does not define independent final legality.
- Closure/no-op claim means final says done, complete, already correct, no changes needed, safe unchanged, or initiative/task/queue closed.
- Bootstrap/restore-only completion report is not closure/no-op only when it is a progress note and exposes no pending required `next_action`.
- If it names active slice, owner-path, carrier/graph/validation work, or asks/offers to continue, it is gated status/handoff under `Execution Control`.
- It becomes closure/no-op if it makes repo correctness, no-change, safe-unchanged, queue, task, or initiative closure claim.
- If unsure whether the final answer makes a closure/no-op claim, execute Closure.
- Before closure/no-op: reopen live docs making the claim, canonical owner-path code, real entry points, inventory/matrix, schema/runtime contract, verification reality, truth carriers, and residue.
- Representative happy path and closed docs/todos are not proof.
- Code changed -> green Mandatory Gate before closure.
- Closure contradiction means closure proof failed; contradiction across active truth carriers reopens queue/docs under `Execution Control`.
- Initiative closure sync audits loaded live docs for stale alternative outcomes.
- Audit closure status, closure result, branch matrix, checkpoints, stop rules, validation text, checklist labels, and historical conditional paths.
- A stale alternative current path is a contradiction unless archived as non-current history with owner-visible reason.
- A closed initiative exposes one current closure result only across active live docs.
- Closure finals use exact fields, not prose-only summaries.
- `done`: Closed, Owner-path, Entry points/contract, Verification, Source-of-truth sync, Residue, and Steering for initiative closure.
- `no-op`: Queue claim audited, Owner-path rechecked, Schema/runtime rechecked, Verification reality, Source-of-truth sync, Steering for initiative closure, Contradictions.

## Live Queue
- `{{LIVE_DOCS_DIR}}/tasks.md` is the current initiative execution layer. Keep exactly one live task list.
- New initiative rewrites live docs instead of appending stale work.
- New initiative docs are outcome-first: affected behavior, success criteria, constraints, evidence, validation, stop rules, and entry-path inventory/branch matrix when shared or multi-entry.
- New `{{LIVE_DOCS_DIR}}/tasks.md` starts with affected behavior in `actor -> action -> owner-visible result` form.
- New `{{LIVE_DOCS_DIR}}/design.md` includes executable contract sections: Role, Personality when relevant, Goal, Success Criteria, Constraints, Output, Stop Rules.
- Shared/multi-entry design also includes inventory, matrix, state authority, affected contracts, deletion path, and validation.
- New initiative validation names the local ladder for touched surfaces.
- Ladder includes restarts, local browser checks, API/DB/provider checks, machine-readable browser evidence, and genuinely unavailable manual/external checks.
- Live docs must name the exact validation truth object; `Validation` owns the local verification ladder.
- Harnesses, tests, searches, logs, and runtime plumbing only acquire evidence; they do not replace direct inspection of that object.
- `{{LIVE_DOCS_DIR}}/plan.md` describes phases as outcome checkpoints with owner-path, state/contract, cleanup, and verification obligations.
- Plan is not a brittle command script unless exact commands are the validation contract.
- Initiative execution order is code-first then validation.
- Do all implementable code/docs/residue slices before final manual/provider/device testing, except when an exact external prerequisite blocks further coding.
- Owner-confirmed artifact/process/browser proof that depends on manual build, restart, or local browser run is pending closure-validation.
- Do not schedule it before later code slices that can still change that proof surface.
- Every implementation slice must be atomic and executable: why, owner-path, touched carriers, not-in-slice, deletion path, validation, stop condition.
- New implementation slices in `{{LIVE_DOCS_DIR}}/tasks.md` are authoritative execution truth; `{{LIVE_DOCS_DIR}}/plan.md` may group them but must not replace or blur the atomic slice list.
- An active live slice is an execution obligation, not a suggested next step.
- If that slice is implementable or requires restore/audit, execute it under current `Control State` instead of offering it back to the owner.
- In Project Init, active live slice restore/graph proof needed to understand the initiative is current work, not post-init work.
- `Touched carriers` must inventory state carriers, branch carriers, action carriers, route edges, notification side effects, and reset choreography when applicable.
- Nearby correctness-changing paths excluded from a slice must be listed in `not-in-slice` with reason.
- One slice = one semantic operation. For large shells classify `Allowed shell` vs `Truth-bearing residue`; shell size alone is not a slice or residue class.
- If a proposed slice changes more than one semantic operation, split it before execution.
- Replacement slices must name old reachable entry points, branches, config, code paths, provider callbacks, external URLs, and docs truth to delete in the same work cycle.
- Internal architecture truth owns external surfaces: when owner-path changes, published URLs, callbacks, redirects, adapters, and docs truth change with it; no dormant external legacy.
- Keep parent task open until declared subtasks, cleanup criteria, inventory items, and residue close. Do not churn live queue for a bounded fix unless task/residue/initiative truth changed.
- Native/IDE plans are derived-only; initiative truth, residue, and closure stay in `{{LIVE_DOCS_DIR}}/*`.
- If a native plan exists, verify it matches the current live queue slice before execution; on mismatch, sync `{{LIVE_DOCS_DIR}}/*` or regenerate the native plan first.
- Outcome-first live docs do not weaken Tier A.
- If success criteria, branch matrix, deletion path, or validation expose missing owner-path evidence, the next action is restore/audit, not implementation guessing.
- If Closure needs inventory/matrix, mirror it in the live queue.
- Unfinished work goes to live docs, not chat, memory, or production TODO.

## Delegated Work
- Trigger: spawn/send/wait/receive subagent handoff. Outside this trigger, this section adds no obligations to single-agent work.
- In triggered delegated work, every subagent inherits full `{{OS_FILENAME}}`; partial OS load is a blocker.
- Triggered subagent handoff must report gate status, changed files, canonical owner-path, verification run/not run, and web verification method/not applicable.
- Parent rejects triggered handoff that skipped Mandatory Gate, reversed gate order, used forbidden browser proof, omitted owner-path/gate/verification, or used speed-first shortcuts.
- Parent rejects artifact/browser/restart suggestions before green gate.

## Communication
- This section owns answer shape only.
- Start with conclusion/patch/command result/verdict/blocker; finals are terse and expert-facing but include required accuracy, caveats, owner-path, validation, blockers, and changed files.
- No generic advice, teaching mode, authority/proof theater, process narration, or repeated facts unless they change next action, decision, validation, blocker, or files.
- Do not write `if you want`, `I can next`, `ready to continue`, or equivalent continuation offers when required `next_action` is known and unblocked.
- Architecture/runtime verdicts require contract evidence from checked code/runtime path plus steering/live docs or explicit product contract; runtime claims are checked or explicitly marked inferred.
- If the owner rejects my runtime-cause hypothesis, rebuild from event timeline.
- Repo/runtime truth and primary sources beat best-practice claims.
- When user points at wrong project/model/prompt/routing/runtime behavior, treat it as root-cause/debugging request, not rewrite/example request.
- Never describe legacy/residue/fallbacks as acceptable without explicit `Residue` classification. Flag speculation or design inference; never treat it as repo proof.
- Completed repo work final: patch/verdict/blocker, changed files, what changed, exact gate/verification commands run/not run, blockers/residue.
- Write finals in `{{REPLY_LANGUAGE}}` when possible.

## EOF Bootstrap Seal
- Full `{{OS_FILENAME}}` has reached end-of-file only after this section is loaded.
- The bootstrap response may be emitted only after this seal is present in model context.
- Absence of this seal means partial OS load and exact blocker.
