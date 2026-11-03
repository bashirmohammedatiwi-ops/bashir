export const meta = {
  name: 'mobile-app-quality-leap',
  description: 'Implement the 35 verified work packages for the Deema Flutter app + backend in dependency levels, gate each level with analysis, then adversarially review and fix',
  phases: [
    { title: 'Level 1', detail: 'shared foundations + backend (10 packages in parallel)' },
    { title: 'Gate 1', detail: 'analyze, apply cross-file follow-ups, fix breakages' },
    { title: 'Level 2', detail: 'feature packages (18 in parallel)' },
    { title: 'Gate 2' },
    { title: 'Level 3', detail: 'new signature improvements' },
    { title: 'Level 4', detail: 'routing wiring, dark mode foundation, compare' },
    { title: 'Gate 3' },
    { title: 'Gate 4' },
    { title: 'Review', detail: 'adversarial reviewers by dimension over the full diff' },
    { title: 'Fix', detail: 'apply verified review fixes' },
  ],
}

const ROOT = '/Users/cloud/.cursor/worktrees/full-app/puf'
const SP = '/private/tmp/claude-502/-Users-cloud--cursor-worktrees-full-app-puf/15c4aef5-cecb-413a-9741-7ba08e943d23/scratchpad'
const BASE = args.base

const RULES = `PROJECT: «ديما الحياة» (Deema Alhayat) Iraqi beauty store. Repo root ${ROOT}. Flutter app: ${ROOT}/mobile-app (Arabic-first RTL + English). Backend NestJS + Prisma: ${ROOT}/backend. Web store (Next.js, reference only, do not edit unless your package says so): ${ROOT}/web-store.
The owner asked for a qualitative leap in the mobile app: ease of use, elegance, distinctiveness, and everything working flawlessly. An audit produced verified findings and a plan of work packages; you implement ONE package.

HARD RULES (violating these breaks other engineers' work):
- Edit ONLY the files your package owns (listed in its spec). If the right fix needs a change in a file you do not own, do NOT edit it; describe it precisely in "followups" (file, exact change).
- Another Claude session works in the same git worktree on manager-app/, admin-desktop/ and backend/src/modules/control/. Never touch those. NEVER run git commit, git stash, git checkout, git reset, git restore, git clean, or anything that changes git state or other files.
- OWNER DECISION: NO voice search and NO microphone anywhere in the mobile app (no speech_to_text, no mic buttons, no RECORD_AUDIO / NSMicrophoneUsageDescription / NSSpeechRecognitionUsageDescription). Ignore any spec text suggesting voice input; if you find such code in files you own, remove it.
- OWNER DECISION: NO "forgot password" link/flow anywhere in the app (skip findings auth-04, account-m4 and any forgotPassword UI; remove such UI/strings if found in files you own).
- OWNER DECISION: NO birthday feature (no birthday tile, date picker, birthday field editing or birthday reward text) — skip account-22; remove such UI if found in files you own.
- OWNER DECISION: the «ديما» advisor is shown ONLY when the app language is Arabic. Every entry point (tabs, buttons, cards, chips, launchers, deep links to /advisor, 'ask Deema' blocks) must be hidden when the language is not Arabic (use the app's language provider, e.g. languageCodeProvider / locale). Do not build English Deema UI.
- Never edit backend/.env or any secrets, never print secrets. Never run flutter build/apk/ios builds or flutter pub upgrade (disk is limited). flutter pub get is allowed only if you changed pubspec.yaml.
- Database migrations: write the SQL by hand in a new folder backend/prisma/migrations/<YYYYMMDDHHMMSS>_<name>/migration.sql (timestamp after 20261019140000) and run \`cd ${ROOT}/backend && npx prisma generate\`. NEVER write a migration that deletes or rewrites existing customer data (no DELETE of reviews/orders etc.); add nullable columns or indexes only. If a unique constraint would conflict with existing duplicates, skip the DB constraint and enforce it in code instead (e.g. find-then-update upsert).
- Backward compatibility: every backend response change must stay compatible with older app versions in the field AND the web store (${ROOT}/web-store). New params are optional.
- Money math must match backend rules: coupon applies to (subtotal − package savings); loyalty: 1 point = 1 IQD discount, redeem in steps of 250, earn 1%; free shipping threshold uses subtotal.
- UI: use the design system (core/theme AppText/AppCorners/AppColors tokens, context.worldTheme colors, core/widgets). Every user-facing string must be bilingual (Arabic + English) via the app's l10n mechanism (read lib/core/l10n/app_strings.dart and localized_text.dart to see how). Respect RTL (EdgeInsetsDirectional, AlignmentDirectional), text scale up to 1.25, tap targets >= 44, and MediaQuery.disableAnimations for motion.
- Fonts: IBM Plex Sans Arabic TTFs are available locally at ${SP}/aarres/res/font/ (ibmplex_sans_arabic_{regular_400,medium_500,semibold_600,bold_700}.ttf). Other OFL fonts can be downloaded with curl -L from https://github.com/google/fonts/raw/main/ofl/<familylowercase>/<File>.ttf (check the repo path if 404, e.g. via https://api.github.com/repos/google/fonts/contents/ofl/<family>).
- Quality bar: production code, idiomatic, matching surrounding style and comment density (comments in Arabic like the codebase). Read every owned file fully before editing. Do not leave TODOs for things you can do.
- VERIFY before returning: for Dart, run \`cd ${ROOT}/mobile-app && flutter analyze <your changed dart files>\` and fix every error and warning in your files (ignore problems in files you don't own — other engineers are mid-edit). For backend, run \`cd ${ROOT}/backend && npx tsc --noEmit -p tsconfig.json\` and fix errors in your files; run related jest tests if present (npx jest <pattern>).`

const RESULT = {
  type: 'object',
  properties: {
    package: { type: 'string' },
    summary: { type: 'string', description: 'what you changed, 5-12 sentences' },
    files_changed: { type: 'array', items: { type: 'string' } },
    findings_done: { type: 'array', items: { type: 'string' } },
    findings_skipped: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, reason: { type: 'string' } }, required: ['id', 'reason'] } },
    followups: { type: 'array', items: { type: 'string' }, description: 'precise cross-file changes needed in files you do not own' },
    verification: { type: 'string', description: 'commands run and their result' },
  },
  required: ['package', 'summary', 'files_changed', 'findings_done', 'findings_skipped', 'followups', 'verification'],
}

const LEVELS = args.levels // [[names...], ...]

function implPrompt(name, priorSummaries) {
  return `${RULES}\n\nYOUR PACKAGE: "${name}". Read its full spec (goal, owned_files, instructions, and the verified findings with evidence and fixes) from ${SP}/pkgs/${name}.json. Implement ALL of it.\nIMPORTANT — RESUMING: an earlier attempt at this package was interrupted midway (the engineer was cut off without finishing or verifying). Some of your owned files may already contain partial, possibly incomplete or inconsistent edits. First run \`cd ${ROOT} && git diff ${BASE} -- <each owned file>\` (and check untracked files in owned dirs) to see what is already there, keep what is correct, fix anything half-done, and complete everything that is missing. Then verify the whole package.\nWhere the spec conflicts with the HARD RULES above, the rules win (note it in findings_skipped).\n${args.priorFile ? `\nEarlier levels are DONE and committed. Their summaries, changed files and followups are in ${args.priorFile} (JSON array) — read the entries relevant to your package (new APIs, string keys, widgets, models) and read the actual code before relying on it.\n` : ''}${priorSummaries ? `\nWork already completed by earlier levels (APIs, strings, widgets you can now use — read the actual code before relying on it):\n${priorSummaries}\n` : ''}\nReturn the structured result.`
}

const GATE_RESULT = {
  type: 'object',
  properties: {
    analyze_errors_before: { type: 'integer' },
    analyze_errors_after: { type: 'integer' },
    backend_tsc_ok: { type: 'boolean' },
    tests: { type: 'string' },
    followups_applied: { type: 'array', items: { type: 'string' } },
    followups_not_applied: { type: 'array', items: { type: 'string' } },
    fixes: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['analyze_errors_before', 'analyze_errors_after', 'backend_tsc_ok', 'tests', 'followups_applied', 'followups_not_applied', 'fixes', 'notes'],
}

function gatePrompt(levelNo, results) {
  return `${RULES.replace('Edit ONLY the files your package owns (listed in its spec). If the right fix needs a change in a file you do not own, do NOT edit it; describe it precisely in "followups" (file, exact change).', 'You are the INTEGRATION GATE for level ' + levelNo + '. All engineers of this level have finished, so you may edit any file in mobile-app/ and backend/ (still never manager-app/, admin-desktop/, backend/src/modules/control/).')}\n\nTasks:\n1) Apply every FOLLOWUP below that is still needed and correct (read the code first; skip ones already done or wrong, and say why).\n2) Run \`cd ${ROOT}/mobile-app && flutter analyze\` and fix ALL errors (and warnings introduced by this work, e.g. unused imports, undefined names) until there are zero errors. Do not mass-reformat.\n3) Run \`cd ${ROOT}/mobile-app && flutter test test/category_index_test.dart test/search_suggest_test.dart\` and any new tests under mobile-app/test (excluding zz_*), and fix failures.\n4) Run \`cd ${ROOT}/backend && npx tsc --noEmit -p tsconfig.json && npx jest --silent\` (if jest config exists) and fix failures caused by this work. Ignore failures only inside backend/src/modules/control/ (another session) and report them.\n5) Sanity-check integration between packages of this level (e.g. a widget calls a string key or API method another package added — confirm names match).\n\n${args.extraGateFile ? `ALSO: other engineers of this same level finished earlier; their results (summaries, files, FOLLOWUPS) are in ${args.extraGateFile} — apply their still-needed followups too.\n` : ''}Level ${levelNo} engineer results:\n${JSON.stringify(results.map((r) => ({ package: r.package, summary: r.summary, files: r.files_changed, followups: r.followups, skipped: r.findings_skipped })), null, 1)}`
}

const summaries = args.prior || []
const allResults = []
const gates = []
let levelNo = 0
for (const names of LEVELS) {
  levelNo++
  const phaseName = `Level ${args.levelOffset + levelNo}`
  phase(phaseName)
  const prior = summaries.length ? summaries.map((s) => `- ${s.package}: ${s.summary} Files: ${s.files_changed.join(', ')}`).join('\n') : ''
  let res = (await parallel(names.map((n) => () => agent(implPrompt(n, prior), { label: `impl:${n}`, phase: phaseName, schema: RESULT })))).filter(Boolean)
  let missing = names.filter((n) => !res.some((r) => r && r.package === n))
  if (missing.length) {
    log(`level ${levelNo}: retrying ${missing.join(', ')}`)
    const again = (await parallel(missing.map((n) => () => agent(implPrompt(n, prior), { label: `retry:${n}`, phase: phaseName, schema: RESULT })))).filter(Boolean)
    res = res.concat(again)
    missing = names.filter((n) => !res.some((r) => r && r.package === n))
  }
  if (missing.length) {
    log(`level ${levelNo}: STOPPING — no result from ${missing.join(', ')}`)
    return { stoppedAtLevel: levelNo, missing, results: allResults.concat(res), gates }
  }
  allResults.push(...res)
  summaries.push(...res)
  {
    const g = `Gate ${args.levelOffset + levelNo}`
    phase(g)
    const levelRes = res
    const gate = await agent(gatePrompt(args.levelOffset + levelNo, levelRes), { label: `gate:${args.levelOffset + levelNo}`, phase: g, schema: GATE_RESULT })
    gates.push({ level: levelNo, ...gate })
    log(`gate ${levelNo}: analyze errors ${gate ? gate.analyze_errors_before + '→' + gate.analyze_errors_after : '?'}, backend tsc ${gate ? gate.backend_tsc_ok : '?'}`)
  }
}

if (!args.review) return { results: allResults, gates }
phase('Review')
const DIMENSIONS = [
  { key: 'money', prompt: 'MONEY & ORDER CORRECTNESS: prices shown vs charged (shade prices), cart/checkout totals, coupons, loyalty, shipping, packages, idempotent order placement, cancel/refund rules, stock decrements/restores. Compare app math with backend/src/modules/orders/orders.service.ts.' },
  { key: 'crash', prompt: 'CRASHES & RUNTIME ERRORS: null/empty handling, async gaps using BuildContext after await without mounted checks, setState after dispose, providers reading disposed refs, list index errors, layout exceptions (unbounded constraints, overflow at text scale 1.25), JSON parsing of new fields, migrations that could fail on production data.' },
  { key: 'navigation', prompt: 'NAVIGATION & STATE FLOW: router wiring for every new screen/param, deep links, back behaviour, tab switching, auth gates and returning to the intended page, refresh/invalidation after mutations, offline banner and session-expired handling.' },
  { key: 'l10n', prompt: 'LOCALIZATION & RTL & ACCESSIBILITY: every new user-facing string bilingual and grammatical (Arabic plurals), digits, RTL directional paddings/alignment, semantics labels and tooltips, 44pt targets, reduce-motion respected.' },
  { key: 'design', prompt: 'DESIGN CONSISTENCY & ELEGANCE & PERFORMANCE: use of the design system tokens and shared widgets, consistent radii/shadows/typography, no hardcoded colors where world theme tokens exist, smooth animations without per-frame rebuilds, images decoded at the right size, no heavy work in build().' },
  { key: 'backend', prompt: 'BACKEND SAFETY & COMPATIBILITY: API changes stay backward compatible with older app versions and the web store (web-store/lib, web-store/app), validation DTOs (forbidNonWhitelisted is ON in main.ts — new body fields must be declared), migrations are additive and safe, auth/authorization checks on new endpoints, no secrets logged.' },
]
const FIND = {
  type: 'object',
  properties: {
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          file: { type: 'string' },
          line: { type: 'integer' },
          evidence: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['title', 'severity', 'file', 'line', 'evidence', 'fix'],
      },
    },
  },
  required: ['issues'],
}
const VOTE = { type: 'object', properties: { real: { type: 'boolean' }, reason: { type: 'string' } }, required: ['real', 'reason'] }

const reviewed = await pipeline(
  DIMENSIONS,
  (d) => agent(`${RULES}\n\nYou are a READ-ONLY REVIEWER (do not edit files). Review ALL changes made in this effort: run \`cd ${ROOT} && git diff ${BASE} -- mobile-app backend\` plus \`git status --short mobile-app backend\` for new untracked files (read them). Focus dimension: ${d.prompt}\nReport only real, concrete problems introduced or left by these changes (cite file:line from the CURRENT code). Skip style nits. Max 25 issues, most severe first.`, { label: `review:${d.key}`, phase: 'Review', schema: FIND }),
  (r, d) => parallel((r ? r.issues : []).filter((i) => i.severity !== 'low').map((i) => () =>
    agent(`${RULES}\n\nREAD-ONLY. Adversarially verify this reported problem in the CURRENT code of ${ROOT}. Re-open the file and surrounding code; try to refute it (maybe guarded elsewhere, not reachable, or the fix would be wrong). Default to real=false if you cannot confirm it from the code.\nIssue: ${JSON.stringify(i)}`, { label: `vote:${d.key}`, phase: 'Review', schema: VOTE })
      .then((v) => (v && v.real ? { ...i, dimension: d.key, why: v.reason } : null)))),
)
const confirmedIssues = reviewed.flat().filter(Boolean)
log(`${confirmedIssues.length} review issues confirmed`)

phase('Fix')
let fixResult = null
if (confirmedIssues.length) {
  fixResult = await agent(`${RULES.replace('Edit ONLY the files your package owns (listed in its spec). If the right fix needs a change in a file you do not own, do NOT edit it; describe it precisely in "followups" (file, exact change).', 'You are the FINAL FIXER: you may edit any file in mobile-app/ and backend/ (never manager-app/, admin-desktop/, backend/src/modules/control/).')}\n\nFix every confirmed review issue below (read the code first; if one turns out wrong, skip it and say why). Then run the full verification: flutter analyze (zero errors), the mobile tests, backend tsc and jest. Return a summary.\n\nISSUES:\n${JSON.stringify(confirmedIssues, null, 1)}`, { label: 'fix:final', phase: 'Fix', schema: GATE_RESULT })
}

return { results: allResults, gates, confirmedIssues, fixResult }