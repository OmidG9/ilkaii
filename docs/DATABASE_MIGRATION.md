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

## Resetting a development database

```bash
npx prisma migrate reset   # drops, re-applies migrations, runs the seed
```

> Never run `migrate reset` or `db push` against production.
