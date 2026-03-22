# Credora

> **Housing trust, built from evidence. Not just a credit score.**

Credora gives thin-file renters a way to actually prove they're reliable. Fill out a structured profile, get a transparent score broken down by category, and — when you're ready — publish an immutable public snapshot that lives forever. No black boxes. No automated rejections. No vibes-based landlord decisions.

---

## What it does

Traditional credit scores miss the full picture. Credora builds a housing-specific reliability profile from real evidence:

- **Payment consistency** — rent streaks, utility payments, no missed months
- **Income regularity** — stable deposits, pay stubs, employment duration
- **Housing history** — previous tenancies, references, time at address
- **Balance stability** — savings behavior, cash flow patterns

Each category gets its own score + rationale. Missing evidence is flagged separately from actual risk — so "we don't have your bank statements" doesn't count the same as "you missed three payments."

---

## The flow

```
Applicant fills form  →  Credora scores it  →  Private results first
                                                      ↓
                                          Applicant chooses to publish
                                                      ↓
                                          Immutable public snapshot
                                          (reviewers can see it anytime)
```

Publishing is **intentional and one-way** per snapshot:
- once published, a snapshot can't be edited
- a new publish creates a linked next version
- old versions stay visible as a permanent record

---

## Pages

| Route | What's there |
|---|---|
| `/` | Landing — hero, how it works, feature grid |
| `/applicant-profile` | Intake form — submit once, score everything |
| `/profiles/[profileId]` | Private results — applicant-only, full breakdown |
| `/review` | Public directory — tile grid of published snapshots |
| `/published/[snapshotId]` | Immutable public profile — shareable, permanent |
| `/blockchain-technology` | How attestations and hashing work |

Legacy routes (`/applicant`, `/profile/[id]`, `/review/[id]`) redirect automatically.

---

## API

### Core

```
POST /api/profiles                        create + submit in one shot
GET  /api/profiles/[profileId]            fetch full profile
POST /api/profiles/[profileId]/publish    publish immutable snapshot
POST /api/profiles/[profileId]/disputes   open a dispute
POST /api/profiles/[profileId]/access     append audit log event
```

### Draft flow (for incremental frontends)

```
POST   /api/profiles/drafts
GET    /api/profiles/[profileId]/draft
PATCH  /api/profiles/[profileId]/draft
POST   /api/profiles/[profileId]/submit
GET    /api/profiles/[profileId]/status
GET    /api/profiles/[profileId]/evaluation
GET    /api/profiles/summaries
```

> `POST/DELETE /api/profiles/[profileId]/share-links` → `410 Gone` (deprecated)

---

## Architecture

### The scoring pipeline

```
applicant input
    → evidence-normalizer.ts   (structure raw input into typed evidence)
    → rubric.ts                (deterministic category scores + confidence)
    → evaluator-client.ts      (optional external evaluator, with fallback)
    → evaluator-validator.ts   (validate external responses)
    → hud-contract.ts          (HUD-facing payload, band mapping, recommendations)
    → store.ts                 (persist everything, handle publish/dispute/audit)
```

### Key files

| File | Does what |
|---|---|
| `src/lib/store.ts` | The brain — profile lifecycle, snapshots, disputes, audit logs |
| `src/lib/rubric.ts` | Deterministic scoring — no LLM, no randomness |
| `src/lib/evaluator-client.ts` | Calls external evaluator if configured, falls back gracefully |
| `src/lib/hud-contract.ts` | HUD translation layer — recommendation payloads, band mapping |
| `src/lib/persistence.ts` | Local JSON storage at `.data/credora-db.json` |
| `src/lib/attestations.ts` | Blockchain hook — currently no-op, ready for real anchoring |

### Blockchain posture

Intentionally lightweight for now:
- every published snapshot gets a stable **payload hash**
- a demo attestation record is stored alongside it
- **no raw applicant data goes on-chain** — only the hash
- future anchoring plugs into `attestations.ts` using the snapshot hash

---

## Evaluator modes

No LLMs run in this repo. The evaluator is a swappable boundary:

```bash
CREDORA_EVALUATOR_MODE=local_mock        # default, good for dev
CREDORA_EVALUATOR_MODE=deterministic_only # rubric only, no external calls
CREDORA_EVALUATOR_MODE=hud_remote        # calls a real external service
```

For remote mode:
```bash
CREDORA_HUD_EVALUATOR_URL=https://your-hud-service.example.com/evaluate
```

If the external evaluator is down, the app falls back to the deterministic rubric automatically.

---

## UI details

- **Light mode by default**, dark mode toggle top-right of every page
- **No login required** — fully public, no accounts
- Score rings on the directory page are color-coded: green (≥ 75), amber (≥ 55), red (below 55)
- Applicants see their full breakdown privately before deciding to publish

---

## Run it

```bash
npm install
npm run dev
```

Hit `http://localhost:3000`.

```bash
npm run lint
npm run build
npm run eval:cases   # run scoring test cases
```

---

## Known limitations

- **Storage**: local JSON (`.data/credora-db.json`), not Postgres/Supabase yet
- **Uploads**: filenames only, file contents not stored
- **Plaid**: simulated bank connection
- **Identity**: self-asserted in the demo flow
- **Attestations**: demo hashes only, not real cryptographic signatures
- **HUD case IDs**: supported in the data model, not assigned by the app yet
