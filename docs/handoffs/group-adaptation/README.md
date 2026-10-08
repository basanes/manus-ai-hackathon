# Verification — group decisions & adaptive planning

Self-contained check of `src/features/groupTrip.ts`. It does not touch the shared application.

```
cd docs/handoffs/group-adaptation/verification
./run.sh
```

`verification/features/groupTrip.ts` and `verification/lib/*` are copies taken at handoff time, so
the check keeps working even after the live module evolves. The copies mirror the shared
`src/lib/contracts.ts` field names exactly.

Expected output: `11 checks passed`.
