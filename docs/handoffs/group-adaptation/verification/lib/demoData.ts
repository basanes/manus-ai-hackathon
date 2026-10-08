import type { PlanningStop } from "./contracts";
import type { VoteRecord } from "../features/groupTrip";

/**
 * Seeded demo data for the Participant 3 harness.
 *
 * Everything here is fixed, hand-written demo content: a three-person crew, one Lisbon day, and
 * the votes they already cast. No live weather, no accounts, no network calls.
 * Field names follow the shared contract in `src/lib/contracts.ts`.
 */

export type Traveler = {
  id: string;
  name: string;
  /** What this traveller cares about, shown next to their vote row. */
  cares: string;
};

export const CREW: Traveler[] = [
  { id: "maya", name: "Maya", cares: "here for the music" },
  { id: "jamie", name: "Jamie", cares: "walks are the whole point" },
  { id: "alex", name: "Alex", cares: "keeping the day affordable" },
];

/**
 * Tuesday in Lisbon. `miradouro` is the only stop marked `isOutdoor && weatherRisk`, so
 * `proposeRainPlan` has exactly one candidate and returns `null` when that flag is switched off.
 */
export const LISBON_DAY: PlanningStop[] = [
  {
    id: "alfama",
    title: "Alfama lanes walk",
    description: "Steep lanes, no shelter worth the name.",
    latitude: 38.7118,
    longitude: -9.13,
    durationMinutes: 45,
    transferFromPreviousMinutes: 10,
    costEUR: 0,
    isOutdoor: true,
    weatherRisk: false,
  },
  {
    id: "miradouro",
    title: "Miradouro da Senhora do Monte",
    description: "The best view of the city, and the first thing rain takes away.",
    latitude: 38.7192,
    longitude: -9.1325,
    durationMinutes: 30,
    transferFromPreviousMinutes: 28,
    costEUR: 0,
    isOutdoor: true,
    weatherRisk: true,
  },
  {
    id: "timeout",
    title: "Time Out Market lunch",
    description: "Covered, and everyone can order what they actually want.",
    latitude: 38.7069,
    longitude: -9.1457,
    durationMinutes: 60,
    transferFromPreviousMinutes: 12,
    costEUR: 14,
    isOutdoor: false,
    weatherRisk: false,
  },
  {
    id: "livraria",
    title: "Livraria Bertrand",
    description: "The oldest bookshop still running, and it is on the way.",
    latitude: 38.7107,
    longitude: -9.142,
    durationMinutes: 20,
    transferFromPreviousMinutes: 8,
    costEUR: 0,
    isOutdoor: false,
    weatherRisk: false,
  },
];

/**
 * The votes the crew already cast — including on the Plan B alternative, which they had been
 * shown as an option. The viewpoint is deliberately contested and music is deliberately
 * unanimous: that contrast is the whole point of the module.
 */
export const SEEDED_VOTES: VoteRecord[] = [
  // Alfama lanes walk — mostly wanted
  { travelerId: "maya", stopId: "alfama", choice: "must-do" },
  { travelerId: "jamie", stopId: "alfama", choice: "must-do" },
  { travelerId: "alex", stopId: "alfama", choice: "nice-to-have" },

  // Miradouro da Senhora do Monte — nobody agrees
  { travelerId: "maya", stopId: "miradouro", choice: "nice-to-have" },
  { travelerId: "jamie", stopId: "miradouro", choice: "skip" },
  { travelerId: "alex", stopId: "miradouro", choice: "must-do" },

  // Time Out Market lunch — unanimous
  { travelerId: "maya", stopId: "timeout", choice: "must-do" },
  { travelerId: "jamie", stopId: "timeout", choice: "must-do" },
  { travelerId: "alex", stopId: "timeout", choice: "must-do" },

  // Livraria Bertrand — liked, not essential
  { travelerId: "maya", stopId: "livraria", choice: "nice-to-have" },
  { travelerId: "jamie", stopId: "livraria", choice: "nice-to-have" },
  { travelerId: "alex", stopId: "livraria", choice: "skip" },

  // Museu do Fado — the Plan B alternative, and the thing the crew agrees on most
  { travelerId: "maya", stopId: "museufado", choice: "must-do" },
  { travelerId: "jamie", stopId: "museufado", choice: "must-do" },
  { travelerId: "alex", stopId: "museufado", choice: "must-do" },
];
