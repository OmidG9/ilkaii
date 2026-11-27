# Security upgrade and regression plan

This document tracks the remaining dependency advisories and the guardrails for
upgrading them. Do not force-upgrade a major dependency on a production branch.

## Current state

| Package | Current | Advisory | Action |
| --- | --- | --- | --- |
| `sharp` | `0.35.5` | fixed | Upgraded and verified. Keep the lockfile change. |
| `zod` | `3.25.x` | GHSA-mrhx-c7xc-m3w5 | Requires zod 4.6.7+ (major). Plan in a dedicated branch. |
| `postcss` (inside Next) | bundled | GHSA-qx2v-qp2m-jg93 and related | Requires Next 16.4.6+ (major). Plan with the Next upgrade. |

`npm audit --omit=dev` must be reviewed after each step. `npm audit fix --force`
must not be used because it silently crosses major versions.

## Gate before any upgrade

Run from a clean worktree:

```bash
npm ci
npm run verify
```

`npm run verify` runs type-check, lint and the unit/contract suite. Then exercise
the smoke matrix below against a staging database and a real test gateway.

## Upgrade sequence

### 1. sharp (done)

- `sharp@^0.35.5` is installed.
- `src/services/upload.ts` uses `ReturnType<typeof sharp>` because 0.35 changed
  the exported typings.
- Verify: upload a JPEG/PNG through Admin → Media, confirm WebP output, thumbnails
  and deletion still work.

### 2. zod 4 in isolation

1. Create `chore/upgrade-zod4` from the current production commit.
2. Install `zod@^4.6.7` and run `npm run verify`.
3. Inspect and fix the breakages that matter to this project:
   - `z.record()` now requires key and value schemas.
   - `ZodError.flatten()` / `format()` usage in `src/lib/http.ts` and admin forms.
   - `z.preprocess` output typing in `src/lib/validation.ts`.
   - `z.string().url()` and `z.string().datetime()` edge cases.
   - `.default()` / `.transform()` ordering in checkout, returns and settings.
4. Run the smoke matrix and compare API validation errors with the current build.
5. Merge only after green build, unit tests and the staging checkout.

### 3. Next 16 + React 19

1. Create `chore/upgrade-next16` from the merged zod branch.
2. Install `next@^16.4.6`, `react@^19`, `react-dom@^19` and matching types.
3. Remove `next lint` in favour of the ESLint CLI (`eslint .`), because Next 16
   removes the `next lint` command.
4. Check async `params`/`searchParams` (already awaited in this codebase),
   middleware runtime changes and image configuration.
5. Run `npm run verify`, then the production build with
   `NEXT_DIST_DIR=.next-audit-build npm run build`.
6. Run the smoke matrix with CSP enabled (nonce-based) and confirm there are no
   CSP violations in the browser console.

## Smoke matrix (staging)

- [ ] OTP login (request, resend, verify) and session revocation.
- [ ] Guest cart → login → cart merge.
- [ ] COD checkout with valid address and every shipping method.
- [ ] Online checkout against each configured sandbox gateway.
- [ ] Payment success, cancel and duplicate callback (idempotency).
- [ ] Gateway initiation failure → stock, cart and coupon restored.
- [ ] Percentage, fixed, capped and usage-limited coupons.
- [ ] 100% discount / pickup free order (must not require a gateway).
- [ ] Partial return quantities, duplicate return rejection, per-line restock.
- [ ] Admin order status transitions and COD settled-on-delivery.
- [ ] Media upload (Cloudinary and local volume) and deletion.
- [ ] CSP nonce, HSTS and security headers in production.
- [ ] `npm audit --omit=dev` and `npm run verify`.

## Rollback

Keep the last known-good lockfile and deploy the previous release. A dependency
upgrade should never be mixed with feature changes in the same deploy.
