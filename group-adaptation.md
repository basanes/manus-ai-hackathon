# Handoff — Group decisions & adaptive planning (Participant 3 → Participant 5)

Owner: Participant 3 — Group Decisions and Adaptive Planning Engineer.
Module: `src/features/groupTrip.ts` (pure TypeScript; no React, no I/O, no network calls).
Typed against the existing shared contract in `src/lib/contracts.ts` — no changes to that file are
required.

## 1. Exact imports

```ts
import {
  getGroupPulse,
  proposeRainPlan,
  applyProposal,
  revertProposal,
  type VoteChoice,
  type VoteRecord,
  type GroupPulse,
  type AdaptationProposal,
} from "./features/groupTrip";

import type { PlanningStop } from "./lib/contracts";
```

## 2. Fields this module reads from `PlanningStop`

It reads exactly these, and nothing else:

| `PlanningStop` field | Used for |
| --- | --- |
| `id` | vote keying, swap target, pulse label lookup |
| `title` | human-readable proposal reason |
| `description` | carried into the replacement unchanged |
| `latitude`, `longitude` | carried into the replacement unchanged |
| `durationMinutes` | proposal reason |
| `transferFromPreviousMinutes` | `walkingMinutesSaved` |
| `costEUR` | `budgetDeltaEUR` |
| `isOutdoor`, `weatherRisk` | the weather-risk test |

`startTime` / `endTime` are ignored by this module and are safe to leave assigned by
`resequenceDay`.

**Why `transferFromPreviousMinutes` is the walking measure:** the shared contract records movement
only as the transfer from the previous stop, so that is what the swap is measured against. The
seeded scenario sets the viewpoint's transfer to 28 min and Museu do Fado's to 10 min, which is the
"18 minutes less walking" claim.

**Weather risk is not a forecast.** A stop is weather-risky when `isOutdoor && weatherRisk` — the
same condition `planner.ts` uses for its `weather` warning, so the two modules agree by
construction. Nothing in this module calls a weather service.

## 3. Exact inputs and outputs

```ts
getGroupPulse(votes: VoteRecord[], stopId: string): GroupPulse
```

- `VoteRecord = { travelerId: string; stopId: string; choice: "must-do" | "nice-to-have" | "skip" }`
- Returns `{ mustDoCount, niceToHaveCount, skipCount, summary }`.
- `summary` examples, exactly as produced:
  - `"3/3 crew members marked music as a must-do."`
  - `"2/3 crew members marked streets as a must-do."`
  - `"2/3 crew members want to skip views."`
  - `"The crew is split on views: 1 must-do, 1 nice-to-have, 1 skip."` (no majority is never smoothed
    into a false consensus)
  - `"No votes yet on views."`
- Readable wording needs a stop id → theme label map, because the required signature passes only an
  id. The module carries a small `THEME_LABEL_BY_STOP` registry for the seeded Lisbon stops and falls
  back to the raw id. Add your stop ids there, or use ids that read well in a sentence.

```ts
proposeRainPlan(stops: PlanningStop[]): AdaptationProposal | null
```

- Finds the **first** stop where `isOutdoor && weatherRisk`.
- Returns `null` when there is no such stop, and also when the risky stop has no vetted entry in
  `PLAN_B_CATALOG`. It never invents an alternative.
- For the seeded scenario it returns:

```ts
{
  originalStopId: "miradouro",
  replacement: {
    id: "museufado",
    title: "Museu do Fado",
    description: "Fado history and a listening room, two lanes down from the viewpoint.",
    latitude: 38.7112,
    longitude: -9.1279,
    durationMinutes: 65,
    transferFromPreviousMinutes: 10,
    costEUR: 8,
    isOutdoor: false,
    weatherRisk: false,
  },
  reason: "Rain is likely during “Miradouro da Senhora do Monte” (outdoor, 30 min). “Museu do Fado” is indoor: 65 min, €8, 10 min transfer allowance. It keeps the culture + music thread of the day, cuts walking by 18 min, and costs €8 more per person.",
  walkingMinutesSaved: 18,
  budgetDeltaEUR: 8,
  preserves: ["culture", "music"],
}
```

```ts
applyProposal(stops: PlanningStop[], proposal: AdaptationProposal): PlanningStop[]
revertProposal(stops: PlanningStop[], proposal: AdaptationProposal, original: PlanningStop): PlanningStop[]
```

- Both are pure: inputs are never mutated, and order is preserved — the replacement lands in the
  original stop's exact slot, and revert restores the captured original at the same index.
- `applyProposal` is a no-op if `originalStopId` is absent. `revertProposal` matches on
  `proposal.replacement.id`, so **do not** keep a second copy of the replacement elsewhere in the
  day, or revert would replace both.
- Because the replacement carries `startTime` / `endTime` as `undefined`, run `resequenceDay` after
  accepting or reverting so the day's schedule is recomputed for the new stop durations.

## 4. Minimal button flow

```ts
const [plan, setPlan] = useState<PlanningStop[]>(dayStops);
const [active, setActive] = useState<AdaptationProposal | null>(null);
const [original, setOriginal] = useState<PlanningStop | null>(null);

// 1. Preview only — nothing changes yet.
const proposal = proposeRainPlan(plan);   // may be null: render the "no risk" state
// show proposal.reason, proposal.preserves, proposal.walkingMinutesSaved, proposal.budgetDeltaEUR

// 2. Explicit accept. Capture the original stop BEFORE applying.
function accept() {
  setOriginal(plan.find(s => s.id === proposal.originalStopId) ?? null);
  setActive(proposal);
  setPlan(applyProposal(plan, proposal));
}

// 3. Revert restores the original itinerary exactly.
function revert() {
  setPlan(revertProposal(plan, active, original));
  setActive(null);
  setOriginal(null);
}
```

Note the ordering rule: `proposal` must be recomputed from the **current** plan, so once the swap is
applied `proposeRainPlan` correctly returns `null` (the replacement is indoor). Keep `active` for the
revert button, and never call `applyProposal` twice with the same proposal.

## 5. Telling the user *why*

Do not swap titles silently. Three pieces of the proposal exist purely for explanation:

1. `reason` — one paragraph naming the stop at risk, the indoor alternative with its duration, cost
   and transfer allowance, and the net effect on walking and budget. Render it verbatim.
2. `preserves` — the thread of the day that survives the swap (`["culture", "music"]`). Render as
   chips so the user can see the swap is not a random substitution.
3. `walkingMinutesSaved` / `budgetDeltaEUR` — the honest trade-off, in signed numbers.

Pair the swap with the group pulse for the replacement stop: the crew was split on the viewpoint but
unanimous on music, which is the argument for accepting the change.

## 6. Verification status

`src/features/groupTrip.test.ts` covers: the required unanimous sentence, the split sentence,
no-votes, a changed vote, the full seeded proposal numbers, every shared-contract field on the
replacement, `null` for a dry day, an indoor-only day and an unflagged outdoor stop, no mutation of
inputs, and apply-then-revert returning the original array exactly. 15 tests pass; `pnpm check` is
clean.
