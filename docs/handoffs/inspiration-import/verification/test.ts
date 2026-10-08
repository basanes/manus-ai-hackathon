/**
 * Acceptance test for src/features/inspiration.ts (Participant 2).
 *
 * Runs against Participant 1's REAL src/lib/contracts.ts and src/lib/planner.ts,
 * so the conversion helper is proven against the shared contract, not a guess.
 * Pure Node — no test framework, no dependencies.
 *
 * Run with: bash verification/run.sh
 */

import {
  DEMO_IMPORT_DISCLAIMER,
  DEMO_SOURCE_PLACEHOLDER,
  DEFAULT_TRANSFER_MINUTES,
  FRESH_FIND_NOTE,
  candidateToPlanningStop,
  extractDemoCandidates,
  summariseImport,
} from './features/inspiration';
import { resequenceDay } from './lib/planner';
import type { PlanningStop } from './lib/contracts';

declare const process: { exitCode?: number };

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail = ''): void {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failures.push(label + (detail ? ` — ${detail}` : ''));
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
}

/* ---------------------------------------------------------------- default */

section('1. Default demo source (the seeded reel)');
const defaultCandidates = extractDemoCandidates(DEMO_SOURCE_PLACEHOLDER);
check('returns exactly three candidates', defaultCandidates.length === 3, `got ${defaultCandidates.length}`);

const names = defaultCandidates.map((c) => c.name).join(' | ');
check('candidate set matches the brief', names === 'Fábrica da Nata | Ler Devagar | Alcântara viewpoint', names);

const categories = defaultCandidates.map((c) => c.category).join(' | ');
check('categories are food | culture | viewpoint', categories === 'food | culture | viewpoint', categories);

check('all default candidates are high confidence', defaultCandidates.every((c) => c.confidence === 'high'));
check('all carry the demo reel source label', defaultCandidates.every((c) => c.sourceLabel === 'Demo Reel · @lisbonbites'));
check('every candidate has a non-empty extraction reason', defaultCandidates.every((c) => c.extractionReason.trim().length > 0));
check('Fábrica da Nata is the cheap food stop', defaultCandidates[0].category === 'food' && defaultCandidates[0].costEUR === 3.5);
check('Ler Devagar is indoor', defaultCandidates[1].category === 'culture' && defaultCandidates[1].indoor === true);
check('Alcântara viewpoint is flagged weather risk', defaultCandidates[2].category === 'viewpoint' && defaultCandidates[2].weatherRisk === true && defaultCandidates[2].indoor === false);

/* -------------------------------------------------------------- fallback */

section('2. Arbitrary pasted text still returns the labelled demo set');
const junk = extractDemoCandidates('a random tweet about my broken dishwasher');
check('still returns exactly three candidates', junk.length === 3, `got ${junk.length}`);
check('same stable ids as the default set', junk.map((c) => c.id).join(',') === defaultCandidates.map((c) => c.id).join(','));
check('nothing claims a high-confidence match', junk.every((c) => c.confidence === 'medium'));
check('reasons admit there was no match', junk.every((c) => c.extractionReason.includes('No match in your paste')));
check('source label stays the demo reel (no fake platform)', junk.every((c) => c.sourceLabel === 'Demo Reel · @lisbonbites'));

const partial = extractDemoCandidates('planning a weekend in Lisbon, want a miradouro at sunset');
check('keyword match upgrades only the matching candidate', partial[2].confidence === 'high' && partial[0].confidence === 'medium');
check('keyword match names the trigger', partial[2].extractionReason.includes('sunset') || partial[2].extractionReason.includes('miradouro'));

const empty = extractDemoCandidates('');
check('empty input still returns the three seeded candidates', empty.length === 3);
check('empty input claims no match', empty.every((c) => c.confidence === 'medium' && c.extractionReason.includes('Nothing pasted yet')));
check('summary on empty input reports 0 of 3', summariseImport('').matchedCount === 0);

const lisbonOnly = extractDemoCandidates('somewhere in Lisbon, no idea where yet');
check('a Lisbon mention alone does not fake a match', lisbonOnly.every((c) => c.confidence === 'medium'));
check('default reel keeps its curated reasons', defaultCandidates[0].extractionReason === 'Named in caption (“pastéis de nata”) + food tag');
check('non-reel match explains itself literally', partial[2].extractionReason.includes('in your paste'));

/* ---------------------------------------------------------------- honesty */

section('3. Honesty wording');
check('disclaimer text is exact', DEMO_IMPORT_DISCLAIMER === 'Demo import — seeded Lisbon signals.');
const summary = summariseImport(DEMO_SOURCE_PLACEHOLDER);
check('summary reports 3 of 3 matched', summary.matchedCount === 3 && summary.totalCount === 3 && summary.allMatched === true);
check('summary carries the disclaimer', summary.label === DEMO_IMPORT_DISCLAIMER);
check('summary on junk reports 0 of 3', summariseImport('dishwasher').matchedCount === 0);

/* ------------------------------------------------------------- stability */

section('4. Stable + unique ids and coordinates');
const ids = defaultCandidates.map((c) => c.id);
check('ids are unique', new Set(ids).size === ids.length);
check('ids are stable across calls', extractDemoCandidates('anything at all').map((c) => c.id).join(',') === ids.join(','));
check('ids are kebab-case and namespaced', ids.every((id) => /^demo-lisbon-[a-z-]+$/.test(id)), ids.join(','));
check('schematic x/y stay inside 0–100', defaultCandidates.every((c) => c.x >= 0 && c.x <= 100 && c.y >= 0 && c.y <= 100));
check('real coordinates are plausible for Lisbon', defaultCandidates.every((c) => c.latitude > 38.6 && c.latitude < 38.8 && c.longitude > -9.3 && c.longitude < -9.0));
check('the three places are geographically distinct', new Set(defaultCandidates.map((c) => `${c.latitude},${c.longitude}`)).size === 3);

/* ------------------------------------------------------------ conversion */

section('5. candidateToPlanningStop emits every mandatory PlanningStop field');
const stop = candidateToPlanningStop(defaultCandidates[0], 1, 2);
const mandatory = [
  'id',
  'title',
  'description',
  'latitude',
  'longitude',
  'durationMinutes',
  'transferFromPreviousMinutes',
  'costEUR',
  'isOutdoor',
  'weatherRisk',
] as const;
const missing = mandatory.filter((key) => stop[key] === undefined || stop[key] === null);
check('no mandatory field is missing or null', missing.length === 0, `missing: ${missing.join(', ')}`);
check('title comes from the candidate name', stop.title === 'Fábrica da Nata');
check('description is visibly marked as a fresh find', stop.description.startsWith(FRESH_FIND_NOTE));
check('description keeps the candidate advice', stop.description.includes('Rua Augusta'));
check('transfer allowance is the safe 12 minutes', stop.transferFromPreviousMinutes === DEFAULT_TRANSFER_MINUTES && DEFAULT_TRANSFER_MINUTES === 12);
check('indoor is inverted into isOutdoor', stop.isOutdoor === false && candidateToPlanningStop(defaultCandidates[2], 1, 3).isOutdoor === true);
check('weatherRisk defaults to false when unset', candidateToPlanningStop({ ...defaultCandidates[1], weatherRisk: undefined }, 2, 1).weatherRisk === false);
check('real coordinates are carried through', stop.latitude === defaultCandidates[0].latitude && stop.longitude === defaultCandidates[0].longitude);
check('cost and duration are preserved', stop.costEUR === 3.5 && stop.durationMinutes === 30);
check('planner-owned times are left unset', stop.startTime === undefined && stop.endTime === undefined);
check('conversion is pure (input untouched)', defaultCandidates[0].note.indexOf('Fresh find') === -1);

/* ------------------------------------------- integration with Participant 1 */

section("6. Integration: Participant 1's resequenceDay accepts the output");
const converted = defaultCandidates.map((c, i) => candidateToPlanningStop(c, 1, i + 1));
const shuffled = [converted[2].id, converted[0].id, converted[1].id];
const day = resequenceDay(converted, shuffled, '09:30', 40);

check('planner keeps all three stops', day.stops.length === 3);
check('planner honours the drag order', day.stops.map((s) => s.id).join(',') === shuffled.join(','));
check('planner assigns HH:MM start and end times', day.stops.every((s) => /^\d{2}:\d{2}$/.test(s.startTime ?? '') && /^\d{2}:\d{2}$/.test(s.endTime ?? '')));
check('first stop starts at the requested 09:30', day.stops[0].startTime === '09:30');
check('day total cost is the €3.50 nata only', day.totalCostEUR === 3.5, String(day.totalCostEUR));
check('planned minutes include both 12-minute transfers', day.plannedMinutes === 30 + 45 + 35 + 12 + 12, String(day.plannedMinutes));

const codes = day.warnings.map((w) => w.code);
check('no tight-transfer warning (12 min is not "tight")', !codes.includes('tight-transfer'), codes.join(','));
check('no budget warning at a €40 budget', !codes.includes('budget'));
const weatherWarnings = day.warnings.filter((w) => w.code === 'weather');
check('exactly one weather warning', weatherWarnings.length === 1, codes.join(','));
check('weather warning points at the outdoor viewpoint', weatherWarnings[0]?.stopId === 'demo-lisbon-alcantara-viewpoint');
check('the weather warning is the expected message', weatherWarnings[0]?.message === 'Alcântara viewpoint is outdoors and may be affected by weather.');

const lateDay = resequenceDay(converted, shuffled, '21:30', 40);
check('a late start produces the late-day warning', lateDay.warnings.some((w) => w.code === 'late-day'));
check('a tight budget produces the budget warning', resequenceDay(converted, shuffled, '09:30', 2).warnings.some((w) => w.code === 'budget'));

const malformed = resequenceDay(converted, [], '09:30', 40);
check('an empty drag payload cannot drop an imported stop', malformed.stops.length === 3);
check('stop identity survives the planner round trip', malformed.stops.every((s: PlanningStop) => s.description.startsWith(FRESH_FIND_NOTE)));

/* ----------------------------------------------------------------- result */

console.log('\n----------------------------------------');
if (failures.length === 0) {
  console.log(`ALL ${passed} CHECKS PASSED`);
} else {
  console.log(`${passed} passed, ${failures.length} FAILED:`);
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exitCode = 1;
}
