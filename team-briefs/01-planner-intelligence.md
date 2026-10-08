# Participant 1 — Planning Intelligence Engineer

> Paste this document and the [team integration contract](00-team-integration-contract.md) into this participant’s Manus task.

## Mission

Turn the itinerary’s current hard-coded scheduling behaviour into a **small, deterministic planning engine**. The goal is not AI magic. The goal is to show a judge transparent logic: the route is re-sequenced, transfers are allowed for, costs are totalled, and conflicts become readable warnings.

## You own

- `src/lib/contracts.ts`
- `src/lib/planner.ts`
- `docs/handoffs/planner-engine.md`

Do **not** edit `src/main.tsx`, `src/styles.css`, `package.json`, or files owned by any other participant.

## Required exports

Create these pure functions. They must not use React, browser APIs, network calls, or random data.

```ts
import type { PlanningStop, FeasibilityWarning } from './contracts';

export type ReplanResult = {
  stops: PlanningStop[];
  totalCostEUR: number;
  plannedMinutes: number;
  warnings: FeasibilityWarning[];
};

export function resequenceDay(
  stops: PlanningStop[],
  orderedIds: string[],
  dayStart: string,
  dailyBudgetEUR: number,
): ReplanResult;

export function getDayWarnings(
  stops: PlanningStop[],
  dailyBudgetEUR: number,
): FeasibilityWarning[];

export function formatDuration(totalMinutes: number): string;
```

## Behaviour rules

- Re-sequence only a supplied day’s stops.
- Start the first stop at `dayStart`.
- Each next start time = previous start + previous duration + that stop’s `transferFromPreviousMinutes`.
- Preserve the selected order, descriptions, coordinates, and costs.
- Return a `budget` warning if total cost exceeds the budget.
- Return a `tight-transfer` warning if any transfer is under 12 minutes.
- Return a `weather` warning for any outdoor `weatherRisk` stop.
- Return a `late-day` warning if a stop ends after 22:30.
- Do not invent distances, opening hours, external data, or weather forecasts.

## Acceptance criteria

- The module compiles under strict TypeScript.
- It has no dependency beyond the shared contract.
- Its functions are deterministic: identical input returns identical output.
- `docs/handoffs/planner-engine.md` contains one complete example input/output and the exact imports Participant 5 needs.

## Handoff to Participant 5

Give the integrator this example usage:

```ts
const result = resequenceDay(dayStops, draggedOrder, '09:30', 140);
setPlan(replaceDay(plan, result.stops));
setWarnings(result.warnings);
```

State explicitly whether any assumptions in the current `PlanItem` shape need mapping to `PlanningStop`. Do not change the live UI yourself.
