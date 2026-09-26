# Paywall — Build Later

Not started. Zero infrastructure exists. Build this entire layer after core features are complete.

## Plan Structure

- Weekly: £1.99/week — lead plan, shown first, lowest commitment
- Monthly: £4.99/month — middle option
- Yearly: £29.99/year — hidden behind "view all plans" button, not highlighted
- Pro tier only at launch. Premium after community is live.

## Trial

- 7 day free trial on all plans
- No payment due on signup
- Explicit charge date shown front and centre on paywall — not buried
- Copy: "No payment due now. Your free trial ends [date]. Cancel anytime before then."
- Start with 7 day. A/B test 7 day vs 3 day post-launch.

## What needs building from scratch

1. Install and configure RevenueCat (react-native-purchases)
2. Paywall screen — bullet list format, single page, USP bullets + large CTA button (minimum 56pt height, existing design system defaults to 52pt so bump it)
3. CTA copy — "Start 7-day free trial" as default
4. "No commitment, cancel anytime" line on every paywall variant
5. Clean plan names — "Weekly", "Monthly", "Yearly" — no verbose repetition
6. Per-week price breakdown on yearly plan — show £0.58/week to make it feel cheap
7. Weekly shown by default, monthly and yearly behind "view all plans" button
8. One-time offer fallback paywall — fires if user dismisses the main paywall, offer 33% off yearly
9. A/B testing infrastructure — minimum two paywall variants running at all times

## A/B Test Queue (run sequentially, never simultaneously)

### Price tests (run after structure is stable)
- Weekly: £1.99 vs £2.49 vs £2.99
- Monthly: £4.99 vs £5.99 vs £6.99

### Structure tests (run these first, higher ROI than price)
- 3 day trial vs 7 day trial
- Weekly lead vs monthly lead
- One page paywall vs multi-page
- Bullet list vs video paywall
- "Start 7-day free trial" vs "Continue" as CTA copy

## Timing

- Paywall fires immediately after onboarding quiz and outcome screen complete — before user hits Home for the first time
- 82-89% of all purchases happen on day 0 — do not delay
- User has just seen their personalised prediction ("you could lucid dream in 14 days") — that is peak intent, hit them there

## Key data points

- Weekly with trial = £54.50 LTV vs £7.40 without trial — 636% difference, trial is non-negotiable
- Weekly is now 55.6% of all subscription app revenue, monthly collapsed to 11.7%
- Plan count changes drive 63% more conversion uplift than price changes — test structure before price
- Explicit charge date = 23% conversion increase, 55% drop in complaints (Blinkist)
- Higher prices attract higher intent users — do not race to the bottom
- Apps running 50+ paywall experiments per year make 18.7x more revenue than apps running one

## Design rules

- Dark navy, matches app design system
- Bullet list format — single page, USP bullets, one large CTA
- No tables, no comparison grids — users do not read them
- "No commitment, cancel anytime" on every variant
- Button minimum 56pt height
- Plan names clean and short
- Do not run large discounts outside Black Friday/Cyber Monday — cheapens the brand
- One-time offer discount: 33% off yearly (£29.99 to £19.99)

## Notes

- RevenueCat handles entitlements, not custom logic
- PostHog already in stack — use for paywall event tracking
- natural_wake_time already saved from onboarding quiz — wire into WBTB default when building paywall flow
- Social proof (ratings, testimonials, user count) to be added post-launch when real data exists
