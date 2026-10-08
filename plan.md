# RouteMuse implementation plan

## Scope

RouteMuse is a fast, front-end-only hackathon prototype for turning social travel inspiration into a feasible shared itinerary. It must make the core planning loop, a disruption/re-plan flow, group input, and an honest monetisation model tangible without login, live booking, a database, or external map access.

## Implementation approach

A Vite + React + TypeScript single page will hold a deterministic two-day Lisbon dataset in local state. It will simulate social import, let a visitor add places, reorder itinerary cards with drag-and-drop, select an activity to synchronize the illustrated route map, vote as a group, and apply/revert an auto-suggested rain plan. The first screen is an editorial landing/product story; the working trip studio is the centrepiece; the revenue section completes the pitch.

### Monetisation model to present

1. **Free Planner — £0.** One active trip, inspiration capture, simple itinerary, group sharing, and transparent outbound booking links. It maximizes acquisition and produces booking-intent traffic.
2. **RouteMuse Pass — £5.99 per trip** *(or £19/year for frequent travellers)*. Unlocks adaptive re-planning, unlimited collaborators, live feasibility warnings, offline day packs, and collaborative decision history. The payment moment is when a trip becomes high-stakes, so it fits episodic travel behaviour better than a forced subscription.
3. **Affiliate referrals — 2–8% commission, where available.** Keep results clearly labelled and never change the itinerary ranking because of commission. RouteMuse earns only when a traveller intentionally leaves to book accommodation, activities, transport, or insurance.
4. **Later, not in the MVP: team/concierge licensing.** Sell a white-label trip workspace to travel communities, student groups, or boutique travel advisers only after the consumer planning loop proves retention.

The interface should state the key principle: **users pay for confidence when plans change; booking partners pay for completed intent.** No advertising, no pay-to-rank results, and no hidden affiliate pricing.

## Design direction: Postcard Collage

- **Design movement:** an annotated travel journal / postcard collage rather than a generic SaaS dashboard.
- **Core principles:** tactile, legible, optimistic, operational. Paper-like panels support dense trip detail; every interaction keeps the current plan understandable.
- **Color philosophy:** warm parchment creates calm; RouteMuse coral `#D65A3A` is the ownable action color; saffron `#F2C14E`, moss, and ink distinguish decisions, costs, and plan state without looking corporate.
- **Layout paradigm:** a slightly overlapping travel desk: a slim editorial story above an asymmetrical itinerary studio with a map-like field, timeline, and paper-note side panels. Mobile collapses this to a narrative stack.
- **Signature elements:** dashed route lines, stamped status badges, handwritten-style annotation labels, and clipped-corner paper cards.
- **Interaction philosophy:** operations feel physical—drag a card, click a pin, tap a reaction, or accept a clearly explained alternative. Local state makes every demo action instant and reversible.
- **Animation:** a restrained card lift on hover, 180–240ms state transitions, and a brief route/selection highlight. No continuously moving decoration.
- **Typography:** Bricolage Grotesque for expressive headlines and Inter/system sans for dense schedule detail.
- **Brand essence:** *RouteMuse makes a group’s saved travel ideas workable in the real world.* Personality: warm, clever, reassuring.
- **Brand voice:** direct, specific, and light. Example: “Saved it. Now make it fit.” / “Rain changed the route, not the mood.”
- **Wordmark and mark:** an offset coral route loop with a small compass dot, paired with a sturdy RouteMuse wordmark.

## Project structure

| Path | Responsibility |
|---|---|
| `src/main.tsx` | React UI, seeded data, state transitions, import/vote/re-plan/drag interactions |
| `src/styles.css` | Responsive Postcard Collage visual system, map field, cards, and interaction states |
| `public/manus-routes.json` | Static route declaration for the one-page app |
| `index.html` | Vite entry document and metadata |
| `package.json`, `vite.config.ts`, `tsconfig.json` | Vite/TypeScript toolchain |
| `TODO.md` | Implementation outcome list for this prototype |

## Material constraints

- Use only seeded local data; no login, keys, third-party APIs, payments, booking flows, or scraping.
- The map is an original illustrated Lisbon route field, not a live map service.
- All revenue claims are presented as a product model and simple ranges, not as current business results.
- The static build will be publishable; Preview runs on port 3000.
