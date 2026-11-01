# Nocturnal V2 Roadmap

Everything deferred from v1 launch. Build these after first revenue.

---

## Retention gaps (carried from v1 audit)

- **Invite redemption** — share text carries invite code but `nocturnal.app/invite` is a placeholder; needs backend redemption flow and reward for referrer
- **Shareable image card** — share is text-only; needs image capture library (e.g. `react-native-view-shot`) to generate a proper Spotify Wrapped-style card
- **Cleo resonant insight payoff** — haptic fires on every reply as placeholder; needs a way to detect a genuinely resonant response and treat it differently
- **Midnight reality check reset** — no counter that resets at midnight; currently relies on notification schedule only
- **Full craft/consistency audit** — only screens touched in the retention pass were checked; every screen needs a proper walk
- **Voice transcription error paths** — not re-audited after the retention pass; needs designed error states

---

## Community layer

Full social/community build — separate scoping required. High-level intent:

- Leaderboard (lucid dreams this month, streak ranking)
- Friends/following with shared progress visibility
- Dream sharing (opt-in public entries)
- Community challenges (7-day streaks, monthly lucid goals)
- Dream circles (technique-based groups)

---

## Other v2 features

- **Shareable image card** — Wrapped-style monthly recap as an image, not just text
- **Streak leaderboard** — solo version exists; community version needs server-side aggregate and privacy controls
- **Cleo memory** — Cleo should remember past insights and reference them in future sessions
- **Dream pattern export** — let users export their journal data (PDF or CSV)
- **Apple Watch integration** — sleep tracking input, WBTB haptic alarm on wrist
- **Widget** — home screen widget showing today's focus and streak
