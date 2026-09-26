# DESIGN.md — Nocturnal (dark atmospheric lucid dreaming app)

Drop this file in your project root (or `.claude/`) and reference it at the start of any
Claude Code UI session: "Follow DESIGN.md for all UI work on this screen."

Fill in the `[[ ]]` placeholders once you've measured your actual Moonly screenshot with a
color picker / font identifier (see the tools list in chat). Values below are a reasonable
starting point for a premium dark atmospheric mobile app, not a pixel-measured copy.

## 1. Visual Theme & Atmosphere

Dark, atmospheric, nocturnal. The app should feel like being awake at 3am looking at the
sky — calm, spacious, a little mysterious. No card borders. No flat solid-color blocks.
Content floats directly on a gradient/particle background. Generous negative space is a
feature, not empty space to fill.

Reference: Moonly (lucid dream tracking app). Do not reference generic "dark mode SaaS
dashboard" aesthetics (that's a different, colder register).

## 2. Color Palette & Roles

Grounded against the actual Moonly screenshots (Practice / Dreams Archive screen), not
guessed — these are close to the real values, re-check with an eyedropper if you want
exact hex:

```
--bg-top:          #2B3178   (lighter indigo-purple, behind the cloud silhouettes)
--bg-bottom:        #12143A  (deep navy, screen bottom)
--panel:            #171A4A  (the full-bleed rounded-top content panel — see section 4)
--text-primary:     #F5F3F0  (warm off-white, not pure #FFFFFF)
--text-secondary:   rgba(245,243,240,0.65)  (lavender-tinted gray, subtext)
--accent:           #F2A93B  (warm amber/orange — matches the app icon's crescent moon,
                     used ONLY for the active tab / primary highlight)
--glass-fill:       rgba(255,255,255,0.10)  (inactive pills, floating buttons)
--star:             #FFFFFF at 40–90% opacity, varied per star/sparkle
```

Rules:
- One dominant background family (indigo → navy vertical gradient), one accent color
  (warm amber, not purple/indigo — Moonly deliberately avoids the "AI purple" default).
  No purple-to-blue CTA gradients.
- Never pure black (#000000) or pure white (#FFFFFF) backgrounds/text.
- Accent color used sparingly — the active tab/pill and key CTAs only, not on every icon.

## 3. Typography Rules

- Display/heading font: serif, see FONTS section (delivered in chat) — pick ONE, use it
  decisively for all headings. Moonly's own in-app headings ("Practice", "Dreams
  Archive") are a bold serif — this is real in-app type, not just marketing-slide type.
- Body font: a clean humanist sans (Inter is fine for body text only, never for headings —
  the serif/sans contrast is the point).
- Screen-title headings (top-left, e.g. "Practice") sit large and left-aligned, ~34px.
  Section headings within a panel (e.g. "Dreams Archive") are centered, ~28px, slightly
  smaller than the screen title — don't make every heading the same size.
- No more than 2 font families total in the app.

## 4. Component Styling

Correction from the general pattern below: Moonly does NOT float every element directly
on the raw background. Each screen has exactly ONE full-bleed content panel — a
rounded-top-corner rectangle (radius ~28–32px, corners top only) in a slightly different
navy shade (`--panel`) than the background gradient — that holds everything below the
screen title. Small controls (the +/clock buttons, the bottom nav) float as glass pills
directly on the background, outside that panel.

- One panel per screen max. No nested cards, no per-item bordered containers inside it.
- No `border` anywhere. No hard `shadow`/`elevation` — depth comes from the panel's flat
  color shift and from glass blur, not from shadows.
- Small floating controls (icon buttons, tab pills, bottom nav) use a frosted-glass
  treatment: `rgba(255,255,255,0.10)` fill + backdrop blur via `expo-blur`'s `<BlurView
  intensity={30} tint="dark">`, fully rounded (`borderRadius: 999`).
- Segmented tabs (e.g. Affirmations/Tarot/Dreamer/Runes): pill row, inactive = glass fill
  + white text, active = solid `--accent` fill, no border on either state.
- Buttons: pill-shaped, solid accent fill for primary, glass fill for secondary — never a
  gradient fill.
- Icons: consistent single icon set, never emoji as UI icons.
- Inputs: borderless, bottom-hairline only or fully invisible until focused.

## 5. Layout Principles

- Vertical rhythm over grids. Avoid the "hero + 3-card grid" skeleton entirely — this is
  a single-column, narrative-feeling mobile app, not a dashboard.
- Safe-area aware padding, minimum 24px horizontal margins.
- Let backgrounds bleed full-screen behind status bar / notch; the one content panel per
  screen can bleed to the bottom edge too, sitting above a floating bottom nav.

## 6. Depth & Elevation

- Depth comes from three things only: the background gradient, the single panel's flat
  color shift, and glass-blur floating controls. No box-shadow, no `elevation` prop.
- Small sparkle/star accents (4-pointed sparkle glyphs, not just round dots) scattered at
  low density near headings add atmosphere cheaply — see the star section in chat for
  how to generate these.

## 7. Do's and Don'ts

Do:
- Commit to the navy/indigo palette everywhere, including empty states and modals.
- Let text sit directly on the background.
- Use the serif display font for anything the user should feel, not just read (headings,
  big numbers, empty-state messages).

Don't:
- Add card borders "for clarity" — fix hierarchy with spacing/type instead.
- Use Inter/Roboto/system-font for headings.
- Use indigo-500/violet-500/purple gradient CTAs (the generic AI-slop default).
- Add box-shadow, drop-shadow, or `elevation` props by default.
- Add emoji as icons.

## 8. Responsive Behavior

- Design for iPhone SE width (375pt) up through Pro Max (430pt) and common Android
  widths. Star/particle density should scale with screen area, not be fixed-count.
- Respect Dynamic Type / font scaling — test heading font at 130% system text size.

## 9. Agent Prompt Guide

When asking Claude Code to build or fix a screen against this file:
- Always say "follow DESIGN.md" explicitly in the prompt.
- Attach a screenshot of the current state AND (when relevant) the Moonly reference.
- Fix one problem at a time (see PROMPT_TEMPLATES.md).
- After any UI change, ask Claude to state which DESIGN.md rule it applied — this catches
  silent drift back toward defaults.

## 10. Motion

The calm, unhurried mood from section 1 applies to movement, not just color — nothing
snappy or bouncy except the one deliberate celebration moment below. Eight tokens cover
every animated interaction in the app; don't invent a ninth without updating this file
first.

```
Arrive   Easing.out(cubic), 320ms   fade + slide up 14px       screen/section entrances
Settle   spring(friction 9, tension 80)                        sliding into a resting
                                                                 position (tab bar bubble,
                                                                 chip selection pill)
Micro    Easing.out(cubic), 150ms   scale/opacity press-in
Release  spring(friction 8, tension 120)                       press-out bounce-back
Cross    Easing.inOut(cubic), 200ms crossfade                  swapping one state of a
                                                                 slot for another
Reveal   Easing.out(cubic), 650ms   0 → value                  numeric/progress fill
Pop      spring(friction 6, tension 200)                       one-time overshoot —
                                                                 used sparingly: the
                                                                 30-Day Track day-complete
                                                                 moment and SSILD's
                                                                 round-complete beat
Ambient  Easing.inOut(sine), 7000ms opacity loop, looped        continuous atmospheric
                                                                 drift for open-ended,
                                                                 no-timer states —
                                                                 currently only WILD's
                                                                 passive hypnagogic phase
```

Stage-style forward flows (the WBTB session's alarm → recall → window → technique →
closed steps, and SSILD's sight → sound → touch cycle within the technique step) use a
variant of Cross: fade + horizontal slide (outgoing −16px, incoming from +16px), 260ms
`Easing.inOut(cubic)` — it's still a crossfade, just with direction to read as moving
forward through steps rather than one fact replacing another.

Reduced motion: every animated component checks `useReducedMotion()`
(`src/hooks/useReducedMotion.ts`, wraps `AccessibilityInfo.isReduceMotionEnabled` +
`reduceMotionChanged`). When it's true, Arrive/Settle/Micro/Release/Reveal/Pop/Ambient
and the stage-slide variant are skipped entirely — only Cross (plain opacity) runs, so
state changes still register but nothing slides, scales, overshoots, or drifts. Under
reduced motion, Ambient's drifting halo freezes at its brightest state instead of
looping.

`NightSky` (`src/components/NightSky.tsx`, the background behind Home/Journal/
Insights/Profile) extends Ambient into a small composite background system rather than
inventing an unrelated ninth token — a star is still just an Ambient opacity loop
(`EASE_AMBIENT`, `DURATIONS.ambient`), staggered per star so they don't pulse in unison:
- **Drift** — the star field scrolls left continuously (~14px/s, `Easing.linear`, no
  start/end) by rendering two copies side by side and animating both from x=0 to
  x=-width on an exact loop, so the wrap is invisible.
- **Breathe** — the gradient's two color stops slowly mix toward a slightly different
  point in the same indigo/purple range and back, on a ~24s cycle. Runs on the JS
  thread (color isn't a native-driver-eligible property) but is throttled to ~7fps,
  since a shift this slow doesn't need 60fps to read as smooth.
Both freeze under reduced motion — drift holds at x=0, breathe holds at its base
colors — same as Ambient's own halo freezing at its brightest state. Breathe is
`full`-intensity only; `subtle`'s smaller, tighter-gradient usages don't have the room
for it to read as anything but noise.

Shared building blocks: `src/lib/motion.ts` (the constants above), `src/components/
Arrive.tsx` (entrance wrapper), `src/components/CrossFade.tsx` (state-swap wrapper, plus
the stage-slide variant), `src/components/AnimatedPressable.tsx` (Micro/Release press
feedback, drop-in for `Pressable`), `src/components/Breathing.tsx` (opacity-loop
primitive backing Ambient, also used for pre-Ambient atmospheric touches like the
AlarmStage clock halo), `src/components/PopIn.tsx` (Pop wrapper), `src/components/
NightSky.tsx` (the star-drift/twinkle/breathing background above).
