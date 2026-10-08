/**
 * Standalone verification for src/features/groupTrip.ts (Participant 3).
 * Uses only node:assert — no test framework, no dependencies beyond a TypeScript runner.
 * Run with ./run.sh
 */
import assert from "node:assert/strict";
import type { PlanningStop } from "./lib/contracts";
import { CREW, LISBON_DAY, SEEDED_VOTES } from "./lib/demoData";
import {
  applyProposal,
  getGroupPulse,
  proposeRainPlan,
  revertProposal,
  type VoteRecord,
} from "./features/groupTrip";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

console.log("groupTrip verification");

check("unanimous pulse reads as required", () => {
  assert.equal(getGroupPulse(SEEDED_VOTES, "museufado").summary, "3/3 crew members marked music as a must-do.");
});

check("a split is reported, not smoothed", () => {
  assert.equal(
    getGroupPulse(SEEDED_VOTES, "miradouro").summary,
    "The crew is split on views: 1 must-do, 1 nice-to-have, 1 skip.",
  );
});

check("a changed vote updates the sentence", () => {
  const votes: VoteRecord[] = [
    { travelerId: "maya", stopId: "miradouro", choice: "skip" },
    { travelerId: "jamie", stopId: "miradouro", choice: "skip" },
    { travelerId: "alex", stopId: "miradouro", choice: "must-do" },
  ];
  assert.equal(getGroupPulse(votes, "miradouro").summary, "2/3 crew members want to skip views.");
});

check("seeded crew has three travellers", () => assert.equal(CREW.length, 3));

check("proposal numbers are the agreed ones", () => {
  const p = proposeRainPlan(LISBON_DAY);
  assert.ok(p);
  assert.equal(p!.originalStopId, "miradouro");
  assert.equal(p!.replacement.id, "museufado");
  assert.equal(p!.replacement.durationMinutes, 65);
  assert.equal(p!.replacement.costEUR, 8);
  assert.equal(p!.replacement.transferFromPreviousMinutes, 10);
  assert.equal(p!.replacement.isOutdoor, false);
  assert.equal(p!.walkingMinutesSaved, 18);
  assert.equal(p!.budgetDeltaEUR, 8);
  assert.deepEqual(p!.preserves, ["culture", "music"]);
});

check("replacement satisfies every shared-contract field", () => {
  const r = proposeRainPlan(LISBON_DAY)!.replacement;
  const keys: (keyof PlanningStop)[] = [
    "id", "title", "description", "latitude", "longitude",
    "durationMinutes", "transferFromPreviousMinutes", "costEUR", "isOutdoor", "weatherRisk",
  ];
  for (const k of keys) assert.ok(r[k] !== undefined, `missing ${k}`);
});

check("null when nothing is weather-risky", () => {
  assert.equal(proposeRainPlan(LISBON_DAY.map(s => ({ ...s, weatherRisk: false }))), null);
  assert.equal(proposeRainPlan([]), null);
});

check("null for an indoor-only day", () => {
  assert.equal(proposeRainPlan(LISBON_DAY.filter(s => !s.isOutdoor)), null);
});

check("an unflagged outdoor stop is not weather-risky", () => {
  assert.equal(proposeRainPlan(LISBON_DAY.filter(s => s.id === "alfama")), null);
});

check("applying then reverting restores the original exactly", () => {
  const p = proposeRainPlan(LISBON_DAY)!;
  const original = LISBON_DAY.find(s => s.id === p.originalStopId)!;
  const swapped = applyProposal(LISBON_DAY, p);
  assert.deepEqual(swapped.map(s => s.id), ["alfama", "museufado", "timeout", "livraria"]);
  assert.deepEqual(revertProposal(swapped, p, original), LISBON_DAY);
});

check("inputs are never mutated", () => {
  const snapshot = JSON.stringify(LISBON_DAY);
  const p = proposeRainPlan(LISBON_DAY)!;
  const original = LISBON_DAY.find(s => s.id === p.originalStopId)!;
  applyProposal(LISBON_DAY, p);
  revertProposal(applyProposal(LISBON_DAY, p), p, original);
  assert.equal(JSON.stringify(LISBON_DAY), snapshot);
});

console.log(`\n${passed} checks passed`);
