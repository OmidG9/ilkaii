# Deployment Guide — ilkaii

White-label Persian fashion e-commerce (Next.js 15 App Router + Prisma + MySQL).

## 1. Requirements

- Node.js **20+** (build and runtime; `sharp` prebuilt binaries)
- MySQL **8.0+** with `utf8mb4` / `utf8mb4_unicode_ci`
- A reverse proxy (Nginx/Caddy) terminating TLS
- About 512 MB RAM minimum; 1 GB recommended for image optimization

## 2. Environment

Copy `.env.example` to `.env` and fill in real values. Both Next.js and the
Prisma CLI read `.env`, as do the seed/admin scripts (`dotenv`). Secrets are
validated lazily; an invalid configuration fails fast on the first request that
needs it.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | `mysql://user:pass@host:3306/db?charset=utf8mb4` |
| `SESSION_SECRET` | yes | ≥ 32 random characters; rotating invalidates sessions |
| `NEXT_PUBLIC_BASE_URL` | yes | Public HTTPS origin, no trailing slash |
| `NEXT_PUBLIC_SITE_NAME` | no | Default brand name (admin can override) |
| `NEXT_PUBLIC_SITE_TAGLINE` | no | Default tagline |
| `NEXT_PUBLIC_CONTACT_EMAIL` | no | Default contact email |
| `NEXT_PUBLIC_IMAGE_HOSTS` | no | Comma-separated extra image hosts (Cloudinary is built in) |
| `SMS_API_URL` / `SMS_API_TOKEN` | prod | Kavenegar-style HTTP SMS adapter |
| `EMAIL_API_URL` | prod (marketing) | HTTP JSON email provider; token can be stored in Admin → Settings → Integrations |
| `CRON_SECRET` | prod | Bearer secret for `POST /api/cron/maintenance`; without it the route is 404 in production |
| `PAYMENT_PROVIDER` | prod | `ZARINPAL` in production; `MOCK` is rejected |
| `ZARINPAL_MERCHANT_ID` | prod | Merchant ID |
| `ZARINPAL_SANDBOX` | no | `true` for sandbox, `false` for live |
| `STORAGE_DRIVER` | no | `LOCAL` (default) or `CLOUDINARY` |
| `CLOUDINARY_*` | if Cloudinary | cloud name, API key, API secret |

> `NODE_ENV=production` is required at runtime so that MOCK payments and the
> development OTP endpoint are disabled.

## 3. Database setup

```bash
npm ci
npx prisma generate
npx prisma migrate deploy      # applies prisma/migrations/*
npm run db:seed                # roles/permissions + demo catalog (dev only)
```

For an existing database created with `db:push`, back up first and review the
SQL in `prisma/migrations/20260101000000_init/migration.sql` before applying.

### Bootstrap the first administrator

There is intentionally no public admin signup. Grant the role to an existing
account (the account is created on first OTP login):

```bash
ADMIN_PHONE=09123456789 BOOTSTRAP_CONFIRM=yes npm run admin:grant
```

## 4. Build & run

```bash
npm ci
npm run type-check
npm test
npm run build
```

Start the production server (respects `PORT`, default 3000):

```bash
npm run start
```

For container/standalone deployments, add `output: "standalone"` to
`next.config.ts`, rebuild, copy `public/` and `.next/static/` into the standalone
folder, then run `node .next/standalone/server.js`.

Health check: `GET /` should return 200 and (when the DB is up) the storefront.

## 5. Reverse proxy

Forward all traffic to the Node process and preserve `Host` and `X-Forwarded-*`.
Example Nginx essentials:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  client_max_body_size 6m;   # image uploads are capped at 5 MB
}
```

The app emits its own security headers (CSP, HSTS in production, etc.); do not
duplicate conflicting CSP headers at the proxy.

## 6. Payments & SMS

- **Zarinpal**: set `PAYMENT_PROVIDER=ZARINPAL`, `ZARINPAL_MERCHANT_ID`, and
  `ZARINPAL_SANDBOX=false` for live. Callbacks hit
  `/api/payments/callback?provider=zarinpal`.
- **COD**: handled without a gateway; the order is marked paid on creation.
- **SMS**: `SMS_API_URL` + `SMS_API_TOKEN`. Without them, production OTP login
  cannot send codes — configure a provider before launch.

## 7. Storage

- `LOCAL` writes to `public/uploads/` (ignored by git). On ephemeral hosts this
  directory must be a persistent volume.
- `CLOUDINARY` requires all three credentials; images are delivered from
  `res.cloudinary.com` (already allowlisted for `next/image`).

## 8. Operations

- **Backups**: nightly `mysqldump` + periodic restore drills.
- **Sessions/OTP cleanup**: expired `Session` and `OtpChallenge` rows can be
  pruned by a scheduled job (`DELETE ... WHERE expiresAt < NOW()`).
- **Audit retention**: keep `AuditLog` per your compliance policy; it is
  append-only from the application.
- **Migrations**: always `prisma migrate deploy` (never `db push`) in production.
- **Rollback**: keep the previous standalone build; restore the DB snapshot before
  rolling back a schema change.

## 9. Post-deploy checklist

- [ ] `NODE_ENV=production`, `SESSION_SECRET` set and unique
- [ ] `prisma migrate deploy` completed
- [ ] Service admin bootstrapped; no default credentials exist
- [ ] Zarinpal merchant configured and a real sandbox payment verified
- [ ] SMS provider sends OTP to a real phone
- [ ] `NEXT_PUBLIC_BASE_URL` is the public HTTPS origin
- [ ] Uploads persist (volume or Cloudinary)
- [ ] `robots.txt` / `sitemap.xml` resolve under the public domain
- [ ] Backups scheduled and restore tested
