# Database Setup Guide

## For Remote Databases (No Shadow Database Permission)

If you're using a remote database and don't have permission to create databases (shadow database), use:

```bash
npm run db:init
```

This uses `prisma db push` which doesn't require a shadow database.

## For Local Databases (With Full Permissions)

If you have a local database with full permissions, you can use migrations:

```bash
npm run db:migrate    # Create and apply migrations
npm run db:seed       # Seed the database
```

## Available Commands

- `npm run db:init` - Generate Prisma Client, push schema, and seed (recommended for remote DBs)
- `npm run db:push` - Push schema changes without migrations (no shadow DB needed)
- `npm run db:migrate` - Create and apply migrations (requires shadow DB)
- `npm run db:migrate:deploy` - Apply existing migrations (production)
- `npm run db:generate` - Generate Prisma Client only
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Difference: `db push` vs `migrate`

- **`db push`**: Directly syncs your schema to the database. Good for development and remote databases.
- **`migrate`**: Creates migration files for version control. Better for production and team collaboration.

## Troubleshooting

### Error: "permission denied to create database"

- Use `db push` instead of `migrate`
- Or configure a shadow database URL in `prisma.config.ts`

### Error: "Can't reach database server"

- Check your `DATABASE_URL` in `.env`
- Verify database server is running
- Check firewall/network settings
