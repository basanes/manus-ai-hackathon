# Participant 5 — Integrator, Experience Lead, and Demo Captain

> Paste this document and the [team integration contract](00-team-integration-contract.md) into this participant’s Manus task. This role owns the final, running prototype.

## Mission

Receive the four participant modules, wire them into the existing RouteMuse app, preserve the warm **Postcard Collage** visual system, validate the build, and rehearse the 90-second demo. You are the only participant allowed to edit the central app files.

## You own

- `src/main.tsx`
- `src/styles.css`
- `README.md`
- `docs/integration-log.md`

Do not rewrite a participant module. If an interface mismatch occurs, document it and ask the module owner for the smallest compatible correction.

## Integration order

1. Pull Participant 1’s `contracts.ts` and `planner.ts` first.
2. Pull Participant 2’s `inspiration.ts`.
3. Pull Participant 3’s `groupTrip.ts`.
4. Pull Participant 4’s `monetisation.ts`.
5. Replace current in-component duplicated data/logic only where the module provides an equivalent deterministic path.
6. Run `pnpm build` after each merge; do not wait until the end to discover type mismatches.

## Required wiring

| Existing area | Integrate | Outcome visible to judge |
|---|---|---|
| Inspiration Tray | `extractDemoCandidates`, `candidateToPlanningStop` | Import uses a clearly labelled seeded Lisbon demo set, then adds a route-ready stop |
| Drag sequence | `resequenceDay`, `formatDuration`, warnings | Reorder recalculates visible times and transfer allowances |
| Group vote | `getGroupPulse` | Group pulse reflects the current vote state and explains consensus |
| Rain card | `proposeRainPlan`, `applyProposal`, `revertProposal` | Before/after rationale, explicit accept, and true post-acceptance revert |
| Monetisation section | `pricingPlans`, `monetisationPrinciple` | One coherent free → £5.99 Pass → affiliate model, with ethical guardrails |

## Non-negotiable quality bar

- Keep the app **front-end only** and local-data only.
- Do not add a login, API key, package, payment checkout, real social scraping, or live map dependency.
- Do not remove the reset control.
- Preserve the current preview’s responsive hero and existing visual hierarchy.
- Make all new interactions keyboard/click friendly and visibly explain their consequence.

## Final checks

Run:

```bash
pnpm install
pnpm build
curl -sS http://127.0.0.1:3000/manus-routes.json
```

Then manually walk this path without a page refresh:

1. Open the Lisbon demo.
2. Extract a seeded social save and add one candidate.
3. Change a group vote.
4. Drag a stop; confirm times/transfer allowance update.
5. Preview rain Plan B; accept it; then revert it.
6. Reset the demo.
7. Scroll to the revenue section and say the monetisation story aloud in 30 seconds.

## Required handoff

Create `README.md` with run instructions and a 90-second demo script. Create `docs/integration-log.md` listing merged modules, the build result, and any deferred issue. Commit only after `pnpm build` passes.

## Demo narration

> “Travel inspiration lives in a scroll, but plans live in chaos. RouteMuse takes the places your group saves, sequences them around real constraints, and tells you why. When rain hits, it keeps the day’s culture and mood intact—not just the calendar slot. The planner stays free, a £5.99 trip pass buys adaptive confidence when the plan matters, and transparent affiliate referrals earn only when a traveller chooses to book.”
