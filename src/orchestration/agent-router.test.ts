/**
 * Example-based unit tests for agent routing edge cases
 * (`src/orchestration/agent-router.ts` → {@link route}).
 *
 * These cover the concrete edge cases called out by Task 7.4 as worked
 * examples, complementing the universal routing property test (Task 7.3):
 *
 * - An agent declared with exactly one specialization label (Req 5.1): a single
 *   Specialist_Agent whose label matches the area, free, executor not busy →
 *   `route` returns `assigned` to that agent.
 * - Pools with duplicate labels — several agents sharing the same
 *   specialization (Req 5.2): given two agents with the same matching label,
 *   `route` assigns to one of the free matching agents; if one is busy and the
 *   other free, it assigns to the free one; if both are busy it returns
 *   `queued`.
 * - No matching agent → `blocked` with the unmatched area echoed back.
 *
 * Validates: Requirements 5.1, 5.2
 */

import { describe, it, expect } from 'vitest';
import { route, SpecialistAgent, RouteOutcome } from './agent-router.js';

describe('route - single agent with exactly one specialization label (Req 5.1)', () => {
  it('assigns to the single matching free agent when the executor is not busy', () => {
    const agents: SpecialistAgent[] = [
      { id: 'js-1', specialization: 'javascript', busy: false },
    ];

    const outcome = route('javascript', agents, false);

    expect(outcome).toEqual<RouteOutcome>({ kind: 'assigned', agentId: 'js-1' });
  });

  it('queues when the single matching agent is itself busy', () => {
    const agents: SpecialistAgent[] = [
      { id: 'js-1', specialization: 'javascript', busy: true },
    ];

    const outcome = route('javascript', agents, false);

    expect(outcome).toEqual<RouteOutcome>({ kind: 'queued' });
  });

  it('queues when the single matching agent is free but the executor is busy (one Task at a time)', () => {
    const agents: SpecialistAgent[] = [
      { id: 'js-1', specialization: 'javascript', busy: false },
    ];

    const outcome = route('javascript', agents, true);

    expect(outcome).toEqual<RouteOutcome>({ kind: 'queued' });
  });
});

describe('route - pools with duplicate specialization labels (Req 5.2)', () => {
  it('assigns to one of the free matching agents when several share the label and all are free', () => {
    const agents: SpecialistAgent[] = [
      { id: 'rust-1', specialization: 'rust', busy: false },
      { id: 'rust-2', specialization: 'rust', busy: false },
    ];

    const outcome = route('rust', agents, false);

    expect(outcome.kind).toBe('assigned');
    // The chosen agent must be one of the free matching agents.
    if (outcome.kind === 'assigned') {
      expect(['rust-1', 'rust-2']).toContain(outcome.agentId);
    }
  });

  it('assigns to the free agent when one duplicate-label agent is busy and the other is free', () => {
    const agents: SpecialistAgent[] = [
      { id: 'rust-1', specialization: 'rust', busy: true },
      { id: 'rust-2', specialization: 'rust', busy: false },
    ];

    const outcome = route('rust', agents, false);

    expect(outcome).toEqual<RouteOutcome>({ kind: 'assigned', agentId: 'rust-2' });
  });

  it('queues when both duplicate-label agents are busy', () => {
    const agents: SpecialistAgent[] = [
      { id: 'rust-1', specialization: 'rust', busy: true },
      { id: 'rust-2', specialization: 'rust', busy: true },
    ];

    const outcome = route('rust', agents, false);

    expect(outcome).toEqual<RouteOutcome>({ kind: 'queued' });
  });
});

describe('route - no matching agent → blocked with unmatched area', () => {
  it('blocks and echoes the unmatched area when the pool is empty', () => {
    const outcome = route('python', [], false);

    expect(outcome).toEqual<RouteOutcome>({
      kind: 'blocked',
      unmatchedArea: 'python',
    });
  });

  it('blocks and echoes the unmatched area when no agent carries the matching label', () => {
    const agents: SpecialistAgent[] = [
      { id: 'js-1', specialization: 'javascript', busy: false },
      { id: 'rust-1', specialization: 'rust', busy: false },
    ];

    const outcome = route('python', agents, false);

    expect(outcome).toEqual<RouteOutcome>({
      kind: 'blocked',
      unmatchedArea: 'python',
    });
  });
});
