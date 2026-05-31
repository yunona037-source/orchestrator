/**
 * README Validator for the Rebranding Layer (`src/rebrand/`)
 *
 * Verifies the *structural* invariants the requirements impose on the rewritten
 * README (Requirements 2.2, 2.4, 2.5, 2.6, 2.7, 2.8). The validator is a pure
 * function over the README text: it never reads or writes files.
 *
 * The README is treated as Markdown. Sections are delimited by ATX headings
 * (`#`..`######`); the project title is the first level-1 heading (`# ...`); the
 * intro is the narrative text located between the title and the next heading.
 * Heading detection, ordered-list detection and narrative extraction all ignore
 * fenced code blocks (```` ``` ```` / `~~~`).
 *
 * Detection heuristics (documented so they stay predictable across tests):
 * - `what-it-does`  : a heading whose words include both "what" and "does".
 * - `who-its-for`   : a heading whose words include both "who" and "for"
 *                     (apostrophes are normalized away, so "who it's for" matches).
 * - `how-to-start`  : a heading containing one of "how to start", "getting started",
 *                     "quick start", "get started", "how to use", OR whose words
 *                     include "how" together with "start"/"begin".
 * - intro narrative : every non-blank, non-rule, non-heading line between the title
 *                     and the next heading (blockquote/list markers are stripped).
 * - numbered steps  : ordered-list items (`1. ...`) or numbered sub-headings
 *                     (`### 1. ...`) inside the "how to start" section.
 *
 * Validates: Requirements 2.2, 2.4, 2.5, 2.6, 2.7, 2.8
 */

import {
  BRANDING_TOKENS,
  RebrandConfig,
  RequiredSection,
  ReadmeValidationResult,
} from './types.js';

/** Mandatory README sections, in a stable reporting order (Req 2.4, 2.7). */
const REQUIRED_SECTIONS: readonly RequiredSection[] = [
  'what-it-does',
  'who-its-for',
  'how-to-start',
];

/** Maximum number of words allowed per intro sentence (Req 2.2). */
const MAX_INTRO_SENTENCE_WORDS = 25;

/**
 * Minimum number of numbered steps required for the "how to start" section to
 * count as having step-by-step instructions. Requirement 2.5 asks for numbered
 * steps covering BOTH installation and first run, so at least two are required.
 */
const MIN_NUMBERED_STEPS = 2;

/** A parsed ATX heading. */
interface Heading {
  /** Heading level (1..6). */
  level: number;
  /** Raw heading text (after the `#` markers, trimmed). */
  text: string;
  /** Normalized heading text: lowercased, alphanumerics + single spaces. */
  normalized: string;
  /** 0-based index of the heading's line in the document. */
  lineIndex: number;
}

/**
 * Validates the structure of a README against Requirements 2.2-2.8.
 *
 * @param readme - Full README markdown text.
 * @param config - Rebrand configuration (accepted for interface completeness;
 *   the old-project-name check relies on the fixed {@link BRANDING_TOKENS}).
 * @returns A {@link ReadmeValidationResult} describing every structural finding.
 */
export function validateReadme(
  readme: string,
  config: RebrandConfig
): ReadmeValidationResult {
  void config;

  const lines = readme.split(/\r\n|\r|\n/);
  const codeMask = computeCodeFenceMask(lines);
  const headings = parseHeadings(lines, codeMask);

  const missingSections = findMissingSections(headings);
  const usesOldNameAsProjectName = detectOldNameAsProjectName(headings);
  const { introIsFirstSection, introSentencesOverLimit } = analyzeIntro(
    lines,
    codeMask,
    headings
  );
  const howToStartHasNumberedSteps = analyzeHowToStartSteps(
    lines,
    codeMask,
    headings
  );

  const isComplete =
    missingSections.length === 0 &&
    !usesOldNameAsProjectName &&
    introIsFirstSection &&
    introSentencesOverLimit.length === 0 &&
    howToStartHasNumberedSteps;

  return {
    missingSections,
    usesOldNameAsProjectName,
    introIsFirstSection,
    introSentencesOverLimit,
    howToStartHasNumberedSteps,
    isComplete,
  };
}

/**
 * Computes, for each line, whether it lies inside a fenced code block (the fence
 * delimiter lines themselves are marked as inside). Used to ignore headings and
 * ordered-list items that appear inside code samples.
 */
function computeCodeFenceMask(lines: string[]): boolean[] {
  const mask: boolean[] = new Array(lines.length).fill(false);
  let inFence = false;

  lines.forEach((line, i) => {
    const isFenceDelimiter = /^\s*(```|~~~)/.test(line);
    if (isFenceDelimiter) {
      // The delimiter line belongs to the code block on both open and close.
      mask[i] = true;
      inFence = !inFence;
      return;
    }
    mask[i] = inFence;
  });

  return mask;
}

/** Parses every ATX heading outside fenced code blocks. */
function parseHeadings(lines: string[], codeMask: boolean[]): Heading[] {
  const headings: Heading[] = [];

  lines.forEach((line, i) => {
    if (codeMask[i]) {
      return;
    }
    // ATX heading: 1-6 leading '#', a space, then the text (trailing '#' allowed).
    const match = /^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (match) {
      const text = match[2].trim();
      headings.push({
        level: match[1].length,
        text,
        normalized: normalizeHeading(text),
        lineIndex: i,
      });
    }
  });

  return headings;
}

/**
 * Normalizes a heading: lowercases, replaces every non-alphanumeric character
 * (emoji, punctuation, apostrophes) with a space, and collapses whitespace.
 */
function normalizeHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Returns the mandatory sections that are absent from the README (Req 2.4, 2.7). */
function findMissingSections(headings: Heading[]): RequiredSection[] {
  const present = new Set<RequiredSection>();

  for (const heading of headings) {
    const words = heading.normalized.split(' ').filter((w) => w.length > 0);
    if (hasWord(words, 'what') && hasWord(words, 'does')) {
      present.add('what-it-does');
    }
    if (hasWord(words, 'who') && hasWord(words, 'for')) {
      present.add('who-its-for');
    }
    if (isHowToStartHeading(heading.normalized, words)) {
      present.add('how-to-start');
    }
  }

  return REQUIRED_SECTIONS.filter((section) => !present.has(section));
}

/** Whether a normalized "how to start" section heading was matched. */
function isHowToStartHeading(normalized: string, words: string[]): boolean {
  const phrases = [
    'how to start',
    'getting started',
    'quick start',
    'get started',
    'how to use',
  ];
  if (phrases.some((phrase) => normalized.includes(phrase))) {
    return true;
  }
  return (
    hasWord(words, 'how') &&
    (hasWord(words, 'start') || hasWord(words, 'begin'))
  );
}

/** Exact-token membership check (avoids matching substrings like "forward"). */
function hasWord(words: string[], word: string): boolean {
  return words.includes(word);
}

/**
 * Detects whether the old project name is used as the project name. The README
 * declares its project name in the level-1 title, so the title is the canonical
 * place to check; any {@link BRANDING_TOKENS} occurrence there (case-insensitive)
 * counts (Req 2.6, 2.8).
 */
function detectOldNameAsProjectName(headings: Heading[]): boolean {
  const title = findTitle(headings);
  if (!title) {
    return false;
  }
  const lowered = title.text.toLowerCase();
  return BRANDING_TOKENS.some((token) => lowered.includes(token));
}

/** The README title is the first level-1 heading. */
function findTitle(headings: Heading[]): Heading | undefined {
  return headings.find((heading) => heading.level === 1);
}

/**
 * Analyzes the intro section: whether it is the first section after the title
 * (Req 2.2) and which of its sentences exceed the 25-word limit (Req 2.2).
 */
function analyzeIntro(
  lines: string[],
  codeMask: boolean[],
  headings: Heading[]
): { introIsFirstSection: boolean; introSentencesOverLimit: number[] } {
  const title = findTitle(headings);
  if (!title) {
    return { introIsFirstSection: false, introSentencesOverLimit: [] };
  }

  const nextHeading = headings.find((h) => h.lineIndex > title.lineIndex);
  const introEnd = nextHeading ? nextHeading.lineIndex : lines.length;
  const introText = extractNarrative(
    lines,
    codeMask,
    title.lineIndex + 1,
    introEnd
  );

  const introIsFirstSection = introText.length > 0;
  const introSentencesOverLimit = introIsFirstSection
    ? sentencesOverLimit(introText)
    : [];

  return { introIsFirstSection, introSentencesOverLimit };
}

/**
 * Joins the narrative text in `[start, end)`, ignoring fenced code, blank lines
 * and horizontal rules, and stripping blockquote / list markers.
 */
function extractNarrative(
  lines: string[],
  codeMask: boolean[],
  start: number,
  end: number
): string {
  const parts: string[] = [];

  for (let i = start; i < end; i++) {
    if (codeMask[i]) {
      continue;
    }
    let text = lines[i].trim();
    if (text === '') {
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(text)) {
      continue; // horizontal rule
    }
    if (/^#{1,6}\s/.test(text)) {
      continue; // defensive: a heading should not appear in the intro slice
    }
    text = text.replace(/^>\s?/, ''); // blockquote marker
    text = text.replace(/^[-*+]\s+/, ''); // unordered list marker
    text = text.replace(/^\d+\.\s+/, ''); // ordered list marker
    text = text.trim();
    if (text !== '') {
      parts.push(text);
    }
  }

  return parts.join(' ');
}

/**
 * Splits the intro into sentences and returns the 0-based indices of sentences
 * whose word count exceeds {@link MAX_INTRO_SENTENCE_WORDS}.
 */
function sentencesOverLimit(introText: string): number[] {
  const overLimit: number[] = [];

  splitSentences(introText).forEach((sentence, index) => {
    const words = sentence.split(/\s+/).filter((w) => w.length > 0);
    if (words.length > MAX_INTRO_SENTENCE_WORDS) {
      overLimit.push(index);
    }
  });

  return overLimit;
}

/** Splits text into sentences on terminal punctuation (`.`, `!`, `?`). */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

/**
 * Determines whether the "how to start" section contains numbered step-by-step
 * instructions (Req 2.5). Returns `false` when the section is absent.
 */
function analyzeHowToStartSteps(
  lines: string[],
  codeMask: boolean[],
  headings: Heading[]
): boolean {
  const index = headings.findIndex((heading) => {
    const words = heading.normalized.split(' ').filter((w) => w.length > 0);
    return isHowToStartHeading(heading.normalized, words);
  });
  if (index === -1) {
    return false;
  }

  const [start, end] = sectionBodyRange(headings, index, lines.length);
  return countNumberedSteps(lines, codeMask, start, end) >= MIN_NUMBERED_STEPS;
}

/**
 * Computes the body line range `[start, end)` of the heading at `index`: from the
 * line after the heading up to the next heading of the same or higher level (so
 * numbered sub-headings nested under the section are included).
 */
function sectionBodyRange(
  headings: Heading[],
  index: number,
  totalLines: number
): [number, number] {
  const heading = headings[index];
  const start = heading.lineIndex + 1;
  let end = totalLines;

  for (let j = index + 1; j < headings.length; j++) {
    if (headings[j].level <= heading.level) {
      end = headings[j].lineIndex;
      break;
    }
  }

  return [start, end];
}

/**
 * Counts numbered steps in `[start, end)`: ordered-list items (`1. ...`) and
 * numbered sub-headings (`### 1. ...`), ignoring fenced code blocks.
 */
function countNumberedSteps(
  lines: string[],
  codeMask: boolean[],
  start: number,
  end: number
): number {
  let count = 0;

  for (let i = start; i < end; i++) {
    if (codeMask[i]) {
      continue;
    }
    const headingMatch = /^ {0,3}#{1,6}\s+(.*)$/.exec(lines[i]);
    const candidate = headingMatch ? headingMatch[1] : lines[i];
    if (/^\s*\d+\.\s+\S/.test(candidate)) {
      count++;
    }
  }

  return count;
}
