# Nocturnal — Design Brief

## Identity
- **App name:** Nocturnal
- **Tagline:** Control Your Dreams
- **Category:** Lucid dreaming trainer + journal

## Vibe
Dark atmospheric. Deep navy, not pure black. The feeling of being half-awake at 3am, aware you're dreaming. Premium, intentional, grounded — not mystical or tarot-adjacent. Moonly's dream archive screen is the closest reference. That energy, built for lucid dreaming.

Not this:
- Purple-black AI slop
- Generic dark mode (grey cards on black)
- Overly minimal/clinical
- Spiritual/mystical (no moons, stars, crystals as decoration)

Yes to this:
- Deep navy backgrounds (#0A0E1A range)
- Subtle depth — layered dark blues, not flat
- Premium feel — Calm, Headspace quality
- Intentional whitespace
- Content-first — the journal, the streak, the insight is the hero

## Colour Palette
- **Background primary:** #0A0E1A (deep navy-black)
- **Background secondary:** #111827 (slightly lighter navy)
- **Surface/card:** #1A2035 (elevated card background)
- **Border/divider:** #2A3350 (subtle)
- **Accent primary:** #6C8EFF (cool blue-purple — not garish, not neon)
- **Accent secondary:** #A78BFA (soft violet for Pro/Premium highlights)
- **Success/lucid:** #34D399 (green — used for lucid dream logs, streaks)
- **Text primary:** #F0F4FF (near white, slightly cool)
- **Text secondary:** #8B9CC7 (muted blue-grey)
- **Text tertiary:** #4B5A7A (very muted, for labels)

## Typography
- **Primary font:** Inter (all weights available, clean, readable in dark UI)
- **Display/headings:** Inter Bold or Semibold
- **Body:** Inter Regular, 16px base
- **Labels/captions:** Inter Medium, 12-13px
- **No decorative or serif fonts** — this is a daily-use app, not a mood board

## Spacing & Layout
- Base unit: 8px
- Card padding: 16px
- Screen padding: 20px horizontal
- Corner radius: 12px for cards, 8px for buttons, 24px for pill chips
- Bottom tab bar: frosted/blurred dark, not solid black

## Component Rules
- Cards: #1A2035 background, 1px border #2A3350, 12px radius, 16px padding
- Buttons primary: #6C8EFF fill, white text, 12px radius, 52px height
- Buttons secondary: transparent, #6C8EFF border, same sizing
- Inputs: #1A2035 background, #2A3350 border, focused border #6C8EFF
- Streak/progress: green (#34D399) accents only — never overused
- AI insight cards: slightly lighter surface (#1E2840), left border accent in #6C8EFF

## Iconography
- Lucide icons (already in React Native ecosystem)
- Stroke weight: consistent 1.5px
- Size: 24px standard, 20px compact, 28px tab bar
- No filled icons mixed with outline icons

## Paywall Design Rules
- Pro tier: highlighted with "Most Popular" badge in #6C8EFF
- Premium tier: #A78BFA accent — makes Pro look like the rational choice
- Annual shown as default, monthly toggle available
- No lifetime plans shown
- Clean card layout, no gradient overload

## Anti-AI-Slop Checklist
Before any screen is considered done:
- [ ] No generic grey-on-black dark mode
- [ ] No stock gradient backgrounds
- [ ] No emoji used as UI decoration
- [ ] No purple-black colour scheme
- [ ] Typography hierarchy is clear — one thing dominates per screen
- [ ] Empty states have character, not just a grey placeholder
- [ ] Loading states are designed, not default spinners
- [ ] Every card has breathing room — nothing crammed

## Reference Apps
- **Moonly** — dark atmospheric vibe, dream section (closest feel)
- **Calm** — dark, premium, clean without being cold
- **Headspace** — exceptional onboarding flow and pacing
- **Day One** — journal UI done right, content-first

## Mobbin MCP
Connected to Claude Code. Search these when building each screen:
- Onboarding: "dark onboarding flow", "sleep app onboarding"
- Journal: "dark journal app", "Day One journal UI"
- Home/dashboard: "dark dashboard mobile", "streak tracker dark"
- Paywall: "dark paywall", "subscription screen dark mode"
- Empty states: "dark empty state mobile"
