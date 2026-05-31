// Feature: fork-rebrand-task-workflow, Property 9: Маршрутизация задачи по метке специализации
/**
 * Property-based test for {@link route} (Task 7.3).
 *
 * Property 9 — "Маршрутизация задачи по метке специализации":
 *   For ANY technical area, ANY pool of Specialist_Agent (varying
 *   specialization labels and busy flags) and ANY executor-busy fact:
 *   - if NO agent carries the label `area` → the result is `blocked` with
 *     `unmatchedArea === area` (Req 5.6);
 *   - else if there exists a FREE (`busy === false`) agent with
 *     `specialization === area` AND the executor is not busy
 *     (`executorBusy === false`) → the result is `assigned`, and the returned
 *     `agentId` belongs to an agent that has `specialization === area` and was
 *     free (Req 5.3, 5.4);
 *   - else (matching agents exist but all busy, OR the executor is busy) → the
 *     result is `queued` (Req 5.7, 7.6).
 *
 * **Validates: Requirements 5.3, 5.4, 5.6, 5.7**
 *
 * Generation strategy:
 *  - `area` and each agent's `specialization` are drawn from the SAME small
 *    label alphabet so that matches and non-matches both occur frequently;
 *    this exercises the `blocked` branch (no match), the `assigned` branch
 *    (free match + idle executor) and the `queued` branch (all matches busy
 *    and/or executor busy) within a realistic input space.
 *  - Agent pools include the empty pool (guaranteeing `blocked` cases) and
 *    pools with duplicate specialization labels (multiple agents per area,
 *    Req 5.2). Each agent is given a UNIQUE id so an `assigned` result can be
 *    traced back unambiguously to the agent it names.
 *  - For every generated input we INDEPENDENTLY recompute the expected outcome
 *    kind (without reusing the implementation) and assert it matches, then
 *    verify the outcome-specific payload (`unmatchedArea` / `agentId`). We also
 *    assert `route` does not mutate the input pool (purity).
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { route, SpecialistAgent, RouteOutcome } from './agent-router.js';

/** Small label alphabet shared by `area` and agent `specialization`. */
const LABELS = ['js', 'rust', 'go', 'py', 'docs'] as const;

const labelArb: fc.Arbitrary<string> = fc.constantFrom(...LABELS);

/**
 * A pool of agents with unique ids. Specialization is drawn from the shared
 * alphabet; busy is arbitrary. Including the empty pool guarantees `blocked`
 * cases, and duplicate labels exercise multi-agent-per-area routing (Req 5.2).
 */
const agentsArb: fc.Arbitrary<SpecialistAgent[]> = fc
  .array(fc.record({ specialization: labelArb, busy: fc.boolean() }), {
    minLength: 0,
    maxLength: 8,
  })
  .map((partials) =>
    partials.map((partial, index) => ({
      id: `agent-${index}`,
      specialization: partial.specialization,
      busy: partial.busy,
    }))
  );

type OutcomeKind = RouteOutcome['kind'];

/** Independently compute the expected outcome KIND (Req 5.3, 5.4, 5.6, 5.7). */
function expectedKind(
  area: string,
  agents: SpecialistAgent[],
  executorBusy: boolean
): OutcomeKind {
  const matching = agents.filter((agent) => agent.specialization === area);
  if (matching.length === 0) return 'blocked';
  const hasFreeMatch = matching.some((agent) => !agent.busy);
  if (hasFreeMatch && !executorBusy) return 'assigned';
  return 'queued';
}

describe('Property 9: Маршрутизация задачи по метке специализации (route)', () => {
  it('routes to blocked/assigned/queued exactly per the specialization-and-busy rules', () => {
    fc.assert(
      fc.property(
        labelArb,
        agentsArb,
        fc.boolean(),
        (area, agents, executorBusy) => {
          // Snapshot for purity check (route must not mutate the pool).
          const before = JSON.stringify(agents);

          const outcome = route(area, agents, executorBusy);
          const expected = expectedKind(area, agents, executorBusy);

          expect(outcome.kind).toBe(expected);

          if (outcome.kind === 'blocked') {
            // No agent carries `area` → unmatchedArea echoes the area (Req 5.6).
            expect(agents.some((a) => a.specialization === area)).toBe(false);
            expect(outcome.unmatchedArea).toBe(area);
          } else if (outcome.kind === 'assigned') {
            // The named agent must match the area and have been free (Req 5.3, 5.4).
            expect(executorBusy).toBe(false);
            const chosen = agents.find((a) => a.id === outcome.agentId);
            expect(chosen).toBeDefined();
            expect(chosen!.specialization).toBe(area);
            expect(chosen!.busy).toBe(false);
          } else {
            // queued: matching agents exist but all busy, OR executor busy
            // (Req 5.7, 7.6).
            const matching = agents.filter((a) => a.specialization === area);
            expect(matching.length).toBeGreaterThan(0);
            const allBusy = matching.every((a) => a.busy);
            expect(allBusy || executorBusy).toBe(true);
          }

          // Purity: the input pool is never mutated.
          expect(JSON.stringify(agents)).toBe(before);
        }
      ),
      { numRuns: 200 }
    );
  });
});
