/**
 * Inspiration Import — social save → route-ready Lisbon places.
 *
 * Owner: Participant 2 (Inspiration Import Engineer).
 * This file is pure data + pure functions. No React, no UI, no fetch,
 * no browser automation, no new dependencies.
 *
 * ---------------------------------------------------------------------------
 * HONESTY CONTRACT
 * ---------------------------------------------------------------------------
 * We never access TikTok, Instagram or any social platform. Nothing here
 * scrapes, calls out, or parses a real network response. Every candidate is
 * seeded demo data, and every label returned by this module says so.
 *
 * The UI must display `DEMO_IMPORT_DISCLAIMER` ("Demo import — seeded Lisbon
 * signals.") next to any candidate list produced here.
 *
 * ---------------------------------------------------------------------------
 * SHARED CONTRACT (reconciled with Participant 1, commit 40ea543)
 * ---------------------------------------------------------------------------
 * `src/lib/contracts.ts` is planner-only today and defines no `Interest` type
 * and no category field, so the category union below is owned by this module.
 * If Participant 1 later exports `Interest`, swap the local definition for
 * `import type { Interest } from '../lib/contracts';`.
 *
 * `PlanningStop` fields are mapped exactly as Participant 1's handoff
 * specifies: `title`/`description`, `latitude`/`longitude`,
 * `durationMinutes`, `transferFromPreviousMinutes`, `costEUR`, `isOutdoor`,
 * `weatherRisk`. `startTime`/`endTime` are left for `resequenceDay` to assign.
 */

import type { PlanningStop } from '../lib/contracts';

/* -------------------------------------------------------------------------- */
/* Public types                                                               */
/* -------------------------------------------------------------------------- */

/** Owned here because the shared planner contract has no category concept. */
export type Interest = 'food' | 'culture' | 'viewpoint' | 'nature' | 'nightlife' | 'shopping';

export type InspirationCandidate = {
  id: string;
  name: string;
  category: Interest;
  sourceLabel: string; // Example: 'Demo Reel · @lisbonbites'
  extractionReason: string; // Example: 'Named in caption + food tag'
  confidence: 'high' | 'medium';
  costEUR: number;
  durationMinutes: number;
  indoor: boolean;
  weatherRisk?: boolean;
  note: string;
  /** Schematic-map position, 0–100. Kept because the integration contract fixes it. */
  x: number;
  y: number;
  /** Real WGS84 coordinates, carried into `PlanningStop` unchanged. */
  latitude: number;
  longitude: number;
};

/* -------------------------------------------------------------------------- */
/* Exported constants the UI can reuse                                        */
/* -------------------------------------------------------------------------- */

/** Wording the interface must show beside imported candidates. */
export const DEMO_IMPORT_DISCLAIMER = 'Demo import — seeded Lisbon signals.';

/** Safe default transfer allowance applied to every imported stop. */
export const DEFAULT_TRANSFER_MINUTES = 12;

/** Marker prefixed onto every imported stop description, so a judge can see its origin. */
export const FRESH_FIND_NOTE = 'Fresh find (demo import)';

/** Handy example paste for the demo textarea. */
export const DEMO_SOURCE_PLACEHOLDER =
  'Saved reel: "24h in Lisbon — pastéis de nata at Fábrica da Nata, then LX Factory and a sunset miradouro in Alcântara 🌅 #lisbon #food"';

/** The seeded demo reel these candidates come from. */
const DEMO_SOURCE_LABEL = 'Demo Reel · @lisbonbites';

/* -------------------------------------------------------------------------- */
/* Seeded candidate set                                                       */
/* -------------------------------------------------------------------------- */

type Seed = InspirationCandidate & { triggers: string[]; defaultReason: string };

const SEEDS: Seed[] = [
  {
    id: 'demo-lisbon-fabrica-da-nata',
    name: 'Fábrica da Nata',
    category: 'food',
    sourceLabel: DEMO_SOURCE_LABEL,
    extractionReason: 'Named in caption + food tag',
    confidence: 'high',
    costEUR: 3.5,
    durationMinutes: 30,
    indoor: true,
    weatherRisk: false,
    note: 'Pastel de nata counter on Rua Augusta in the Baixa. Cheap, quick, and easy to slot in or drop when the day runs late.',
    x: 62,
    y: 42,
    latitude: 38.7107,
    longitude: -9.137,
    triggers: ['nata', 'pastel', 'pasteis', 'custard', 'fabrica', 'santa justa', 'baixa'],
    defaultReason: 'Named in caption (“pastéis de nata”) + food tag',
  },
  {
    id: 'demo-lisbon-ler-devagar',
    name: 'Ler Devagar',
    category: 'culture',
    sourceLabel: DEMO_SOURCE_LABEL,
    extractionReason: 'Place tag + culture tag',
    confidence: 'high',
    costEUR: 0,
    durationMinutes: 45,
    indoor: true,
    weatherRisk: false,
    note: 'Bookshop inside LX Factory, steps from the Alcântara waterfront. Fully indoor, so it works as the rainy-hour swap.',
    x: 18,
    y: 60,
    latitude: 38.7037,
    longitude: -9.1786,
    triggers: ['ler devagar', 'lx factory', 'livraria', 'bookshop', 'bookstore', 'book', 'library'],
    defaultReason: 'Place tag “LX Factory” + culture tag',
  },
  {
    id: 'demo-lisbon-alcantara-viewpoint',
    name: 'Alcântara viewpoint',
    category: 'viewpoint',
    sourceLabel: DEMO_SOURCE_LABEL,
    extractionReason: 'Golden-hour cue in caption + viewpoint tag',
    confidence: 'high',
    costEUR: 0,
    durationMinutes: 35,
    indoor: false,
    weatherRisk: true,
    note: 'Golden-hour views over the 25 de Abril bridge from Rocha do Conde de Óbidos. Free, but skip it in rain or high wind.',
    x: 9,
    y: 50,
    latitude: 38.7047,
    longitude: -9.1705,
    triggers: ['alcantara', 'miradouro', 'viewpoint', 'view point', 'sunset', 'golden hour', 'ponte', 'bridge'],
    defaultReason: 'Golden-hour cue (“sunset miradouro”) + viewpoint tag',
  },
];

/* -------------------------------------------------------------------------- */
/* Deterministic demo matching                                                */
/* -------------------------------------------------------------------------- */

/** Lowercase and strip accents so “Alcântara” matches “alcantara”. */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Trigger keywords each seeded candidate is matched against. */
function matchedTriggers(normalised: string): string[][] {
  return SEEDS.map((seed) => seed.triggers.filter((trigger) => normalised.includes(trigger)));
}

/**
 * True when the paste is the seeded demo reel itself: the text is
 * Lisbon-related *and* carries signals for at least two of the three
 * candidates. Only then do we use the curated "named in the caption" reasons;
 * every other paste — including an empty field — gets a plain, literal
 * explanation of what was (or was not) matched.
 */
function isDefaultReel(normalised: string, matches: string[][]): boolean {
  const isLisbon =
    normalised.includes('lisbon') ||
    normalised.includes('lisboa') ||
    normalised.includes('lisbonbites');
  return isLisbon && matches.filter((m) => m.length > 0).length >= 2;
}

/**
 * Turn a pasted "saved post" into route-ready Lisbon candidates.
 *
 * Always returns the same three seeded demo candidates — the module is
 * deterministic and offline by design. The pasted text is only used to decide
 * which candidates are marked `high` confidence and what the extraction reason
 * says; it never changes the candidate set, and nothing is ever fetched.
 */
export function extractDemoCandidates(sourceText: string): InspirationCandidate[] {
  const text = normalise(sourceText ?? '');
  const matches = matchedTriggers(text);
  const isDefault = isDefaultReel(text, matches);

  return SEEDS.map((seed, index) => {
    const matchedTrigger = matches[index][0];

    let confidence: InspirationCandidate['confidence'];
    let extractionReason: string;

    if (isDefault && matchedTrigger) {
      confidence = 'high';
      extractionReason = seed.defaultReason;
    } else if (matchedTrigger) {
      confidence = 'high';
      extractionReason = `Matched “${matchedTrigger}” in your paste · seeded demo rule`;
    } else {
      confidence = 'medium';
      extractionReason =
        text.length === 0
          ? 'Nothing pasted yet · seeded demo candidate'
          : 'No match in your paste · seeded demo candidate';
    }

    return {
      id: seed.id,
      name: seed.name,
      category: seed.category,
      sourceLabel: seed.sourceLabel,
      extractionReason,
      confidence,
      costEUR: seed.costEUR,
      durationMinutes: seed.durationMinutes,
      indoor: seed.indoor,
      weatherRisk: seed.weatherRisk,
      note: seed.note,
      x: seed.x,
      y: seed.y,
      latitude: seed.latitude,
      longitude: seed.longitude,
    };
  });
}

/**
 * Small helper for the banner above the candidate list.
 * Example output: { label: 'Demo import — seeded Lisbon signals.',
 *                   matchedCount: 3, totalCount: 3, allMatched: true }
 */
export function summariseImport(sourceText: string): {
  label: string;
  matchedCount: number;
  totalCount: number;
  allMatched: boolean;
} {
  const candidates = extractDemoCandidates(sourceText);
  const matchedCount = candidates.filter((c) => c.confidence === 'high').length;

  return {
    label: DEMO_IMPORT_DISCLAIMER,
    matchedCount,
    totalCount: candidates.length,
    allMatched: matchedCount === candidates.length,
  };
}

/* -------------------------------------------------------------------------- */
/* Conversion into the shared planning shape                                  */
/* -------------------------------------------------------------------------- */

/**
 * Convert an accepted candidate into a `PlanningStop` for Participant 1's planner.
 *
 * Every required field is emitted: `id`, `title`, `description` (marked
 * "Fresh find (demo import)"), real `latitude`/`longitude`,
 * `durationMinutes`, the 12-minute `transferFromPreviousMinutes` allowance,
 * `costEUR`, `isOutdoor` (inverted from the candidate's `indoor`), and
 * `weatherRisk`. `startTime`/`endTime` are deliberately omitted — `resequenceDay`
 * assigns them.
 *
 * `day` and `order` are kept because the team integration contract fixes this
 * signature, but the shared `PlanningStop` has no slot fields: a day is an array
 * of stops and the planner derives ordering from its `orderedIds` argument. They
 * are therefore intentionally not written into the stop.
 */
export function candidateToPlanningStop(
  candidate: InspirationCandidate,
  day: number,
  order: number,
): PlanningStop {
  void day;
  void order;

  return {
    id: candidate.id,
    title: candidate.name,
    description: `${FRESH_FIND_NOTE}: ${candidate.note}`,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    durationMinutes: candidate.durationMinutes,
    transferFromPreviousMinutes: DEFAULT_TRANSFER_MINUTES,
    costEUR: candidate.costEUR,
    isOutdoor: !candidate.indoor,
    weatherRisk: candidate.weatherRisk ?? false,
  };
}
