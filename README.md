# Credora

Credora is a housing-first Applicant Profile app for thin-file renters. An applicant enters their information directly, uploads supporting evidence, submits a profile, and receives a transparent housing-specific reliability assessment they can review before sharing with a landlord.

## What changed

The app has been reworked from a report-centric demo into a profile-centric flow:

- `Applicant Profile` is now the main product surface
- submissions create persisted applicant/profile/submission/grading records
- evaluation now uses a non-LLM preparation pipeline:
  - evidence normalization
  - deterministic rubric extraction
  - external evaluator request packaging
  - stored evaluator responses with deterministic fallback
- completed profiles are private by default and shareable by revocable link
- blockchain is intentionally out of the MVP flow, but there is a future attestation hook

## Main routes

- `/` landing page
- `/applicant-profile` primary applicant intake page
- `/profiles/[profileId]` applicant-facing results page
- `/profiles/[profileId]/reviewer?token=...` reviewer-safe shared view

## Backend integration routes

These routes are the cleaner frontend-facing backend surface for a new UI:

- `POST /api/profiles/drafts`
  - create a draft profile from empty defaults or a partial payload
- `GET /api/profiles/[profileId]/draft`
  - fetch the current draft snapshot
- `PATCH /api/profiles/[profileId]/draft`
  - update the draft with a partial payload
- `POST /api/profiles/[profileId]/submit`
  - validate and submit the current draft, generate immutable submission + evaluation
- `GET /api/profiles/[profileId]/status`
  - fetch lightweight status for polling or workflow transitions
- `GET /api/profiles/[profileId]/evaluation`
  - fetch the stored evaluation result only
- `GET /api/profiles/summaries`
  - fetch lightweight profile summaries for dashboards or lists

Legacy compatibility routes still exist for the current UI:

- `POST /api/profiles`
  - one-shot create-and-submit path used by the current frontend
- `GET /api/profiles/[profileId]`
  - full applicant-facing profile view used by the current frontend

Legacy routes still redirect:

- `/applicant`
- `/profile/[reportId]`
- `/review/[reportId]`

## Current architecture

### Frontend

- `src/components/applicant-profile-form.tsx`
  - sectioned applicant intake form
  - progress/completeness rail
  - consent controls
  - simulated Plaid-style connection
- `src/components/profile-results-client.tsx`
  - applicant-facing result page
  - category bands, evidence, disputes, sharing, audit trail
- `src/components/reviewer-profile-client.tsx`
  - reviewer-safe shared view
  - manual note capture

### Backend

- `src/lib/store.ts`
  - backend orchestration and compatibility layer
  - draft creation/update
  - submission + evaluation persistence
  - share links, disputes, reviewer notes, audit logs
- `src/lib/api-contracts.ts`
  - frontend-facing request/response DTOs and API envelopes
- `src/lib/profile-defaults.ts`
  - empty draft defaults and completion calculations
- `src/lib/profile-merge.ts`
  - partial payload merge logic for multi-step frontends
- `src/lib/persistence.ts`
  - JSON-backed local persistence in `.data/credora-db.json`
- `src/app/api/profiles/*`
  - draft creation/update/submit
  - profile fetch, status fetch, evaluation fetch
  - log access
  - create disputes
  - create/revoke share links
  - save reviewer notes

### Grading

- `src/lib/grading.ts`
  - compatibility barrel for the evaluation pipeline
- `src/lib/evidence-normalizer.ts`
  - consent boundaries
  - raw input normalization
  - evaluator-ready evidence bundle creation
- `src/lib/rubric.ts`
  - deterministic rubric
  - weighted category scoring
  - confidence and recommendation logic
- `src/lib/evaluator-client.ts`
  - local mock mode for development
  - future HUD remote integration boundary
  - deterministic fallback behavior
- `src/lib/evaluator-validator.ts`
  - response schema validation
  - coherence enforcement across score, band, confidence, and recommendation
- `src/lib/synthetic-cases.ts`
  - reusable synthetic evaluation fixtures
- `src/lib/eval-runner.ts`
  - optional regression harness for synthetic cases

### Future portability

- `src/lib/attestations.ts`
  - no-op attestation interface for later signed artifacts or verifiable credentials

## Data model

The app now stores:

- applicants
- profiles
- submissions
- evidence items
- consent records
- grading results
- share links
- disputes
- reviewer notes
- audit logs
- future attestations

## Evaluator configuration

This repo does not run direct LLM prompts or model inference.

It supports three evaluator modes:

```bash
CREDORA_EVALUATOR_MODE=local_mock
```

Available values:

- `local_mock`
  - default development mode
  - stores a schema-valid mock response using the external evaluator contract
- `deterministic_only`
  - skips external response generation and stores the deterministic rubric result directly
- `hud_remote`
  - future integration mode for a separate HUD-powered evaluator service

For future HUD integration:

```bash
CREDORA_EVALUATOR_MODE=hud_remote
CREDORA_HUD_EVALUATOR_URL=https://your-hud-service.example.com/evaluate
```

If the external evaluator is unavailable, the app still works. It falls back to the deterministic rubric and stores a warning in the grading record and audit log.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

To verify:

```bash
npm run lint
npm run build
```

## Demo flow

1. Start on `/`
2. Open `/applicant-profile`
3. Fill the Applicant Profile or load a demo scenario
4. Submit the profile
5. Review the applicant-facing results on `/profiles/[profileId]`
6. Generate a share link and open the reviewer preview
7. Revoke access or file a dispute to show trust controls

## Important MVP boundaries

- This is not a universal social score
- This is not a morality score
- This is not employment or criminal screening
- Missing data lowers confidence, not character
- Raw financial data is not exposed in reviewer views
- Blockchain is not part of the MVP core flow

## Current limitations

- Persistence is local JSON storage, not Supabase yet
- Auth0 is not wired in yet
- Uploads store filenames only, not file contents
- Plaid is simulated, not live
- The reviewer view is share-link based, not full RBAC
- The external HUD evaluator is not connected in this repo yet
- Remote evaluator mode currently depends on a separate service URL being available
