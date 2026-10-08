# RouteMuse — Group Pulse & Plan B: module demo

**Public demo:** https://routemuse-4deintii.manus.space/

## What it does

Turns votes on a shared day itinerary into a readable group pulse and offers a transparent, reversible indoor alternative to a weather-risk outdoor stop.

## Who it is for and the friction removed

For the friend coordinating a group day out: it makes disagreement visible without rereading a group chat, and makes a rain-plan trade-off explicit instead of silently replacing the day.

## Judge's usage path

Open the public demo without signing in. Change a traveller's vote and read the updated pulse. Select the viewpoint, click **Preview Plan B**, and read the duration, cost and movement trade-off. Click **Accept swap** to put Museu do Fado into the viewpoint's slot. Click **Revert to original** to restore it. Turn off the weather-risk checkbox to see the no-proposal state.

## What works today

Local voting for Maya, Jamie and Alex; majority and split summaries; deterministic risk detection from `isOutdoor && weatherRisk`; an explicit preview/accept/revert flow; and the pure TypeScript functions in `src/features/groupTrip.ts`.

For the seeded scenario, Museu do Fado is indoor, takes 65 minutes, costs €8, and has a 10-minute transfer allowance. The explanation says it preserves culture + music. The 18-minute movement saving is the difference between two recorded transfer allowances (28 − 10), **not** a live walking-route calculation. The €8 increase is based on the seeded free viewpoint.

The repository module is typechecked against the team's existing `src/lib/contracts.ts`. The self-contained verification folder passes 11 checks, including apply-then-revert restoration and absence of input mutation.

## What is unfinished

This is a standalone demo harness, not proof of integration into the team's final UI. There are no accounts, live weather, venue availability checks, map routing, multi-device voting, or persistence; votes reset on reload. The alternative catalog covers this one Lisbon scenario, and unknown weather-risk stops return `null`. Names, prices, risk flags and votes are seeded demo data.

An earlier browser check observed a platform notice on the demo; this upload does not establish its removal. Check the public demo again before selecting the final submission link.
