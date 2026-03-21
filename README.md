# Credora

Credora is a housing-first, consent-based trust infrastructure demo for thin-file applicants. This MVP helps renters turn verified identity, payment, income, and housing evidence into an explainable rental reliability profile that a landlord can review without relying on a single black-box score.

## What is implemented

- Marketing landing page with clear anti-"social credit" positioning
- Applicant build flow with:
  - persona presets
  - granular source consent
  - sandbox bank connection toggle
  - evidence upload metadata
  - explainable input controls
- Rule-based scoring engine with:
  - six trust categories
  - confidence bands
  - contextual recommendation states
  - reason drivers, missing evidence, and risk flags
- Applicant profile dashboard with:
  - evidence breakdown
  - consent receipts
  - share-link controls
  - dispute workflow
  - audit trail
- Reviewer dashboard with:
  - soft recommendation only
  - shared evidence panel
  - manual-review notes
  - revocation-aware access handling
- In-memory API routes for reports, access logs, disputes, reviewer notes, and consent updates

## Key routes

- `/` landing page
- `/applicant` applicant build flow
- `/profile/[reportId]` applicant-facing report and dispute page
- `/review/[reportId]` reviewer-facing dashboard

## Tech notes

- Built with Next.js 16 App Router and TypeScript
- Uses an in-memory server store for demo speed, so reports reset when the server restarts
- No real auth, Plaid, Supabase, or Stripe Identity credentials are required for this demo build
- Consent boundaries are enforced in the scoring path: unchecked sources are removed from computation

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For a production build sanity check:

```bash
npm run lint
npm run build
```

## Demo guidance

1. Start on `/` to frame the product.
2. Go to `/applicant` and pick a preset like "Newcomer with steady payments".
3. Adjust consent toggles or simulate an inconsistency to show guardrails.
4. Generate the profile and walk through the applicant-facing explanation.
5. Open the reviewer link and show that the recommendation is soft, transparent, and revocable.
6. Revoke reviewer access or file a dispute to demonstrate trust controls.

## Current limitations

- Persistence is not backed by a real database
- File uploads store filenames only; no OCR or document extraction is performed
- Bank connection is a sandbox simulation, not a live Plaid integration
- Reviewer links are demo links, not authenticated or signed tokens
- No FCRA-grade workflow automation, adverse-action notices, or production security controls yet
