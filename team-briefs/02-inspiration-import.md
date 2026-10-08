# Participant 2 — Inspiration Import Engineer

> Paste this document and the [team integration contract](00-team-integration-contract.md) into this participant’s Manus task.

## Mission

Make the “social save → route-ready place” idea feel credible **without pretending to scrape TikTok or Instagram**. Build a deterministic demo-import module that returns Lisbon candidates, explains why they were extracted, and converts an accepted candidate into the shared planning shape.

## You own

- `src/features/inspiration.ts`
- `docs/handoffs/inspiration-import.md`

Do **not** edit `src/main.tsx`, `src/styles.css`, `package.json`, or any Participant 1, 3, or 4 file.

## Required exports

```ts
import type { Interest, PlanningStop } from '../lib/contracts';

export type InspirationCandidate = {
  id: string;
  name: string;
  category: Interest;
  sourceLabel: string;          // Example: 'Demo Reel · @lisbonbites'
  extractionReason: string;     // Example: 'Named in caption + food tag'
  confidence: 'high' | 'medium';
  costEUR: number;
  durationMinutes: number;
  indoor: boolean;
  weatherRisk?: boolean;
  note: string;
  x: number;
  y: number;
};

export function extractDemoCandidates(sourceText: string): InspirationCandidate[];
export function candidateToPlanningStop(
  candidate: InspirationCandidate,
  day: number,
  order: number,
): PlanningStop;
```

## Seed data requirements

Return exactly three polished Lisbon candidates for the default demo source. Keep the existing product logic:

| Candidate | Category | What it proves |
|---|---|---|
| Fábrica da Nata | food | A low-cost treat that can flex around the schedule |
| Ler Devagar | culture | An indoor, map-adjacent addition near LX Factory |
| Alcântara viewpoint | viewpoint | A golden-hour option with weather-risk visibility |

For any other pasted text, still return the same **clearly labelled demo candidate set**. Never imply that an unconnected social platform was actually accessed.

## Acceptance criteria

- No React or UI code.
- No external API, fetch, browser automation, or new dependency.
- Candidate IDs are stable and unique.
- The conversion helper emits all mandatory `PlanningStop` fields, using a safe default transfer allowance of 12 minutes and a visible `Fresh find`/demo note.
- Handoff doc includes one import example and explains the transparency wording the UI should display: **“Demo import — seeded Lisbon signals.”**

## Handoff to Participant 5

The integrator should be able to replace in-component candidate data with:

```ts
const candidates = extractDemoCandidates(socialInput);
const stop = candidateToPlanningStop(candidate, activeDay, nextOrder);
```

Keep the module small and importable. Do not wire it into the interface yourself.
