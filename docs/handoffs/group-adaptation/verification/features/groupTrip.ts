import type { PlanningStop } from "../lib/contracts";

/**
 * Participant 3 — Group Decisions and Adaptive Planning.
 *
 * Two behaviours, both pure:
 *  1. Turn a pile of votes into one legible sentence about what the group wants.
 *  2. Offer a transparent, explicitly-accepted, exactly-reversible Plan B when rain threatens an
 *     outdoor stop.
 *
 * No React, no I/O, no network calls, no live weather feed, no account model.
 * Typed against the shared `PlanningStop` in `src/lib/contracts.ts`.
 */

export type VoteChoice = "must-do" | "nice-to-have" | "skip";
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

/* -------------------------------------------------------------------------- */
/* Plan B catalog                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Vetted indoor replacements, keyed by the stop they replace.
 *
 * Deliberately a small hand-checked catalog rather than a generated suggestion: the module only
 * offers a swap it can describe honestly. A weather-risky stop with no entry here yields `null`
 * instead of a guess.
 */
export const PLAN_B_CATALOG: Record<string, PlanningStop> = {
  miradouro: {
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
};

/** What each swap is understood to preserve, in the crew's own words. */
const PRESERVES_BY_STOP: Record<string, string[]> = {
  miradouro: ["culture", "music"],
};

/**
 * Theme labels used to build the pulse sentence. `getGroupPulse(votes, stopId)` receives only an
 * id, so readable wording needs a small id → label registry; unknown ids fall back to the id
 * itself rather than inventing a name.
 */
const THEME_LABEL_BY_STOP: Record<string, string> = {
  alfama: "streets",
  miradouro: "views",
  timeout: "food",
  livraria: "books",
  museufado: "music",
};

function labelFor(stopId: string): string {
  return THEME_LABEL_BY_STOP[stopId] ?? stopId;
}

/**
 * A stop is weather-risky only when the shared contract explicitly marks it outdoor and flagged.
 * This is the planner's own `weather` warning condition, so the two modules agree by construction.
 */
function isWeatherRisk(stop: PlanningStop): boolean {
  return stop.isOutdoor && stop.weatherRisk;
}

/* -------------------------------------------------------------------------- */
/* Group pulse                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Counts the crew's choices for one stop and states the result in one legible sentence.
 *
 * A clear majority reads as "3/3 crew members marked music as a must-do."; an even spread is
 * reported as a split rather than smoothed into a false consensus.
 */
export function getGroupPulse(votes: VoteRecord[], stopId: string): GroupPulse {
  const relevant = votes.filter(vote => vote.stopId === stopId);
  const mustDoCount = relevant.filter(vote => vote.choice === "must-do").length;
  const niceToHaveCount = relevant.filter(vote => vote.choice === "nice-to-have").length;
  const skipCount = relevant.filter(vote => vote.choice === "skip").length;
  const total = relevant.length;
  const label = labelFor(stopId);

  let summary: string;
  if (total === 0) {
    summary = `No votes yet on ${label}.`;
  } else {
    const candidates: { choice: VoteChoice; count: number }[] = [
      { choice: "must-do", count: mustDoCount },
      { choice: "nice-to-have", count: niceToHaveCount },
      { choice: "skip", count: skipCount },
    ];
    const ranked = [...candidates].sort((a, b) => b.count - a.count);
    const top = ranked[0];

    if (top.count * 2 > total) {
      summary =
        top.choice === "skip"
          ? `${top.count}/${total} crew members want to skip ${label}.`
          : `${top.count}/${total} crew members marked ${label} as a ${top.choice}.`;
    } else {
      summary = `The crew is split on ${label}: ${mustDoCount} must-do, ${niceToHaveCount} nice-to-have, ${skipCount} skip.`;
    }
  }

  return { mustDoCount, niceToHaveCount, skipCount, summary };
}

/* -------------------------------------------------------------------------- */
/* Adaptive planning                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Finds the first weather-risky outdoor stop and proposes a vetted indoor replacement.
 *
 * Returns `null` when no stop in the plan is weather-risky, and also when the risky stop has no
 * catalog entry — the module never invents an alternative it cannot describe.
 */
export function proposeRainPlan(stops: PlanningStop[]): AdaptationProposal | null {
  const atRisk = stops.find(isWeatherRisk);
  if (!atRisk) return null;

  const replacement = PLAN_B_CATALOG[atRisk.id];
  if (!replacement) return null;

  // The shared contract records movement as `transferFromPreviousMinutes`, so that is the
  // walking/transfer time the swap is measured against.
  const walkingMinutesSaved =
    atRisk.transferFromPreviousMinutes - replacement.transferFromPreviousMinutes;
  const budgetDeltaEUR = replacement.costEUR - atRisk.costEUR;
  const preserves = PRESERVES_BY_STOP[atRisk.id] ?? [atRisk.title];

  const reason = [
    `Rain is likely during “${atRisk.title}” (outdoor, ${atRisk.durationMinutes} min).`,
    `“${replacement.title}” is indoor: ${replacement.durationMinutes} min, €${replacement.costEUR}, ${replacement.transferFromPreviousMinutes} min transfer allowance.`,
    `It keeps the ${preserves.join(" + ")} thread of the day, cuts walking by ${walkingMinutesSaved} min, and costs €${budgetDeltaEUR} more per person.`,
  ].join(" ");

  return {
    originalStopId: atRisk.id,
    replacement,
    reason,
    walkingMinutesSaved,
    budgetDeltaEUR,
    preserves,
  };
}

/**
 * Swaps the replacement into the original stop's exact position. Pure: the input array is never
 * mutated, and stop order is preserved.
 */
export function applyProposal(stops: PlanningStop[], proposal: AdaptationProposal): PlanningStop[] {
  return stops.map(stop => (stop.id === proposal.originalStopId ? proposal.replacement : stop));
}

/**
 * Restores the captured original stop in place of the replacement, returning the itinerary to its
 * exact prior order and content.
 */
export function revertProposal(
  stops: PlanningStop[],
  proposal: AdaptationProposal,
  original: PlanningStop,
): PlanningStop[] {
  return stops.map(stop => (stop.id === proposal.replacement.id ? original : stop));
}
