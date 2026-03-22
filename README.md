# 🏠 Credora

Housing trust built from evidence, not just a credit score.

Credora lets renters build a structured reliability profile from real evidence: rent history, income docs, bank signals, identity verification. Each category is scored separately with a clear rationale. Applicants control when their profile goes public.

---

## How it works

```
Applicant fills form
    → Credora scores it
    → Applicant reviews private results
    → Applicant chooses to publish
    → Immutable public snapshot (reviewers can see it anytime)
```

Publishing is one-way per snapshot. Once published it cannot be edited. A new publish creates a linked next version and old ones stay visible.

---

## Scoring

Six categories, each 0-100, fully deterministic:

| Category | Weight |
|---|---|
| Identity confidence | 15% |
| Housing history | 25% |
| Income stability | 20% |
| Payment consistency | 20% |
| Financial stability | 10% |
| Completeness / recency | 10% |

Missing evidence is flagged separately from actual risk. "No bank statements" is not the same as "missed three payments."

Outputs: `Recommended`, `Needs manual review`, `Potential inconsistency detected`, or `Insufficient evidence`.

---

## Pages

| Route | What |
|---|---|
| `/` | Landing page |
| `/applicant-profile` | Intake form |
| `/profiles/[profileId]` | Private results, dispute, publish |
| `/review` | Public snapshot directory |
| `/published/[snapshotId]` | Immutable public profile |
| `/blockchain-technology` | Attestation and hashing explainer |

---

## API

**Profiles**
```
POST   /api/profiles
GET    /api/profiles/[profileId]
POST   /api/profiles/[profileId]/publish
POST   /api/profiles/[profileId]/disputes
POST   /api/profiles/[profileId]/access
```

**Drafts**
```
POST   /api/profiles/drafts
GET    /api/profiles/[profileId]/draft
PATCH  /api/profiles/[profileId]/draft
POST   /api/profiles/[profileId]/submit
GET    /api/profiles/[profileId]/status
GET    /api/profiles/[profileId]/evaluation
GET    /api/profiles/summaries
```

---

## Evaluator modes

```bash
CREDORA_EVALUATOR_MODE=local_mock         # default
CREDORA_EVALUATOR_MODE=deterministic_only # rubric only, no external calls
CREDORA_EVALUATOR_MODE=hud_remote         # calls external HUD service
```

Falls back to the deterministic rubric if the external evaluator is unavailable.

---

## Blockchain

Every published snapshot gets a SHA256 payload hash. Snapshots are version-chained via the previous snapshot hash. No raw applicant data goes on-chain. Real anchoring plugs into `src/lib/attestations.ts`.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run eval:cases # run scoring test cases
```

---

## Limitations

- Storage is local JSON at `.data/credora-db.json`, not Postgres yet
- File uploads store filenames only
- Plaid connection is simulated
- Identity verification is self-asserted
- Attestations are demo hashes, not real signatures
