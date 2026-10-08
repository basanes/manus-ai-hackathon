export type PricingPlan = {
  id: 'free' | 'pass' | 'affiliate';
  label: string;
  headline: string;
  price: string;
  description: string;
  proofPoints: string[];
  note?: string;
};

export const monetisationPrinciple =
  'Users pay for confidence when plans change; partners pay for completed intent.';

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    label: 'Free Planner',
    headline: 'Make the first good plan for £0.',
    price: '£0',
    description:
      'Start with one active trip, capture inspiration, create a simple plan and share it with the group.',
    proofPoints: [
      'One active trip',
      'Inspiration capture',
      'Simple plan',
      'Group sharing',
    ],
    note: 'No ads. The core planning experience stays accessible before we ask for payment.',
  },
  {
    id: 'pass',
    label: 'RouteMuse Pass',
    headline: 'Pay once when the details matter.',
    price: '£5.99 per trip',
    description:
      'Unlock the trip-ready view when coordination and disruption risk are real. One trip, one payment, no subscription.',
    proofPoints: [
      'Full trip-ready coordination',
      'Confidence when plans change',
      'No recurring payment',
      'No hidden price uplift',
    ],
    note: 'Frequent-traveller alternative to test later: £19/year. It is not part of the MVP.',
  },
  {
    id: 'affiliate',
    label: 'Outbound booking referrals',
    headline: 'Book only when an option works for you.',
    price: '2–8% commission where available',
    description:
      'If a traveller intentionally uses a clearly labelled outbound booking referral, RouteMuse may receive a partner commission on the completed booking.',
    proofPoints: [
      'Clearly labelled outbound referrals',
      'No pay-to-rank',
      'No ads',
      'Recommendation order never changes because of commission',
    ],
    note: '2–8% is a model assumption, not current revenue, a signed partner rate or a guarantee of booking conversion.',
  },
];

export const judgeMoneyAnswer =
  'RouteMuse is free to start because travellers should see a useful plan before paying. They pay £5.99 per trip for confidence when coordination and disruption risk are real, while partners pay only for completed intent through clearly labelled outbound booking referrals. No ads, no pay-to-rank and no hidden price uplift.';
