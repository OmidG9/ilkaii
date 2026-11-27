# Database Migration Notes

## Fresh install

```bash
npx prisma migrate deploy
npm run db:seed        # development data only
```

`prisma/migrations/20260101000000_init/migration.sql` was generated from the
schema with `prisma migrate diff --from-empty`, so it creates the full domain
model (identity, catalog, cart, orders, inventory, promotions, reviews,
returns, audit, site settings).

## Upgrading a legacy `prisma db push` database

The previous implementation used `db push`, so it has **no migration history**.
Prisma will refuse to baseline automatically. Recommended procedure:

1. **Back up** the database:
   ```bash
   mysqldump --single-transaction --routines --triggers ilkaii > backup.sql
   ```
2. Create a shadow/baseline copy and inspect column and table differences.
   Compare the live schema against `prisma/migrations/20260101000000_init/migration.sql`.
3. Because the domain model was replaced, the safest path is a **new database**
   plus a data export/import script for `User`, `Product`, `Order` and related
   rows. Legacy tables whose shape no longer matches must be transformed.
4. Once the data is migrated, mark the initial migration as applied:
   ```bash
   npx prisma migrate resolve --applied 20260101000000_init
   npx prisma migrate deploy
   ```
5. Verify `_prisma_migrations` contains one applied row and that the application
   can read products, orders and sessions.

## Control Center migrations

The Control Center adds three forward-only migrations on top of the initial
domain model:

1. `20261125120000_control_center_core` — CMS/analytics/marketing/operations
   tables, string role codes, audit snapshots, customer CRM fields.
2. `20261125130000_order_analytics_link` — anonymous analytics session link on
   orders for campaign/purchase attribution.
3. `20261125140000_newsletter_unsubscribe` — opaque unsubscribe tokens.

Apply with `npx prisma migrate deploy`. `Role.code` and `User.role` are converted
from MySQL enums to `VARCHAR(64)`; existing values are preserved. After applying,
run `npm run db:seed` (development only) or call the idempotent role bootstrap so
the new built-in roles and permissions exist. Custom roles can then be created
from `/admin/roles`.

## Refund ledger

`20261127160000_refunds` adds the immutable `Refund` ledger (partial/full refunds,
provider reference, acting admin). Existing order/payment data is untouched.

## Warehouse & inventory

`20261127160000_warehouse_inventory` adds suppliers, purchase orders and items,
stocktakes and items, variant barcode/cost/bin/default-supplier columns and
ledger running balance/reference/unit-cost columns. All new columns are nullable
or defaulted, so existing products, variants and movements are preserved. Legacy
movements keep `balanceAfter = NULL`. See `docs/WAREHOUSE.md` for workflows.

## Resetting a development database

```bash
npx prisma migrate reset   # drops, re-applies migrations, runs the seed
```

> Never run `migrate reset` or `db push` against production.
