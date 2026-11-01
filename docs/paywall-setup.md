# Paywall setup

The paywall screen (`src/screens/paywall/PaywallScreen.tsx`) renders whatever RevenueCat
returns, so prices, trial length and the A/B arm are all configured outside the app. Nothing
below is done by code; until it is, the paywall shows "We couldn't load the plans".

## Store products

Create one subscription product per plan and give every one a **7-day free trial**
introductory offer (App Store Connect and Google Play both):

| Plan    | Price                                                  |
| ------- | ------------------------------------------------------ |
| Weekly  | your choice                                            |
| Monthly | $6.99 / $7.99 / $8.99 / $9.99, one product per arm     |
| Annual  | monthly x 10: $69.90 / $79.90 / $89.90 / $99.90        |

Each price arm needs its own set of products, since a store product has one price.

## RevenueCat offerings

1. Entitlement `nocturnal_pro` (already used by the app) attached to every product.
2. Four offerings, with these exact identifiers, each holding a Weekly, a Monthly and an
   Annual package (use the standard `$rc_weekly`, `$rc_monthly`, `$rc_annual` types):
   `price_699`, `price_799`, `price_899`, `price_999`.
3. A **Experiment** splitting new customers across those four offerings. RevenueCat serves
   the user's arm as `offerings.current`, and the app reads the arm from the offering
   identifier (`variantOf` in `src/lib/purchases.ts`) and sends it to PostHog as `variant`.
4. A fifth offering, identifier `fallback_offer`, for the abandoned-transaction offer. Its
   Annual package (or, failing that, its first package) is shown after the main paywall is
   closed. Make it a discounted annual product, or an annual product with a longer free
   trial: the copy adapts to either (`FallbackOffer` in the paywall screen).

## PostHog events

All carry `plan` (`weekly | monthly | annual`), `variant` (`price_699 ... price_999 |
unknown`) and `source` (`onboarding | profile | feature_gate`):
`paywall_shown`, `paywall_dismissed`, `paywall_converted`, `fallback_shown`,
`fallback_converted`. A restore is not counted as a conversion.

## Behaviour notes

- The hard paywall opens right after the onboarding quiz. It is flagged in AsyncStorage the
  moment onboarding completes, so quitting mid-paywall shows it again next launch. Accounts
  that finished onboarding before this shipped are not interrupted.
- Closing the paywall (X, or Android back) goes straight to the fallback offer; declining
  that enters the app on the free tier.
- Free users do not reach the Edge Functions for dream sign detection, insights, progress
  narratives, the sleep correlation or the technique recommendation. This is a client-side
  gate; to enforce it server-side, have those functions check the entitlement via
  RevenueCat's REST API.
