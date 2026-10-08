# Handoff — Inspiration Import (Participant 2)

**Module:** `src/features/inspiration.ts`
**Status:** complete, self-contained, verified against Participant 1's real planner.
**One line:** pasted "saved post" text → three Lisbon candidates with an honest explanation of why each was extracted → one accepted candidate → a `PlanningStop` that `resequenceDay` accepts unchanged.

---

## 1. What this module does and does not do

| Does | Does not |
|---|---|
| Returns three polished Lisbon candidates from any pasted text | Scrape, call, or authenticate against TikTok / Instagram / any platform |
| Explains each extraction in a short, literal reason string | Fetch anything, or use any new dependency |
| Converts an accepted candidate into a complete `PlanningStop` | Render UI, hold state, or import React |
| Labels everything as a demo import | Invent places that are not in the seeded set |

There is no network call anywhere in the file. The pasted text is only used to decide *which* seeded candidates are marked high confidence and *what* the reason string says. The candidate set never changes.

---

## 2. Public API

```ts
import type { PlanningStop } from '../lib/contracts';

export type Interest = 'food' | 'culture' | 'viewpoint' | 'nature' | 'nightlife' | 'shopping';

export type InspirationCandidate = {
  id: string;
  name: string;
  category: Interest;
  sourceLabel: string;          // 'Demo Reel · @lisbonbites'
  extractionReason: string;     // 'Named in caption (“pastéis de nata”) + food tag'
  confidence: 'high' | 'medium';
  costEUR: number;
  durationMinutes: number;
  indoor: boolean;
  weatherRisk?: boolean;
  note: string;
  x: number;                    // schematic map position, 0–100
  y: number;
  latitude: number;             // real WGS84 coordinates
  longitude: number;
};

export function extractDemoCandidates(sourceText: string): InspirationCandidate[];
export function candidateToPlanningStop(
  candidate: InspirationCandidate,
  day: number,
  order: number,
): PlanningStop;

// Extras for the UI banner (safe to ignore)
export const DEMO_IMPORT_DISCLAIMER: string;   // 'Demo import — seeded Lisbon signals.'
export const DEFAULT_TRANSFER_MINUTES: number; // 12
export const FRESH_FIND_NOTE: string;          // 'Fresh find (demo import)'
export const DEMO_SOURCE_PLACEHOLDER: string;  // ready-made example paste for the textarea
export function summariseImport(sourceText: string): {
  label: string; matchedCount: number; totalCount: number; allMatched: boolean;
};
```

---

## 3. Integration for Participant 5 (copy-paste)

```ts
import {
  DEMO_IMPORT_DISCLAIMER,
  candidateToPlanningStop,
  extractDemoCandidates,
} from './features/inspiration';

// replace the in-component candidate data with:
const candidates = extractDemoCandidates(socialInput);
const stop = candidateToPlanningStop(candidate, activeDay, nextOrder);
```

Wiring sketch:

```tsx
const [socialInput, setSocialInput] = useState('');
const [candidates, setCandidates] = useState<InspirationCandidate[]>([]);

function onImport() {
  setCandidates(extractDemoCandidates(socialInput));
}

function onAccept(candidate: InspirationCandidate) {
  // keep the slot in your own state: PlanningStop has no day/order fields,
  // ordering is expressed by the day array and the planner's orderedIds.
  setDayStops((prev) => [...prev, candidateToPlanningStop(candidate, activeDay, prev.length + 1)]);
}
```

Then hand the array straight to Participant 1's planner:

```ts
const result = resequenceDay(dayStops, draggedOrder, '09:30', 140);
setPlan(replaceDay(plan, result.stops));
setWarnings(result.warnings);
```

Two things the UI must handle:

- **Show the disclaimer.** Render `DEMO_IMPORT_DISCLAIMER` once above the candidate list. That banner is the honesty mechanism and what makes the "no scraping" claim in the explainer true.
- **Guard double-adds.** Accepting the same candidate twice creates two stops with the same `id`; the planner tolerates it, but the day would show a duplicate. Disable the accept button after a click (the preview does).

An imported stop behaves correctly in the planner: `weatherRisk` on the outdoor viewpoint raises the expected `weather` warning, and the 12-minute allowance sits exactly on the `tight-transfer` threshold, so it does **not** trigger a false "tight transfer" warning.

---

## 4. Transparency wording the UI must display

> **Demo import — seeded Lisbon signals.**

Recommended supporting line (already produced by `summariseImport`):

> 3 of 3 signals matched your paste · no social platform was accessed

Every candidate also carries `sourceLabel: 'Demo Reel · @lisbonbites'` — a clearly fictional demo reel — and every converted stop's description starts with `Fresh find (demo import):`. Nothing in the flow implies a real platform connection.

---

## 5. Seed data (exactly three, stable)

| id | Name | Category | Why it is in the set | Cost | Duration | Indoor | Weather risk |
|---|---|---|---|---|---|---|---|
| `demo-lisbon-fabrica-da-nata` | Fábrica da Nata | `food` | Low-cost treat that flexes around the schedule | €3.50 | 30 min | yes | no |
| `demo-lisbon-ler-devagar` | Ler Devagar | `culture` | Indoor, map-adjacent addition near LX Factory | Free | 45 min | yes | no |
| `demo-lisbon-alcantara-viewpoint` | Alcântara viewpoint | `viewpoint` | Golden-hour option with visible weather risk | Free | 35 min | no | yes |

Coordinates are real and distinct, so a real map component can plot them:

| Place | Address used | Latitude | Longitude | Schematic x / y |
|---|---|---|---|---|
| Fábrica da Nata | Rua Augusta, Baixa | 38.7107 | -9.1370 | 62 / 42 |
| Ler Devagar | Rua Rodrigues de Faria 103, LX Factory | 38.7037 | -9.1786 | 18 / 60 |
| Alcântara viewpoint | Rocha do Conde de Óbidos, Alcântara | 38.7047 | -9.1705 | 9 / 50 |

IDs are stable and unique, and never change with the input.

### Deterministic matching rules

1. Text is lowercased and accent-stripped, so "Alcântara" matches `alcantara`.
2. Each candidate has a keyword list (`nata`, `lx factory`, `miradouro`, …). A keyword hit → `confidence: 'high'`, reason `Matched “<keyword>” in your paste · seeded demo rule`.
3. If the text mentions Lisbon *and* hits keywords for at least two candidates, it is recognised as the seeded reel and gets the curated reasons ("Named in caption …").
4. Everything else — including an empty textarea — still returns the same three candidates, marked `medium`, with a reason that says `No match in your paste · seeded demo candidate`.

---

## 6. Contract reconciliation (Participant 1, commit `40ea543`)

`candidateToPlanningStop` emits Participant 1's real `PlanningStop` exactly:

| `PlanningStop` field | Emitted value |
|---|---|
| `id` | candidate id (stable, e.g. `demo-lisbon-ler-devagar`) |
| `title` | candidate `name` |
| `description` | `Fresh find (demo import): <candidate note>` |
| `latitude`, `longitude` | candidate's real coordinates, unchanged |
| `durationMinutes` | candidate value |
| `transferFromPreviousMinutes` | **12** (`DEFAULT_TRANSFER_MINUTES`) |
| `costEUR` | candidate value |
| `isOutdoor` | `!candidate.indoor` (the contract is outdoor-positive) |
| `weatherRisk` | candidate value, defaulting to `false` |
| `startTime`, `endTime` | omitted on purpose — `resequenceDay` assigns them |

Two deliberate deviations from the original brief, both forced by the real contract:

1. **`Interest` is defined in this module, not imported.** `src/lib/contracts.ts` is planner-only and exports no category type, and `PlanningStop` has no category field, so the category union lives here and is exported for the UI's own badges/filters. If Participant 1 later exports `Interest`, replace the local definition with an import — one line.
2. **Candidates carry both `x`/`y` and `latitude`/`longitude`.** The brief fixes `x`/`y` on `InspirationCandidate`, so they remain as 0–100 schematic-map positions, while `latitude`/`longitude` were added because the shared contract plots real coordinates. `candidateToPlanningStop` uses the real pair. A schematic map can keep using `x`/`y`; nothing breaks either way.

`day` and `order` are kept in the signature because the integration contract fixes it, but they are intentionally not written into the stop — the shared contract has no slot fields, a day is an array, and the planner derives order from its `orderedIds` argument. Participant 5 keeps `activeDay` / `nextOrder` in their own state, which is where they already come from.

---

## 7. Verification evidence

Run `REPO=/path/to/manus-ai-hackathon bash verification/run.sh`. It syncs Participant 1's real `contracts.ts` and `planner.ts` from the repo, mirrors this module next to them, then runs the checks. Last run:

- static guard: no `react`, no `fetch`, no external import, no new dependency — clean
- `tsc --noEmit --strict` — no type errors
- acceptance + integration test — **58/58 checks passed**, including:
  - the exact three-candidate set, categories, and stable unique ids
  - high/medium confidence behaviour for the reel, arbitrary text, partial matches, and empty input
  - all 10 mandatory `PlanningStop` fields present and non-null, `isOutdoor` inversion, 12-minute allowance, visible "Fresh find" marker, purity of both functions
  - **`resequenceDay` accepts the converted stops**: drag order honoured, `HH:MM` times assigned, `totalCostEUR` €3.50, `plannedMinutes` 134 including both transfers, exactly one `weather` warning pointing at the outdoor viewpoint, and no false `tight-transfer` warning
  - an empty drag payload cannot drop an imported stop

---

## 8. Honest limitations

- **No real platform connection.** This is a deterministic demo import, not a scraper. It will never return a place that is not in the seeded set, whatever is pasted.
- **Keyword matching, not understanding.** Reason strings are literal matches against a fixed keyword list; a paste describing these places in unexpected words falls back to `medium` with "No match in your paste".
- **Three candidates only.** No candidate pool, ranking, or de-duplication against existing stops — `onAccept` must guard against adding the same id twice.
- **No opening hours, no live availability, no travel times.** The 12-minute allowance is a flat default, not a routing estimate; the planner is told explicitly not to infer travel times.
- **Coordinates are seeded, not verified on the ground.** They are the published addresses to the nearest block, good enough to plot; they are not a routing source.
- **Category is UI-only metadata.** It is not part of `PlanningStop`, so it is lost once a candidate becomes a stop.
