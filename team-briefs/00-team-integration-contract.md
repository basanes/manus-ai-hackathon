# RouteMuse — Team Integration Contract

> **Use this as the common context for every participant’s Manus task.** Each person should also receive their numbered role brief.

## Product in one sentence

**RouteMuse turns social travel inspiration into a group itinerary that is feasible, explainable, and adaptable when plans change.**

The live prototype is a Vite + React + TypeScript, front-end-only Lisbon demo. It has no backend, no login, no live social scraping, no live bookings, and no live map API. That is deliberate: a reliable hackathon demo is more valuable than fragile integrations.

## Current baseline

- **Project name:** RouteMuse
- **Baseline checkpoint:** `b167df9` — *Build RouteMuse itinerary demo*
- **Current app files:** `src/main.tsx` and `src/styles.css`
- **Run:** `pnpm install && pnpm dev`
- **Validate:** `pnpm build`
- **Route:** `/`
- **Design direction:** *Postcard Collage* — warm paper, coral (`#D65A3A`), saffron (`#F2C14E`), ink, annotated route/stamp motifs, Bricolage Grotesque headings.

## Team objective

At the final demo, a judge must be able to see this end-to-end story in under 90 seconds:

1. A traveler has scattered social saves.
2. RouteMuse extracts plausible places into an Inspiration Tray.
3. The group votes and the planner creates a route with time, cost, and transfer logic.
4. Rain disrupts a sunset activity; RouteMuse proposes, explains, accepts, and can revert a nearby indoor alternative.
5. The model earns through a free planner, a £5.99 per-trip RouteMuse Pass, and transparent affiliate referrals.

## Architecture and file ownership

Only **Participant 5** changes the live application entry point and styling. Everyone else contributes a small, importable module with a handoff note.

| Participant | Owns | Must not edit |
|---|---|---|
| 1 — Planning engine | `src/lib/contracts.ts`, `src/lib/planner.ts` | `src/main.tsx`, `src/styles.css`, package files |
| 2 — Inspiration import | `src/features/inspiration.ts` | `src/main.tsx`, `src/styles.css`, Participant 1 files |
| 3 — Group + adaptation | `src/features/groupTrip.ts` | `src/main.tsx`, `src/styles.css`, Participant 1/2 files |
| 4 — Monetisation | `src/content/monetisation.ts`, `docs/monetisation-pitch.md` | application entry/style files and other modules |
| 5 — Integrator + demo | `src/main.tsx`, `src/styles.css`, `README.md` | rewrite another participant’s module without asking them |

## Shared TypeScript contract

Participant 1 creates this file first; other module authors code against it. Participant 5 merges Participant 1 before the others.

```ts
// src/lib/contracts.ts
export type Interest = 'food' | 'culture' | 'viewpoint' | 'neighbourhood' | 'activity';

export type PlanningStop = {
  id: string;
  name: string;
  category: Interest;
  day: number;
  order: number;
  time: string;                 // 24-hour HH:mm
  durationMinutes: number;
  transferFromPreviousMinutes: number;
  costEUR: number;
  indoor: boolean;
  weatherRisk?: boolean;
  note: string;
  x: number;                    // 0–100 illustrated map coordinate
  y: number;
};

export type FeasibilityWarning = {
  level: 'info' | 'warning' | 'blocker';
  code: 'weather' | 'budget' | 'tight-transfer' | 'late-day' | 'duplicate';
  message: string;
};
```

## Non-negotiable integration rules

1. **No live API keys or account flows.** All output must work from seeded local data.
2. **No dependencies without agreement.** Do not change `package.json` unless Participant 5 explicitly approves it.
3. **No overlapping file edits.** Create only the files listed in your role brief.
4. **Return modules, not ideas.** Every contributor delivers compiling TypeScript or a clearly labelled Markdown output.
5. **Keep claims honest.** Say “demo import” and “illustrated route map”; never claim live social scraping, real-time weather, or booking availability.
6. **Keep the design coherent.** The UI is warm editorial travel, not generic SaaS or a copy of AnotherTrip.

## Handoff format

Every participant sends Participant 5:

- Their changed files or a Git branch/PR.
- A 3–5 bullet summary of what changed.
- Exact imports/exports and one example call.
- Known limits or assumptions.
- Confirmation that their work does not touch another owner’s files.

## Merge order

1. Participant 1: contracts and planning engine.
2. Participant 2: inspiration module.
3. Participant 3: group/adaptation module.
4. Participant 4: monetisation content module.
5. Participant 5: wire modules into UI, reconcile types, run `pnpm build`, complete the demo rehearsal.

## Definition of a successful integration

- `pnpm build` succeeds.
- The existing hero, Lisbon demo, map, and monetisation section still render.
- Social import, a vote, a drag/re-sequence, Plan B accept, Plan B revert, and reset all work without a refresh.
- No backend, payment, live map, or social-network account is required.
