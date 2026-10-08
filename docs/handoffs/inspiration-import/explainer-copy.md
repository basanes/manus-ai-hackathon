# Website explainer — import flow section (draft)

Ready-to-paste copy for the required website explainer. It covers only the
social-import part of RouteMuse; splice it into the team's explainer and delete
anything the live build does not actually do.

The rubric requires the explainer to state **what it does**, **who it is for and
the friction it removes**, **how to use it**, **what works today**, and **what is
not finished**. Each block below maps to one of those.

---

## What it does

Paste the caption from a saved post and RouteMuse turns it into route-ready
places you can drop straight into a day plan.

## Who it is for

For the person who saves travel posts all year and then, the night before a trip,
scrolls back through their own saves trying to work out which of those places
were actually worth planning around. The friction is the gap between "I saved
this" and "this is in my plan" — today that gap is manual retyping, and the
saved post tells you nothing about cost, timing, or whether the place survives a
rainy afternoon.

## How to use it

1. Open the planner and paste the caption from a saved post into the import box
   (there is a pre-filled example if you just want to see it work).
2. Press **Import candidates**. Three Lisbon places appear, each with a short
   reason saying why it was picked out and a confidence label.
3. Press **Add to day 1** on the one you want. It becomes a stop in the day plan
   with a duration, a cost, a 12-minute transfer allowance, and a
   `Fresh find` marker.
4. Reorder the day and the planner re-times it and flags anything worth knowing —
   for example that the viewpoint is outdoors and weather-dependent.

## What works today

- Deterministic extraction of three seeded Lisbon candidates from any pasted
  text, each with a visible reason and a high/medium confidence label.
- One-tap conversion into a planning stop that the day planner accepts unchanged:
  cost, duration, indoor/outdoor, weather risk, and the 12-minute transfer.
- The imported stop flows through re-sequencing, cost totals, and feasibility
  warnings with no special-casing.

## What is not finished

- **This is a seeded demo import, not a scraper.** RouteMuse does not connect to
  TikTok, Instagram, or any other platform, and never claims to: the interface
  labels the result "Demo import — seeded Lisbon signals." and the same three
  candidates come back whatever you paste. Real link parsing is not built.
- **Three candidates only.** There is no candidate pool, ranking, or de-duplication
  against places already in your plan.
- **No opening hours, travel times, or live availability.** The 12-minute transfer
  allowance is a flat default, not a routing estimate.
- **Coordinates are the published addresses, good enough to plot** — not a routing
  source.

---

## Wording to keep verbatim in the interface

> **Demo import — seeded Lisbon signals.**

Supporting line, already produced by the module:

> 3 of 3 signals matched your paste · no social platform was accessed

The disclaimer is not decoration. It is the thing that makes the honesty claim in
this explainer true, and judges are told to challenge unsupported claims — so it
must be visible wherever imported candidates are shown.
