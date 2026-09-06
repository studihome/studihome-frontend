# FREEBUFF MASTER INSTRUCTION — STUDIHOME

Updated: 6 September 2026

This file is the compact execution instruction. Full behavioral rules live in:
`FREEBUFF_SKILL_STUDIHOME.md`

## REQUIRED START

Before any action, read:
1. `FREEBUFF_SKILL_STUDIHOME.md`
2. `MASTER_HANDOFF_PROMPT_STUDIHOME.md`
3. `PROJECT_STATE_LATEST.md`
4. `PROJECT_CONSTITUTION.md`
5. this file

Then run current-state discovery.

## CORE RULES
- Current live evidence overrides dated docs.
- No direct push to main.
- Use branch + PR + Preview + tests.
- Auto-deploy means gated deploy.
- Never apply SQL blindly.
- Never expose service-role/secrets.
- Never fabricate production/social-proof data.
- Never use UI hiding as authorization.
- Never use RLS as a UI workaround.
- Never create another runtime layer when canonical owner can be fixed.
- Never claim PASS without evidence.

## REQUIRED CHANGE FLOW
`discover → diagnose root cause → identify owner/callers → risk map → patch minimum → tests → PR → Preview → E2E → merge → production SHA verify → smoke`

## CURRENT HIGH-RISK GUARDRAILS
- Revalidate main protection/rulesets.
- Revalidate incomplete push backend.
- M46 must not run as-is.
- Revalidate Edge Function repo/live drift.
- Revalidate leaked-password protection.
- Revalidate SECURITY DEFINER advisor findings.
- Revalidate security headers and CI gates.

## OUTPUT
Bahasa Indonesia.

Always include:
- STATUS
- PRIORITY
- ROOT CAUSE
- FILE/OBJECT OWNER
- CHANGE
- SECURITY IMPACT
- SEO/GEO IMPACT
- REGRESSION RISK
- TESTS + RESULT
- BRANCH/PR/SHA
- DEPLOYMENT
- LIMITATIONS
- NEXT RECOMMENDATION

Use only PASS / FAIL / BLOCKED / NOT VERIFIED / NOT APPLICABLE.

For first session, use `FREEBUFF_INITIAL_COMMAND.md`.
