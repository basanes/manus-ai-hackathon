# Participant 3 — Group Decisions and Adaptive Planning Engineer

> Paste this document and the [team integration contract](00-team-integration-contract.md) into this participant’s Manus task.

## Mission

Own the two behaviours that make RouteMuse more than a static itinerary: **group consensus** and a transparent **Plan B**. Your module should calculate a simple group pulse and propose a weather-safe alternative while preserving the day’s experience.

## You own

- `src/features/groupTrip.ts`
- `docs/handoffs/group-adaptation.md`

Do **not** edit `src/main.tsx`, `src/styles.css`, `package.json`, or other participant modules.

## Required exports

```ts
import type { PlanningStop } from '../lib/contracts';

export type VoteChoice = 'must-do' | 'nice-to-have' | 'skip';
export type VoteRecord = { travelerId: string; stopId: string; choice: VoteChoice };

export type GroupPulse = {
  mustDoCount: number;
  niceToHaveCount: number;
  skipCount: number;
  summary: string;
};

export type AdaptationProposal = {
  originalStopId: string;
  replacement: PlanningStop;
  reason: string;
  walkingMinutesSaved: number;
  budgetDeltaEUR: number;
  preserves: string[];
};

export function getGroupPulse(votes: VoteRecord[], stopId: string): GroupPulse;
export function proposeRainPlan(stops: PlanningStop[]): AdaptationProposal | null;
export function applyProposal(stops: PlanningStop[], proposal: AdaptationProposal): PlanningStop[];
export function revertProposal(stops: PlanningStop[], proposal: AdaptationProposal, original: PlanningStop): PlanningStop[];
```

## Demo scenario rules

- The seeded crew is **Maya, Jamie, and Alex**.
- The candidate being replaced is `miradouro` / Senhora do Monte.
- The replacement is `museufado` / Museu do Fado: indoor, 65 minutes, €8, transfer allowance 10 minutes, with the existing illustrated Lisbon coordinate.
- Explain the replacement in human terms: it preserves **culture + music**, reduces walking by 18 minutes, and costs €8 more.
- `getGroupPulse` must return a legible statement such as: **“3/3 crew members marked music as a must-do.”**
- No fake weather feed, live availability, or user account model.

## Acceptance criteria

- Pure TypeScript only; no React and no external calls.
- `proposeRainPlan` returns `null` when there is no weather-risk outdoor stop.
- Applying then reverting returns the original itinerary order/content.
- Handoff doc gives exact imports, expected input, and a minimal button flow for Participant 5.

## Handoff to Participant 5

The integration should fit this shape:

```ts
const proposal = proposeRainPlan(dayStops);
// Preview proposal; only change plan after explicit accept
setPlan(applyProposal(plan, proposal));
// On revert, restore the captured original stop
setPlan(revertProposal(plan, proposal, originalStop));
```

Your module must help the UI explain **why** the plan changes, not just swap titles.
