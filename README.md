# RouteMuse

**Saved it. Now make it fit.** RouteMuse turns a group's saved travel posts into a timed, budget-checked day plan, and offers an indoor Plan B when rain threatens an outdoor stop.

This is a front-end-only hackathon prototype with seeded Lisbon data. No sign-in, backend, live social import, live weather or payments.

## Run

```bash
pnpm install
pnpm dev     # http://localhost:3000
pnpm build   # type-check + production build into dist/
```

## Module map

| Module | Owner | Used for |
|---|---|---|
| `src/lib/contracts.ts`, `src/lib/planner.ts` | Participant 1 | Re-timing every day, totals, budget/weather/tight-transfer/late-day warnings |
| `src/features/inspiration.ts` | Participant 2 | Demo import of three seeded Lisbon candidates and conversion to planner stops |
| `src/features/groupTrip.ts` | Participant 3 | Group pulse from votes; rain Plan B propose / accept / revert |
| `src/content/monetisation.ts` | Participant 4 | Pricing cards, principle and judge answer |
| `src/main.tsx`, `src/styles.css` | Participant 5 | UI wiring and presentation |

## 90-second demo script

1. **Problem (10s):** "Our group saves great places in reels and chats, but nobody turns them into a plan that actually fits the day, and rain wrecks it anyway."
2. **Import (15s):** In *Bring the scroll*, click **Extract 3 places**. Point out the "Demo import — seeded Lisbon signals" label. Click **+** on Fábrica da Nata; the day re-times.
3. **Plan (20s):** Drag a card or use ↑ ↓. Times, transfer allowances, spend and the *Planner checks* list update.
4. **Group (10s):** Select a stop and vote; the group pulse sentence updates.
5. **Rain (20s):** **Preview Plan B**, read the reason (keeps culture + music, saves 18 min walking, +€8), **Accept**, then **Revert**.
6. **Money (15s):** "Free to plan. £5.99 per trip when the plan matters. Clearly labelled booking referrals, never pay-to-rank. It's a proposed model; nothing is charged in this demo."
