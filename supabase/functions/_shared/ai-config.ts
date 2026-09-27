// Single source of truth for the Claude model powering every AI feature in
// Nocturnal — the dream-insight narrator today, and whatever coach chat, MILD
// prompt personalization, or technique recommendations get built on top of it
// later. Bump this one line to upgrade every Edge Function at once instead of
// hunting through each one's source.
export const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

export const ANTHROPIC_API_VERSION = "2023-06-01";

// Standing house style for every AI-generated, user-facing string this app
// produces. Include this in every prompt (system or user message) whose output a
// Nocturnal user will actually read — see the memory note this rule came from
// (feedback_no_em_dashes_in_ai_output) for why.
export const NO_EM_DASH_RULE =
  "Never use an em dash (—) anywhere in your response. Use a comma, a period, or restructure the sentence instead.";
