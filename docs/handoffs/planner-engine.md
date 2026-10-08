# Planner engine handoff

## Purpose

`src/lib/planner.ts` is a pure, deterministic day-planning module. It does not call React, browser APIs, network services, clocks, or random sources. Given the same inputs, it returns the same ordering, schedule, totals, and warnings.

It solves only the itinerary re-plan step: apply a supplied drag order, sequence the day from a chosen start time, include each destination's recorded transfer duration, total its recorded costs, and make known caveats visible. It deliberately does **not** infer travel times, opening hours, distances, forecasts, or availability.

## Imports for Participant 5

From `src/main.tsx`, use these exact imports:

```ts
import { resequenceDay, getDayWarnings, formatDuration } from './lib/planner';
import type { FeasibilityWarning, PlanningStop } from './lib/contracts';
```

Core integration pattern:

```ts
const result = resequenceDay(dayStops, draggedOrder, '09:30', 140);
setPlan(replaceDay(plan, result.stops));
setWarnings(result.warnings);
```

## `PlanningStop` mapping assumptions

The current live `PlanItem` shape was not present when this isolated engine was created. Participant 5 should map each day item to `PlanningStop` at the UI boundary, then keep the returned fields when mapping back.

| `PlanningStop` field | Required source / mapping assumption |
| --- | --- |
| `id`, `title`, `description` | Existing item identifier and user-visible text. |
| `latitude`, `longitude` | Existing item's coordinates. If the UI stores `{ lat, lng }`, map to these two numeric fields. |
| `durationMinutes` | Existing visit/activity duration as a non-negative number of minutes. |
| `transferFromPreviousMinutes` | Existing per-stop incoming transfer duration. The first stop's value is retained but not applied. |
| `costEUR` | Existing numeric EUR cost for the stop. |
| `isOutdoor`, `weatherRisk` | Two explicit booleans. A weather warning is emitted only when **both** are `true`; this is not a weather forecast. |
| `startTime`, `endTime` | Optional on input; overwritten by `resequenceDay` as 24-hour `HH:MM` display times. |

`orderedIds` should be the full ordered list of drag IDs. If it contains an unknown ID or a duplicate, the planner ignores that entry. If it accidentally omits an input stop, the planner appends that stop in its prior order rather than dropping it from the day.

## Warning behavior

- `budget`: day total is strictly greater than the supplied daily budget.
- `tight-transfer`: a non-first stop has less than 12 minutes recorded for its incoming transfer.
- `weather`: a stop is both `isOutdoor` and `weatherRisk`.
- `late-day`: a scheduled stop ends strictly after 22:30.

Warnings are deterministic: the single budget warning appears first, followed by warnings in stop order (transfer, weather, then late-day for a given stop).

## Complete example

```ts
const dayStops: PlanningStop[] = [
  {
    id: 'museum',
    title: 'Museum of Modern Art',
    description: 'A compact indoor gallery visit.',
    latitude: 40.7614,
    longitude: -73.9776,
    durationMinutes: 90,
    transferFromPreviousMinutes: 0,
    costEUR: 25,
    isOutdoor: false,
    weatherRisk: false,
  },
  {
    id: 'park',
    title: 'Riverside Park',
    description: 'Walk through the riverside gardens.',
    latitude: 40.8007,
    longitude: -73.9705,
    durationMinutes: 60,
    transferFromPreviousMinutes: 10,
    costEUR: 0,
    isOutdoor: true,
    weatherRisk: true,
  },
  {
    id: 'dinner',
    title: 'Late dinner',
    description: 'Dinner reservation near the hotel.',
    latitude: 40.758,
    longitude: -73.9855,
    durationMinutes: 90,
    transferFromPreviousMinutes: 25,
    costEUR: 42.5,
    isOutdoor: false,
    weatherRisk: false,
  },
];

const result = resequenceDay(dayStops, ['park', 'museum', 'dinner'], '20:00', 60);
```

The result is:

```ts
{
  stops: [
    { ...dayStops[1], startTime: '20:00', endTime: '21:00' },
    { ...dayStops[0], startTime: '21:00', endTime: '22:30' },
    { ...dayStops[2], startTime: '22:55', endTime: '00:25' },
  ],
  totalCostEUR: 67.5,
  plannedMinutes: 265,
  warnings: [
    {
      code: 'budget',
      message: 'Day total €67.50 exceeds the €60.00 budget.',
    },
    {
      code: 'weather',
      stopId: 'park',
      message: 'Riverside Park is outdoors and may be affected by weather.',
    },
    {
      code: 'tight-transfer',
      stopId: 'museum',
      message: 'Museum of Modern Art allows only 0 min for the transfer.',
    },
    {
      code: 'late-day',
      stopId: 'dinner',
      message: 'Late dinner ends at 00:25, after the 22:30 cutoff.',
    },
  ],
}
```

The `00:25` end time is wrapped for 24-hour display, while late-day detection uses the absolute schedule duration before that display formatting. This module treats planning as a one-day schedule; it does not model a calendar date or multi-day rollover.

## Formatting helper

`formatDuration(65)` returns `"1 hr 5 min"`; `formatDuration(60)` returns `"1 hr"`; and `formatDuration(8)` returns `"8 min"`.
