# Migration Guide: Subscription Plans Schema Update

This guide helps you migrate your existing `subscription_plans` table to include the new `code` and `billingCycle` fields.

## Problem

The schema was updated to add required fields `code` and `billingCycle`, but existing data in the table doesn't have these values. This prevents `prisma db push` from working.

## Solution

We've made the fields **optional temporarily** so you can:
1. Push the schema changes
2. Update existing data
3. (Optional) Make fields required again later

---

## Step-by-Step Migration

### Step 1: Push Schema Changes

```bash
npm run db:push
```

This will now work because `code` and `billingCycle` are optional.

### Step 2: Update Existing Data

Run the migration script to populate `code` and `billingCycle` for existing plans:

```bash
npm run db:migrate:plans
```

Or manually:

```bash
node scripts/migrateSubscriptionPlans.js
```

This script will:
- Find all plans without `code` or `billingCycle`
- Auto-detect and assign appropriate values:
  - TRIAL plan → `code: 'TRIAL'`, `billingCycle: 'MONTHLY'`
  - 1 month plan → `code: 'MONTHLY'`, `billingCycle: 'MONTHLY'`
  - 12 month plan → `code: 'YEARLY'`, `billingCycle: 'YEARLY'`

### Step 3: Seed New Plans

Run the seed to create MONTHLY and YEARLY plans (if they don't exist):

```bash
npm run db:seed
```

Or:

```bash
npx prisma db seed
```

---

## What Changed

### Schema Changes

1. **Added `code` field** (optional, unique)
   - Values: `'TRIAL'`, `'MONTHLY'`, `'YEARLY'`
   - Used for API references and frontend

2. **Added `billingCycle` field** (optional)
   - Values: `'MONTHLY'`, `'YEARLY'`
   - Cleaner than inferring from `durationMonths`

3. **Changed `price` from Decimal to Int**
   - Payment gateways prefer integers (₹800 → `800`)
   - No decimal precision needed

4. **Added `createdAt` field**
   - Audit trail

### Existing Data

Your existing TRIAL plan will be updated with:
- `code: 'TRIAL'`
- `billingCycle: 'MONTHLY'`

---

## Verification

After migration, verify the data:

```bash
npx prisma studio
```

Or check via API:

```bash
GET /api/v1/plans
```

You should see all plans with `code` and `billingCycle` populated.

---

## Making Fields Required (Optional - Future)

Once all existing data has `code` and `billingCycle`, you can make them required:

1. Update `prisma/schema.prisma`:
   ```prisma
   code          String         @unique @db.VarChar(20)  // Remove ?
   billingCycle  String         @db.VarChar(20)          // Remove ?
   ```

2. Push again:
   ```bash
   npm run db:push
   ```

---

## Troubleshooting

### Error: "code already exists"

If you get a unique constraint error, check for duplicate codes:

```sql
SELECT code, COUNT(*) 
FROM subscription_plans 
WHERE code IS NOT NULL 
GROUP BY code 
HAVING COUNT(*) > 1;
```

### Error: "Cannot find module"

Make sure you're in the project root and dependencies are installed:

```bash
npm install
```

### Existing Plans Not Updated

If the migration script doesn't find your existing plan, check:

1. Plan name matches expected values
2. Run the script with more logging
3. Manually update via Prisma Studio or SQL

---

## Manual SQL Update (Alternative)

If the script doesn't work, you can update manually:

```sql
-- Update TRIAL plan
UPDATE subscription_plans 
SET code = 'TRIAL', billing_cycle = 'MONTHLY' 
WHERE name = 'TRIAL' OR price = 0;

-- Update MONTHLY plan (if exists)
UPDATE subscription_plans 
SET code = 'MONTHLY', billing_cycle = 'MONTHLY' 
WHERE duration_months = 1 AND code IS NULL;

-- Update YEARLY plan (if exists)
UPDATE subscription_plans 
SET code = 'YEARLY', billing_cycle = 'YEARLY' 
WHERE duration_months = 12 AND code IS NULL;
```

---

## Next Steps

After successful migration:

1. ✅ Test the APIs:
   - `GET /api/v1/plans` (public)
   - `POST /api/v1/subscriptions/buy` (society admin)
   - `GET /api/v1/subscriptions/current` (society admin)

2. ✅ Verify seed data:
   - MONTHLY plan (₹800)
   - YEARLY plan (₹8000)
   - TRIAL plan (₹0)

3. ✅ Ready for Razorpay integration (when needed)

---

## Support

If you encounter issues:

1. Check Prisma logs
2. Verify database connection
3. Check existing data in `subscription_plans` table
4. Review migration script output

