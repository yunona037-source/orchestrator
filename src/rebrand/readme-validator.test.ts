/**
 * Sanity unit tests for the README structure validator.
 *
 * These cover concrete examples and edge cases for `validateReadme`. The
 * universal property for missing sections (Property 4) is implemented separately
 * in task 3.2; this file exercises the remaining structural rules with examples.
 *
 * Requirements covered: 2.2, 2.3, 2.4, 2.5, 2.6, 2.8.
 */

import { describe, it, expect } from 'vitest';
import { validateReadme } from './readme-validator.js';
import { RebrandConfig } from './types.js';

/** Representative rebrand configuration used across the tests. */
const config: RebrandConfig = {
  newProjectName: 'Flow Orchestrator',
  newPackageName: 'flow-orchestrator',
  newCliCommand: 'flow-orch',
  newModeSlug: 'flow-orchestrator',
};

/** Builds a README from lines, joining with newlines. */
function readme(...lines: string[]): string {
  return lines.join('\n');
}

describe('validateReadme - intro section position (Req 2.2)', () => {
  it('flags the intro as the first section when narrative follows the title', () => {
    const text = readme(
      '# Flow Orchestrator',
      '',
      'Flow Orchestrator helps you run tasks. It keeps things simple.',
      '',
      '## What it does',
      '',
      'It does useful work.'
    );

    expect(validateReadme(text, config).introIsFirstSection).toBe(true);
  });

  it('does not flag an intro when a heading immediately follows the title', () => {
    const text = readme(
      '# Flow Orchestrator',
      '',
      '## What it does',
      '',
      'It does useful work.'
    );

    expect(validateReadme(text, config).introIsFirstSection).toBe(false);
  });
});

describe('validateReadme - intro sentence length (Req 2.2)', () => {
  it('reports no over-limit sentences when every sentence is 25 words or fewer', () => {
    const text = readme(
      '# Flow Orchestrator',
      '',
      'Flow Orchestrator helps you run tasks. It is a simple tool.',
      '',
      '## What it does',
      '',
      'Work.'
    );

    expect(validateReadme(text, config).introSentencesOverLimit).toEqual([]);
  });

  it('reports the index of an intro sentence that exceeds 25 words', () => {
    // Sentence 0 has 5 words; sentence 1 has 34 words (> 25).
    const longSentence =
      'It can read and write and update and validate and check and scan and ' +
      'rename and verify and report and route and queue and plan and design ' +
      'and build and test and ship today.';
    const text = readme(
      '# Flow Orchestrator',
      '',
      `Flow Orchestrator is a tool. ${longSentence}`,
      '',
      '## What it does',
      '',
      'Work.'
    );

    expect(validateReadme(text, config).introSentencesOverLimit).toEqual([1]);
  });
});

describe('validateReadme - required sections (Req 2.4)', () => {
  it('reports no missing sections when all three required sections are present', () => {
    const text = readme(
      '# Flow Orchestrator',
      '',
      'Intro text here.',
      '',
      '## What it does',
      '',
      'It does useful work.',
      '',
      "## Who it's for",
      '',
      'It is for developers.',
      '',
      '## How to start',
      '',
      '1. Install the package.',
      '2. Run the command.'
    );

    expect(validateReadme(text, config).missingSections).toEqual([]);
  });

  it('reports the section that is missing', () => {
    const text = readme(
      '# Flow Orchestrator',
      '',
      'Intro text here.',
      '',
      '## What it does',
      '',
      'It does useful work.',
      '',
      "## Who it's for",
      '',
      'It is for developers.'
    );

    expect(validateReadme(text, config).missingSections).toEqual([
      'how-to-start',
    ]);
  });
});

describe('validateReadme - how-to-start numbered steps (Req 2.5)', () => {
  it('flags numbered steps when the section lists 1. / 2. instructions', () => {
    const text = readme(
      '## How to start',
      '',
      '1. Install the package.',
      '2. Run the command.'
    );

    expect(validateReadme(text, config).howToStartHasNumberedSteps).toBe(true);
  });

  it('does not flag numbered steps when the section has only prose', () => {
    const text = readme(
      '## How to start',
      '',
      'Just download the package and run it right away.'
    );

    expect(validateReadme(text, config).howToStartHasNumberedSteps).toBe(false);
  });
});

describe('validateReadme - old name as project title (Req 2.6, 2.8)', () => {
  it('flags the old name when used as the project title', () => {
    const text = readme(
      '# Roo Commander',
      '',
      'An orchestrator tool.'
    );

    expect(validateReadme(text, config).usesOldNameAsProjectName).toBe(true);
  });

  it('does not flag a clean title that uses the new project name', () => {
    const text = readme(
      '# Flow Orchestrator',
      '',
      'An orchestrator tool.'
    );

    expect(validateReadme(text, config).usesOldNameAsProjectName).toBe(false);
  });
});

describe('validateReadme - fully valid README', () => {
  it('is complete when every structural rule is satisfied', () => {
    const text = readme(
      '# Flow Orchestrator',
      '',
      'Flow Orchestrator helps you run tasks. It keeps things simple.',
      '',
      '## What it does',
      '',
      'It does useful work.',
      '',
      "## Who it's for",
      '',
      'It is for developers.',
      '',
      '## How to start',
      '',
      '1. Install the package.',
      '2. Run the command.'
    );

    const result = validateReadme(text, config);

    expect(result).toEqual({
      missingSections: [],
      usesOldNameAsProjectName: false,
      introIsFirstSection: true,
      introSentencesOverLimit: [],
      howToStartHasNumberedSteps: true,
      isComplete: true,
    });
  });
});
