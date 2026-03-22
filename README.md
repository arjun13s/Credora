# Credora

Credora is a housing-first Applicant Profile app for thin-file renters. An applicant fills out a private profile, gets a housing-specific reliability result, and can then choose to publish an immutable public snapshot.

## Current product flow

1. Applicant completes `/applicant-profile`
2. Credora stores the submission and evaluates it
3. Applicant reviews private results at `/profiles/[profileId]`
4. Applicant may publish a permanent public snapshot
5. Published snapshots appear in the public directory and on `/published/[snapshotId]`

Publishing is intentional and one-way for each snapshot:

- the public snapshot is immutable
- later publishes create a newer linked version
- older public versions remain visible as historical records

## Main routes

- `/` landing page
- `/applicant-profile` applicant intake page
- `/profiles/[profileId]` applicant-only results page
- `/review` public snapshot directory
- `/published/[snapshotId]` immutable public snapshot page

Legacy compatibility routes still redirect:

- `/applicant`
- `/profile/[reportId]`
- `/review/[reportId]`
- `/profiles/[profileId]/reviewer`

## Backend routes

- `POST /api/profiles`
  - one-shot create-and-submit flow used by the current frontend
- `GET /api/profiles`
  - list full profile views
- `GET /api/profiles/[profileId]`
  - fetch full applicant-facing profile view
- `POST /api/profiles/[profileId]/publish`
  - publish a new immutable public snapshot for the latest scored result
- `POST /api/profiles/[profileId]/disputes`
  - open a dispute against the current private profile
- `POST /api/profiles/[profileId]/access`
  - append an access event to the audit log

Draft-oriented integration routes for a replacement frontend:

- `POST /api/profiles/drafts`
- `GET /api/profiles/[profileId]/draft`
- `PATCH /api/profiles/[profileId]/draft`
- `POST /api/profiles/[profileId]/submit`
- `GET /api/profiles/[profileId]/status`
- `GET /api/profiles/[profileId]/evaluation`
- `GET /api/profiles/summaries`

Deprecated:

- `POST /api/profiles/[profileId]/share-links`
- `DELETE /api/profiles/[profileId]/share-links`
  - both return `410 Gone`

## Architecture

### App/backend orchestration

- `src/lib/store.ts`
  - profile creation
  - draft update/submit flow
  - evaluation persistence
  - immutable public snapshot publishing
  - disputes, audit logs, compatibility helpers

### Evaluation preparation

- `src/lib/evidence-normalizer.ts`
  - normalizes applicant input into structured evidence
- `src/lib/rubric.ts`
  - deterministic category scoring and confidence logic
- `src/lib/evaluator-client.ts`
  - builds requests for an external evaluator and handles fallback
- `src/lib/evaluator-validator.ts`
  - validates external evaluator responses
- `src/lib/hud-contract.ts`
  - central HUD-facing translation layer
  - exact nested recommendation payload builder
  - canonical decision-band mapping
  - HUD category score mapping

### Persistence

- `src/lib/persistence.ts`
  - local JSON persistence in `.data/credora-db.json`
- `src/lib/api-contracts.ts`
  - typed request/response contracts

### Future blockchain hook

- `src/lib/attestations.ts`
  - no-op attestation interface

The current blockchain posture is intentionally lightweight:

- public snapshots get a stable payload hash
- the app stores a demo attestation record
- no raw applicant data is written on-chain
- future anchoring should use the snapshot hash, not the full profile

## Evaluator configuration

This repo does not run direct LLM prompts or model inference.

Supported modes:

```bash
CREDORA_EVALUATOR_MODE=local_mock
```

Available values:

- `local_mock`
- `deterministic_only`
- `hud_remote`

Optional future remote evaluator configuration:

```bash
CREDORA_EVALUATOR_MODE=hud_remote
CREDORA_HUD_EVALUATOR_URL=https://your-hud-service.example.com/evaluate
```

If the external evaluator is unavailable, the app falls back to the deterministic rubric.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verify locally

```bash
npm run lint
npm run build
npm run eval:cases
```

## Current limitations

- persistence is local JSON storage, not Postgres/Supabase yet
- uploads store filenames only, not file contents
- Plaid/bank connection is simulated
- identity verification is self-asserted in the demo flow
- attestation records are demo-only and not cryptographic signatures yet
- public snapshots currently default to the applicant's full name
- HUD case IDs are supported as system-owned fields, but the current app does not assign them yet
