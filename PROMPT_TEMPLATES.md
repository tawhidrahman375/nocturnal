# Nocturnal — Reusable Claude Code UI Prompt Templates

Use one problem per prompt. Attach a screenshot every time — Claude (and any model) fixes
visual problems far more reliably when it can see the actual render, not just read code.

---

## Template 1 — Single-issue visual fix

```
Look at [screenshot attached]. This is the [screen name] screen in a React Native/Expo app.

Problem: [ONE specific problem, e.g. "the heading font looks like a generic system sans,
not the premium serif this app should use"].

Fix only this. Do not touch layout, spacing, colors, or any other component while doing
this. Follow DESIGN.md for the correct treatment.

After the change, tell me exactly which file(s)/line(s) you changed and why.
```

## Template 2 — Match a reference screenshot

```
[Reference screenshot: Moonly] [Current screenshot: my app, same screen type]

Compare these two. My version currently reads as generic/AI-generated. Identify the
top 3 concrete differences that make the reference feel premium and mine feel generic
(be specific: font, spacing values, color, borders, shadows — not vague adjectives).

Then fix only the #1 difference. Show me the diff before touching #2 or #3.
```

## Template 3 — Remove a specific "AI slop" pattern

```
Audit [file/screen] for this specific anti-pattern: [e.g. "box-shadow or elevation used
as a stand-in for hierarchy" / "card borders around content that should float on the
background" / "Inter or system font used on headings"].

Everywhere you find it, remove it and replace it per DESIGN.md section [X]. List every
instance you changed. Do not introduce any other stylistic changes.
```

## Template 4 — Component-level polish pass

```
[Screenshot attached] This component (`[ComponentName].tsx`) is functionally done but
visually flat. Following DESIGN.md sections 3 (Typography) and 6 (Depth & Elevation)
only, make ONE pass to improve type hierarchy and depth — no layout restructuring, no
new components, no color changes outside the existing palette in DESIGN.md.

Constraint: every value you use must be traceable to a rule in DESIGN.md. If you want to
use a value that isn't in DESIGN.md, ask me first instead of inventing one.
```

## Template 5 — Regression check after a fix

```
[New screenshot after your last change] Confirm this actually matches what I asked for
in the previous message — quote back the specific problem I described and tell me,
honestly, whether it's fully fixed, partially fixed, or you're not sure. If you're not
sure, say so instead of claiming success.

Also confirm you didn't touch anything outside the scope of that request — list any
files changed.
```

---

## Why these work (short version)

- **One problem per prompt.** Bundled requests ("make it look more premium") make Claude
  average across several generic fixes at once. A single named problem gets a single,
  legible fix you can verify.
- **Screenshot every time.** Claude cannot infer how Tailwind/RN styles actually render;
  it can only guess from code. A screenshot turns a guess into a correction.
- **Cite DESIGN.md by section**, not "make it look nice." Vague aesthetic requests are
  exactly what produces AI-slop defaults (Inter, indigo-500, box-shadow, rounded-2xl
  everywhere) — models fall back to their training-distribution defaults when given no
  constraint.
- **Ask it to self-report changed files/lines.** Keeps single-issue prompts actually
  single-issue, and catches scope creep before it compounds across a session.
- **Ask it to confirm honestly, not just "done."** Models default to claiming success;
  explicitly asking "partially fixed or not sure?" gets more accurate self-assessment.

---

## Common React Native / Expo "AI slop" defaults, and the exact language to kill each one

| Default Claude reaches for | Prompt language to remove it |
|---|---|
| `fontFamily: undefined` / system font on headings | "Headings must use the loaded custom serif font family exactly as registered via `useFonts` — never fall back to system font. Confirm the font loaded before rendering, don't just set fontFamily and hope." |
| `backgroundColor: '#fff'` cards with `borderRadius` + `shadowOpacity`/`elevation` | "No card containers. Content sits directly on the screen background — no backgroundColor, no border, no shadow/elevation props on this component." |
| Indigo/violet/purple as the only accent (`#6366f1`-ish) | "Do not use indigo, violet, or purple as the accent color. Use only the accent defined in DESIGN.md." |
| `LinearGradient` from purple to blue on every button | "No gradient fills on buttons. Solid fill or pill outline only, per DESIGN.md." |
| Emoji used as icons (🌙 ✨ 🔮) | "Replace emoji icons with [Phosphor/Feather] SVG icons from the icon set already in the project. No emoji in the UI." |
| Uniform `borderRadius: 16` / `borderRadius: 9999` on everything | "Don't apply the same border radius to every element by default — check DESIGN.md's radius scale and apply intentionally, or use none." |
| `flex: 1, justifyContent: 'center', alignItems: 'center'` centered-everything layouts | "Don't center this by default — follow the vertical rhythm and margin rules in DESIGN.md section 5." |
| Hardcoded RGB/hex sprinkled through component files instead of theme tokens | "Pull every color from the theme/DESIGN.md tokens, not hardcoded hex values. If a needed color isn't in the token set, ask me before inventing one." |
| `Animated.timing` scale-bounce on every touchable | "Don't add micro-animations to every touchable. One deliberate entrance animation for this screen (staggered fade/slide), nothing else, per DESIGN.md." |
