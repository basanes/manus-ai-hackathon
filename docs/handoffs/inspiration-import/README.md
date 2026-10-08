# Participant 2 package — Inspiration Import

Everything Participant 2 owns, plus a runnable preview and a test harness. Built offline against a stand-in shared contract; nothing here touches another participant's files.

## What to copy into the team repo

| File | Destination | Notes |
|---|---|---|
| `src/features/inspiration.ts` | `src/features/inspiration.ts` | the whole deliverable |
| `docs/handoffs/inspiration-import.md` | `docs/handoffs/inspiration-import.md` | handoff for Participant 5 |

Nothing else. In particular **do not** copy `verification/lib/contracts.ts` — that is a local stand-in for Participant 1's real `src/lib/contracts.ts`.

## Verify it in one command

```bash
bash docs/handoffs/inspiration-import/verification/run.sh
```

Static guard (no React / no fetch / no new dependency) → strict `tsc --noEmit` → 39 acceptance checks. Expected tail: `ALL 39 CHECKS PASSED`.

## See the flow in a browser

```bash
bash preview/build.sh                        # builds the self-contained preview/index.html
python3 -m http.server 8080 --directory preview
```

Then open `preview/index.html`. The preview is a harness for this module only — it is deliberately not the team app.

## Open items before submission

1. **Reconcile the contract.** Paste Participant 1's `src/lib/contracts.ts` and check the two marked lines in `candidateToPlanningStop` (`id`, `category`, plus the rename notes in §6 of the handoff). Re-run `verification/run.sh` after any change.
2. **Hand off to Participant 5.** They replace in-component candidate data with `extractDemoCandidates(socialInput)` and `candidateToPlanningStop(candidate, activeDay, nextOrder)`.
3. **Show the disclaimer.** The UI must render `DEMO_IMPORT_DISCLAIMER` — "Demo import — seeded Lisbon signals." — above the candidate list.
4. **Guard double-adds.** Accepting the same candidate twice would create two stops with the same `id`; disable the button after accept (the preview does).
5. **Rubric check.** Judges open the public link, so the explainer must state what it does, who it is for, the exact judge path, what works today, and the honest limits — the module's limits are listed in §8 of the handoff.
