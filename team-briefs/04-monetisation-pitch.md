# Participant 4 — Monetisation and Judge Narrative Lead

> Paste this document and the [team integration contract](00-team-integration-contract.md) into this participant’s Manus task.

## Mission

Make RouteMuse’s business model defensible in a 30-second judge conversation. The answer must be concrete, ethical, and compatible with how people actually plan travel: travel is episodic, so users should not be forced into a subscription before value exists.

## You own

- `src/content/monetisation.ts`
- `docs/monetisation-pitch.md`
- `docs/judge-q-and-a.md`

Do **not** edit `src/main.tsx`, `src/styles.css`, `package.json`, or other participant modules.

## Required content model

Export content—not UI components—so Participant 5 can render it consistently.

```ts
export type PricingPlan = {
  id: 'free' | 'pass' | 'affiliate';
  label: string;
  headline: string;
  price: string;
  description: string;
  proofPoints: string[];
  note?: string;
};

export const pricingPlans: PricingPlan[];
export const monetisationPrinciple: string;
export const judgeMoneyAnswer: string;
```

## Required commercial decision

| Revenue stream | Decision | Why it is credible |
|---|---|---|
| Free Planner | £0: one active trip, inspiration capture, simple plan, group sharing | Builds trust and acquisition before asking for money |
| RouteMuse Pass | **£5.99 per trip**; alternative £19/year for frequent travellers | User pays when coordination and disruption risk are real |
| Affiliate referrals | **2–8% commission where available** on clearly labelled outbound bookings | Earns when a traveler intentionally books; no pay-to-rank |
| Later only | Concierge/community white-label workspace | A potential B2B expansion, not a hackathon MVP claim |

## Non-negotiable ethics

- Never claim current revenue, signed partners, commission contracts, or live booking conversion.
- Never change recommendation order because of affiliate commission.
- Say **“outbound booking referral”**, not “we book travel.”
- Use the phrase: **“Users pay for confidence when plans change; partners pay for completed intent.”**
- Explicitly state: **No ads. No pay-to-rank. No hidden price uplift.**

## Deliverables

1. `src/content/monetisation.ts` with concise UI-ready copy for the three plans.
2. `docs/monetisation-pitch.md` with a 30-second spoken explanation and one simple unit-economics *hypothesis* clearly labelled as an assumption.
3. `docs/judge-q-and-a.md` with direct answers to:
   - Why would anyone pay £5.99?
   - Why not just use Google Maps or a generic AI itinerary generator?
   - How do affiliate links avoid bias?
   - What is the first metric you would measure after launch?

## Acceptance criteria

- No UI code and no external research claim required.
- All numbers match the shared commercial decision above.
- Copy is short enough for a UI card and a live pitch.
- Handoff identifies exactly which exported strings Participant 5 should use in the existing monetisation section.
